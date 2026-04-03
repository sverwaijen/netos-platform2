import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/mDvGyHKfUjrJPbgE7f5Bn3";

// ── Clear existing data ──
await conn.execute("DELETE FROM product_resource_links");
await conn.execute("DELETE FROM booking_addons");
await conn.execute("DELETE FROM kiosk_order_items");
await conn.execute("DELETE FROM kiosk_orders");
await conn.execute("DELETE FROM products");
await conn.execute("DELETE FROM product_categories");
console.log("🗑️  Cleared existing product data");

// ── Product Categories ──
const categories = [
  { name: "Koffie & Thee", slug: "koffie-thee", icon: "Coffee", sortOrder: 1 },
  { name: "Koude Dranken", slug: "koude-dranken", icon: "GlassWater", sortOrder: 2 },
  { name: "Ontbijt & Snacks", slug: "ontbijt-snacks", icon: "Croissant", sortOrder: 3 },
  { name: "Lunch", slug: "lunch", icon: "UtensilsCrossed", sortOrder: 4 },
  { name: "Meeting Catering", slug: "meeting-catering", icon: "ChefHat", sortOrder: 5 },
  { name: "Equipment", slug: "equipment", icon: "Monitor", sortOrder: 6 },
  { name: "Print & Kopie", slug: "print-kopie", icon: "Printer", sortOrder: 7 },
  { name: "Dagpassen", slug: "dagpassen", icon: "Ticket", sortOrder: 8 },
];

for (const c of categories) {
  await conn.execute(
    `INSERT INTO product_categories (name, slug, icon, sortOrder, isActive) VALUES (?, ?, ?, ?, true)`,
    [c.name, c.slug, c.icon, c.sortOrder]
  );
}
console.log(`✅ ${categories.length} categorieën aangemaakt`);

// Get category IDs
const [catRows] = await conn.execute("SELECT id, slug FROM product_categories");
const catMap = {};
for (const r of catRows) catMap[r.slug] = r.id;

