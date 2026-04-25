// @ts-nocheck
/**
 * Parking Demo Data Seed Script
 *
 * Seeds the database with realistic demo data for the Smart Parking module.
 * Run with: npx tsx server/seed-parking-demo.ts
 *
 * Covers all 7 The Green locations with zones, spots, pricing, permits,
 * active sessions, and reservations.
 */
import { drizzle } from "drizzle-orm/mysql2";
import {
  locations,
  parkingZones,
  parkingSpots,
  parkingPricing,
  parkingPermits,
  parkingSessions,
  parkingReservations,
} from "../drizzle/pg-schema";

const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_MIN = 60_000;
const now = Date.now();

async function seed() {
  const db = drizzle(process.env.DATABASE_URL!);
  console.log("🅿️  Seeding parking demo data...\n");

  // ─── 1. Ensure demo locations exist ────────────────────────────────
  const demoLocations = [
    { name: "The Green Zuidas", slug: "zuidas", address: "Gustav Mahlerlaan 2970", city: "Amsterdam", postalCode: "1081 LA", lat: "52.3380", lng: "4.8725" },
    { name: "The Green Houthavens", slug: "houthavens", address: "Danzigerbocht 27", city: "Amsterdam", postalCode: "1013 AM", lat: "52.3910", lng: "4.8780" },
    { name: "The Green WTC", slug: "wtc", address: "Strawinskylaan 77", city: "Amsterdam", postalCode: "1077 XW", lat: "52.3390", lng: "4.8729" },
    { name: "The Green Centrum", slug: "centrum", address: "Singel 542", city: "Amsterdam", postalCode: "1017 AZ", lat: "52.3660", lng: "4.8920" },
    { name: "The Green Rotterdam", slug: "rotterdam", address: "Wilhelminakade 175", city: "Rotterdam", postalCode: "3072 AP", lat: "51.9050", lng: "4.4858" },
    { name: "The Green Den Haag", slug: "den-haag", address: "Koninginnegracht 19", city: "Den Haag", postalCode: "2514 AB", lat: "52.0820", lng: "4.3107" },
    { name: "The Green Utrecht", slug: "utrecht", address: "Stadsplateau 7", city: "Utrecht", postalCode: "3521 AZ", lat: "52.0893", lng: "5.1130" },
  ];

  // Insert locations (ignore duplicates if they exist)
  for (const loc of demoLocations) {
    try {
      await db.insert(locations).values(loc);
    } catch {
      // Already exists
    }
  }
  const allLocations = await db.select().from(locations);
  console.log(`  ✓ ${allLocations.length} locations ready`);

  // ─── 2. Parking Zones ──────────────────────────────────────────────
  const zoneTemplates: Array<{
    locationSlug: string;
    name: string;
    slug: string;
    totalSpots: number;
    type: "indoor" | "outdoor" | "underground" | "rooftop";
    accessMethod: "barrier" | "anpr" | "manual" | "salto";
  }> = [
    // Zuidas — flagship, 3 zones
    { locationSlug: "zuidas", name: "Zuidas Garage P1", slug: "zuidas-p1", totalSpots: 120, type: "underground", accessMethod: "anpr" },
    { locationSlug: "zuidas", name: "Zuidas Rooftop P2", slug: "zuidas-p2", totalSpots: 40, type: "rooftop", accessMethod: "barrier" },
    { locationSlug: "zuidas", name: "Zuidas Visitor Parking", slug: "zuidas-visitor", totalSpots: 20, type: "outdoor", accessMethod: "manual" },
    // Houthavens
    { locationSlug: "houthavens", name: "Houthavens Kelder", slug: "houthavens-kelder", totalSpots: 60, type: "underground", accessMethod: "salto" },
    // WTC
    { locationSlug: "wtc", name: "WTC Garage", slug: "wtc-garage", totalSpots: 80, type: "indoor", accessMethod: "anpr" },
    // Centrum
    { locationSlug: "centrum", name: "Centrum Binnenplaats", slug: "centrum-binnenplaats", totalSpots: 15, type: "outdoor", accessMethod: "manual" },
    // Rotterdam
    { locationSlug: "rotterdam", name: "Kop van Zuid Garage", slug: "rotterdam-kvz", totalSpots: 100, type: "underground", accessMethod: "barrier" },
    { locationSlug: "rotterdam", name: "Rotterdam Bezoekers", slug: "rotterdam-visitor", totalSpots: 25, type: "outdoor", accessMethod: "anpr" },
    // Den Haag
    { locationSlug: "den-haag", name: "Den Haag Parkeergarage", slug: "den-haag-garage", totalSpots: 50, type: "indoor", accessMethod: "salto" },
    // Utrecht
    { locationSlug: "utrecht", name: "Utrecht Station Garage", slug: "utrecht-station", totalSpots: 70, type: "underground", accessMethod: "anpr" },
    { locationSlug: "utrecht", name: "Utrecht Dak", slug: "utrecht-dak", totalSpots: 30, type: "rooftop", accessMethod: "barrier" },
  ];

  const createdZones: Array<{ id: number; slug: string; totalSpots: number }> = [];

  for (const zt of zoneTemplates) {
    const loc = allLocations.find(l => l.slug === zt.locationSlug);
    if (!loc) continue;
    const { locationSlug, ...rest } = zt;
    try {
      const result = await db.insert(parkingZones).values({ ...rest, locationId: loc.id });
      createdZones.push({ id: Number(result[0].insertId), slug: zt.slug, totalSpots: zt.totalSpots });
    } catch {
      // Already exists
    }
  }

  // If zones already existed, fetch them
  const allZones = await db.select().from(parkingZones);
  console.log(`  ✓ ${allZones.length} parking zones`);

  // ─── 3. Parking Spots ──────────────────────────────────────────────
  const spotTypes: Array<"standard" | "electric" | "disabled" | "motorcycle" | "reserved"> = ["standard", "electric", "disabled", "motorcycle", "reserved"];
  const spotStatuses: Array<"available" | "occupied" | "reserved" | "maintenance" | "blocked"> = ["available", "occupied", "reserved", "maintenance", "blocked"];

  for (const zone of allZones) {
    // Check if spots already exist for this zone
    const existingSpots = await db.select().from(parkingSpots).where(
      (await import("drizzle-orm")).eq(parkingSpots.zoneId, zone.id)
    );
    if (existingSpots.length > 0) continue;

    const prefix = zone.slug.split("-").map(w => w[0]?.toUpperCase() || "").join("").slice(0, 3) || "P";
    const spots = Array.from({ length: zone.totalSpots }, (_, i) => {
      const num = i + 1;
      // Distribute types: 75% standard, 10% electric, 5% disabled, 5% motorcycle, 5% reserved
      let type: typeof spotTypes[number] = "standard";
      if (num % 10 === 0) type = "electric";
      else if (num % 20 === 0) type = "disabled";
      else if (num % 15 === 0) type = "motorcycle";
      else if (num % 25 === 0) type = "reserved";

      // Distribute statuses for a realistic look: ~55% available, ~30% occupied, ~8% reserved, ~5% maintenance, ~2% blocked
      let status: typeof spotStatuses[number] = "available";
      const rand = Math.random();
      if (rand < 0.30) status = "occupied";
      else if (rand < 0.38) status = "reserved";
      else if (rand < 0.43) status = "maintenance";
      else if (rand < 0.45) status = "blocked";

      return {
        zoneId: zone.id,
        spotNumber: `${prefix}-${String(num).padStart(3, "0")}`,
        type,
        status,
      };
    });

    await db.insert(parkingSpots).values(spots);
  }
  const allSpots = await db.select().from(parkingSpots);
  console.log(`  ✓ ${allSpots.length} parking spots across all zones`);

  // ─── 4. Pricing Rules ──────────────────────────────────────────────
  const pricingRules = [
    { name: "Standaard uurtarief", rateType: "hourly" as const, priceEur: "2.50", priceCredits: "5.00", appliesToType: "all" as const, freeMinutes: 15, dayBeforeDiscount: 0 },
    { name: "Dagtarief", rateType: "daily" as const, priceEur: "15.00", priceCredits: "30.00", appliesToType: "all" as const, maxDailyCapEur: "15.00", freeMinutes: 0, dayBeforeDiscount: 10 },
    { name: "Member Maandabonnement", rateType: "monthly" as const, priceEur: "149.00", priceCredits: "250.00", appliesToType: "members" as const, freeMinutes: 0, dayBeforeDiscount: 0 },
    { name: "Bedrijf Maandtarief", rateType: "monthly" as const, priceEur: "129.00", priceCredits: "220.00", appliesToType: "companies" as const, freeMinutes: 0, dayBeforeDiscount: 5 },
    { name: "Bezoekerstarief", rateType: "hourly" as const, priceEur: "3.50", priceCredits: "7.00", appliesToType: "guests" as const, freeMinutes: 30, dayBeforeDiscount: 15 },
    { name: "Avondtarief (na 18:00)", rateType: "flat" as const, priceEur: "5.00", priceCredits: "10.00", appliesToType: "all" as const, freeMinutes: 0, validTimeStart: "18:00", validTimeEnd: "08:00", dayBeforeDiscount: 0 },
  ];

  for (const zone of allZones.slice(0, 4)) {
    for (const rule of pricingRules) {
      try {
        await db.insert(parkingPricing).values({ ...rule, zoneId: zone.id });
      } catch { /* skip duplicates */ }
    }
  }
  // Remaining zones get the basic hourly + daily
  for (const zone of allZones.slice(4)) {
    for (const rule of pricingRules.slice(0, 2)) {
      try {
        await db.insert(parkingPricing).values({ ...rule, zoneId: zone.id });
      } catch { /* skip duplicates */ }
    }
  }
  console.log(`  ✓ Pricing rules seeded`);

  // ─── 5. Parking Permits ────────────────────────────────────────────
  const dutchPlates = [
    "AB-123-CD", "EF-456-GH", "JK-789-LM", "NP-012-RS", "TV-345-WX",
    "YZ-678-AB", "CD-901-EF", "GH-234-JK", "LM-567-NP", "RS-890-TV",
    "WX-111-YZ", "AB-222-CD", "EF-333-GH", "JK-444-LM", "NP-555-RS",
    "TV-666-WX", "YZ-777-AB", "CD-888-EF", "GH-999-JK", "LM-000-NP",
    "R-123-ABC", "S-456-DEF", "T-789-GHI", "V-012-JKL", "W-345-MNO",
  ];

  const vehicles = [
    "Tesla Model 3 (wit)", "VW ID.4 (grijs)", "BMW 320i (zwart)",
    "Audi A3 (blauw)", "Mercedes C200 (zilver)", "Volvo XC40 (rood)",
    "Toyota Corolla (groen)", "Hyundai Kona EV (wit)", "Peugeot 308 (grijs)",
    "Renault Megane E-Tech (blauw)", "Skoda Octavia (zwart)", "Ford Mustang Mach-E (rood)",
    "Kia EV6 (grijs)", "Porsche Taycan (wit)", "Mini Cooper SE (geel)",
  ];

  const permitTypes: Array<"monthly" | "annual" | "reserved" | "visitor"> = ["monthly", "annual", "reserved", "visitor"];
  const permitStatuses: Array<"active" | "expired" | "suspended"> = ["active", "active", "active", "expired", "suspended"];

  for (let i = 0; i < 20; i++) {
    const zone = allZones[i % allZones.length];
    const startDate = now - (Math.random() * 180 * MS_PER_DAY);
    const type = permitTypes[i % permitTypes.length];
    const endDate = type === "annual" ? startDate + 365 * MS_PER_DAY : startDate + 30 * MS_PER_DAY;

    try {
      await db.insert(parkingPermits).values({
        zoneId: zone.id,
        licensePlate: dutchPlates[i % dutchPlates.length],
        vehicleDescription: vehicles[i % vehicles.length],
        type,
        status: permitStatuses[i % permitStatuses.length],
        startDate: Math.floor(startDate),
        endDate: Math.floor(endDate),
      });
    } catch { /* skip */ }
  }
  console.log(`  ✓ 20 parking permits`);

  // ─── 6. Active Parking Sessions ────────────────────────────────────
  const sessionPlates = dutchPlates.slice(0, 12);
  for (let i = 0; i < 12; i++) {
    const zone = allZones[i % allZones.length];
    const occupiedSpots = allSpots.filter(s => s.zoneId === zone.id && s.status === "occupied");
    const spot = occupiedSpots[i % Math.max(occupiedSpots.length, 1)];
    const entryTime = now - Math.floor(Math.random() * 4 * MS_PER_HOUR + 10 * MS_PER_MIN);

    try {
      await db.insert(parkingSessions).values({
        zoneId: zone.id,
        spotId: spot?.id,
        licensePlate: sessionPlates[i],
        entryTime,
        status: "active",
      });
    } catch { /* skip */ }
  }
  console.log(`  ✓ 12 active parking sessions`);

  // ─── 7. Completed Sessions (historical revenue) ────────────────────
  for (let i = 0; i < 80; i++) {
    const zone = allZones[i % allZones.length];
    const daysAgo = Math.floor(Math.random() * 28);
    const entryTime = now - daysAgo * MS_PER_DAY - Math.floor(Math.random() * 10 * MS_PER_HOUR);
    const durationMinutes = Math.floor(30 + Math.random() * 480); // 30 min to 8 hours
    const exitTime = entryTime + durationMinutes * MS_PER_MIN;
    const hourlyRate = 2.50;
    const amountEur = (Math.ceil(durationMinutes / 60) * hourlyRate).toFixed(2);
    const paymentMethods: Array<"credits" | "stripe" | "permit" | "free"> = ["credits", "stripe", "permit", "free"];

    try {
      await db.insert(parkingSessions).values({
        zoneId: zone.id,
        licensePlate: dutchPlates[Math.floor(Math.random() * dutchPlates.length)],
        entryTime,
        exitTime,
        durationMinutes,
        status: "completed",
        amountEur,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        paymentStatus: "paid",
      });
    } catch { /* skip */ }
  }
  console.log(`  ✓ 80 historical sessions (revenue data)`);

  // ─── 8. Reservations ───────────────────────────────────────────────
  const reservationStatuses: Array<"confirmed" | "checked_in" | "completed" | "cancelled" | "no_show"> = [
    "confirmed", "confirmed", "confirmed", "checked_in", "completed", "cancelled", "no_show",
  ];

  for (let i = 0; i < 25; i++) {
    const zone = allZones[i % allZones.length];
    const daysFromNow = Math.floor(Math.random() * 14) - 3; // -3 to +11 days
    const reservationDate = now + daysFromNow * MS_PER_DAY;
    const startHour = 8 + Math.floor(Math.random() * 10); // 8:00 - 18:00
    const startTime = reservationDate + startHour * MS_PER_HOUR;
    const endTime = startTime + (1 + Math.floor(Math.random() * 8)) * MS_PER_HOUR;
    const status = daysFromNow < 0
      ? (["completed", "no_show", "cancelled"] as const)[Math.floor(Math.random() * 3)]
      : reservationStatuses[i % reservationStatuses.length];

    try {
      await db.insert(parkingReservations).values({
        zoneId: zone.id,
        userId: 1, // demo user
        licensePlate: dutchPlates[i % dutchPlates.length],
        reservationDate: Math.floor(reservationDate),
        startTime: Math.floor(startTime),
        endTime: Math.floor(endTime),
        status,
        amountEur: (Math.ceil((endTime - startTime) / MS_PER_HOUR) * 2.50).toFixed(2),
      });
    } catch { /* skip */ }
  }
  console.log(`  ✓ 25 reservations`);

  console.log("\n🅿️  Parking demo data seeded successfully!");
  console.log(`   Zones: ${allZones.length} | Spots: ${allSpots.length} | Permits: 20 | Sessions: 92 | Reservations: 25`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
