/**
 * Sync Menu to Kiosk Products
 * 
 * Synchronizes the active season's menu items into the kiosk product catalog.
 * This ensures the ButlerKiosk always reflects the current menukaart.
 * 
 * Can be called:
 * 1. Manually via API endpoint
 * 2. Automatically when a season is activated
 * 3. As a standalone script: npx tsx server/syncMenuToKiosk.ts
 */

import { eq, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import { createLogger } from "./_core/logger";

const log = createLogger("SyncMenuToKiosk");
import {
  menuSeasons,
  menuCategories,
  menuItems,
  menuSeasonItems,
  productCategories,
  products,
} from "../drizzle/schema";

// Mapping from menu category slugs to kiosk product category names
const CATEGORY_MAP: Record<string, { name: string; slug: string; icon: string }> = {
  "soepen": { name: "Soepen", slug: "soepen", icon: "🍲" },
  "sandwiches": { name: "Sandwiches", slug: "sandwiches", icon: "🥪" },
  "wraps": { name: "Wraps", slug: "wraps", icon: "🌯" },
  "salades": { name: "Salades", slug: "salades", icon: "🥗" },
  "warme-lunch": { name: "Warme Lunch", slug: "warme-lunch", icon: "🔥" },
  "breakfast": { name: "Breakfast", slug: "breakfast", icon: "🥐" },
  "sweets": { name: "Sweets", slug: "sweets", icon: "🍰" },
  "smoothies": { name: "Smoothies", slug: "smoothies", icon: "🥤" },
  "koffie-thee": { name: "Koffie & Thee", slug: "koffie-thee", icon: "☕" },
  "frisdranken": { name: "Frisdranken", slug: "frisdranken", icon: "🥤" },
  "alcoholisch": { name: "Alcoholisch", slug: "alcoholisch", icon: "🍷" },
};

export async function syncMenuToKiosk(): Promise<{ synced: number; created: number; updated: number; deactivated: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. Get active season
  const [season] = await db.select().from(menuSeasons)
    .where(eq(menuSeasons.isActive, true)).limit(1);
  if (!season) throw new Error("No active season found");

  // 2. Get all season items with their menu item and category data
  const seasonItemRows = await db.select({
    seasonItem: menuSeasonItems,
    item: menuItems,
    category: menuCategories,
  })
    .from(menuSeasonItems)
    .innerJoin(menuItems, eq(menuSeasonItems.menuItemId, menuItems.id))
    .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
    .where(and(
      eq(menuSeasonItems.seasonId, season.id),
      eq(menuSeasonItems.isAvailable, true),
    ));

  // 3. Ensure kiosk product categories exist
  const existingCats = await db.select().from(productCategories);
  const catSlugToId: Record<string, number> = {};
  for (const cat of existingCats) {
    catSlugToId[cat.slug] = cat.id;
  }

  for (const [slug, catDef] of Object.entries(CATEGORY_MAP)) {
    if (!catSlugToId[slug]) {
      const [result] = await db.insert(productCategories).values({
        name: catDef.name,
        slug: catDef.slug,
        icon: catDef.icon,
        sortOrder: Object.keys(CATEGORY_MAP).indexOf(slug),
        isActive: true,
      }).$returningId();
      catSlugToId[slug] = result.id;
    }
  }

  // 4. Get existing kiosk products (by SKU pattern "menu-{menuItemId}")
  const existingProducts = await db.select().from(products);
  const skuToProduct: Record<string, typeof existingProducts[0]> = {};
  for (const p of existingProducts) {
    if (p.sku?.startsWith("menu-")) {
      skuToProduct[p.sku] = p;
    }
  }

  let created = 0;
  let updated = 0;
  const syncedSkus = new Set<string>();

  // 5. Sync each menu item to kiosk products
  for (const row of seasonItemRows) {
    const sku = `menu-${row.item.id}`;
    syncedSkus.add(sku);
    const price = row.seasonItem.priceOverrideEur || row.item.priceEur || "0.00";
    const catId = catSlugToId[row.category.slug] || catSlugToId["sandwiches"];

    const productData = {
      categoryId: catId,
      name: row.item.name,
      description: row.item.subtitle || "",
      imageUrl: row.item.imageUrl,
      priceCredits: price, // 1:1 credit = EUR
      priceEur: price,
      sku,
      isActive: true,
      sortOrder: row.seasonItem.sortOrder,
      vatRate: "9.00", // food BTW laag tarief
    };

    if (skuToProduct[sku]) {
      // Update existing
      await db.update(products).set(productData).where(eq(products.id, skuToProduct[sku].id));
      updated++;
    } else {
      // Create new
      await db.insert(products).values(productData);
      created++;
    }
  }

  // 6. Deactivate kiosk products that are no longer in the active season
  let deactivated = 0;
  for (const [sku, product] of Object.entries(skuToProduct)) {
    if (!syncedSkus.has(sku) && product.isActive) {
      await db.update(products).set({ isActive: false }).where(eq(products.id, product.id));
      deactivated++;
    }
  }

  return { synced: seasonItemRows.length, created, updated, deactivated };
}

// Run standalone
if (require.main === module) {
  syncMenuToKiosk()
    .then((result) => {
      log.info("Sync complete", result);
      process.exit(0);
    })
    .catch((err) => {
      log.error("Sync failed", err);
      process.exit(1);
    });
}
