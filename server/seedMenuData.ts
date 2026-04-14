/**
 * Seed script: Menukaart database populated from Google Drive spreadsheet data.
 * Run via: npx tsx server/seedMenuData.ts
 * 
 * This seeds:
 * - menu_seasons (Q1 + Q2 2026)
 * - menu_categories
 * - menu_items (all dishes)
 * - menu_season_items (links)
 * - menu_preparations (foodbook instructions)
 * - menu_arrangements (deals)
 */

import {
import { createLogger } from "./_core/logger";

const log = createLogger("SeedMenu"); getDb } from "./db";
import {
  menuSeasons,
  menuCategories,
  menuItems,
  menuSeasonItems,
  menuPreparations,
  menuArrangements,
} from "../drizzle/schema";

// ─── Category definitions ───────────────────────────────────────────
const CATEGORIES = [
  { name: "Soepen", slug: "soepen", icon: "Soup", sortOrder: 1 },
  { name: "Sandwiches", slug: "sandwiches", icon: "Sandwich", sortOrder: 2 },
  { name: "Wraps", slug: "wraps", icon: "Wrap", sortOrder: 3 },
  { name: "Salades", slug: "salades", icon: "Salad", sortOrder: 4 },
  { name: "Warme Lunch", slug: "warme-lunch", icon: "Flame", sortOrder: 5 },
  { name: "Breakfast", slug: "breakfast", icon: "Coffee", sortOrder: 6 },
  { name: "Sweets", slug: "sweets", icon: "Cake", sortOrder: 7 },
  { name: "Smoothies", slug: "smoothies", icon: "GlassWater", sortOrder: 8 },
  { name: "Koffie & Thee", slug: "koffie-thee", icon: "CoffeeIcon", sortOrder: 9 },
  { name: "Frisdranken", slug: "frisdranken", icon: "Wine", sortOrder: 10 },
  { name: "Alcoholisch", slug: "alcoholisch", icon: "Beer", sortOrder: 11 },
  { name: "Arrangementen", slug: "arrangementen", icon: "Package", sortOrder: 12 },
];

