/**
 * Seed remaining empty tables with correct PG column names
 */
import pg from "pg";

const url = process.env.SUPABASE_DB_URL || "";
const m = url.match(/postgresql:\/\/postgres:([^@]+)@db\.([a-z0-9]+)\.supabase\.co:(\d+)\/(.+)/);
const poolerUrl = m ? `postgresql://postgres.${m[2]}:${m[1]}@aws-1-eu-central-1.pooler.supabase.com:5432/${m[4]}` : url;
const client = new pg.Client(poolerUrl);
await client.connect();

async function run(label, sql, values) {
  try {
    await client.query(sql, values);
    console.log(`✓ ${label}`);
  } catch (e) {
    if (e.message.includes("duplicate")) console.log(`⊘ ${label} (already exists)`);
    else console.error(`✗ ${label}: ${e.message}`);
  }
}

// ─── PARKING ZONES ───
const locations = [
  { id: 1, name: "Amsterdam", spots: 45 },
  { id: 2, name: "Rotterdam", spots: 30 },
  { id: 3, name: "Zwolle", spots: 25 },
  { id: 4, name: "Ede", spots: 20 },
  { id: 5, name: "Apeldoorn", spots: 20 },
  { id: 6, name: "Klarenbeek", spots: 15 },
  { id: 7, name: "Spijkenisse", spots: 20 },
];

for (const loc of locations) {
  const slug = loc.name.toLowerCase().replace(/\s+/g, "-");
  await run(`Parking zone: ${loc.name}`, `
    INSERT INTO parking_zones ("locationId", name, slug, "totalSpots", type, "accessMethod", "isActive", "createdAt")
    VALUES ($1, $2, $3, $4, 'indoor', 'anpr', true, NOW())
    ON CONFLICT DO NOTHING
  `, [loc.id, `${loc.name} Parking`, slug, loc.spots]);
}

const zoneRes = await client.query(`SELECT id, "locationId", "totalSpots" FROM parking_zones ORDER BY id`);
const zones = zoneRes.rows;

// ─── PARKING SPOTS ───
for (const zone of zones) {
  for (let i = 1; i <= zone.totalSpots; i++) {
    const floor = Math.ceil(i / 15);
    const spotNum = ((i - 1) % 15) + 1;
    const type = i <= 2 ? "ev_charging" : i <= 4 ? "handicap" : "standard";
    await run(`Spot ${zone.locationId}-${floor}${String(spotNum).padStart(2, "0")}`, `
      INSERT INTO parking_spots ("zoneId", "spotNumber", type, status, "isActive")
      VALUES ($1, $2, $3, 'available', true)
      ON CONFLICT DO NOTHING
    `, [zone.id, `${floor}${String(spotNum).padStart(2, "0")}`, type]);
  }
}

// ─── PARKING PRICING ───
for (const zone of zones) {
  await run(`Pricing: ${zone.locationId} hourly`, `
    INSERT INTO parking_pricing ("zoneId", name, "rateType", "priceEur", "priceCredits", "appliesToType", "freeMinutes", "maxDailyCapEur", "isActive", "createdAt")
    VALUES ($1, 'Standard Rate', 'hourly', 3.50, 7.00, 'all', 15, 15.00, true, NOW())
    ON CONFLICT DO NOTHING
  `, [zone.id]);
  await run(`Pricing: ${zone.locationId} monthly`, `
    INSERT INTO parking_pricing ("zoneId", name, "rateType", "priceEur", "priceCredits", "appliesToType", "freeMinutes", "maxDailyCapEur", "isActive", "createdAt")
    VALUES ($1, 'Member Monthly', 'monthly', 99.00, 198.00, 'members', 0, 0.00, true, NOW())
    ON CONFLICT DO NOTHING
  `, [zone.id]);
}

// ─── PRODUCT CATEGORIES ───
const categories = [
  { name: "Hot Drinks", slug: "hot-drinks" },
  { name: "Cold Drinks", slug: "cold-drinks" },
  { name: "Snacks", slug: "snacks" },
  { name: "Lunch", slug: "lunch" },
  { name: "Extras", slug: "extras" },
];
for (let i = 0; i < categories.length; i++) {
  await run(`Category: ${categories[i].name}`, `
    INSERT INTO product_categories (name, slug, "sortOrder", "isActive", "createdAt")
    VALUES ($1, $2, $3, true, NOW())
    ON CONFLICT DO NOTHING
  `, [categories[i].name, categories[i].slug, i + 1]);
}