// ── Products with CDN images ──
const products = [
  // Koffie & Thee
  { cat: "koffie-thee", name: "Espresso", desc: "Single shot espresso, huismelange", credits: "1.50", eur: "2.50", vat: "9.00", img: `${CDN}/espresso_6d124f38.jpg`, addon: false },
  { cat: "koffie-thee", name: "Dubbele Espresso", desc: "Double shot voor de echte liefhebber", credits: "2.00", eur: "3.00", vat: "9.00", img: `${CDN}/espresso_6d124f38.jpg`, addon: false },
  { cat: "koffie-thee", name: "Cappuccino", desc: "Klassieke cappuccino met opgeschuimd melk", credits: "2.00", eur: "3.50", vat: "9.00", img: `${CDN}/cappuccino_f4e6b95c.jpg`, addon: false },
  { cat: "koffie-thee", name: "Caffè Latte", desc: "Zachte latte, ook met havermelk", credits: "2.00", eur: "3.50", vat: "9.00", img: `${CDN}/latte_4a92c945.jpg`, addon: false },
  { cat: "koffie-thee", name: "Flat White", desc: "Dubbele shot flat white, velvety", credits: "2.50", eur: "3.75", vat: "9.00", img: `${CDN}/flatwhite_c57d229b.jpg`, addon: false },
  { cat: "koffie-thee", name: "Verse Muntthee", desc: "Verse muntblaadjes, heet water", credits: "1.50", eur: "2.50", vat: "9.00", img: `${CDN}/minttea_385fc090.jpg`, addon: false },
  { cat: "koffie-thee", name: "Matcha Latte", desc: "Ceremonial grade matcha met havermelk", credits: "3.00", eur: "4.50", vat: "9.00", img: `${CDN}/matcha_0188f9f6.jpg`, addon: false },
  { cat: "koffie-thee", name: "Chai Latte", desc: "Kruidige chai met opgeschuimd melk", credits: "2.50", eur: "3.75", vat: "9.00", img: `${CDN}/latte_4a92c945.jpg`, addon: false },

  // Koude Dranken
  { cat: "koude-dranken", name: "Bronwater", desc: "500ml glazen fles, stil", credits: "0.50", eur: "1.00", vat: "9.00", img: `${CDN}/stillwater_67b5b001.jpg`, addon: true },
  { cat: "koude-dranken", name: "Spa Rood", desc: "500ml bruisend mineraalwater", credits: "0.50", eur: "1.00", vat: "9.00", img: `${CDN}/sparklingwater_7df860af.webp`, addon: true },
  { cat: "koude-dranken", name: "Vers Sinaasappelsap", desc: "Vers geperst, 250ml", credits: "2.50", eur: "4.00", vat: "9.00", img: `${CDN}/orangejuice_ab84ef5a.jpg`, addon: true },
  { cat: "koude-dranken", name: "Iced Coffee", desc: "Cold brew met ijs en een vleugje melk", credits: "2.50", eur: "3.75", vat: "9.00", img: `${CDN}/icedcoffee_2229640f.jpg`, addon: false },
  { cat: "koude-dranken", name: "Kombucha Gember", desc: "Biologische gember kombucha, 330ml", credits: "2.00", eur: "3.50", vat: "9.00", img: `${CDN}/kombucha_d14fa872.jpg`, addon: false },
  { cat: "koude-dranken", name: "Groene Smoothie", desc: "Spinazie, banaan, appel, gember", credits: "3.00", eur: "4.50", vat: "9.00", img: `${CDN}/orangejuice_ab84ef5a.jpg`, addon: false },

  // Ontbijt & Snacks
  { cat: "ontbijt-snacks", name: "Roomboter Croissant", desc: "Vers gebakken, ambachtelijk", credits: "1.50", eur: "2.50", vat: "9.00", img: `${CDN}/croissant_a373c1de.jpg`, addon: false },
  { cat: "ontbijt-snacks", name: "Bananenbrood", desc: "Huisgemaakt, per plak", credits: "2.00", eur: "3.00", vat: "9.00", img: `${CDN}/bananabread_dd3ff6ae.jpg`, addon: false },
  { cat: "ontbijt-snacks", name: "Notenmix Premium", desc: "Cashew, amandel, walnoot, 100g", credits: "1.50", eur: "2.50", vat: "9.00", img: `${CDN}/mixednuts_a0f2a201.jpg`, addon: false },
  { cat: "ontbijt-snacks", name: "Energy Bar", desc: "Biologische haver-dadel reep", credits: "1.00", eur: "2.00", vat: "9.00", img: `${CDN}/energybar_54b5f0d0.jpg`, addon: false },
  { cat: "ontbijt-snacks", name: "Chocolate Chip Cookie", desc: "Vers gebakken, groot formaat", credits: "1.00", eur: "1.75", vat: "9.00", img: `${CDN}/cookie_d9cdb39f.jpg`, addon: false },
  { cat: "ontbijt-snacks", name: "Yoghurt Bowl", desc: "Griekse yoghurt, granola, seizoensfruit", credits: "3.00", eur: "4.50", vat: "9.00", img: `${CDN}/fruitplatter_bfb6ac15.jpg`, addon: false },

  // Lunch
  { cat: "lunch", name: "Club Sandwich", desc: "Kip, bacon, sla, tomaat, ei", credits: "5.00", eur: "8.50", vat: "9.00", img: `${CDN}/clubsandwich_d29bdc07.jpg`, addon: false },
  { cat: "lunch", name: "Caesar Salade", desc: "Romaine, parmezaan, croutons, dressing", credits: "4.50", eur: "7.50", vat: "9.00", img: `${CDN}/caesarsalad_2bfa015c.jpg`, addon: false },
  { cat: "lunch", name: "Soep van de Dag", desc: "Verse dagsoep met brood", credits: "3.50", eur: "5.50", vat: "9.00", img: `${CDN}/soup_5f7445a0.jpg`, addon: false },
  { cat: "lunch", name: "Avocado Toast", desc: "Zuurdesem, avocado, gepocheerd ei, chili", credits: "4.00", eur: "6.50", vat: "9.00", img: `${CDN}/avocadotoast_78ac9915.jpg`, addon: false },
  { cat: "lunch", name: "Wrap van de Dag", desc: "Dagelijks wisselende wrap", credits: "4.00", eur: "6.50", vat: "9.00", img: `${CDN}/wrap_2761c05f.jpg`, addon: false },
  { cat: "lunch", name: "Tosti Kaas & Ham", desc: "Oude kaas, mosterd, beenham", credits: "3.00", eur: "5.00", vat: "9.00", img: `${CDN}/clubsandwich_d29bdc07.jpg`, addon: false },

  // Meeting Catering (booking add-ons)
  { cat: "meeting-catering", name: "Koffie & Thee Service", desc: "Koffie, thee & water voor vergadering", credits: "3.00", eur: "5.00", vat: "9.00", img: `${CDN}/cappuccino_f4e6b95c.jpg`, addon: true, perHour: true },
  { cat: "meeting-catering", name: "Lunchplank", desc: "Broodjes & salades voor 6-8 personen", credits: "25.00", eur: "42.50", vat: "9.00", img: `${CDN}/lunchplatter_57e5a721.jpg`, addon: true },
  { cat: "meeting-catering", name: "Fruitschaal", desc: "Seizoensfruit voor 6-8 personen", credits: "12.00", eur: "20.00", vat: "9.00", img: `${CDN}/fruitplatter_bfb6ac15.jpg`, addon: true },
  { cat: "meeting-catering", name: "Snackbox", desc: "Koekjes, noten & energierepen", credits: "8.00", eur: "13.50", vat: "9.00", img: `${CDN}/mixednuts_a0f2a201.jpg`, addon: true },
  { cat: "meeting-catering", name: "Drankenpakket", desc: "Sap, water & frisdrank", credits: "4.00", eur: "6.50", vat: "9.00", img: `${CDN}/orangejuice_ab84ef5a.jpg`, addon: true, perHour: true },
  { cat: "meeting-catering", name: "Borrelplank", desc: "Kaas, vleeswaren, noten voor 6-8 pers.", credits: "18.00", eur: "30.00", vat: "9.00", img: `${CDN}/lunchplatter_57e5a721.jpg`, addon: true },

  // Equipment (booking add-ons)
  { cat: "equipment", name: "Beamer Full HD", desc: "Full HD projector met HDMI", credits: "5.00", eur: "8.50", vat: "21.00", img: null, addon: true, perHour: true },
  { cat: "equipment", name: "Whiteboard", desc: "Mobiel whiteboard met stiften", credits: "2.00", eur: "3.50", vat: "21.00", img: null, addon: true },
  { cat: "equipment", name: "Webcam HD", desc: "Logitech HD webcam voor videocalls", credits: "3.00", eur: "5.00", vat: "21.00", img: null, addon: true, perHour: true },
  { cat: "equipment", name: "Flipover", desc: "Flipover met papier en stiften", credits: "2.00", eur: "3.50", vat: "21.00", img: null, addon: true },
  { cat: "equipment", name: "Bluetooth Speaker", desc: "JBL speaker voor presentaties", credits: "3.00", eur: "5.00", vat: "21.00", img: null, addon: true, perHour: true },
  { cat: "equipment", name: "Clickshare", desc: "Draadloos presenteren, plug & play", credits: "2.00", eur: "3.50", vat: "21.00", img: null, addon: true, perHour: true },

  // Print & Kopie
  { cat: "print-kopie", name: "Zwart-wit Print (A4)", desc: "Per pagina", credits: "0.10", eur: "0.15", vat: "21.00", img: null, addon: false },
  { cat: "print-kopie", name: "Kleurenprint (A4)", desc: "Per pagina, full color", credits: "0.25", eur: "0.40", vat: "21.00", img: null, addon: false },
  { cat: "print-kopie", name: "A3 Print Kleur", desc: "A3 formaat, full color", credits: "0.50", eur: "0.80", vat: "21.00", img: null, addon: false },
  { cat: "print-kopie", name: "Scan naar Email", desc: "Per document", credits: "0.10", eur: "0.15", vat: "21.00", img: null, addon: false },

  // Dagpassen
  { cat: "dagpassen", name: "Dagpas Flex Desk", desc: "Hele dag toegang tot flex werkplek", credits: "8.00", eur: "15.00", vat: "21.00", img: null, addon: false },
  { cat: "dagpassen", name: "Dagpas Premium", desc: "Flex desk + 1 uur vergaderruimte", credits: "15.00", eur: "25.00", vat: "21.00", img: null, addon: false },
  { cat: "dagpassen", name: "Dagpas + Lunch", desc: "Flex desk + lunch van de dag", credits: "12.00", eur: "20.00", vat: "21.00", img: null, addon: false },
];