// ─── Q2 2026 Menu Items (current/active) ────────────────────────────
const Q2_ITEMS: { cat: string; name: string; subtitle: string; price: string; priceLarge?: string; isVegan?: boolean; isVegetarian?: boolean }[] = [
  // Soepen
  { cat: "soepen", name: "Uiensoep", subtitle: "gegratineerd broodje | kruidenolie | bosui", price: "3.95" },
  { cat: "soepen", name: "Knolselderij-cepessoep", subtitle: "oesterzwam | kruidenolie | bosui", price: "3.95" },
  { cat: "soepen", name: "Bospaddenstoelensoep", subtitle: "pompoenpit | kruidenolie | paddenstoelen | cress", price: "3.95" },
  { cat: "soepen", name: "Pompoensoep", subtitle: "ui | pompoen | kruidenolie | pompoenpit", price: "3.95", isVegan: true },
  { cat: "soepen", name: "Linzensoep", subtitle: "linzen | tomaat | winterpeen", price: "3.95", isVegan: true },
  { cat: "soepen", name: "Courgettesoep", subtitle: "ui | laurier | tijm | kruidenolie", price: "3.95", isVegan: true },
  { cat: "soepen", name: "Zoete Aardappelsoep", subtitle: "masala | kerrie | kokosmelk", price: "3.95", isVegan: true },
  // Sandwiches Q2
  { cat: "sandwiches", name: "Chorizo", subtitle: "paprikamayonaise | zongedroogde tomaat | mozzarella | bieslook | mesclun", price: "7.75" },
  { cat: "sandwiches", name: "Smashed Avocado", subtitle: "vegan mayonaise | cherry tomaat | sesamzaad | chillivlokken", price: "7.75", isVegan: true },
  { cat: "sandwiches", name: "York", subtitle: "boerenham | mosterdmayonaise | zongedroogde tomaat | pompoenpit | bieslook | mesclun", price: "6.95" },
  { cat: "sandwiches", name: "Chicken", subtitle: "kipfilet | kerrie hummus | mozzarella | perzik | pittenmix | bieslook | mesclun", price: "7.50" },
  { cat: "sandwiches", name: "Oude Kaas", subtitle: "mosterdmayonaise | puntpaprika | radijs | rode ui | bieslook | mesclun", price: "7.50", isVegetarian: true },
  { cat: "sandwiches", name: "Tuna", subtitle: "tonijnsalade | bieslook | cherrytomaat | mesclun", price: "6.95" },
  { cat: "sandwiches", name: "Egg", subtitle: "eiersalade | bieslook | komkommer | cherrytomaat | mesclun", price: "5.95", isVegetarian: true },
  { cat: "sandwiches", name: "Goat", subtitle: "geitenkaas | walnoot | zongedroogde tomaat | honing | bieslook | mesclun", price: "7.75", isVegetarian: true },
  { cat: "sandwiches", name: "Caprese", subtitle: "mozzarella | tomaat | pesto | basilicum | balsamico | mesclun", price: "7.50", isVegetarian: true },
  // Wraps Q2
  { cat: "wraps", name: "Wrap Veggie", subtitle: "spicy mango hummus | mango | kikkererwten | puntpaprika | amandel | spinazie", price: "7.50", isVegan: true },
  { cat: "wraps", name: "Wrap Pulled Chicken", subtitle: "sesamsaus | cherry tomaat | chilliflakes | bosui | wasabi mayonaise", price: "7.50" },
  // Salades Q2
  { cat: "salades", name: "Salade Gegrilde Groente", subtitle: "rodewijnazijn | zongedroogde tomaat hummus | rode ui | mesclun", price: "7.50", priceLarge: "10.25", isVegan: true },
  { cat: "salades", name: "Zwarte Rijst Salade", subtitle: "cherry tomaat | rode ui | bieslook | chipotle mayonaise | spinazie", price: "7.50", priceLarge: "10.25" },
  { cat: "salades", name: "Far East Salade Bowl", subtitle: "soba noedels | oesterzwam | pulled chicken | radijs | sesamzaad", price: "7.50", priceLarge: "10.25" },
  // Warme Lunch Q2
  { cat: "warme-lunch", name: "Just Say Cheese", subtitle: "belegen kaas | italiaanse kruiden", price: "6.25", isVegetarian: true },
  { cat: "warme-lunch", name: "Tuna Melt", subtitle: "tonijn | jonge kaas", price: "6.95" },
  { cat: "warme-lunch", name: "Not So Cheezy", subtitle: "boerenham | belegen kaas", price: "6.25" },
  { cat: "warme-lunch", name: "Brie Tosti", subtitle: "brie | honing | walnoot", price: "7.50", isVegetarian: true },
  // Breakfast Q2
  { cat: "breakfast", name: "Croissant", subtitle: "met aardbeienjam", price: "2.50" },
  { cat: "breakfast", name: "Yoghurt Fruit Farm", subtitle: "volle yoghurt | perzik | amandelschaafsel", price: "4.25", isVegetarian: true },
  { cat: "breakfast", name: "Overnight Oats", subtitle: "mango | kokosschaafsel", price: "4.95", isVegan: true },
  { cat: "breakfast", name: "Cinnamon Swirl", subtitle: "", price: "3.75" },
  { cat: "breakfast", name: "Hand Fruit", subtitle: "", price: "1.25", isVegan: true },
  // Sweets Q2
  { cat: "sweets", name: "Plaatcake", subtitle: "lemon, kersen, stoofpeer, appel/kaneel", price: "3.25" },
  { cat: "sweets", name: "Koek", subtitle: "haverkoek, kokoskoek, american cookie, chocolate chip cookie", price: "2.75" },
  { cat: "sweets", name: "Brownie", subtitle: "huisgemaakt", price: "2.95" },
  { cat: "sweets", name: "Bananenbrood", subtitle: "huisgemaakt | banaan | gemengde noten | honing", price: "3.75" },
  { cat: "sweets", name: "Muffin", subtitle: "blueberry, naturel, appel/kaneel", price: "3.75" },
  { cat: "sweets", name: "Muesli Date Bar", subtitle: "huisgemaakt", price: "3.95" },
  { cat: "sweets", name: "Bread Pudding", subtitle: "huisgemaakt", price: "2.75" },
  // Smoothies Q2
  { cat: "smoothies", name: "Green Machine", subtitle: "komkommer | avocado | appel | spinazie", price: "3.75", isVegan: true },
  { cat: "smoothies", name: "Yellow Star", subtitle: "mango | sinaasappel | munt", price: "3.75", isVegan: true },
  { cat: "smoothies", name: "Red Devil", subtitle: "aardbei | rode biet | banaan", price: "3.75", isVegan: true },
  { cat: "smoothies", name: "Tropical Carrot", subtitle: "wortel | mango | gember", price: "3.75", isVegan: true },
  { cat: "smoothies", name: "Blue Glow", subtitle: "blauwe bes | gember | biet | amandelmelk", price: "3.75", isVegan: true },
  // Koffie & Thee
  { cat: "koffie-thee", name: "Americano", subtitle: "", price: "2.95" },
  { cat: "koffie-thee", name: "Espresso", subtitle: "", price: "2.75" },
  { cat: "koffie-thee", name: "Cappuccino", subtitle: "", price: "3.25" },
  { cat: "koffie-thee", name: "Koffie Verkeerd", subtitle: "", price: "3.35" },
  { cat: "koffie-thee", name: "Latte Macchiato", subtitle: "", price: "3.35" },
  { cat: "koffie-thee", name: "Thee", subtitle: "", price: "2.95" },
  { cat: "koffie-thee", name: "Warme Chocolademelk", subtitle: "", price: "3.25" },
  // Frisdranken
  { cat: "frisdranken", name: "Fritz Cola of Sinas", subtitle: "", price: "2.95" },
  { cat: "frisdranken", name: "Bos Ice Tea", subtitle: "", price: "2.95" },
  { cat: "frisdranken", name: "Fever Tree Tonic", subtitle: "", price: "2.95" },
  { cat: "frisdranken", name: "Sinaas(Appel)sap", subtitle: "", price: "2.95" },
  { cat: "frisdranken", name: "Bundaberg Gingerbeer", subtitle: "", price: "4.25" },
  { cat: "frisdranken", name: "Soof", subtitle: "", price: "2.95" },
  { cat: "frisdranken", name: "Kombucha", subtitle: "", price: "4.25" },
  { cat: "frisdranken", name: "Earth Water", subtitle: "", price: "2.75" },
  // Alcoholisch
  { cat: "alcoholisch", name: "Bier", subtitle: "", price: "3.95" },
  { cat: "alcoholisch", name: "Wijn (glas)", subtitle: "", price: "4.95" },
  { cat: "alcoholisch", name: "Wijn (fles)", subtitle: "", price: "30.00" },
];

