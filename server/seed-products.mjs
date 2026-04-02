import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Product Categories
const categories = [
  { name: "Hot Drinks", slug: "hot-drinks", icon: "Coffee", sortOrder: 1 },
  { name: "Cold Drinks", slug: "cold-drinks", icon: "GlassWater", sortOrder: 2 },
  { name: "Snacks", slug: "snacks", icon: "Cookie", sortOrder: 3 },
  { name: "Lunch", slug: "lunch", icon: "UtensilsCrossed", sortOrder: 4 },
  { name: "Catering", slug: "catering", icon: "ChefHat", sortOrder: 5 },
  { name: "Equipment", slug: "equipment", icon: "Monitor", sortOrder: 6 },
  { name: "Printing", slug: "printing", icon: "Printer", sortOrder: 7 },
  { name: "Day Passes", slug: "day-passes", icon: "Ticket", sortOrder: 8 },
];

for (const c of categories) {
  await conn.execute(
    `INSERT INTO product_categories (name, slug, icon, sortOrder, isActive) VALUES (?, ?, ?, ?, true)
     ON DUPLICATE KEY UPDATE name=VALUES(name)`,
    [c.name, c.slug, c.icon, c.sortOrder]
  );
}
console.log(`✅ ${categories.length} product categories seeded`);

// Get category IDs
const [catRows] = await conn.execute("SELECT id, slug FROM product_categories");
const catMap = {};
for (const r of catRows) catMap[r.slug] = r.id;

// Products
const products = [
  // Hot Drinks
  { cat: "hot-drinks", name: "Espresso", desc: "Single shot espresso", credits: "1.50", eur: "2.50", addon: false },
  { cat: "hot-drinks", name: "Cappuccino", desc: "Classic cappuccino with steamed milk", credits: "2.00", eur: "3.50", addon: false },
  { cat: "hot-drinks", name: "Latte", desc: "Smooth latte with oat milk option", credits: "2.00", eur: "3.50", addon: false },
  { cat: "hot-drinks", name: "Flat White", desc: "Double shot flat white", credits: "2.50", eur: "3.75", addon: false },
  { cat: "hot-drinks", name: "Fresh Mint Tea", desc: "Fresh mint leaves, hot water", credits: "1.50", eur: "2.50", addon: false },
  { cat: "hot-drinks", name: "Matcha Latte", desc: "Ceremonial grade matcha", credits: "3.00", eur: "4.50", addon: false },
  // Cold Drinks
  { cat: "cold-drinks", name: "Still Water", desc: "500ml bottle", credits: "0.50", eur: "1.00", addon: true },
  { cat: "cold-drinks", name: "Sparkling Water", desc: "500ml bottle", credits: "0.50", eur: "1.00", addon: true },
  { cat: "cold-drinks", name: "Fresh Orange Juice", desc: "Freshly squeezed", credits: "2.50", eur: "4.00", addon: true },
  { cat: "cold-drinks", name: "Iced Coffee", desc: "Cold brew with ice", credits: "2.50", eur: "3.75", addon: false },
  { cat: "cold-drinks", name: "Kombucha", desc: "Organic ginger kombucha", credits: "2.00", eur: "3.50", addon: false },
  // Snacks
  { cat: "snacks", name: "Croissant", desc: "Butter croissant, freshly baked", credits: "1.50", eur: "2.50", addon: false },
  { cat: "snacks", name: "Banana Bread", desc: "Homemade banana bread slice", credits: "2.00", eur: "3.00", addon: false },
  { cat: "snacks", name: "Mixed Nuts", desc: "Premium nut mix, 100g", credits: "1.50", eur: "2.50", addon: false },
  { cat: "snacks", name: "Energy Bar", desc: "Organic oat bar", credits: "1.00", eur: "2.00", addon: false },
  { cat: "snacks", name: "Cookie", desc: "Chocolate chip cookie", credits: "1.00", eur: "1.75", addon: false },
  // Lunch
  { cat: "lunch", name: "Club Sandwich", desc: "Chicken, bacon, lettuce, tomato", credits: "5.00", eur: "8.50", addon: false },
  { cat: "lunch", name: "Caesar Salad", desc: "Romaine, parmesan, croutons", credits: "4.50", eur: "7.50", addon: false },
  { cat: "lunch", name: "Soup of the Day", desc: "Fresh daily soup with bread", credits: "3.50", eur: "5.50", addon: false },
  { cat: "lunch", name: "Avocado Toast", desc: "Sourdough, avocado, poached egg", credits: "4.00", eur: "6.50", addon: false },
  { cat: "lunch", name: "Wrap of the Day", desc: "Daily rotating wrap", credits: "4.00", eur: "6.50", addon: false },
  // Catering (booking add-ons)
  { cat: "catering", name: "Coffee Service", desc: "Coffee, tea & water for meeting", credits: "3.00", eur: "5.00", addon: true, perHour: true },
  { cat: "catering", name: "Lunch Platter", desc: "Sandwiches & salads for 6-8 people", credits: "25.00", eur: "42.50", addon: true },
  { cat: "catering", name: "Fruit Platter", desc: "Seasonal fresh fruit for 6-8 people", credits: "12.00", eur: "20.00", addon: true },
  { cat: "catering", name: "Snack Box", desc: "Cookies, nuts & energy bars", credits: "8.00", eur: "13.50", addon: true },
  { cat: "catering", name: "Drinks Package", desc: "Juice, water & soft drinks", credits: "4.00", eur: "6.50", addon: true, perHour: true },
  // Equipment (booking add-ons)
  { cat: "equipment", name: "Projector", desc: "Full HD projector with HDMI", credits: "5.00", eur: "8.50", addon: true, perHour: true },
  { cat: "equipment", name: "Whiteboard", desc: "Mobile whiteboard with markers", credits: "2.00", eur: "3.50", addon: true },
  { cat: "equipment", name: "Webcam HD", desc: "Logitech HD webcam for video calls", credits: "3.00", eur: "5.00", addon: true, perHour: true },
  { cat: "equipment", name: "Flipchart", desc: "Flipchart with paper and markers", credits: "2.00", eur: "3.50", addon: true },
  { cat: "equipment", name: "Speaker System", desc: "Bluetooth speaker for presentations", credits: "3.00", eur: "5.00", addon: true, perHour: true },
  // Printing
  { cat: "printing", name: "B/W Print (per page)", desc: "A4 black & white", credits: "0.10", eur: "0.15", addon: false },
  { cat: "printing", name: "Color Print (per page)", desc: "A4 full color", credits: "0.25", eur: "0.40", addon: false },
  { cat: "printing", name: "A3 Print", desc: "A3 color print", credits: "0.50", eur: "0.80", addon: false },
  // Day Passes
  { cat: "day-passes", name: "Day Pass - Hot Desk", desc: "Full day access to hot desk area", credits: "8.00", eur: "15.00", addon: false },
  { cat: "day-passes", name: "Day Pass - Premium", desc: "Full day access + meeting room 1hr", credits: "15.00", eur: "25.00", addon: false },
];

