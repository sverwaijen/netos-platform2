import { z } from "zod";
import { eq, and, desc, asc, like, or, sql } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { syncMenuToKiosk } from "../syncMenuToKiosk";
import { getDriver } from "../db";
import * as pgSchema from "../../drizzle/pg-schema";
function S(): any { return pgSchema; }
const menuSeasons = () => S().menuSeasons;
const menuCategories = () => S().menuCategories;
const menuItems = () => S().menuItems;
const menuSeasonItems = () => S().menuSeasonItems;
const menuPreparations = () => S().menuPreparations;
const menuArrangements = () => S().menuArrangements;

// ═══════════════════════════════════════════════════════════════════════
// ─── MENU SEASONS ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
export const menuSeasonsRouter = router({
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(menuSeasons()).orderBy(desc(menuSeasons().year), desc(menuSeasons().quarter));
  }),

  active: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;
    const [season] = await db.select().from(menuSeasons())
      .where(eq(menuSeasons().isActive, true))
      .limit(1);
    return season || null;
  }),

  create: protectedProcedure.input(z.object({
    year: z.number(),
    quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
    name: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    driveMenuSheetId: z.string().optional(),
    driveFoodbookDocId: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [result] = await db.insert(menuSeasons()).values({
      ...input,
      isActive: false,
    }).returning();
    return { id: result.id };
  }),

  activate: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    // Deactivate all
    await db.update(menuSeasons()).set({ isActive: false });
    // Activate selected
    await db.update(menuSeasons()).set({ isActive: true }).where(eq(menuSeasons().id, input.id));
    // Auto-sync to kiosk products
    try {
      const syncResult = await syncMenuToKiosk();
      return { success: true, sync: syncResult };
    } catch (e) {
      return { success: true, sync: null, syncError: String(e) };
    }
  }),

  syncToKiosk: protectedProcedure.mutation(async () => {
    const result = await syncMenuToKiosk();
    return result;
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isActive: z.boolean().optional(),
    driveMenuSheetId: z.string().optional(),
    driveFoodbookDocId: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const { id, ...updates } = input;
    const setObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) setObj[k] = v;
    }
    if (Object.keys(setObj).length > 0) {
      await db.update(menuSeasons()).set(setObj).where(eq(menuSeasons().id, id));
    }
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.delete(menuSeasonItems()).where(eq(menuSeasonItems().seasonId, input.id));
    await db.delete(menuSeasons()).where(eq(menuSeasons().id, input.id));
    return { success: true };
  }),

  // Clone a season (copy all items to a new season)
  clone: protectedProcedure.input(z.object({
    sourceSeasonId: z.number(),
    year: z.number(),
    quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
    name: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const { sourceSeasonId, ...seasonData } = input;
    const [newSeason] = await db.insert(menuSeasons()).values({ ...seasonData, isActive: false }).returning();
    // Copy season items
    const sourceItems = await db.select().from(menuSeasonItems())
      .where(eq(menuSeasonItems().seasonId, sourceSeasonId));
    for (const item of sourceItems) {
      await db.insert(menuSeasonItems()).values({
        seasonId: newSeason.id,
        menuItemId: item.menuItemId,
        locationId: item.locationId,
        priceOverrideEur: item.priceOverrideEur,
        priceLargeOverrideEur: item.priceLargeOverrideEur,
        isAvailable: item.isAvailable,
        sortOrder: item.sortOrder,
      });
    }
    return { id: newSeason.id, itemsCopied: sourceItems.length };
  }),
});

// ═══════════════════════════════════════════════════════════════════════
// ─── MENU CATEGORIES ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
export const menuCategoriesRouter = router({
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(menuCategories())
      .where(eq(menuCategories().isActive, true))
      .orderBy(asc(menuCategories().sortOrder));
  }),

  create: protectedProcedure.input(z.object({
    name: z.string(),
    slug: z.string(),
    icon: z.string().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [result] = await db.insert(menuCategories()).values(input).returning();
    return { id: result.id };
  }),
});

