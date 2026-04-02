import mysql from "mysql2/promise";

async function seed() {
  const db = await mysql.createConnection(process.env.DATABASE_URL);
  console.log("🌱 Seeding resource management data...");

  // ─── Resource Types ───────────────────────────────────────────
  const resourceTypes = [
    { name: "Hot Desk", slug: "hot-desk", description: "Flexible desk in open workspace, first-come first-served", icon: "Monitor", defaultCapacity: 1, chargingUnit: "per_hour", timeSlotMinutes: 30 },
    { name: "Fixed Desk", slug: "fixed-desk", description: "Dedicated desk assigned to a single member", icon: "Laptop", defaultCapacity: 1, chargingUnit: "per_month", timeSlotMinutes: 30 },
    { name: "Meeting Room S", slug: "meeting-room-s", description: "Small meeting room for 2-4 people", icon: "Users", defaultCapacity: 4, chargingUnit: "per_hour", timeSlotMinutes: 15 },
    { name: "Meeting Room M", slug: "meeting-room-m", description: "Medium meeting room for 5-8 people with presentation screen", icon: "Presentation", defaultCapacity: 8, chargingUnit: "per_hour", timeSlotMinutes: 15 },
    { name: "Meeting Room L", slug: "meeting-room-l", description: "Large meeting room for 10-20 people with full AV setup", icon: "Theater", defaultCapacity: 20, chargingUnit: "per_hour", timeSlotMinutes: 15 },
    { name: "Private Office", slug: "private-office", description: "Lockable private office for teams", icon: "Building", defaultCapacity: 6, chargingUnit: "per_month", timeSlotMinutes: 60 },
    { name: "Phone Booth", slug: "phone-booth", description: "Soundproof booth for calls and video meetings", icon: "Phone", defaultCapacity: 1, chargingUnit: "per_hour", timeSlotMinutes: 15 },
    { name: "Event Space", slug: "event-space", description: "Large open area for events, workshops and presentations", icon: "CalendarDays", defaultCapacity: 50, chargingUnit: "per_day", timeSlotMinutes: 60 },
    { name: "Locker", slug: "locker", description: "Personal storage locker", icon: "Lock", defaultCapacity: 1, chargingUnit: "per_month", timeSlotMinutes: 0 },
    { name: "Gym Access", slug: "gym-access", description: "Access to on-site gym facilities", icon: "Dumbbell", defaultCapacity: 1, chargingUnit: "per_use", timeSlotMinutes: 0 },
  ];

  for (const rt of resourceTypes) {
    await db.execute(
      `INSERT INTO resource_types (name, slug, description, icon, defaultCapacity, chargingUnit, timeSlotMinutes) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)`,
      [rt.name, rt.slug, rt.description, rt.icon, rt.defaultCapacity, rt.chargingUnit, rt.timeSlotMinutes]
    );
  }
  console.log(`  ✓ ${resourceTypes.length} resource types`);

  // Get resource type IDs
  const [rtRows] = await db.execute("SELECT id, slug FROM resource_types");
  const rtMap = {};
  for (const r of rtRows) rtMap[r.slug] = r.id;

  // ─── Resource Rates ───────────────────────────────────────────
  const rates = [
    // Hot Desk rates
    { name: "Hot Desk - Standard", resourceTypeId: rtMap["hot-desk"], creditCost: 2, chargingUnit: "per_hour", isDefault: true, appliesToCustomerType: "all" },
    { name: "Hot Desk - Member Discount", resourceTypeId: rtMap["hot-desk"], creditCost: 1.5, chargingUnit: "per_hour", isDefault: false, appliesToCustomerType: "specific_tiers", appliesToTiers: '["gold"]' },
    { name: "Hot Desk - Off-Peak", resourceTypeId: rtMap["hot-desk"], creditCost: 1, chargingUnit: "per_hour", isDefault: false, appliesToCustomerType: "all", validTimeStart: "07:00", validTimeEnd: "09:00" },
    { name: "Hot Desk - Day Pass", resourceTypeId: rtMap["hot-desk"], creditCost: 12, chargingUnit: "per_day", maxPriceCap: 12, isDefault: false, appliesToCustomerType: "all" },
    // Meeting Room S rates
    { name: "Meeting Room S - Standard", resourceTypeId: rtMap["meeting-room-s"], creditCost: 10, chargingUnit: "per_hour", isDefault: true, appliesToCustomerType: "all" },
    { name: "Meeting Room S - Gold Tier", resourceTypeId: rtMap["meeting-room-s"], creditCost: 7, chargingUnit: "per_hour", isDefault: false, appliesToCustomerType: "specific_tiers", appliesToTiers: '["gold"]' },
    // Meeting Room M rates
    { name: "Meeting Room M - Standard", resourceTypeId: rtMap["meeting-room-m"], creditCost: 15, chargingUnit: "per_hour", isDefault: true, appliesToCustomerType: "all" },
    { name: "Meeting Room M - Per Attendee", resourceTypeId: rtMap["meeting-room-m"], creditCost: 3, chargingUnit: "per_hour", isDefault: false, perAttendeePricing: true, appliesToCustomerType: "all" },
    // Meeting Room L rates
    { name: "Meeting Room L - Standard", resourceTypeId: rtMap["meeting-room-l"], creditCost: 25, chargingUnit: "per_hour", isDefault: true, appliesToCustomerType: "all" },
    { name: "Meeting Room L - Half Day", resourceTypeId: rtMap["meeting-room-l"], creditCost: 75, chargingUnit: "per_day", maxPriceCap: 75, isDefault: false, appliesToCustomerType: "all", validTimeStart: "08:00", validTimeEnd: "13:00" },
    // Private Office rates
    { name: "Private Office - Monthly", resourceTypeId: rtMap["private-office"], creditCost: 800, chargingUnit: "per_month", isDefault: true, appliesToCustomerType: "all" },
    { name: "Private Office - Hourly", resourceTypeId: rtMap["private-office"], creditCost: 8, chargingUnit: "per_hour", isDefault: false, appliesToCustomerType: "all", maxPriceCap: 60 },
    // Phone Booth
    { name: "Phone Booth - Standard", resourceTypeId: rtMap["phone-booth"], creditCost: 5, chargingUnit: "per_hour", isDefault: true, appliesToCustomerType: "all" },
    { name: "Phone Booth - Members Free (30min)", resourceTypeId: rtMap["phone-booth"], creditCost: 0, chargingUnit: "per_hour", isDefault: false, appliesToCustomerType: "members_only", maxBookingLengthMinutes: 30 },
    // Event Space
    { name: "Event Space - Full Day", resourceTypeId: rtMap["event-space"], creditCost: 200, chargingUnit: "per_day", isDefault: true, appliesToCustomerType: "all" },
    { name: "Event Space - Half Day", resourceTypeId: rtMap["event-space"], creditCost: 120, chargingUnit: "per_day", isDefault: false, appliesToCustomerType: "all", validTimeStart: "08:00", validTimeEnd: "13:00" },
    // Fixed Desk
    { name: "Fixed Desk - Monthly", resourceTypeId: rtMap["fixed-desk"], creditCost: 350, chargingUnit: "per_month", isDefault: true, appliesToCustomerType: "all" },
    // Locker
    { name: "Locker - Monthly", resourceTypeId: rtMap["locker"], creditCost: 25, chargingUnit: "per_month", isDefault: true, appliesToCustomerType: "all" },
    // Gym
    { name: "Gym - Per Visit", resourceTypeId: rtMap["gym-access"], creditCost: 3, chargingUnit: "per_use", isDefault: true, appliesToCustomerType: "all" },
    { name: "Gym - Members Free", resourceTypeId: rtMap["gym-access"], creditCost: 0, chargingUnit: "per_use", isDefault: false, appliesToCustomerType: "specific_tiers", appliesToTiers: '["gold","silver"]' },
  ];

  for (const rate of rates) {
    await db.execute(
      `INSERT INTO resource_rates (name, resourceTypeId, creditCost, chargingUnit, isDefault, appliesToCustomerType, appliesToTiers, maxPriceCap, perAttendeePricing, validTimeStart, validTimeEnd, maxBookingLengthMinutes, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        rate.name, rate.resourceTypeId, rate.creditCost, rate.chargingUnit,
        rate.isDefault ?? false, rate.appliesToCustomerType ?? "all",
        rate.appliesToTiers ?? null, rate.maxPriceCap ?? null,
        rate.perAttendeePricing ?? false, rate.validTimeStart ?? null,
        rate.validTimeEnd ?? null, rate.maxBookingLengthMinutes ?? null,
      ]
    );
  }
  console.log(`  ✓ ${rates.length} resource rates`);

  // ─── Resource Categories ──────────────────────────────────────
  const categories = [
    { name: "Workspaces", slug: "workspaces", description: "Desks and open workspace areas", icon: "Monitor", sortOrder: 1 },
    { name: "Meeting Rooms", slug: "meeting-rooms", description: "Rooms for meetings and collaboration", icon: "Users", sortOrder: 2 },
    { name: "Private Offices", slug: "private-offices", description: "Lockable offices for teams", icon: "Building", sortOrder: 3 },
    { name: "Event Spaces", slug: "event-spaces", description: "Large areas for events and workshops", icon: "CalendarDays", sortOrder: 4 },
    { name: "Amenities", slug: "amenities", description: "Gym, lockers and other facilities", icon: "Sparkles", sortOrder: 5 },
  ];

  for (const cat of categories) {
    await db.execute(
      `INSERT INTO resource_categories (name, slug, description, icon, sortOrder) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)`,
      [cat.name, cat.slug, cat.description, cat.icon, cat.sortOrder]
    );
  }
  console.log(`  ✓ ${categories.length} resource categories`);

  // ─── Resource Amenities ───────────────────────────────────────
  const amenities = [
    { name: "4K Display", icon: "Monitor", category: "tech" },
    { name: "Video Conferencing", icon: "Video", category: "tech" },
    { name: "Whiteboard", icon: "PenTool", category: "tech" },
    { name: "Projector", icon: "Projector", category: "tech" },
    { name: "Webcam", icon: "Camera", category: "tech" },
    { name: "Microphone", icon: "Mic", category: "tech" },
    { name: "Speakers", icon: "Speaker", category: "tech" },
    { name: "USB-C Charging", icon: "Plug", category: "tech" },
    { name: "Standing Desk", icon: "ArrowUpDown", category: "furniture" },
    { name: "Ergonomic Chair", icon: "Armchair", category: "furniture" },
    { name: "Sofa Seating", icon: "Sofa", category: "furniture" },
    { name: "Air Conditioning", icon: "Wind", category: "comfort" },
    { name: "Natural Light", icon: "Sun", category: "comfort" },
    { name: "Soundproofing", icon: "VolumeX", category: "comfort" },
    { name: "Plants", icon: "Leaf", category: "comfort" },
    { name: "Wheelchair Accessible", icon: "Accessibility", category: "accessibility" },
    { name: "Hearing Loop", icon: "Ear", category: "accessibility" },
    { name: "Coffee Machine", icon: "Coffee", category: "catering" },
    { name: "Water Dispenser", icon: "Droplet", category: "catering" },
    { name: "Catering Available", icon: "UtensilsCrossed", category: "catering" },
  ];

  for (const am of amenities) {
    await db.execute(
      `INSERT INTO resource_amenities (name, icon, category) VALUES (?, ?, ?)`,
      [am.name, am.icon, am.category]
    );
  }
  console.log(`  ✓ ${amenities.length} amenities`);

  // ─── Resource Rules ───────────────────────────────────────────
  const rules = [
    { name: "Guests: Max 2h meeting rooms", scope: "global", conditionType: "customer_type", conditionValue: { customerType: "guest" }, limitType: "max_duration", limitValue: { maxMinutes: 120 }, evaluationOrder: 1 },
    { name: "Guests: No private offices", scope: "global", conditionType: "customer_type", conditionValue: { customerType: "guest" }, limitType: "block_booking", limitValue: { resourceTypes: ["private-office", "fixed-desk"] }, evaluationOrder: 2 },
    { name: "Bronze: Max 4h/day meeting rooms", scope: "global", conditionType: "tier_type", conditionValue: { tier: "bronze" }, limitType: "max_bookings_per_day", limitValue: { maxHours: 4 }, evaluationOrder: 3 },
    { name: "All: Min 1h advance booking", scope: "global", conditionType: "advance_booking", conditionValue: { minAdvanceMinutes: 60 }, limitType: "min_advance_hours", limitValue: { minHours: 1 }, evaluationOrder: 4 },
    { name: "All: Max 30 days advance", scope: "global", conditionType: "advance_booking", conditionValue: { maxAdvanceDays: 30 }, limitType: "max_advance_days", limitValue: { maxDays: 30 }, evaluationOrder: 5 },
    { name: "Gold: Skip approval for event space", scope: "global", conditionType: "tier_type", conditionValue: { tier: "gold" }, limitType: "require_approval", limitValue: { requireApproval: false }, evaluationOrder: 6, stopEvaluation: true },
    { name: "All: Event space requires approval", scope: "global", conditionType: "customer_type", conditionValue: { customerType: "all" }, limitType: "require_approval", limitValue: { requireApproval: true, resourceTypes: ["event-space"] }, evaluationOrder: 7 },
    { name: "Weekend: Restricted hours", scope: "global", conditionType: "day_of_week", conditionValue: { days: [0, 6] }, limitType: "restrict_hours", limitValue: { openTime: "09:00", closeTime: "17:00" }, evaluationOrder: 8 },
  ];

  for (const rule of rules) {
    await db.execute(
      `INSERT INTO resource_rules (name, scope, conditionType, conditionValue, limitType, limitValue, evaluationOrder, stopEvaluation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [rule.name, rule.scope, rule.conditionType, JSON.stringify(rule.conditionValue), rule.limitType, JSON.stringify(rule.limitValue), rule.evaluationOrder, rule.stopEvaluation ?? false]
    );
  }
  console.log(`  ✓ ${rules.length} resource rules`);

  // ─── Booking Policies ─────────────────────────────────────────
  const policies = [
    { name: "Default Policy", bufferMinutes: 10, minAdvanceMinutes: 30, maxAdvanceDays: 60, minDurationMinutes: 15, maxDurationMinutes: 480, freeCancelMinutes: 1440, lateCancelFeePercent: 50, noShowFeePercent: 100, autoCheckInMinutes: 15, autoCancelNoCheckIn: true, allowRecurring: true, requireApproval: false, allowGuestBooking: true },
    { name: "Meeting Room Policy", bufferMinutes: 15, minAdvanceMinutes: 60, maxAdvanceDays: 30, minDurationMinutes: 30, maxDurationMinutes: 240, freeCancelMinutes: 720, lateCancelFeePercent: 25, noShowFeePercent: 100, autoCheckInMinutes: 10, autoCancelNoCheckIn: true, allowRecurring: true, requireApproval: false, allowGuestBooking: false },
    { name: "Event Space Policy", bufferMinutes: 60, minAdvanceMinutes: 4320, maxAdvanceDays: 90, minDurationMinutes: 120, maxDurationMinutes: 720, freeCancelMinutes: 4320, lateCancelFeePercent: 75, noShowFeePercent: 100, autoCheckInMinutes: 30, autoCancelNoCheckIn: false, allowRecurring: false, requireApproval: true, allowGuestBooking: false },
  ];

  for (const pol of policies) {
    await db.execute(
      `INSERT INTO booking_policies (name, bufferMinutes, minAdvanceMinutes, maxAdvanceDays, minDurationMinutes, maxDurationMinutes, freeCancelMinutes, lateCancelFeePercent, noShowFeePercent, autoCheckInMinutes, autoCancelNoCheckIn, allowRecurring, requireApproval, allowGuestBooking) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pol.name, pol.bufferMinutes, pol.minAdvanceMinutes, pol.maxAdvanceDays, pol.minDurationMinutes, pol.maxDurationMinutes, pol.freeCancelMinutes, pol.lateCancelFeePercent, pol.noShowFeePercent, pol.autoCheckInMinutes, pol.autoCancelNoCheckIn, pol.allowRecurring, pol.requireApproval, pol.allowGuestBooking]
    );
  }
  console.log(`  ✓ ${policies.length} booking policies`);

  // ─── Resource Schedules (Default: Mon-Fri 7:00-22:00, Sat 9:00-17:00) ──
  const [locRows] = await db.execute("SELECT id FROM locations");
  let schedCount = 0;
  for (const loc of locRows) {
    for (let day = 1; day <= 5; day++) {
      await db.execute(
        `INSERT INTO resource_schedules (locationId, dayOfWeek, openTime, closeTime) VALUES (?, ?, ?, ?)`,
        [loc.id, day, "07:00", "22:00"]
      );
      schedCount++;
    }
    // Saturday
    await db.execute(
      `INSERT INTO resource_schedules (locationId, dayOfWeek, openTime, closeTime) VALUES (?, ?, ?, ?)`,
      [loc.id, 6, "09:00", "17:00"]
    );
    schedCount++;
  }
  console.log(`  ✓ ${schedCount} schedules`);

  console.log("\n✅ Resource management seed complete!");
  await db.end();
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