const catRes = await client.query(`SELECT id, name FROM product_categories ORDER BY "sortOrder"`);
const catMap = {};
catRes.rows.forEach(r => catMap[r.name] = r.id);

// ─── PRODUCTS ───
const products = [
  { name: "Espresso", desc: "Single shot espresso", eur: 2.50, credits: 5.00, cat: "Hot Drinks", sku: "HD-001" },
  { name: "Cappuccino", desc: "Espresso with steamed milk foam", eur: 3.50, credits: 7.00, cat: "Hot Drinks", sku: "HD-002" },
  { name: "Flat White", desc: "Double espresso with velvety milk", eur: 3.80, credits: 7.60, cat: "Hot Drinks", sku: "HD-003" },
  { name: "Latte", desc: "Espresso with steamed milk", eur: 3.50, credits: 7.00, cat: "Hot Drinks", sku: "HD-004" },
  { name: "Tea", desc: "Selection of premium teas", eur: 2.80, credits: 5.60, cat: "Hot Drinks", sku: "HD-005" },
  { name: "Hot Chocolate", desc: "Rich Belgian chocolate", eur: 3.50, credits: 7.00, cat: "Hot Drinks", sku: "HD-006" },
  { name: "Fresh Orange Juice", desc: "Freshly squeezed oranges", eur: 4.50, credits: 9.00, cat: "Cold Drinks", sku: "CD-001" },
  { name: "Sparkling Water", desc: "500ml sparkling mineral water", eur: 2.00, credits: 4.00, cat: "Cold Drinks", sku: "CD-002" },
  { name: "Still Water", desc: "500ml still mineral water", eur: 2.00, credits: 4.00, cat: "Cold Drinks", sku: "CD-003" },
  { name: "Iced Latte", desc: "Cold espresso with milk over ice", eur: 4.00, credits: 8.00, cat: "Cold Drinks", sku: "CD-004" },
  { name: "Smoothie", desc: "Mixed berry or mango smoothie", eur: 5.50, credits: 11.00, cat: "Cold Drinks", sku: "CD-005" },
  { name: "Croissant", desc: "Freshly baked butter croissant", eur: 2.80, credits: 5.60, cat: "Snacks", sku: "SN-001" },
  { name: "Banana Bread", desc: "Homemade banana bread slice", eur: 3.20, credits: 6.40, cat: "Snacks", sku: "SN-002" },
  { name: "Energy Bar", desc: "Organic nut & seed bar", eur: 2.50, credits: 5.00, cat: "Snacks", sku: "SN-003" },
  { name: "Mixed Nuts", desc: "Roasted mixed nuts 100g", eur: 3.00, credits: 6.00, cat: "Snacks", sku: "SN-004" },
  { name: "Cookie", desc: "Chocolate chip cookie", eur: 2.20, credits: 4.40, cat: "Snacks", sku: "SN-005" },
  { name: "Club Sandwich", desc: "Chicken, bacon, lettuce, tomato", eur: 8.50, credits: 17.00, cat: "Lunch", sku: "LU-001" },
  { name: "Caesar Salad", desc: "Romaine, parmesan, croutons, dressing", eur: 9.00, credits: 18.00, cat: "Lunch", sku: "LU-002" },
  { name: "Veggie Wrap", desc: "Grilled vegetables, hummus, feta", eur: 7.50, credits: 15.00, cat: "Lunch", sku: "LU-003" },
  { name: "Soup of the Day", desc: "Chef's daily soup with bread", eur: 6.00, credits: 12.00, cat: "Lunch", sku: "LU-004" },
  { name: "Meeting Room Catering", desc: "Coffee, tea & snacks for meetings (per person)", eur: 12.50, credits: 25.00, cat: "Extras", sku: "EX-001" },
  { name: "Fruit Basket", desc: "Fresh seasonal fruit basket", eur: 15.00, credits: 30.00, cat: "Extras", sku: "EX-002" },
  { name: "Printing (B&W)", desc: "Per page black & white printing", eur: 0.15, credits: 0.30, cat: "Extras", sku: "EX-003" },
  { name: "Printing (Color)", desc: "Per page color printing", eur: 0.35, credits: 0.70, cat: "Extras", sku: "EX-004" },
];

