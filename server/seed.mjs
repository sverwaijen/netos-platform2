import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  // ─── Locations ───
  const locationData = [
    { name: "Mr. Green Apeldoorn", slug: "apeldoorn", address: "Lange Amerikaweg 55/61/67", city: "Apeldoorn", postalCode: "7332 BP", lat: "52.184200", lng: "5.981600", totalResources: 169 },
    { name: "Mr. Green Klarenbeek", slug: "klarenbeek", address: "Oudhuizerstraat 31", city: "Klarenbeek", postalCode: "7382 BS", lat: "52.160000", lng: "6.080000", totalResources: 152 },
    { name: "Mr. Green Amsterdam", slug: "amsterdam", address: "Stationsplein 9", city: "Amsterdam", postalCode: "1012 AB", lat: "52.378900", lng: "4.900300", totalResources: 140 },
    { name: "Mr. Green Zwolle", slug: "zwolle", address: "Ceintuurbaan 28", city: "Zwolle", postalCode: "8024 AA", lat: "52.516700", lng: "6.116700", totalResources: 135 },
    { name: "Mr. Green Rotterdam", slug: "rotterdam", address: "Hofplein 19", city: "Rotterdam", postalCode: "3032 AC", lat: "51.925000", lng: "4.479200", totalResources: 124 },
    { name: "Mr. Green Ede", slug: "ede", address: "Achterdoelen 5", city: "Ede", postalCode: "6711 AV", lat: "52.048100", lng: "5.670000", totalResources: 101 },
    { name: "Mr. Green Spijkenisse", slug: "spijkenisse", address: "Plaatweg 15", city: "Spijkenisse", postalCode: "3202 LB", lat: "51.860000", lng: "4.320000", totalResources: 96 },
  ];

  for (const loc of locationData) {
    await connection.execute(
      `INSERT INTO locations (name, slug, address, city, postalCode, lat, lng, totalResources) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)`,
      [loc.name, loc.slug, loc.address, loc.city, loc.postalCode, loc.lat, loc.lng, loc.totalResources]
    );
  }
  console.log("✓ 7 locations seeded");

  // Get location IDs
  const [locations] = await connection.execute("SELECT id, slug FROM locations ORDER BY id");

  // ─── Resources per location ───
  const resourceTemplates = [
    { name: "Smart Desk", type: "desk", zone: "zone_2", capacity: 1, creditCostPerHour: "2.00", count: 45 },
    { name: "Open Space", type: "open_space", zone: "zone_1", capacity: 30, creditCostPerHour: "0.50", count: 2 },
    { name: "Meeting Room S", type: "meeting_room", zone: "zone_3", capacity: 4, creditCostPerHour: "10.00", count: 3 },
    { name: "Meeting Room M", type: "meeting_room", zone: "zone_3", capacity: 8, creditCostPerHour: "15.00", count: 2 },
    { name: "Meeting Room L", type: "meeting_room", zone: "zone_3", capacity: 16, creditCostPerHour: "25.00", count: 1 },
    { name: "Private Office", type: "private_office", zone: "zone_3", capacity: 4, creditCostPerHour: "20.00", count: 3 },
    { name: "Phone Booth", type: "phone_booth", zone: "zone_2", capacity: 1, creditCostPerHour: "5.00", count: 4 },
    { name: "Locker", type: "locker", zone: "zone_1", capacity: 1, creditCostPerHour: "0.25", count: 10 },
    { name: "Boutique Gym", type: "gym", zone: "zone_1", capacity: 10, creditCostPerHour: "3.00", count: 1 },
    { name: "Event Space", type: "event_space", zone: "zone_3", capacity: 50, creditCostPerHour: "40.00", count: 1 },
  ];

  const amenitiesByType = {
    desk: '["WiFi", "Monitor", "USB-C Charging", "Adjustable Height"]',
    open_space: '["WiFi", "Power Outlets", "Natural Light"]',
    meeting_room: '["WiFi", "Display Screen", "Whiteboard", "Video Conferencing"]',
    private_office: '["WiFi", "Monitor", "Standing Desk", "Lockable Door", "Climate Control"]',
    phone_booth: '["WiFi", "Soundproof", "USB-C Charging"]',
    locker: '["Secure Lock", "USB Charging"]',
    gym: '["Equipment", "Shower", "Towels"]',
    event_space: '["WiFi", "Projector", "Sound System", "Catering Kitchen"]',
  };

  let resourceCount = 0;
  for (const loc of locations) {
    for (const tmpl of resourceTemplates) {
      for (let i = 1; i <= tmpl.count; i++) {
        const resourceName = tmpl.count > 1 ? `${tmpl.name} ${String(i).padStart(2, "0")}` : tmpl.name;
        await connection.execute(
          `INSERT INTO resources (locationId, name, type, zone, capacity, amenities, creditCostPerHour, floor, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true)`,
          [loc.id, resourceName, tmpl.type, tmpl.zone, tmpl.capacity, amenitiesByType[tmpl.type], tmpl.creditCostPerHour, "1"]
        );
        resourceCount++;
      }
    }
  }
  console.log(`✓ ${resourceCount} resources seeded`);

  // ─── Credit Bundles ───
  const bundles = [
    { name: "Basic Access", slug: "basic-access", creditsPerMonth: 0, priceEur: "0.00", description: "Lobby access, community events", features: '["Zone 0 Access", "Community Events", "WiFi in Lobby"]', isPopular: false },
    { name: "Lobby Plus", slug: "lobby-plus", creditsPerMonth: 15, priceEur: "49.00", description: "1 free day per month + lobby access", features: '["Zone 0-1 Access", "1 Free Day/Month", "Community Events", "Coffee Included"]', isPopular: false },
    { name: "Service & Discount", slug: "service-discount", creditsPerMonth: 10, priceEur: "50.00", description: "Small budget, discount on extra credits", features: '["Zone 0-1 Access", "10 Credits/Month", "10% Discount on Extra", "Community Events"]', isPopular: false },
    { name: "Some Time", slug: "some-time", creditsPerMonth: 60, priceEur: "209.00", description: "4-8 days flexible working", features: '["Zone 0-2 Access", "60 Credits/Month", "Smart Desk Access", "Meeting Room Booking"]', isPopular: false },
    { name: "Part Time", slug: "part-time", creditsPerMonth: 150, priceEur: "349.00", description: "10-20 days, meeting rooms included", features: '["Zone 0-3 Access", "150 Credits/Month", "All Resources", "Priority Booking", "Visitor Management"]', isPopular: true },
    { name: "Full Time", slug: "full-time", creditsPerMonth: 350, priceEur: "499.00", description: "Unlimited desk, premium access", features: '["Zone 0-3 Access", "350 Credits/Month", "Dedicated Desk", "All Premium Amenities", "Priority Support", "Signing Platform"]', isPopular: false },
  ];

  for (const b of bundles) {
    await connection.execute(
      `INSERT INTO credit_bundles (name, slug, creditsPerMonth, priceEur, description, features, isPopular) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)`,
      [b.name, b.slug, b.creditsPerMonth, b.priceEur, b.description, b.features, b.isPopular]
    );
  }
  console.log("✓ 6 credit bundles seeded");

  // ─── Day Multipliers (per location) ───
  const defaultMultipliers = [
    { dayOfWeek: 0, multiplier: "0.50" },  // Sunday
    { dayOfWeek: 1, multiplier: "0.50" },  // Monday
    { dayOfWeek: 2, multiplier: "0.70" },  // Tuesday
    { dayOfWeek: 3, multiplier: "1.00" },  // Wednesday
    { dayOfWeek: 4, multiplier: "1.40" },  // Thursday
    { dayOfWeek: 5, multiplier: "0.45" },  // Friday
    { dayOfWeek: 6, multiplier: "0.50" },  // Saturday
  ];

  for (const loc of locations) {
    for (const m of defaultMultipliers) {
      await connection.execute(
        `INSERT INTO day_multipliers (locationId, dayOfWeek, multiplier) VALUES (?, ?, ?)`,
        [loc.id, m.dayOfWeek, m.multiplier]
      );
    }
  }
  console.log("✓ Day multipliers seeded for all locations");

  // ─── Demo Companies ───
  const demoCompanies = [
    { name: "MEWS GLOBAL", slug: "mews-global", memberCount: 177, tier: "gold", totalSpend: "45000.00", primaryColor: "#0066FF", secondaryColor: "#00CC88" },
    { name: "Team Rockstars IT", slug: "team-rockstars-it", memberCount: 138, tier: "gold", totalSpend: "38000.00", primaryColor: "#FF4500", secondaryColor: "#FFD700" },
    { name: "Net OS", slug: "net-os", memberCount: 133, tier: "gold", totalSpend: "35000.00", primaryColor: "#1a1a2e", secondaryColor: "#00D4AA" },
    { name: "thyssenkrupp Veerhaven", slug: "thyssenkrupp", memberCount: 71, tier: "silver", totalSpend: "18000.00", primaryColor: "#003366", secondaryColor: "#0099CC" },
    { name: "MKB Brandstof", slug: "mkb-brandstof", memberCount: 68, tier: "silver", totalSpend: "16000.00", primaryColor: "#FF6600", secondaryColor: "#FFCC00" },
  ];

  for (const c of demoCompanies) {
    await connection.execute(
      `INSERT INTO companies (name, slug, memberCount, tier, totalSpend, primaryColor, secondaryColor) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)`,
      [c.name, c.slug, c.memberCount, c.tier, c.totalSpend, c.primaryColor, c.secondaryColor]
    );
  }
  console.log("✓ 5 demo companies seeded");

  // ─── Demo Devices ───
  for (const loc of locations) {
    for (let i = 1; i <= 25; i++) {
      await connection.execute(
        `INSERT INTO devices (locationId, name, type, serialNumber, status, firmwareVersion) VALUES (?, ?, ?, ?, ?, ?)`,
        [loc.id, `NETOS-NL-${loc.id}-${String(i).padStart(3, "0")}`, "netlink", `NL${loc.id}${String(i).padStart(4, "0")}`, i <= 23 ? "online" : "offline", "3.2.1"]
      );
    }
  }
  console.log("✓ 175 devices seeded");

  await connection.end();
  console.log("\n✅ Seed complete!");
}

seed().catch(console.error);