// ─── Q2 Arrangements ───────────────────────────────────────────────
const Q2_ARRANGEMENTS = [
  { name: "Breakfast Deal", price: "17.50", memberPrice: "9.75" },
  { name: "Lunch Deal", price: "15.00", memberPrice: null },
  { name: "Koffie/Thee/Water Halve Dag", price: "9.50", memberPrice: null },
  { name: "Koffie/Thee/Water Hele Dag", price: "17.50", memberPrice: null },
  { name: "Afternoon Bites - Brood met Dip", price: "4.75", memberPrice: null },
  { name: "Afternoon Bites - Crudité met Hummus", price: "4.75", memberPrice: null },
  { name: "Afternoon Bites - Borrel Bites", price: "4.75", memberPrice: null },
  { name: "Diner Deal (p.p.)", price: "23.50", memberPrice: null },
  { name: "Luxe Borrelplank (tot 4 pers.)", price: "19.95", memberPrice: null },
];

// ─── Q2 Preparation instructions (from Foodbook) ───────────────────
const Q2_PREPS: Record<string, string[]> = {
  "Chorizo": [
    "Smeer 1 boterham in met paprikamayonaise (maak deze zelf aan door mayonaise, klein beetje ketchup en paprikapoeder te mengen)",
    "Leg hierop 6 gram (klein handje) mesclun",
    "Verdeel 4 plakken chorizo over de mesclun",
    "Top af met zongedroogde tomaat (15 gr), mozzarella (25 gr) en bieslook (3 gr)",
    "Leg er een boterham bovenop en snijd doormidden",
  ],
  "York": [
    "Smeer 1 boterham in met mosterdmayonaise",
    "Leg hierop 6 gram (klein handje) mesclun",
    "Verdeel 2 plakken boerenham (50 gr) over de mesclun",
    "Top af met een streep mosterdmayonaise en vier zongedroogde tomaatjes (10 gr) en pompoenpitten (3 gr)",
    "Leg er een boterham bovenop en snijd doormidden",
  ],
  "Chicken": [
    "Smeer 1 boterham in met kerrie hummus",
    "Leg hierop 6 gram (klein handje) mesclun",
    "Verdeel 3 plakken kipfilet (40 gr) over de mesclun",
    "Leg daar bovenop de mozzarella (20 gr) en perzik (10 gr)",
    "Top af met de pittenmix (3 gr) en bieslook (3 gr)",
    "Leg er een boterham bovenop en snijd doormidden",
  ],
  "Oude Kaas": [
    "Smeer 1 boterham in met mosterdmayonaise",
    "Leg hierop 6 gram (klein handje) mesclun",
    "Verdeel 2,5 plak oude kaas over de mesclun",
    "Top af met puntpaprika (15 gr), radijs (10 gr), rode ui (10 gr) en bieslook",
    "Leg er een boterham bovenop en snijd doormidden",
  ],
  "Tuna": [
    "Snijd de sandwich alvast doormidden",
    "Verdeel 2 eetlepels tonijnsalade over de sandwich (70 gram)",
    "Top elke helft af met 2 halve cherrytomaatjes (10 gr), bieslook (3 gr) en een klein handje mesclun (6 gr)",
    "Snijd de andere boterham ook doormidden en leg deze helften erop",
  ],
  "Egg": [
    "Snijd de sandwich alvast doormidden",
    "Verdeel 2 eetlepels eiersalade over de sandwich (60 gram)",
    "Top elke helft af met 1 half plakje komkommer (10 gr), 2 halve cherrytomaatjes (10 gr), bieslook (3 gr) en een klein handje mesclun (6 gr)",
    "Snijd de andere boterham ook doormidden en leg deze helften erop",
  ],
  "Smashed Avocado": [
    "Smeer 1 boterham in met vegan mayonaise",
    "Leg hierop 6 gram (klein handje) mesclun",
    "Verdeel de geplette avocado (60 gr) over de mesclun",
    "Top af met cherry tomaat (15 gr), sesamzaad (3 gr) en chillivlokken",
    "Leg er een boterham bovenop en snijd doormidden",
  ],
  "Goat": [
    "Smeer 1 boterham in met honing",
    "Leg hierop 6 gram (klein handje) mesclun",
    "Verdeel geitenkaas (40 gr) over de mesclun",
    "Top af met walnoot (8 gr), zongedroogde tomaat (15 gr) en bieslook (3 gr)",
    "Leg er een boterham bovenop en snijd doormidden",
  ],
  "Caprese": [
    "Smeer 1 boterham in met pesto",
    "Leg hierop 6 gram (klein handje) mesclun",
    "Verdeel mozzarella (40 gr) en tomaat (30 gr) over de mesclun",
    "Top af met basilicum en balsamico",
    "Leg er een boterham bovenop en snijd doormidden",
  ],
  "Wrap Veggie": [
    "Besmeer de wrap met spicy mango hummus (1 el)",
    "Verdeel in het midden een streep mesclun (20 gram)",
    "Leg hierop mangoblokjes (25 gram), hele amandelen (8 gram), amandelschaafsel (3 gram) en kikkererwten (20 gram)",
    "Top af met 2 stukjes puntpaprika en een handje spinazie (25 gram)",
    "Vouw twee kleine stukjes van de wrap naar binnen en rol hem op",
    "Snijd hem daarna doormidden",
  ],
  "Wrap Pulled Chicken": [
    "Besmeer de wrap met wasabimayonaise (1 el)",
    "Verdeel in het midden een streep mesclun (20 gram)",
    "Verdeel 60 gr gemarineerde pulled chicken over de mesclun",
    "Top af met bosui, 4 halve cherrytomaatjes en chili flakes (aleppo peper)",
    "Vouw twee kleine stukjes van de wrap naar binnen en rol hem op",
    "Snijd hem daarna doormidden",
  ],
  "Just Say Cheese": [
    "Beboter 2 sneetjes brood",
    "Beleg met belegen kaas",
    "Bestrooi met italiaanse kruiden",
    "Grill in de tosti-ijzer tot goudbruin",
  ],
  "Tuna Melt": [
    "Beboter 2 sneetjes brood",
    "Verdeel tonijnsalade over 1 sneetje",
    "Beleg met jonge kaas",
    "Grill in de tosti-ijzer tot goudbruin en de kaas gesmolten is",
  ],
  "Not So Cheezy": [
    "Beboter 2 sneetjes brood",
    "Beleg met boerenham en belegen kaas",
    "Grill in de tosti-ijzer tot goudbruin",
  ],
  "Brie Tosti": [
    "Beboter 2 sneetjes brood",
    "Beleg met plakken brie",
    "Voeg walnoot en een druppel honing toe",
    "Grill in de tosti-ijzer tot goudbruin",
  ],
  "Yoghurt Fruit Farm": [
    "Doe volle yoghurt in een kom (150 gr)",
    "Top af met perzik (30 gr) en amandelschaafsel (5 gr)",
  ],
  "Overnight Oats": [
    "Schep de overnight oats in een glas/kom (150 gr)",
    "Top af met mango (25 gr) en kokosschaafsel (5 gr)",
  ],
  "Green Machine": [
    "Doe komkommer, avocado, appel en spinazie in de blender",
    "Blend tot een gladde smoothie",
    "Serveer in een glas",
  ],
  "Yellow Star": [
    "Doe mango, sinaasappel en munt in de blender",
    "Blend tot een gladde smoothie",
    "Serveer in een glas",
  ],
  "Red Devil": [
    "Doe aardbei, rode biet en banaan in de blender",
    "Blend tot een gladde smoothie",
    "Serveer in een glas",
  ],
};

