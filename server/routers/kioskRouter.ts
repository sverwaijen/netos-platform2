import { z } from "zod";
import { eq, and, desc, sql, like, ne } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  productCategories,
  products,
  productResourceLinks,
  kioskOrders,
  kioskOrderItems,
  bookingAddons,
  companyBranding,
  companyBrandingScraped,
  employeePhotos,
  companies,
  wallets,
  creditLedger,
  users,
} from "../../drizzle/pg-schema";
import { scrapeWebsiteBranding } from "../scraper";
import { nanoid } from "nanoid";

// ─── Product Catalog Router ─────────────────────────────────────────
export const productCatalogRouter = router({
  categories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(productCategories).where(eq(productCategories.isActive, true)).orderBy(productCategories.sortOrder);
  }),

  list: publicProcedure
    .input(z.object({ categoryId: z.number().optional(), search: z.string().optional(), bookingAddonsOnly: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(products.isActive, true)];
      if (input?.categoryId) conditions.push(eq(products.categoryId, input.categoryId));
      if (input?.bookingAddonsOnly) conditions.push(eq(products.isBookingAddon, true));
      if (input?.search) conditions.push(like(products.name, `%${input.search}%`));
      return db.select().from(products).where(and(...conditions)).orderBy(products.sortOrder);
    }),

  byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select().from(products).where(eq(products.id, input.id)).limit(1);
    return rows[0] || null;
  }),

  create: protectedProcedure
    .input(z.object({
      categoryId: z.number(),
      name: z.string(),
      description: z.string().optional(),
      priceCredits: z.string(),
      priceEur: z.string(),
      imageUrl: z.string().optional(),
      isBookingAddon: z.boolean().optional(),
      chargePerBookingHour: z.boolean().optional(),
      vatRate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(products).values({
        categoryId: input.categoryId,
        name: input.name,
        description: input.description || null,
        priceCredits: input.priceCredits,
        priceEur: input.priceEur,
        imageUrl: input.imageUrl || null,
        isBookingAddon: input.isBookingAddon || false,
        chargePerBookingHour: input.chargePerBookingHour || false,
        vatRate: input.vatRate || "21.00",
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      priceCredits: z.string().optional(),
      priceEur: z.string().optional(),
      imageUrl: z.string().optional(),
      isActive: z.boolean().optional(),
      isBookingAddon: z.boolean().optional(),
      chargePerBookingHour: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...updates } = input;
      const setObj: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(updates)) {
        if (v !== undefined) setObj[k] = v;
      }
      if (Object.keys(setObj).length > 0) {
        await db.update(products).set(setObj).where(eq(products.id, id));
      }
      return { success: true };
    }),

  bulkUpdateImages: protectedProcedure
    .input(z.object({
      updates: z.array(z.object({ id: z.number(), imageUrl: z.string() }))
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      let updated = 0;
      for (const { id, imageUrl } of input.updates) {
        await db.update(products).set({ imageUrl }).where(eq(products.id, id));
        updated++;
      }
      return { success: true, updated };
    }),

  // Products linked to a resource type (for booking add-ons)
  forResourceType: publicProcedure
    .input(z.object({ resourceTypeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const links = await db
        .select({
          linkId: productResourceLinks.id,
          productId: products.id,
          name: products.name,
          description: products.description,
          priceCredits: products.priceCredits,
          priceEur: products.priceEur,
          isRequired: productResourceLinks.isRequired,
          isDefault: productResourceLinks.isDefault,
          chargePerBookingHour: products.chargePerBookingHour,
          imageUrl: products.imageUrl,
        })
        .from(productResourceLinks)
        .innerJoin(products, eq(products.id, productResourceLinks.productId))
        .where(and(
          eq(productResourceLinks.resourceTypeId, input.resourceTypeId),
          eq(products.isActive, true),
        ))
        .orderBy(productResourceLinks.sortOrder);
      return links;
    }),

  stats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalProducts: 0, totalCategories: 0, totalOrders: 0, revenue: "0" };
    const [prodCount] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isActive, true));
    const [catCount] = await db.select({ count: sql<number>`count(*)` }).from(productCategories);
    const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(kioskOrders);
    const [rev] = await db.select({ total: sql<string>`COALESCE(SUM(totalEur), 0)` }).from(kioskOrders).where(eq(kioskOrders.status, "completed"));
    return {
      totalProducts: prodCount?.count || 0,
      totalCategories: catCount?.count || 0,
      totalOrders: orderCount?.count || 0,
      revenue: rev?.total || "0",
    };
  }),
});