// ═══════════════════════════════════════════════════════════════════════
// ─── MENU ITEMS ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
export const menuItemsRouter = router({
  list: publicProcedure.input(z.object({
    categoryId: z.number().optional(),
    search: z.string().optional(),
    seasonId: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions = [eq(menuItems().isActive, true)];
    if (input?.categoryId) conditions.push(eq(menuItems().categoryId, input.categoryId));
    if (input?.search) conditions.push(or(
      like(menuItems().name, `%${input.search}%`),
      like(menuItems().subtitle, `%${input.search}%`),
    )!);
    return db.select().from(menuItems())
      .where(and(...conditions))
      .orderBy(asc(menuItems().sortOrder));
  }),

  // Get all items for a specific season (with season-specific overrides)
  bySeason: publicProcedure.input(z.object({
    seasonId: z.number(),
    locationId: z.number().optional(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: any[] = [eq(menuSeasonItems().seasonId, input.seasonId)];
    if (input.locationId) {
      conditions.push(or(
        eq(menuSeasonItems().locationId, input.locationId),
        sql`${menuSeasonItems().locationId} IS NULL`,
      ));
    }
    const rows = await db.select({
      seasonItem: menuSeasonItems,
      item: menuItems,
      category: menuCategories,
    })
      .from(menuSeasonItems())
      .innerJoin(menuItems, eq(menuSeasonItems().menuItemId, menuItems().id))
      .innerJoin(menuCategories, eq(menuItems().categoryId, menuCategories().id))
      .where(and(...conditions))
      .orderBy(asc(menuCategories().sortOrder), asc(menuSeasonItems().sortOrder));

    return rows.map((r: any) => ({
      ...r.item,
      seasonItemId: r.seasonItem.id,
      priceEur: r.seasonItem.priceOverrideEur || r.item.priceEur,
      priceLargeEur: r.seasonItem.priceLargeOverrideEur || r.item.priceLargeEur,
      isAvailable: r.seasonItem.isAvailable,
      categoryName: r.category.name,
      categorySlug: r.category.slug,
      categoryIcon: r.category.icon,
    }));
  }),

  // Get active menu (for signage/kiosk)
  activeMenu: publicProcedure.input(z.object({
    locationId: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { season: null, items: [], arrangements: [] };

    // Get active season
    const [season] = await db.select().from(menuSeasons())
      .where(eq(menuSeasons().isActive, true)).limit(1);
    if (!season) return { season: null, items: [], arrangements: [] };

    // Get items
    const conditions: any[] = [
      eq(menuSeasonItems().seasonId, season.id),
      eq(menuSeasonItems().isAvailable, true),
    ];
    if (input?.locationId) {
      conditions.push(or(
        eq(menuSeasonItems().locationId, input.locationId),
        sql`${menuSeasonItems().locationId} IS NULL`,
      ));
    }

    const rows = await db.select({
      seasonItem: menuSeasonItems,
      item: menuItems,
      category: menuCategories,
    })
      .from(menuSeasonItems())
      .innerJoin(menuItems, eq(menuSeasonItems().menuItemId, menuItems().id))
      .innerJoin(menuCategories, eq(menuItems().categoryId, menuCategories().id))
      .where(and(...conditions))
      .orderBy(asc(menuCategories().sortOrder), asc(menuSeasonItems().sortOrder));

    const items = rows.map((r: any) => ({
      ...r.item,
      seasonItemId: r.seasonItem.id,
      priceEur: r.seasonItem.priceOverrideEur || r.item.priceEur,
      priceLargeEur: r.seasonItem.priceLargeOverrideEur || r.item.priceLargeEur,
      categoryName: r.category.name,
      categorySlug: r.category.slug,
      categoryIcon: r.category.icon,
    }));

    // Get arrangements
    const arrangements = await db.select().from(menuArrangements())
      .where(and(eq(menuArrangements().seasonId, season.id), eq(menuArrangements().isActive, true)))
      .orderBy(asc(menuArrangements().sortOrder));

    return { season, items, arrangements };
  }),

  create: protectedProcedure.input(z.object({
    categoryId: z.number(),
    name: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    priceEur: z.string().optional(),
    priceLargeEur: z.string().optional(),
    imageUrl: z.string().optional(),
    allergens: z.array(z.string()).optional(),
    isVegan: z.boolean().optional(),
    isVegetarian: z.boolean().optional(),
    isGlutenFree: z.boolean().optional(),
    isSignature: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [result] = await db.insert(menuItems()).values(input).returning();
    return { id: result.id };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    categoryId: z.number().optional(),
    name: z.string().optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    priceEur: z.string().optional(),
    priceLargeEur: z.string().optional(),
    imageUrl: z.string().optional(),
    allergens: z.array(z.string()).optional(),
    isVegan: z.boolean().optional(),
    isVegetarian: z.boolean().optional(),
    isGlutenFree: z.boolean().optional(),
    isSignature: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const { id, ...updates } = input;
    const setObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) setObj[k] = v;
    }
    if (Object.keys(setObj).length > 0) {
      await db.update(menuItems()).set(setObj).where(eq(menuItems().id, id));
    }
    return { success: true };
  }),
});

// ═══════════════════════════════════════════════════════════════════════
// ─── MENU SEASON ITEMS (assign items to seasons) ───────────────────
// ═══════════════════════════════════════════════════════════════════════
export const menuSeasonItemsRouter = router({
  add: protectedProcedure.input(z.object({
    seasonId: z.number(),
    menuItemId: z.number(),
    locationId: z.number().optional(),
    priceOverrideEur: z.string().optional(),
    priceLargeOverrideEur: z.string().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [result] = await db.insert(menuSeasonItems()).values(input).returning();
    return { id: result.id };
  }),

  remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.delete(menuSeasonItems()).where(eq(menuSeasonItems().id, input.id));
    return { success: true };
  }),

  updateSort: protectedProcedure.input(z.object({
    items: z.array(z.object({ id: z.number(), sortOrder: z.number() })),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    for (const item of input.items) {
      await db.update(menuSeasonItems())
        .set({ sortOrder: item.sortOrder })
        .where(eq(menuSeasonItems().id, item.id));
    }
    return { success: true };
  }),

  toggleAvailability: protectedProcedure.input(z.object({
    id: z.number(),
    isAvailable: z.boolean(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.update(menuSeasonItems())
      .set({ isAvailable: input.isAvailable })
      .where(eq(menuSeasonItems().id, input.id));
    return { success: true };
  }),
});

// ═══════════════════════════════════════════════════════════════════════
// ─── MENU PREPARATIONS (Foodbook) ──────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
export const menuPreparationsRouter = router({
  byItem: publicProcedure.input(z.object({
    menuItemId: z.number(),
    seasonId: z.number().optional(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const conditions = [eq(menuPreparations().menuItemId, input.menuItemId)];
    if (input.seasonId) conditions.push(eq(menuPreparations().seasonId, input.seasonId));
    const [prep] = await db.select().from(menuPreparations())
      .where(and(...conditions))
      .orderBy(desc(menuPreparations().seasonId)) // prefer season-specific
      .limit(1);
    return prep || null;
  }),

  // Get all preparations for active season (kitchen display)
  allActive: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const [season] = await db.select().from(menuSeasons())
      .where(eq(menuSeasons().isActive, true)).limit(1);
    if (!season) return [];

    const rows = await db.select({
      prep: menuPreparations,
      item: menuItems,
      category: menuCategories,
    })
      .from(menuPreparations())
      .innerJoin(menuItems, eq(menuPreparations().menuItemId, menuItems().id))
      .innerJoin(menuCategories, eq(menuItems().categoryId, menuCategories().id))
      .where(eq(menuPreparations().seasonId, season.id))
      .orderBy(asc(menuCategories().sortOrder), asc(menuItems().sortOrder));

    return rows.map((r: any) => ({
      ...r.prep,
      itemName: r.item.name,
      itemSubtitle: r.item.subtitle,
      categoryName: r.category.name,
      categorySlug: r.category.slug,
    }));
  }),

  upsert: protectedProcedure.input(z.object({
    menuItemId: z.number(),
    seasonId: z.number().optional(),
    steps: z.array(z.string()),
    ingredients: z.array(z.object({
      name: z.string(),
      amount: z.string(),
      unit: z.string(),
    })).optional(),
    prepTimeMinutes: z.number().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    // Check if exists
    const conditions = [eq(menuPreparations().menuItemId, input.menuItemId)];
    if (input.seasonId) conditions.push(eq(menuPreparations().seasonId, input.seasonId));
    const [existing] = await db.select().from(menuPreparations())
      .where(and(...conditions)).limit(1);
    if (existing) {
      await db.update(menuPreparations()).set({
        steps: input.steps,
        ingredients: input.ingredients || null,
        prepTimeMinutes: input.prepTimeMinutes || null,
        notes: input.notes || null,
      }).where(eq(menuPreparations().id, existing.id));
      return { id: existing.id, updated: true };
    }
    const [result] = await db.insert(menuPreparations()).values({
      menuItemId: input.menuItemId,
      seasonId: input.seasonId || null,
      steps: input.steps,
      ingredients: input.ingredients || null,
      prepTimeMinutes: input.prepTimeMinutes || null,
      notes: input.notes || null,
    }).returning();
    return { id: result.id, updated: false };
  }),
});

// ═══════════════════════════════════════════════════════════════════════
// ─── MENU ARRANGEMENTS ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
export const menuArrangementsRouter = router({
  list: publicProcedure.input(z.object({
    seasonId: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: any[] = [eq(menuArrangements().isActive, true)];
    if (input?.seasonId) conditions.push(eq(menuArrangements().seasonId, input.seasonId));
    return db.select().from(menuArrangements())
      .where(and(...conditions))
      .orderBy(asc(menuArrangements().sortOrder));
  }),

  create: protectedProcedure.input(z.object({
    seasonId: z.number().optional(),
    name: z.string(),
    description: z.string().optional(),
    priceEur: z.string(),
    memberPriceEur: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [result] = await db.insert(menuArrangements()).values(input).returning();
    return { id: result.id };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    priceEur: z.string().optional(),
    memberPriceEur: z.string().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const { id, ...updates } = input;
    const setObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) setObj[k] = v;
    }
    if (Object.keys(setObj).length > 0) {
      await db.update(menuArrangements()).set(setObj).where(eq(menuArrangements().id, id));
    }
    return { success: true };
  }),
});