let pCount = 0;
for (const p of products) {
  await conn.execute(
    `INSERT INTO products (categoryId, name, description, imageUrl, priceCredits, priceEur, vatRate, isActive, isBookingAddon, chargePerBookingHour, allowMultipleQuantity, sortOrder)
     VALUES (?, ?, ?, ?, ?, ?, ?, true, ?, ?, true, ?)`,
    [catMap[p.cat], p.name, p.desc, p.img, p.credits, p.eur, p.vat, p.addon ? 1 : 0, p.perHour ? 1 : 0, pCount]
  );
  pCount++;
}
console.log(`✅ ${products.length} producten aangemaakt met foto's`);

// Link booking add-on products to meeting room resource types
const [rtRows] = await conn.execute("SELECT id, name FROM resource_types WHERE name LIKE '%Meeting%' OR name LIKE '%Board%' OR name LIKE '%Conference%'");
const [addonProducts] = await conn.execute("SELECT id FROM products WHERE isBookingAddon = true");

let linkCount = 0;
for (const rt of rtRows) {
  for (const prod of addonProducts) {
    await conn.execute(
      `INSERT INTO product_resource_links (productId, resourceTypeId, isRequired, isDefault, sortOrder)
       VALUES (?, ?, false, false, ?)`,
      [prod.id, rt.id, linkCount]
    );
    linkCount++;
  }
}
console.log(`✅ ${linkCount} product-resource links aangemaakt`);

await conn.end();
console.log("🎉 Product catalog v2 seed complete!");