// ─── Kiosk Order Router ─────────────────────────────────────────────
export const kioskOrderRouter = router({
  create: publicProcedure
    .input(z.object({
      locationId: z.number(),
      userId: z.number().optional(),
      companyId: z.number().optional(),
      bookingId: z.number().optional(),
      paymentMethod: z.enum(["personal_credits", "company_credits", "stripe_card", "company_invoice", "cash"]),
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number().min(1),
      })),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Fetch product prices
      const productIds = input.items.map((i: any) => i.productId);
      const prods = await db.select().from(products).where(sql`${products.id} IN (${sql.join(productIds.map((id: any) => sql`${id}`), sql`, `)})`);
      const prodMap = new Map(prods.map((p: any) => [p.id, p]));

      let subtotalCredits = 0;
      let subtotalEur = 0;
      let vatTotal = 0;

      const orderItems = input.items.map((item: any) => {
        const prod: any = prodMap.get(item.productId);
        if (!prod) throw new Error(`Product ${item.productId} not found`);
        const credits = parseFloat(prod.priceCredits as string) * item.quantity;
        const eur = parseFloat(prod.priceEur as string) * item.quantity;
        const vat = eur * (parseFloat(prod.vatRate as string || "21") / 100);
        subtotalCredits += credits;
        subtotalEur += eur;
        vatTotal += vat;
        return {
          productId: item.productId,
          productName: prod.name,
          quantity: item.quantity,
          unitPriceCredits: prod.priceCredits as string,
          unitPriceEur: prod.priceEur as string,
          totalCredits: credits.toFixed(2),
          totalEur: eur.toFixed(2),
          vatRate: prod.vatRate as string || "21.00",
        };
      });

      const orderNumber = `ORD-${nanoid(8).toUpperCase()}`;

      // Insert order
      const [result] = await db.insert(kioskOrders).values({
        orderNumber,
        locationId: input.locationId,
        userId: input.userId || null,
        companyId: input.companyId || null,
        bookingId: input.bookingId || null,
        paymentMethod: input.paymentMethod,
        subtotalCredits: subtotalCredits.toFixed(2),
        subtotalEur: subtotalEur.toFixed(2),
        vatAmount: vatTotal.toFixed(2),
        totalCredits: subtotalCredits.toFixed(2),
        totalEur: (subtotalEur + vatTotal).toFixed(2),
        notes: input.notes || null,
        status: "completed",
      }).returning({ id: kioskOrders.id });

      const orderId = result.id;

      // Insert order items
      for (const item of orderItems) {
        await db.insert(kioskOrderItems).values({ orderId, ...item });
      }

      // Deduct credits if paying with credits
      if (input.paymentMethod === "personal_credits" && input.userId) {
        const userWallets = await db.select().from(wallets).where(and(eq(wallets.ownerId, input.userId), eq(wallets.type, "personal"))).limit(1);
        if (userWallets[0]) {
          const newBalance = parseFloat(userWallets[0].balance as string) - subtotalCredits;
          await db.update(wallets).set({ balance: newBalance.toFixed(2) }).where(eq(wallets.id, userWallets[0].id));
          await db.insert(creditLedger).values({
            walletId: userWallets[0].id,
            type: "spend",
            amount: subtotalCredits.toFixed(2),
            balanceAfter: newBalance.toFixed(2),
            description: `Kiosk order ${orderNumber}`,
            referenceType: "kiosk_order",
            referenceId: orderId,
          });
        }
      } else if (input.paymentMethod === "company_credits" && input.companyId) {
        const compWallets = await db.select().from(wallets).where(and(eq(wallets.ownerId, input.companyId), eq(wallets.type, "company"))).limit(1);
        if (compWallets[0]) {
          const newBalance = parseFloat(compWallets[0].balance as string) - subtotalCredits;
          await db.update(wallets).set({ balance: newBalance.toFixed(2) }).where(eq(wallets.id, compWallets[0].id));
          await db.insert(creditLedger).values({
            walletId: compWallets[0].id,
            type: "spend",
            amount: subtotalCredits.toFixed(2),
            balanceAfter: newBalance.toFixed(2),
            description: `Kiosk order ${orderNumber}`,
            referenceType: "kiosk_order",
            referenceId: orderId,
          });
        }
      }

      return { orderId, orderNumber, totalCredits: subtotalCredits.toFixed(2), totalEur: (subtotalEur + vatTotal).toFixed(2) };
    }),

  list: protectedProcedure
    .input(z.object({ locationId: z.number().optional(), limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input?.locationId) conditions.push(eq(kioskOrders.locationId, input.locationId));
      const q = conditions.length > 0
        ? db.select().from(kioskOrders).where(and(...conditions)).orderBy(desc(kioskOrders.createdAt)).limit(input?.limit || 100)
        : db.select().from(kioskOrders).orderBy(desc(kioskOrders.createdAt)).limit(input?.limit || 100);
      return q;
    }),

  byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const [order] = await db.select().from(kioskOrders).where(eq(kioskOrders.id, input.id)).limit(1);
    if (!order) return null;
    const items = await db.select().from(kioskOrderItems).where(eq(kioskOrderItems.orderId, input.id));
    return { ...order, items };
  }),

  stats: publicProcedure.input(z.object({ locationId: z.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { totalOrders: 0, totalRevenue: "0", todayOrders: 0, todayRevenue: "0" };
    const conditions = [eq(kioskOrders.status, "completed")];
    if (input?.locationId) conditions.push(eq(kioskOrders.locationId, input.locationId));

    const [total] = await db.select({
      count: sql<number>`count(*)`,
      revenue: sql<string>`COALESCE(SUM(totalEur), 0)`,
    }).from(kioskOrders).where(and(...conditions));

    const [today] = await db.select({
      count: sql<number>`count(*)`,
      revenue: sql<string>`COALESCE(SUM(totalEur), 0)`,
    }).from(kioskOrders).where(and(...conditions, sql`DATE(${kioskOrders.createdAt}) = CURDATE()`));

    return {
      totalOrders: total?.count || 0,
      totalRevenue: total?.revenue || "0",
      todayOrders: today?.count || 0,
      todayRevenue: today?.revenue || "0",
    };
  }),

  updateKitchenStatus: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      kitchenStatus: z.enum(["new", "preparing", "ready", "picked_up"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const updateData: Record<string, any> = { kitchenStatus: input.kitchenStatus };

      if (input.kitchenStatus === "preparing") {
        updateData.kitchenStartedAt = new Date();
      } else if (input.kitchenStatus === "ready") {
        updateData.kitchenReadyAt = new Date();
      } else if (input.kitchenStatus === "picked_up") {
        updateData.kitchenPickedUpAt = new Date();
      }

      await db.update(kioskOrders).set(updateData).where(eq(kioskOrders.id, input.orderId));
      return { success: true };
    }),

  getActiveOrders: protectedProcedure
    .input(z.object({ locationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const orders = await db.select().from(kioskOrders)
        .where(and(
          eq(kioskOrders.locationId, input.locationId),
          ne(kioskOrders.kitchenStatus, "picked_up"),
        ))
        .orderBy(kioskOrders.createdAt);

      // TODO: #30 - N+1 Query: This loads items one-by-one
      // Instead, fetch all items in a single query and group by orderId
      // Get items for each order
      const enriched = await Promise.all(orders.map(async (order: any) => {
        const items = await db.select().from(kioskOrderItems).where(eq(kioskOrderItems.orderId, order.id));
        return { ...order, items };
      }));

      return enriched;
    }),

  getOrderStats: protectedProcedure
    .input(z.object({ locationId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { avgPrepTimeSeconds: 0, totalOrdersToday: 0, readyCount: 0 };

      const conditions = [sql`DATE(${kioskOrders.createdAt}) = CURDATE()`];
      if (input?.locationId) conditions.push(eq(kioskOrders.locationId, input.locationId));

      // Get all orders with both started and ready times
      const orders = await db.select().from(kioskOrders)
        .where(and(...conditions))
        .orderBy(kioskOrders.createdAt);

      let totalPrepTime = 0;
      let countWithPrepTime = 0;

      for (const order of orders) {
        if (order.kitchenStartedAt && order.kitchenReadyAt) {
          const prepTime = new Date(order.kitchenReadyAt).getTime() - new Date(order.kitchenStartedAt).getTime();
          totalPrepTime += prepTime;
          countWithPrepTime++;
        }
      }

      const avgPrepTimeSeconds = countWithPrepTime > 0 ? Math.round(totalPrepTime / countWithPrepTime / 1000) : 0;
      const readyCount = orders.filter((o: any) => o.kitchenStatus === "ready").length;

      return {
        avgPrepTimeSeconds,
        totalOrdersToday: orders.length,
        readyCount,
      };
    }),
});

// ─── Signing / Branding Scraper Router ──────────────────────────────
export const signingRouter = router({
  scrape: protectedProcedure
    .input(z.object({ companyId: z.number(), websiteUrl: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Mark as scraping
      await db.insert(companyBrandingScraped).values({
        companyId: input.companyId,
        websiteUrl: input.websiteUrl,
        status: "scraping",
      }).returning({ id: companyBrandingScraped.id });

      try {
        const result = await scrapeWebsiteBranding(input.websiteUrl);

        // Update scraped data
        await db.update(companyBrandingScraped)
          .set({
            scrapedLogoUrl: result.logoUrl,
            scrapedFaviconUrl: result.faviconUrl,
            scrapedColors: result.colors,
            scrapedImages: result.images,
            scrapedFonts: result.fonts,
            scrapedTitle: result.title,
            scrapedDescription: result.description,
            status: "completed",
            lastScrapedAt: new Date(),
          })
          .where(eq(companyBrandingScraped.companyId, input.companyId));

        // Auto-update company branding if no branding exists
        const existing = await db.select().from(companyBranding).where(eq(companyBranding.companyId, input.companyId)).limit(1);
        if (!existing[0]) {
          await db.insert(companyBranding).values({
            companyId: input.companyId,
            logoUrl: result.logoUrl,
            primaryColor: result.colors[0] || "#627653",
            secondaryColor: result.colors[1] || "#111111",
            accentColor: result.colors[2] || "#b8a472",
            fontFamily: result.fonts[0] || "Montserrat",
          });
        }

        return { success: true, data: result };
      } catch (error: unknown) {
        await db.update(companyBrandingScraped)
          .set({ status: "failed" })
          .where(eq(companyBrandingScraped.companyId, input.companyId));
        throw new Error(`Scraping failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  getScrapedData: publicProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(companyBrandingScraped).where(eq(companyBrandingScraped.companyId, input.companyId)).limit(1);
      return rows[0] || null;
    }),

  getBranding: publicProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [brand] = await db.select().from(companyBranding).where(eq(companyBranding.companyId, input.companyId)).limit(1);
      const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
      const photos = await db.select().from(employeePhotos).where(eq(employeePhotos.companyId, input.companyId));
      return { branding: brand || null, company: company || null, photos };
    }),

  // Public kiosk display endpoint - no auth required
  kioskDisplay: publicProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [brand] = await db.select().from(companyBranding).where(eq(companyBranding.companyId, input.companyId)).limit(1);
      const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
      const photos = await db.select().from(employeePhotos).where(eq(employeePhotos.companyId, input.companyId)).limit(20);
      const [scraped] = await db.select().from(companyBrandingScraped).where(eq(companyBrandingScraped.companyId, input.companyId)).limit(1);
      return {
        company: company || null,
        branding: brand || null,
        photos,
        scraped: scraped || null,
      };
    }),

  updateBranding: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      accentColor: z.string().optional(),
      fontFamily: z.string().optional(),
      backgroundImageUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { companyId, ...updates } = input;
      const existing = await db.select().from(companyBranding).where(eq(companyBranding.companyId, companyId)).limit(1);
      if (existing[0]) {
        const setObj: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (v !== undefined) setObj[k] = v;
        }
        if (Object.keys(setObj).length > 0) {
          await db.update(companyBranding).set(setObj).where(eq(companyBranding.companyId, companyId));
        }
      } else {
        await db.insert(companyBranding).values({
          companyId,
          logoUrl: updates.logoUrl || null,
          primaryColor: updates.primaryColor || "#627653",
          secondaryColor: updates.secondaryColor || "#111111",
          accentColor: updates.accentColor || "#b8a472",
          fontFamily: updates.fontFamily || "Montserrat",
          backgroundImageUrl: updates.backgroundImageUrl || null,
        });
      }
      return { success: true };
    }),
    // ─── QR Code generation ───
    generateMemberQR: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Generate or retrieve existing QR token
      let qrToken = ctx.user.id ? (await db.select({ qrToken: users.qrToken }).from(users).where(eq(users.id, ctx.user.id)).limit(1))?.[0]?.qrToken : null;

      if (!qrToken) {
        // Generate new unique token
        qrToken = nanoid(32);
        if (ctx.user.id) {
          await db.update(users).set({ qrToken }).where(eq(users.id, ctx.user.id));
        }
      }

      // Create QR data string: "userid:token" format for easy parsing
      const qrData = `${ctx.user.id}:${qrToken}`;

      return {
        success: true,
        qrData,
        qrToken,
        userId: ctx.user.id,
        encodedQR: Buffer.from(qrData).toString('base64'),
      };
    }),
    // ─── QR Code verification ───
    verifyMemberQR: publicProcedure.input(z.object({
      qrData: z.string(),
    })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Parse QR data: "userid:token" format
      const [userIdStr, token] = input.qrData.split(":");
      const userId = parseInt(userIdStr, 10);

      if (!userId || !token) throw new Error("Invalid QR format");

      // Verify token matches user
      const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const user = userRecord[0];

      if (!user || user.qrToken !== token) throw new Error("QR token invalid or expired");

      // Get wallet info
      const walletRecord = await db.select().from(wallets).where(and(eq(wallets.ownerId, userId), eq(wallets.type, "personal"))).limit(1);
      const wallet = walletRecord[0];

      return {
        success: true,
        userId: user.id,
        name: user.name || "Unknown",
        email: user.email,
        phone: user.phone,
        walletBalance: wallet?.balance ? parseFloat(wallet.balance as string) : 0,
        walletId: wallet?.id,
      };
    }),
    // ─── Create order with member (via QR) ───
    createOrderWithMember: publicProcedure.input(z.object({
      locationId: z.number(),
      qrData: z.string(),
      paymentMethod: z.enum(["personal_credits", "company_credits", "stripe_card", "company_invoice", "cash"]),
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number().min(1),
      })),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Verify QR and get user info
      const [userIdStr, token] = input.qrData.split(":");
      const userId = parseInt(userIdStr, 10);
      if (!userId || !token) throw new Error("Invalid QR format");

      const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const user = userRecord[0];
      if (!user || user.qrToken !== token) throw new Error("QR token invalid or expired");

      // Fetch product prices
      const productIds = input.items.map((i: any) => i.productId);
      const prods = await db.select().from(products).where(sql`${products.id} IN (${sql.join(productIds.map((id: any) => sql`${id}`), sql`, `)})`);
      const prodMap = new Map(prods.map((p: any) => [p.id, p]));

      let subtotalCredits = 0;
      let subtotalEur = 0;
      let vatTotal = 0;

      const orderItems = input.items.map((item: any) => {
        const prod: any = prodMap.get(item.productId);
        if (!prod) throw new Error(`Product ${item.productId} not found`);
        const credits = parseFloat(prod.priceCredits as string) * item.quantity;
        const eur = parseFloat(prod.priceEur as string) * item.quantity;
        const vat = eur * (parseFloat(prod.vatRate as string || "21") / 100);
        subtotalCredits += credits;
        subtotalEur += eur;
        vatTotal += vat;
        return {
          productId: item.productId,
          productName: prod.name,
          quantity: item.quantity,
          unitPriceCredits: prod.priceCredits as string,
          unitPriceEur: prod.priceEur as string,
          totalCredits: credits.toFixed(2),
          totalEur: eur.toFixed(2),
          vatRate: prod.vatRate as string || "21.00",
        };
      });

      const orderNumber = `ORD-${nanoid(8).toUpperCase()}`;

      // Insert order
      const [result] = await db.insert(kioskOrders).values({
        orderNumber,
        locationId: input.locationId,
        userId: userId,
        companyId: user.companyId,
        paymentMethod: input.paymentMethod,
        subtotalCredits: subtotalCredits.toFixed(2),
        subtotalEur: subtotalEur.toFixed(2),
        vatAmount: vatTotal.toFixed(2),
        totalCredits: subtotalCredits.toFixed(2),
        totalEur: (subtotalEur + vatTotal).toFixed(2),
        notes: input.notes || null,
        status: "completed",
      }).returning({ id: kioskOrders.id });

      const orderId = result.id;

      // Insert order items
      for (const item of orderItems) {
        await db.insert(kioskOrderItems).values({ orderId, ...item });
      }

      // Deduct credits if paying with credits
      if (input.paymentMethod === "personal_credits") {
        const userWallets = await db.select().from(wallets).where(and(eq(wallets.ownerId, userId), eq(wallets.type, "personal"))).limit(1);
        if (userWallets[0]) {
          const currentBalance = parseFloat(userWallets[0].balance as string);
          if (currentBalance < subtotalCredits) throw new Error(`Insufficient balance. Need ${subtotalCredits.toFixed(2)}c, have ${currentBalance.toFixed(2)}c`);

          const newBalance = (currentBalance - subtotalCredits).toFixed(2);
          await db.update(wallets).set({ balance: newBalance }).where(eq(wallets.id, userWallets[0].id));
          await db.insert(creditLedger).values({
            walletId: userWallets[0].id,
            type: "spend",
            amount: subtotalCredits.toFixed(2),
            balanceAfter: newBalance,
            description: `Kiosk order ${orderNumber}`,
            referenceType: "kiosk_order",
            referenceId: orderId,
          });
        }
      }

      return {
        success: true,
        orderNumber,
        totalCredits: subtotalCredits.toFixed(2),
        totalEur: (subtotalEur + vatTotal).toFixed(2),
        memberName: user.name,
        walletBalance: input.paymentMethod === "personal_credits"
          ? (await db.select().from(wallets).where(and(eq(wallets.ownerId, userId), eq(wallets.type, "personal"))).limit(1))?.[0]
          : null,
      };
    }),
});