for (let i = 0; i < products.length; i++) {
  const p = products[i];
  await run(`Product: ${p.name}`, `
    INSERT INTO products ("categoryId", name, description, "priceCredits", "priceEur", sku, "isActive", "sortOrder", "createdAt")
    VALUES ($1, $2, $3, $4, $5, $6, true, $7, NOW())
    ON CONFLICT DO NOTHING
  `, [catMap[p.cat], p.name, p.desc, p.credits, p.eur, p.sku, i + 1]);
}

// ─── TICKET SLA POLICIES ───
const slas = [
  { name: "Urgent", priority: "urgent", response: 30, resolution: 240 },
  { name: "High", priority: "high", response: 120, resolution: 480 },
  { name: "Normal", priority: "normal", response: 480, resolution: 1440 },
  { name: "Low", priority: "low", response: 1440, resolution: 4320 },
];
for (const sla of slas) {
  await run(`SLA: ${sla.name}`, `
    INSERT INTO ticket_sla_policies (name, priority, "firstResponseMinutes", "resolutionMinutes", "isActive", "createdAt")
    VALUES ($1, $2, $3, $4, true, NOW())
    ON CONFLICT DO NOTHING
  `, [sla.name, sla.priority, sla.response, sla.resolution]);
}

// ─── CANNED RESPONSES ───
const canned = [
  { title: "Welcome", cat: "general", body: "Thank you for reaching out! We'll look into this and get back to you shortly.", shortcut: "/welcome" },
  { title: "Resolved", cat: "closing", body: "This issue has been resolved. Please let us know if you need anything else.", shortcut: "/resolved" },
  { title: "Need More Info", cat: "general", body: "Could you provide more details about the issue? This will help us resolve it faster.", shortcut: "/moreinfo" },
  { title: "Maintenance Scheduled", cat: "facilities", body: "We've scheduled maintenance for this issue. Expected completion: [DATE].", shortcut: "/maint" },
  { title: "Access Issue", cat: "access", body: "We've reset your access credentials. Please try again and let us know if the issue persists.", shortcut: "/access" },
  { title: "Billing Question", cat: "billing", body: "Thank you for your billing inquiry. We've reviewed your account and [DETAILS].", shortcut: "/billing" },
  { title: "Escalated", cat: "general", body: "This has been escalated to our facilities team. You'll receive an update within 24 hours.", shortcut: "/escalate" },
  { title: "WiFi Troubleshooting", cat: "tech", body: "Please try: 1) Forget the network and reconnect 2) Restart your device 3) Try the guest network.", shortcut: "/wifi" },
];
for (const c of canned) {
  await run(`Canned: ${c.title}`, `
    INSERT INTO canned_responses (title, body, category, shortcut, "usageCount", "isActive", "createdAt")
    VALUES ($1, $2, $3, $4, 0, true, NOW())
    ON CONFLICT DO NOTHING
  `, [c.title, c.body, c.cat, c.shortcut]);
}

