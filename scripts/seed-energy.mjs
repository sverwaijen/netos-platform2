import pg from "pg";

const c = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});
await c.connect();

const { rows: locations } = await c.query("SELECT id, name FROM locations LIMIT 10");
console.log("Locations:", locations.map((l) => l.name));

const now = Date.now();
const DAY = 86400000;
const floors = ["Ground", "1st", "2nd", "3rd"];
const co2Factor = 0.4;
const costPerKwh = 0.28;

let values = [];
for (const loc of locations) {
  const baseConsumption = 40 + Math.random() * 60;
  for (let day = 0; day < 120; day++) {
    const recordedAt = now - (120 - day) * DAY;
    const periodStart = recordedAt;
    const periodEnd = recordedAt + DAY;
    const trend = 1 - (day / 120) * 0.08;
    const date = new Date(recordedAt);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const weekendFactor = isWeekend ? 0.4 : 1.0;

    for (let fi = 0; fi < floors.length; fi++) {
      const floorFactor = [1.0, 1.2, 0.85, 0.7][fi];
      const noise = 0.85 + Math.random() * 0.3;
      const kwh = +(
        (baseConsumption * trend * weekendFactor * floorFactor * noise) /
        4
      ).toFixed(2);
      const solarPct = 0.15 + Math.random() * 0.2;
      const gridKwh = +(kwh * (1 - solarPct)).toFixed(2);
      const solarKwh = +(kwh * solarPct).toFixed(2);

      values.push([
        loc.id, floors[fi], "electricity", "grid", gridKwh, "kWh",
        +(gridKwh * costPerKwh).toFixed(2), +(gridKwh * co2Factor).toFixed(2),
        recordedAt, periodStart, periodEnd,
      ]);
      values.push([
        loc.id, floors[fi], "electricity", "solar", solarKwh, "kWh",
        0, 0, recordedAt, periodStart, periodEnd,
      ]);
    }
  }
}

const batchSize = 200;
for (let i = 0; i < values.length; i += batchSize) {
  const batch = values.slice(i, i + batchSize);
  const placeholders = batch
    .map((_, idx) => {
      const b = idx * 11;
      return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9},$${b + 10},$${b + 11})`;
    })
    .join(",");
  const flat = batch.flat();
  await c.query(
    `INSERT INTO energy_readings ("locationId", floor, "meterType", source, value, unit, cost, "co2Kg", "recordedAt", "periodStart", "periodEnd") VALUES ${placeholders}`,
    flat
  );
}

console.log(`Seeded ${values.length} energy readings for ${locations.length} locations`);
await c.end();
