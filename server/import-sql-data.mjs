#!/usr/bin/env node
/**
 * Import data from PostgreSQL SQL dump (extracted JSON) into netos-platform2 MySQL database.
 * 
 * Maps old Nexudus-based PostgreSQL schema → new Drizzle MySQL schema.
 * 
 * Usage: DATABASE_URL=mysql://... node server/import-sql-data.mjs
 */
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve("../projects/platform-840b0f1c/extracted_data");

function loadJson(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`  ⚠ File not found: ${filename}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filepath, "utf-8"));
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 64);
}

function parseAddress(fullAddress) {
  if (!fullAddress) return { street: "", postalCode: "", city: "" };
  const lines = fullAddress.split("\n").map((l) => l.trim()).filter(Boolean);
  const street = lines[0] || "";
  let postalCode = "";
  let city = "";
  if (lines.length > 1) {
    const match = lines[1].match(/^(\d{4}\s*[A-Z]{2})\s+(.+)$/);
    if (match) {
      postalCode = match[1];
      city = match[2];
    } else {
      city = lines[1];
    }
  }
  return { street, postalCode, city };
}

function mapResourceType(name) {
  const n = name.toLowerCase();
  if (n.includes("meeting room")) return "meeting_room";
  if (n.includes("private office") || (n.includes("office") && n.includes("pax"))) return "private_office";
  if (n.includes("desk")) return "desk";
  if (n.includes("locker")) return "locker";
  if (n.includes("gym")) return "gym";
  if (n.includes("phone") || n.includes("booth")) return "phone_booth";
  if (n.includes("event")) return "event_space";
  if (n.includes("open") || n.includes("coworking") || n.includes("hot")) return "open_space";
  // Default for unknown types
  return "desk";
}

function mapZone(category) {
  const zones = { "0": "zone_0", "1": "zone_1", "2": "zone_2", "3": "zone_3" };
  return zones[String(category)] || "zone_1";
}

function tsToEpoch(ts) {
  if (!ts) return null;
  return new Date(ts + "Z").getTime();
}

function mapCompanyTier(memberCount) {
  if (memberCount >= 100) return "gold";
  if (memberCount >= 30) return "silver";
  return "bronze";
}

function mapPlanToBundle(planName, price) {
  // Map old plan names to credit bundle concepts
  const n = planName.toLowerCase();
  if (n.includes("occasional")) return { creditsPerMonth: 0, slug: slugify(planName) };
  if (n.includes("early bird")) return { creditsPerMonth: 10, slug: slugify(planName) };
  if (n.includes("designated")) return { creditsPerMonth: 10, slug: slugify(planName) };
  if (n.includes("some time")) return { creditsPerMonth: 60, slug: slugify(planName) };
  if (n.includes("part time")) return { creditsPerMonth: 150, slug: slugify(planName) };
  if (n.includes("full time")) return { creditsPerMonth: 350, slug: slugify(planName) };
  if (n.includes("unlimited")) return { creditsPerMonth: 500, slug: slugify(planName) };
  if (n.includes("club")) return { creditsPerMonth: 350, slug: slugify(planName) };
  if (n.includes("monday") || n.includes("tuesday") || n.includes("wednesday") || n.includes("thursday") || n.includes("friday") || n.includes("saturday")) {
    return { creditsPerMonth: 30, slug: slugify(planName) };
  }
  if (n.includes("gym")) return { creditsPerMonth: 15, slug: slugify(planName) };
  if (n.includes("consultancy")) return { creditsPerMonth: 100, slug: slugify(planName) };
  if (n.includes("family")) return { creditsPerMonth: 20, slug: slugify(planName) };
  if (n.includes("friends")) return { creditsPerMonth: 0, slug: slugify(planName) };
  if (n.includes("remote")) return { creditsPerMonth: 40, slug: slugify(planName) };
  if (n.includes("admin")) return { creditsPerMonth: 999, slug: slugify(planName) };
  if (n.includes("tour") || n.includes("lead") || n.includes("book for a day")) return { creditsPerMonth: 0, slug: slugify(planName) };
  if (n.includes("limited")) return { creditsPerMonth: 80, slug: slugify(planName) };
  if (n.includes("just access")) return { creditsPerMonth: 0, slug: slugify(planName) };
  if (n.includes("first family")) return { creditsPerMonth: 0, slug: slugify(planName) };
  if (n.includes("vip")) return { creditsPerMonth: 15, slug: slugify(planName) };
  return { creditsPerMonth: Math.round(parseFloat(price || 0) / 2), slug: slugify(planName) };
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const conn = await mysql.createConnection(dbUrl);
  console.log("✓ Connected to database\n");

  // ═══════════════════════════════════════════════════════════════════
  // 1. CLEAR EXISTING DATA (in dependency order)
  // ═══════════════════════════════════════════════════════════════════
  console.log("Clearing existing data...");
  const tablesToClear = [
    "booking_addons", "kiosk_order_items", "kiosk_orders",
    "product_resource_links", "products", "product_categories",
    "resource_blocked_dates", "resource_schedules", "resource_amenity_map",
    "resource_amenities", "resource_rules", "resource_rates", "resource_types",
    "booking_policies", "resource_categories",
    "crm_campaign_enrollments", "crm_campaign_steps", "crm_campaigns",
    "crm_lead_activities", "crm_leads", "crm_email_templates",
    "company_branding_scraped", "company_branding", "employee_photos",
    "access_log", "notifications", "invites",
    "credit_ledger", "wallets",
    "bookings", "visitors", "sensors", "devices",
    "day_multipliers", "resources", "credit_bundles",
    "companies", "locations",
  ];
  for (const t of tablesToClear) {
    try {
      await conn.execute(`DELETE FROM \`${t}\``);
    } catch (e) {
      // Table might not exist yet, skip
    }
  }
  console.log("✓ Existing data cleared\n");

  // ═══════════════════════════════════════════════════════════════════
  // 2. LOCATIONS
  // ═══════════════════════════════════════════════════════════════════
  console.log("Importing locations...");
  const oldLocations = loadJson("locations.json");
  const locationIdMap = {}; // old UUID → new int ID

  for (const loc of oldLocations) {
    const parsed = parseAddress(loc.address);
    const slug = slugify(loc.name.replace("Boutique Office ", "").replace("Mr.Green ", "mrgreen-"));
    
    const [result] = await conn.execute(
      `INSERT INTO locations (name, slug, address, city, postalCode, lat, lng, totalResources, isActive, timezone)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, true, 'Europe/Amsterdam')`,
      [loc.name, slug, parsed.street, parsed.city, parsed.postalCode,
       loc.latitude || null, loc.longitude || null]
    );
    locationIdMap[loc.id] = result.insertId;
  }
  console.log(`✓ ${oldLocations.length} locations imported\n`);

  // ═══════════════════════════════════════════════════════════════════
  // 3. COMPANIES
  // ═══════════════════════════════════════════════════════════════════
  console.log("Importing companies...");
  const oldCompanies = loadJson("companies.json");
  const oldMemberships = loadJson("company_memberships.json");
  const oldImages = loadJson("images.json");
  const companyIdMap = {}; // old UUID → new int ID

  // Build member count per company
  const memberCounts = {};
  for (const m of oldMemberships) {
    memberCounts[m.company_id] = (memberCounts[m.company_id] || 0) + 1;
  }

  // Build logo map
  const logoMap = {};
  for (const img of oldImages) {
    if (img.company_id && img.name === "logo" && img.url) {
      logoMap[img.company_id] = img.url;
    }
  }

  // Filter active companies only
  const activeCompanies = oldCompanies.filter((c) => !c.deleted_at);

  for (const comp of activeCompanies) {
    const mc = memberCounts[comp.id] || 0;
    const tier = mapCompanyTier(mc);
    const slug = slugify(comp.name);
    const logoUrl = logoMap[comp.id] || null;

    try {
      const [result] = await conn.execute(
        `INSERT INTO companies (name, slug, logoUrl, primaryColor, secondaryColor, memberCount, tier, totalSpend, discountPercent, isActive, auth0OrgId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, ?)`,
        [
          comp.name, slug, logoUrl,
          comp.primary_color || "#1a1a2e",
          comp.secondary_color || "#e94560",
          mc, tier,
          (mc * 250).toFixed(2), // Estimated spend based on members
          comp.discount_plans || "5",
          comp.auth0_organization || null,
        ]
      );
      companyIdMap[comp.id] = result.insertId;
    } catch (e) {
      // Duplicate slug, append ID
      const uniqueSlug = slug + "-" + comp.id.substring(0, 8);
      const [result] = await conn.execute(
        `INSERT INTO companies (name, slug, logoUrl, primaryColor, secondaryColor, memberCount, tier, totalSpend, discountPercent, isActive, auth0OrgId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, ?)`,
        [
          comp.name, uniqueSlug, logoUrl,
          comp.primary_color || "#1a1a2e",
          comp.secondary_color || "#e94560",
          mc, tier,
          (mc * 250).toFixed(2),
          comp.discount_plans || "5",
          comp.auth0_organization || null,
        ]
      );
      companyIdMap[comp.id] = result.insertId;
    }
  }
  console.log(`✓ ${activeCompanies.length} companies imported (${oldCompanies.length - activeCompanies.length} deleted skipped)\n`);

  // ═══════════════════════════════════════════════════════════════════
  // 4. CREDIT BUNDLES (from plans)
  // ═══════════════════════════════════════════════════════════════════
  console.log("Importing credit bundles (from plans)...");
  const oldPlans = loadJson("plans.json");
  const bundleIdMap = {}; // old plan UUID → new bundle int ID
  const usedSlugs = new Set();

  const activePlans = oldPlans.filter((p) => !p.deleted_at);

  for (const plan of activePlans) {
    const mapped = mapPlanToBundle(plan.name, plan.price);
    let slug = mapped.slug;
    // Ensure unique slug
    let suffix = 1;
    while (usedSlugs.has(slug)) {
      slug = mapped.slug + "-" + suffix++;
    }
    usedSlugs.add(slug);

    const price = parseFloat(plan.price || 0);
    const isPopular = plan.name.toLowerCase().includes("part time") || plan.name.toLowerCase().includes("some time");

    const features = [];
    if (mapped.creditsPerMonth > 0) features.push(`${mapped.creditsPerMonth} Credits/Month`);
    if (mapped.creditsPerMonth >= 150) features.push("Zone 0-3 Access", "All Resources", "Priority Booking");
    else if (mapped.creditsPerMonth >= 60) features.push("Zone 0-2 Access", "Smart Desk Access");
    else if (mapped.creditsPerMonth > 0) features.push("Zone 0-1 Access", "Community Events");
    else features.push("Zone 0 Access", "Community Events");
    features.push("WiFi Included");

    try {
      const [result] = await conn.execute(
        `INSERT INTO credit_bundles (name, slug, creditsPerMonth, priceEur, description, features, isPopular, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, true)`,
        [
          plan.name, slug, mapped.creditsPerMonth, price.toFixed(2),
          plan.description || plan.name,
          JSON.stringify(features),
          isPopular,
        ]
      );
      bundleIdMap[plan.id] = result.insertId;
    } catch (e) {
      console.warn(`  ⚠ Skipping bundle "${plan.name}": ${e.message}`);
    }
  }
  console.log(`✓ ${activePlans.length} credit bundles imported\n`);

  // ═══════════════════════════════════════════════════════════════════
  // 5. USERS
  // ═══════════════════════════════════════════════════════════════════
  console.log("Importing users...");
  const oldUsers = loadJson("users.json");
  const oldUserPlans = loadJson("user_plans.json");
  const oldUserRoles = loadJson("user_roles.json");
  const oldRoles = loadJson("roles.json");
  const userIdMap = {}; // old UUID → new int ID

  // Build user→company map from memberships
  const userCompanyMap = {};
  for (const m of oldMemberships) {
    userCompanyMap[m.user_id] = m.company_id;
  }

  // Build admin role IDs
  const adminRoleIds = new Set();
  for (const r of oldRoles) {
    if (r.name.toLowerCase().includes("admin") || r.name.toLowerCase().includes("super")) {
      adminRoleIds.add(r.id);
    }
  }
  const adminUserIds = new Set();
  for (const ur of oldUserRoles) {
    if (adminRoleIds.has(ur.role_id)) {
      adminUserIds.add(ur.user_id);
    }
  }

  // Filter active users
  const activeUsers = oldUsers.filter((u) => u.active === "t" && !u.deleted_at);

  let userCount = 0;
  for (const user of activeUsers) {
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || null;
    const role = adminUserIds.has(user.id) ? "admin" : "user";
    const companyOldId = userCompanyMap[user.id];
    const companyId = companyOldId ? companyIdMap[companyOldId] || null : null;
    // Use email as openId since we don't have auth0 IDs
    const openId = `legacy-${user.id}`;

    try {
      const [result] = await conn.execute(
        `INSERT INTO users (openId, name, email, phone, role, companyId, onboardingComplete, lastSignedIn)
         VALUES (?, ?, ?, ?, ?, ?, true, ?)`,
        [
          openId, name, user.email, user.phone || null,
          role, companyId,
          user.updated_at ? new Date(user.updated_at + "Z") : new Date(),
        ]
      );
      userIdMap[user.id] = result.insertId;
      userCount++;
    } catch (e) {
      console.warn(`  ⚠ Skipping user "${user.email}": ${e.message}`);
    }
  }
  console.log(`✓ ${userCount} users imported\n`);

  // ═══════════════════════════════════════════════════════════════════
  // 6. RESOURCES
  // ═══════════════════════════════════════════════════════════════════
  console.log("Importing resources...");
  const oldResources = loadJson("resources.json");
  const oldResourceTypes = loadJson("resource_types.json");
  const resourceIdMap = {}; // old UUID → new int ID

  // Build resource type map
  const rtMap = {};
  for (const rt of oldResourceTypes) {
    rtMap[rt.id] = rt;
  }

  // Build resource image map
  const resourceImageMap = {};
  for (const img of oldImages) {
    if (img.resource_id && img.url) {
      resourceImageMap[img.resource_id] = img.url;
    }
  }

  // Filter active resources
  const activeResources = oldResources.filter((r) => !r.deleted_at);

  let resCount = 0;
  for (const res of activeResources) {
    const locId = locationIdMap[res.location_id];
    if (!locId) continue; // Skip if location not found

    const rt = rtMap[res.resource_type_id];
    const type = rt ? mapResourceType(rt.name) : mapResourceType(res.name);
    const zone = mapZone(res.category);
    const price = rt ? parseFloat(rt.price || 0) : 0;
    const imageUrl = resourceImageMap[res.id] || null;

    // Parse options for visibility
    let isActive = true;
    if (res.options) {
      try {
        const opts = JSON.parse(res.options);
        if (opts.visible === false) isActive = false;
      } catch (e) {}
    }

    // Determine capacity from resource type name
    let capacity = 1;
    if (rt) {
      const paxMatch = rt.name.match(/(\d+)\s*pax/i);
      if (paxMatch) capacity = parseInt(paxMatch[1]);
      else if (rt.name.toLowerCase().includes("meeting room l")) capacity = 16;
      else if (rt.name.toLowerCase().includes("meeting room m")) capacity = 8;
      else if (rt.name.toLowerCase().includes("meeting room s")) capacity = 4;
      else if (rt.name.toLowerCase().includes("open space")) capacity = 30;
      else if (rt.name.toLowerCase().includes("gym")) capacity = 10;
      else if (rt.name.toLowerCase().includes("event")) capacity = 50;
    }

    const amenities = {
      desk: ["WiFi", "Monitor", "USB-C Charging", "Adjustable Height"],
      meeting_room: ["WiFi", "Display Screen", "Whiteboard", "Video Conferencing"],
      private_office: ["WiFi", "Monitor", "Standing Desk", "Lockable Door", "Climate Control"],
      open_space: ["WiFi", "Power Outlets", "Natural Light"],
      phone_booth: ["WiFi", "Soundproof", "USB-C Charging"],
      locker: ["Secure Lock", "USB Charging"],
      gym: ["Equipment", "Shower", "Towels"],
      event_space: ["WiFi", "Projector", "Sound System", "Catering Kitchen"],
    };

    try {
      const [result] = await conn.execute(
        `INSERT INTO resources (locationId, name, type, zone, capacity, amenities, creditCostPerHour, imageUrl, isActive, floor)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '1')`,
        [
          locId, res.name, type, zone, capacity,
          JSON.stringify(amenities[type] || ["WiFi"]),
          price.toFixed(2),
          imageUrl,
          isActive,
        ]
      );
      resourceIdMap[res.id] = result.insertId;
      resCount++;
    } catch (e) {
      console.warn(`  ⚠ Skipping resource "${res.name}": ${e.message}`);
    }
  }

  // Update location totalResources
  for (const [oldLocId, newLocId] of Object.entries(locationIdMap)) {
    const count = activeResources.filter((r) => r.location_id === oldLocId && !r.deleted_at).length;
    await conn.execute(`UPDATE locations SET totalResources = ? WHERE id = ?`, [count, newLocId]);
  }
  console.log(`✓ ${resCount} resources imported\n`);

  // ═══════════════════════════════════════════════════════════════════
  // 7. DAY MULTIPLIERS
  // ═══════════════════════════════════════════════════════════════════
  console.log("Importing day multipliers...");
  const defaultMultipliers = [
    { dayOfWeek: 0, multiplier: "0.50" },  // Sunday
    { dayOfWeek: 1, multiplier: "0.50" },  // Monday
    { dayOfWeek: 2, multiplier: "0.70" },  // Tuesday
    { dayOfWeek: 3, multiplier: "1.00" },  // Wednesday
    { dayOfWeek: 4, multiplier: "1.40" },  // Thursday
    { dayOfWeek: 5, multiplier: "0.45" },  // Friday
    { dayOfWeek: 6, multiplier: "0.50" },  // Saturday
  ];

  for (const newLocId of Object.values(locationIdMap)) {
    for (const m of defaultMultipliers) {
      await conn.execute(
        `INSERT INTO day_multipliers (locationId, dayOfWeek, multiplier) VALUES (?, ?, ?)`,
        [newLocId, m.dayOfWeek, m.multiplier]
      );
    }
  }
  console.log(`✓ Day multipliers seeded for ${Object.keys(locationIdMap).length} locations\n`);

  // ═══════════════════════════════════════════════════════════════════
  // 8. WALLETS (personal for each user + company wallets)
  // ═══════════════════════════════════════════════════════════════════
  console.log("Creating wallets...");
  const walletMap = {}; // userId → walletId

  // Personal wallets for users with plans
  const userPlanMap = {};
  for (const up of oldUserPlans) {
    userPlanMap[up.user_id] = up.plan_id;
  }

  let walletCount = 0;
  for (const [oldUserId, newUserId] of Object.entries(userIdMap)) {
    const planId = userPlanMap[oldUserId];
    const bundleId = planId ? bundleIdMap[planId] || null : null;
    
    // Get credits from bundle
    let balance = "0.00";
    if (bundleId) {
      const [[bundle]] = await conn.execute(`SELECT creditsPerMonth FROM credit_bundles WHERE id = ?`, [bundleId]);
      if (bundle) balance = String(bundle.creditsPerMonth);
    }

    const [result] = await conn.execute(
      `INSERT INTO wallets (type, ownerId, balance, bundleId) VALUES ('personal', ?, ?, ?)`,
      [newUserId, balance, bundleId]
    );
    walletMap[newUserId] = result.insertId;
    walletCount++;
  }

  // Company wallets
  for (const [oldCompId, newCompId] of Object.entries(companyIdMap)) {
    const mc = memberCounts[oldCompId] || 0;
    const balance = (mc * 100).toFixed(2); // Estimated company credits
    await conn.execute(
      `INSERT INTO wallets (type, ownerId, balance) VALUES ('company', ?, ?)`,
      [newCompId, balance]
    );
    walletCount++;
  }
  console.log(`✓ ${walletCount} wallets created\n`);

  // ═══════════════════════════════════════════════════════════════════
  // 9. BOOKINGS
  // ═══════════════════════════════════════════════════════════════════
  console.log("Importing bookings...");
  const oldBookings = loadJson("bookings.json");

  let bookingCount = 0;
  let bookingSkipped = 0;
  for (const booking of oldBookings) {
    const userId = userIdMap[booking.user_id];
    const resourceId = resourceIdMap[booking.resource_id];
    if (!userId || !resourceId) { bookingSkipped++; continue; }

    // Find location from resource
    const locOldId = booking.location_id || oldResources.find((r) => r.id === booking.resource_id)?.location_id;
    const locationId = locOldId ? locationIdMap[locOldId] : null;
    if (!locationId) { bookingSkipped++; continue; }

    const startTime = tsToEpoch(booking.from_time);
    const endTime = tsToEpoch(booking.to_time);
    if (!startTime || !endTime) { bookingSkipped++; continue; }

    const price = parseFloat(booking.price || 0);
    const isCancelled = !!booking.cancelled_at;
    const status = isCancelled ? "cancelled" : "confirmed";
    const walletId = walletMap[userId] || null;

    try {
      await conn.execute(
        `INSERT INTO bookings (userId, resourceId, locationId, walletId, startTime, endTime, creditsCost, multiplierApplied, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, '1.00', ?, ?)`,
        [userId, resourceId, locationId, walletId, startTime, endTime, price.toFixed(2), status, booking.note || null]
      );
      bookingCount++;
    } catch (e) {
      bookingSkipped++;
    }
  }
  console.log(`✓ ${bookingCount} bookings imported (${bookingSkipped} skipped)\n`);

  // ═══════════════════════════════════════════════════════════════════
  // 10. VISITORS
  // ═══════════════════════════════════════════════════════════════════
  console.log("Importing visitors...");
  const oldVisitors = loadJson("visitors.json");

  let visitorCount = 0;
  let visitorSkipped = 0;
  for (const vis of oldVisitors) {
    const invitedByUserId = userIdMap[vis.user_id];
    const locationId = locationIdMap[vis.location_id];
    if (!invitedByUserId || !locationId) { visitorSkipped++; continue; }

    const name = [vis.first_name, vis.last_name].filter(Boolean).join(" ") || "Unknown";
    const visitDate = tsToEpoch(vis.expected_arrival);
    if (!visitDate) { visitorSkipped++; continue; }

    const status = vis.arrived === "t" ? "checked_in" : "invited";

    try {
      await conn.execute(
        `INSERT INTO visitors (invitedByUserId, name, email, visitDate, locationId, status, accessToken)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [invitedByUserId, name, vis.email, visitDate, locationId, status, String(vis.code)]
      );
      visitorCount++;
    } catch (e) {
      visitorSkipped++;
    }
  }
  console.log(`✓ ${visitorCount} visitors imported (${visitorSkipped} skipped)\n`);

  // ═══════════════════════════════════════════════════════════════════
  // 11. DEVICES
  // ═══════════════════════════════════════════════════════════════════
  console.log("Importing devices...");
  const oldDevices = loadJson("devices.json");
  const deviceIdMap = {}; // old UUID → new int ID

  let deviceCount = 0;
  for (const dev of oldDevices) {
    // Find location through resource
    const resOldId = dev.resource_id;
    const res = oldResources.find((r) => r.id === resOldId);
    const locationId = res ? locationIdMap[res.location_id] : Object.values(locationIdMap)[0];
    if (!locationId) continue;

    const status = dev.status === "online" ? "online" : "offline";

    try {
      const [result] = await conn.execute(
        `INSERT INTO devices (locationId, name, type, serialNumber, status, firmwareVersion)
         VALUES (?, ?, 'netlink', ?, ?, ?)`,
        [locationId, `NETOS-${dev.model}-${dev.id.substring(0, 8)}`, dev.id.substring(0, 16), status, dev.sw_version || "1.0.0"]
      );
      deviceIdMap[dev.id] = result.insertId;
      deviceCount++;
    } catch (e) {
      console.warn(`  ⚠ Skipping device: ${e.message}`);
    }
  }
  console.log(`✓ ${deviceCount} devices imported\n`);

  // ═══════════════════════════════════════════════════════════════════
  // 12. SENSORS
  // ═══════════════════════════════════════════════════════════════════
  console.log("Importing sensors...");
  const oldSensors = loadJson("sensors.json");

  let sensorCount = 0;
  for (const sensor of oldSensors) {
    const deviceId = deviceIdMap[sensor.device_id];
    if (!deviceId) continue;

    // Map sensor type
    let sensorType = "motion";
    const st = (sensor.sensor_type || "").toLowerCase();
    const name = sensor.name.toLowerCase();
    if (st.includes("temp") || name.includes("temp")) sensorType = "temperature";
    else if (st.includes("humid") || name.includes("humid")) sensorType = "humidity";
    else if (st.includes("co2") || name.includes("co2")) sensorType = "co2";
    else if (st.includes("light") || name.includes("light")) sensorType = "light";
    else if (st.includes("occupan") || name.includes("occupan") || name.includes("pir")) sensorType = "occupancy";
    else if (st.includes("motion") || name.includes("motion")) sensorType = "motion";

    // Map resource
    const resourceId = sensor.device_id ? null : null; // Sensors don't directly link to resources in old schema

    try {
      await conn.execute(
        `INSERT INTO sensors (deviceId, type, currentValue, unit, isActive)
         VALUES (?, ?, ?, ?, true)`,
        [deviceId, sensorType, sensor.value || null, sensorType === "temperature" ? "°C" : sensorType === "humidity" ? "%" : sensorType === "co2" ? "ppm" : null]
      );
      sensorCount++;
    } catch (e) {
      // Skip duplicates or errors
    }
  }
  console.log(`✓ ${sensorCount} sensors imported\n`);

  // ═══════════════════════════════════════════════════════════════════
  // 13. ACCESS LOG (from checkins)
  // ═══════════════════════════════════════════════════════════════════
  console.log("Importing access log (from checkins, last 5000)...");
  const oldCheckins = loadJson("checkins.json");

  // Only import last 5000 checkins to avoid overwhelming the DB
  const recentCheckins = oldCheckins.slice(-5000);

  let checkinCount = 0;
  for (const ci of recentCheckins) {
    const userId = userIdMap[ci.user_id];
    const locationId = locationIdMap[ci.location_id];
    if (!locationId) continue;

    try {
      await conn.execute(
        `INSERT INTO access_log (userId, locationId, zone, action, method, createdAt)
         VALUES (?, ?, 'zone_1', 'entry', 'ble', ?)`,
        [userId || null, locationId, ci.from_time ? new Date(ci.from_time + "Z") : new Date()]
      );
      checkinCount++;
    } catch (e) {
      // Skip
    }
  }
  console.log(`✓ ${checkinCount} access log entries imported (from ${oldCheckins.length} total checkins)\n`);

  // ═══════════════════════════════════════════════════════════════════
  // 14. COMPANY BRANDING
  // ═══════════════════════════════════════════════════════════════════
  console.log("Creating company branding...");
  let brandingCount = 0;
  for (const [oldCompId, newCompId] of Object.entries(companyIdMap)) {
    const comp = activeCompanies.find((c) => c.id === oldCompId);
    if (!comp) continue;
    const logoUrl = logoMap[oldCompId] || null;

    try {
      await conn.execute(
        `INSERT INTO company_branding (companyId, logoUrl, primaryColor, secondaryColor, welcomeMessage, isActive)
         VALUES (?, ?, ?, ?, ?, true)`,
        [newCompId, logoUrl, comp.primary_color || "#1a1a2e", comp.secondary_color || "#e94560",
         `Welcome to ${comp.name}`]
      );
      brandingCount++;
    } catch (e) {
      // Skip
    }
  }
  console.log(`✓ ${brandingCount} company brandings created\n`);

  // ═══════════════════════════════════════════════════════════════════
  // 15. PRODUCTS (from old products table)
  // ═══════════════════════════════════════════════════════════════════
  console.log("Importing products...");
  const oldProducts = loadJson("products.json");
  
  // Create default product categories
  const categoryMap = {};
  const defaultCategories = [
    { name: "Hot Drinks", slug: "hot-drinks", icon: "Coffee" },
    { name: "Cold Drinks", slug: "cold-drinks", icon: "GlassWater" },
    { name: "Snacks", slug: "snacks", icon: "Cookie" },
    { name: "Lunch", slug: "lunch", icon: "Utensils" },
    { name: "Services", slug: "services", icon: "Wrench" },
    { name: "Other", slug: "other", icon: "Package" },
  ];

  for (const cat of defaultCategories) {
    const [result] = await conn.execute(
      `INSERT INTO product_categories (name, slug, icon, sortOrder, isActive) VALUES (?, ?, ?, ?, true)`,
      [cat.name, cat.slug, cat.icon, defaultCategories.indexOf(cat)]
    );
    categoryMap[cat.slug] = result.insertId;
  }

  const activeProducts = oldProducts.filter((p) => !p.deleted_at);
  let productCount = 0;

  for (const prod of activeProducts) {
    const price = parseFloat(prod.price || 0);
    const name = prod.name.replace(/^\*/, "").trim();
    
    // Categorize by name
    let catSlug = "other";
    const n = name.toLowerCase();
    if (n.includes("koffie") || n.includes("coffee") || n.includes("thee") || n.includes("tea") || n.includes("cappuccino") || n.includes("espresso") || n.includes("latte")) catSlug = "hot-drinks";
    else if (n.includes("frisdrank") || n.includes("sap") || n.includes("juice") || n.includes("water") || n.includes("cola") || n.includes("bier") || n.includes("beer") || n.includes("wijn") || n.includes("wine") || n.includes("smoothie") || n.includes("drink")) catSlug = "cold-drinks";
    else if (n.includes("snack") || n.includes("cookie") || n.includes("koek") || n.includes("chips") || n.includes("noot") || n.includes("nut") || n.includes("reep") || n.includes("bar") || n.includes("fruit")) catSlug = "snacks";
    else if (n.includes("lunch") || n.includes("brood") || n.includes("sandwich") || n.includes("salade") || n.includes("salad") || n.includes("soep") || n.includes("soup") || n.includes("maaltijd") || n.includes("meal")) catSlug = "lunch";
    else if (n.includes("print") || n.includes("scan") || n.includes("vergader") || n.includes("meeting") || n.includes("service") || n.includes("parkeer") || n.includes("parking")) catSlug = "services";

    const categoryId = categoryMap[catSlug];

    try {
      await conn.execute(
        `INSERT INTO products (categoryId, name, description, priceCredits, priceEur, isActive, sortOrder)
         VALUES (?, ?, ?, ?, ?, true, ?)`,
        [categoryId, name, prod.description || name, price.toFixed(2), price.toFixed(2), productCount]
      );
      productCount++;
    } catch (e) {
      console.warn(`  ⚠ Skipping product "${name}": ${e.message}`);
    }
  }
  console.log(`✓ ${productCount} products imported\n`);

  // ═══════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════");
  console.log("  IMPORT COMPLETE");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Locations:      ${Object.keys(locationIdMap).length}`);
  console.log(`  Companies:      ${Object.keys(companyIdMap).length}`);
  console.log(`  Users:          ${Object.keys(userIdMap).length}`);
  console.log(`  Credit Bundles: ${Object.keys(bundleIdMap).length}`);
  console.log(`  Resources:      ${resCount}`);
  console.log(`  Bookings:       ${bookingCount}`);
  console.log(`  Visitors:       ${visitorCount}`);
  console.log(`  Devices:        ${deviceCount}`);
  console.log(`  Sensors:        ${sensorCount}`);
  console.log(`  Access Log:     ${checkinCount}`);
  console.log(`  Brandings:      ${brandingCount}`);
  console.log(`  Products:       ${productCount}`);
  console.log(`  Wallets:        ${walletCount}`);
  console.log("═══════════════════════════════════════════════════");

  await conn.end();
}

main().catch((e) => {
  console.error("Import failed:", e);
  process.exit(1);
});