async function seed() {
  const db = await getDb();
  if (!db) {
    log.error("Database not available");
    process.exit(1);
  }

  console.log("🌱 Seeding menu data...");

  // 1. Seasons
  const [q1Season] = await db.insert(menuSeasons).values({
    year: 2026,
    quarter: "Q1",
    name: "Winter 2026",
    startDate: "2026-01-06",
    endDate: "2026-04-06",
    isActive: false,
    driveMenuSheetId: "15HZO89KkVIID4wRq8oHI4owLITEgAtBe5xRhqXpDzXU",
    driveFoodbookDocId: "1mo8vvyfdDOdvaFOv7Gs7EGgeqC__64qNa7nq87s917A",
  }).$returningId();

  const [q2Season] = await db.insert(menuSeasons).values({
    year: 2026,
    quarter: "Q2",
    name: "Lente 2026",
    startDate: "2026-04-07",
    endDate: "2026-07-06",
    isActive: true,
    driveMenuSheetId: "14WZWsnIcnEg2VHLD8jFfrNSp3bfOxN1gz64tdufIfYc",
    driveFoodbookDocId: "1-z-DwSY13Omj6fkW8MmMA2nsQj3p_ukslYdtgO5kJPY",
  }).$returningId();

  console.log(`  ✅ Seasons: Q1=${q1Season.id}, Q2=${q2Season.id}`);

  // 2. Categories
  const catMap: Record<string, number> = {};
  for (const cat of CATEGORIES) {
    const [result] = await db.insert(menuCategories).values(cat).$returningId();
    catMap[cat.slug] = result.id;
  }
  console.log(`  ✅ Categories: ${Object.keys(catMap).length}`);

  // 3. Menu Items + Season Items + Preparations
  let itemCount = 0;
  let prepCount = 0;
  for (const item of Q2_ITEMS) {
    const [result] = await db.insert(menuItems).values({
      categoryId: catMap[item.cat],
      name: item.name,
      subtitle: item.subtitle || null,
      priceEur: item.price,
      priceLargeEur: item.priceLarge || null,
      isVegan: item.isVegan || false,
      isVegetarian: item.isVegetarian || false,
      sortOrder: itemCount,
    }).$returningId();

    // Link to Q2 season
    await db.insert(menuSeasonItems).values({
      seasonId: q2Season.id,
      menuItemId: result.id,
      isAvailable: true,
      sortOrder: itemCount,
    });

    // Add preparation if available
    if (Q2_PREPS[item.name]) {
      await db.insert(menuPreparations).values({
        menuItemId: result.id,
        seasonId: q2Season.id,
        steps: Q2_PREPS[item.name],
      });
      prepCount++;
    }

    itemCount++;
  }
  console.log(`  ✅ Menu items: ${itemCount}`);
  console.log(`  ✅ Preparations: ${prepCount}`);

  // 4. Arrangements
  for (let i = 0; i < Q2_ARRANGEMENTS.length; i++) {
    const arr = Q2_ARRANGEMENTS[i];
    await db.insert(menuArrangements).values({
      seasonId: q2Season.id,
      name: arr.name,
      priceEur: arr.price,
      memberPriceEur: arr.memberPrice,
      isActive: true,
      sortOrder: i,
    });
  }
  console.log(`  ✅ Arrangements: ${Q2_ARRANGEMENTS.length}`);

  console.log("🎉 Menu seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