let pCount = 0;
for (const p of products) {
  await conn.execute(
    `INSERT INTO products (categoryId, name, description, priceCredits, priceEur, isActive, isBookingAddon, chargePerBookingHour, allowMultipleQuantity, sortOrder)
     VALUES (?, ?, ?, ?, ?, true, ?, ?, true, ?)
     ON DUPLICATE KEY UPDATE name=VALUES(name)`,
    [catMap[p.cat], p.name, p.desc, p.credits, p.eur, p.addon ? 1 : 0, p.perHour ? 1 : 0, pCount]
  );
  pCount++;
}
console.log(`✅ ${products.length} products seeded`);

// Link booking add-on products to meeting room resource types
const [rtRows] = await conn.execute("SELECT id, name FROM resource_types WHERE name LIKE '%Meeting%' OR name LIKE '%Board%' OR name LIKE '%Conference%'");
const [addonProducts] = await conn.execute("SELECT id FROM products WHERE isBookingAddon = true");

let linkCount = 0;
for (const rt of rtRows) {
  for (const prod of addonProducts) {
    await conn.execute(
      `INSERT INTO product_resource_links (productId, resourceTypeId, isRequired, isDefault, sortOrder)
       VALUES (?, ?, false, false, ?)
       ON DUPLICATE KEY UPDATE sortOrder=VALUES(sortOrder)`,
      [prod.id, rt.id, linkCount]
    );
    linkCount++;
  }
}
console.log(`✅ ${linkCount} product-resource links seeded`);

await conn.end();
console.log("🎉 Product catalog seed complete!");
