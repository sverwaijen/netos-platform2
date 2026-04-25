import { z } from "zod";
import { eq, and, inArray } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  users,
  wallets,
  creditLedger,
  kioskOrders,
  kioskOrderItems,
  products,
} from "../../drizzle/pg-schema";
import { nanoid } from "nanoid";

// ─── Kiosk QR Router ────────────────────────────────────────────────
export const kioskQrRouter = router({
  /**
   * Generate a unique QR token for a member
   * This token can be scanned at the kiosk to identify the user
   */
  generateMemberQR: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Generate a unique token (use nanoid for uniqueness)
      const token = nanoid(32);

      // Update user with QR token
      await db.update(users).set({
        qrToken: token,
      }).where(eq(users.id, ctx.user.id));

      return {
        success: true,
        token,
        qrCode: `kiosk://member/${token}`, // Format for QR code
      };
    }),

  /**
   * Verify a scanned QR token and return user + wallet info
   * Public endpoint (called from unauth kiosk)
   */
  verifyMemberQR: publicProcedure
    .input(z.object({
      token: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Find user by QR token
      const userList = await db
        .select()
        .from(users)
        .where(eq(users.qrToken, input.token))
        .limit(1);

      if (userList.length === 0) {
        return {
          success: false,
          reason: "Invalid or expired QR token",
        };
      }

      const user = userList[0];

      // Get user's personal wallet
      const walletList = await db
        .select()
        .from(wallets)
        .where(
          and(
            eq(wallets.ownerId, user.id),
            eq(wallets.type, "personal")
          )
        )
        .limit(1);

      const wallet = walletList[0];

      if (!wallet) {
        return {
          success: false,
          reason: "User has no active wallet",
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name || "Unknown Member",
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        wallet: {
          id: wallet.id,
          userId: user.id,
          balance: wallet.balance,
          type: wallet.type,
        },
      };
    }),

  /**
   * Create an order using member QR verification
   * Deducts credits from member's wallet
   */
  createOrderWithMember: publicProcedure
    .input(z.object({
      token: z.string().min(1),
      locationId: z.number().int().positive(),
      items: z.array(z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Verify QR token
      const userList = await db
        .select()
        .from(users)
        .where(eq(users.qrToken, input.token))
        .limit(1);

      if (userList.length === 0) {
        throw new Error("Invalid QR token");
      }

      const user = userList[0];

      // Get user's wallet
      const walletList = await db
        .select()
        .from(wallets)
        .where(
          and(
            eq(wallets.ownerId, user.id),
            eq(wallets.type, "personal")
          )
        )
        .limit(1);

      if (walletList.length === 0) {
        throw new Error("User wallet not found");
      }

      const wallet = walletList[0];

      // Calculate total cost
      let totalCredits = "0";
      let totalEur = "0";

      // Fetch product details for pricing
      const productIds = input.items.map(i => i.productId);
      const productList = await db
        .select()
        .from(products)
        .where(
          inArray(products.id, productIds)
        );

      // Build product map
      const productMap = new Map(productList.map((p: any) => [p.id, p]));

      // Calculate total
      for (const item of input.items) {
        const product = productMap.get(item.productId) as any;
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        const itemCredits = parseFloat(product.priceCredits as string) * item.quantity;
        const itemEur = parseFloat(product.priceEur as string) * item.quantity;

        totalCredits = (parseFloat(totalCredits) + itemCredits).toFixed(2);
        totalEur = (parseFloat(totalEur) + itemEur).toFixed(2);
      }

      // Check balance
      const walletBalance = parseFloat(wallet.balance);
      const orderTotal = parseFloat(totalCredits);

      if (walletBalance < orderTotal) {
        return {
          success: false,
          reason: `Insufficient balance. Required: ${totalCredits}c, Available: ${walletBalance}c`,
        };
      }

      // Create order
      const orderNumber = `ORD-${nanoid(8).toUpperCase()}`;

      const insertResult = await db.insert(kioskOrders).values({
        locationId: input.locationId,
        userId: user.id,
        orderNumber,
        totalCredits,
        totalEur,
        status: "completed",
        paymentMethod: "wallet",
      });

      const orderId = insertResult.insertId;

      // Add order items
      for (const item of input.items) {
        const product = productMap.get(item.productId) as any;
        if (product) {
          await db.insert(kioskOrderItems).values({
            orderId: Number(orderId),
            productId: item.productId,
            quantity: item.quantity,
            priceCreditsEach: product.priceCredits as string,
            priceEurEach: product.priceEur as string,
          });
        }
      }

      // Deduct from wallet
      const newBalance = (walletBalance - orderTotal).toFixed(2);
      await db.update(wallets).set({
        balance: newBalance,
      }).where(eq(wallets.id, wallet.id));

      // Create ledger entry
      await db.insert(creditLedger).values({
        walletId: wallet.id,
        type: "debit",
        amount: totalCredits,
        balanceAfter: newBalance,
        description: `Kiosk order: ${orderNumber}`,
        referenceType: "order",
        referenceId: Number(orderId),
      });

      return {
        success: true,
        order: {
          id: Number(orderId),
          orderNumber,
          totalCredits,
          totalEur,
          status: "completed",
        },
        wallet: {
          newBalance,
          previousBalance: wallet.balance,
        },
        receipt: {
          memberName: user.name || "Member",
          items: input.items.map(item => ({
            productId: item.productId,
            productName: (productMap.get(item.productId) as any)?.name || "Unknown",
            quantity: item.quantity,
            unitPrice: (productMap.get(item.productId) as any)?.priceCredits || "0",
          })),
          timestamp: new Date().toISOString(),
        },
      };
    }),

  /**
   * Regenerate QR token (invalidate old one)
   */
  regenerateMemberQR: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const newToken = nanoid(32);

      await db.update(users).set({
        qrToken: newToken,
      }).where(eq(users.id, ctx.user.id));

      return {
        success: true,
        token: newToken,
        qrCode: `kiosk://member/${newToken}`,
      };
    }),

  /**
   * Check if a user has an active QR token
   */
  hasQRToken: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const userList = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      const user = userList[0];
      return {
        hasToken: !!user?.qrToken,
        token: user?.qrToken || null,
      };
    }),
});