// ─── OPS AGENDA (using startTime as bigint unix timestamp ms) ───
const now = Date.now();
const DAY = 86400000;
const opsItems = [
  { locId: 1, title: "Weekly deep clean", type: "maintenance", priority: "normal", status: "scheduled", offset: 5 * DAY },
  { locId: 1, title: "HVAC filter replacement", type: "maintenance", priority: "high", status: "scheduled", offset: 6 * DAY },
  { locId: 2, title: "New member onboarding: TechFlow BV", type: "other", priority: "normal", status: "scheduled", offset: 1 * DAY },
  { locId: 3, title: "Fire safety inspection", type: "inspection", priority: "high", status: "scheduled", offset: 7 * DAY },
  { locId: 4, title: "Printer maintenance", type: "maintenance", priority: "low", status: "scheduled", offset: 8 * DAY },
  { locId: 5, title: "Community event setup", type: "event", priority: "normal", status: "scheduled", offset: 9 * DAY },
  { locId: 6, title: "Parking gate repair", type: "maintenance", priority: "high", status: "in_progress", offset: 0 },
  { locId: 7, title: "Opening preparation checklist", type: "other", priority: "urgent", status: "in_progress", offset: 2 * DAY },
];
for (const item of opsItems) {
  const startTime = now + item.offset;
  const endTime = startTime + 2 * 3600000; // 2 hours duration
  await run(`Ops: ${item.title}`, `
    INSERT INTO ops_agenda ("locationId", title, type, priority, status, "startTime", "endTime", "createdAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    ON CONFLICT DO NOTHING
  `, [item.locId, item.title, item.type, item.priority, item.status, startTime, endTime]);
}

// ─── CRM TRIGGERS (using eventType, conditions, actions as jsonb) ───
const triggers = [
  { name: "New Lead Welcome Email", desc: "Send welcome email when a new lead is created", eventType: "lead_created", conditions: {}, actions: { type: "send_email", templateId: 1 } },
  { name: "Follow-up After Tour", desc: "Send follow-up email 24h after tour is scheduled", eventType: "stage_change", conditions: { newStage: "tour_scheduled" }, actions: { type: "send_email", templateId: 2, delaySeconds: 86400 } },
  { name: "Re-engage Cold Leads", desc: "Send re-engagement email for leads inactive 30 days", eventType: "inactivity", conditions: { inactiveDays: 30 }, actions: { type: "send_email", templateId: 3 } },
  { name: "Notify Owner on Won Deal", desc: "Notify owner when a deal is won", eventType: "stage_change", conditions: { newStage: "won" }, actions: { type: "notify_owner" } },
  { name: "Lost Lead Survey", desc: "Send survey 1h after lead is marked as lost", eventType: "stage_change", conditions: { newStage: "lost" }, actions: { type: "send_email", templateId: 4, delaySeconds: 3600 } },
];
for (const t of triggers) {
  await run(`Trigger: ${t.name}`, `
    INSERT INTO crm_triggers (name, description, "isActive", "eventType", conditions, actions, "executionCount", "createdAt")
    VALUES ($1, $2, true, $3, $4, $5, 0, NOW())
    ON CONFLICT DO NOTHING
  `, [t.name, t.desc, t.eventType, JSON.stringify(t.conditions), JSON.stringify(t.actions)]);
}

// ─── RESOURCE CATEGORIES ───
const resCats = [
  { name: "Private Offices", slug: "private-offices", desc: "Dedicated private office spaces", icon: "building" },
  { name: "Meeting Rooms", slug: "meeting-rooms", desc: "Bookable meeting and conference rooms", icon: "users" },
  { name: "Hot Desks", slug: "hot-desks", desc: "Flexible desk spaces", icon: "laptop" },
  { name: "Event Spaces", slug: "event-spaces", desc: "Spaces for events and workshops", icon: "calendar" },
  { name: "Phone Booths", slug: "phone-booths", desc: "Private phone call booths", icon: "phone" },
];
for (let i = 0; i < resCats.length; i++) {
  const rc = resCats[i];
  await run(`Resource Category: ${rc.name}`, `
    INSERT INTO resource_categories (name, slug, description, icon, "sortOrder", "isActive", "createdAt")
    VALUES ($1, $2, $3, $4, $5, true, NOW())
    ON CONFLICT DO NOTHING
  `, [rc.name, rc.slug, rc.desc, rc.icon, i + 1]);
}

// ─── Final Counts ───
const countTables = [
  "parking_zones", "parking_spots", "parking_pricing", "product_categories", "products",
  "ticket_sla_policies", "canned_responses", "ops_agenda", "crm_triggers", "resource_categories"
];
console.log("\n─── Final Counts ───");
for (const t of countTables) {
  const r = await client.query(`SELECT COUNT(*) as c FROM "${t}"`);
  console.log(`${t}: ${r.rows[0].c}`);
}

await client.end();
console.log("\n✓ All seed data inserted");
