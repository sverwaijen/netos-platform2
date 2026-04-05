import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Clear existing room control data
await conn.execute("DELETE FROM room_automation_rules");
await conn.execute("DELETE FROM alert_thresholds");
await conn.execute("DELETE FROM room_sensor_readings");
await conn.execute("DELETE FROM room_control_points");
await conn.execute("DELETE FROM room_control_zones");

console.log("Cleared existing room control data");

// ─── Zones (location 1 = Amsterdam Keizersgracht) ───────────────────
const zones = [
  { locationId: 1, name: "Lobby & Receptie", floor: "0", type: "lobby", hvac: true, light: true, av: false, blinds: true },
  { locationId: 1, name: "The Boardroom", floor: "1", type: "meeting_room", hvac: true, light: true, av: true, blinds: true },
  { locationId: 1, name: "Focus Room A", floor: "1", type: "meeting_room", hvac: true, light: true, av: true, blinds: false },
  { locationId: 1, name: "Focus Room B", floor: "1", type: "meeting_room", hvac: true, light: true, av: true, blinds: false },
  { locationId: 1, name: "Open Workspace Oost", floor: "2", type: "open_space", hvac: true, light: true, av: false, blinds: true },
  { locationId: 1, name: "Open Workspace West", floor: "2", type: "open_space", hvac: true, light: true, av: false, blinds: true },
  { locationId: 1, name: "Keuken & Lounge", floor: "0", type: "kitchen", hvac: true, light: true, av: false, blinds: false },
  { locationId: 1, name: "Private Office 201", floor: "2", type: "private_office", hvac: true, light: true, av: false, blinds: true },
  { locationId: 1, name: "Private Office 202", floor: "2", type: "private_office", hvac: true, light: true, av: false, blinds: true },
  { locationId: 1, name: "Event Space", floor: "3", type: "common_area", hvac: true, light: true, av: true, blinds: true },
  // Location 2 = Rotterdam
  { locationId: 2, name: "Lobby Rotterdam", floor: "0", type: "lobby", hvac: true, light: true, av: false, blinds: false },
  { locationId: 2, name: "Vergaderzaal Maas", floor: "1", type: "meeting_room", hvac: true, light: true, av: true, blinds: true },
  { locationId: 2, name: "Coworking Floor", floor: "2", type: "open_space", hvac: true, light: true, av: false, blinds: true },
];

const zoneIds = [];
for (const z of zones) {
  const [result] = await conn.execute(
    "INSERT INTO room_control_zones (locationId, name, floor, type, hvacEnabled, lightingEnabled, avEnabled, blindsEnabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [z.locationId, z.name, z.floor, z.type, z.hvac, z.light, z.av, z.blinds]
  );
  zoneIds.push(result.insertId);
}
console.log(`Inserted ${zoneIds.length} zones`);

// ─── Control Points per zone ────────────────────────────────────────
const controlPoints = [];
for (let i = 0; i < zones.length; i++) {
  const z = zones[i];
  const zid = zoneIds[i];
  
  if (z.hvac) {
    controlPoints.push({ zoneId: zid, name: "Temperatuur", type: "hvac_temp", current: "21.5", target: "21.5", unit: "°C", min: 16, max: 28 });
    controlPoints.push({ zoneId: zid, name: "HVAC Modus", type: "hvac_mode", current: "auto", target: "auto", unit: null, min: null, max: null });
    controlPoints.push({ zoneId: zid, name: "Ventilatie", type: "ventilation", current: "60", target: "60", unit: "%", min: 0, max: 100 });
  }
  if (z.light) {
    controlPoints.push({ zoneId: zid, name: "Verlichting", type: "light_level", current: "75", target: "75", unit: "%", min: 0, max: 100 });
    controlPoints.push({ zoneId: zid, name: "Lichtscene", type: "light_scene", current: "werkdag", target: "werkdag", unit: null, min: null, max: null });
  }
  if (z.av) {
    controlPoints.push({ zoneId: zid, name: "AV Systeem", type: "av_power", current: "standby", target: "standby", unit: null, min: null, max: null });
    controlPoints.push({ zoneId: zid, name: "AV Input", type: "av_input", current: "hdmi1", target: "hdmi1", unit: null, min: null, max: null });
  }
  if (z.blinds) {
    controlPoints.push({ zoneId: zid, name: "Zonwering", type: "blinds_position", current: "40", target: "40", unit: "%", min: 0, max: 100 });
  }
}

for (const cp of controlPoints) {
  await conn.execute(
    "INSERT INTO room_control_points (`zoneId`, `name`, `type`, `currentValue`, `targetValue`, `unit`, `minValue`, `maxValue`, `lastUpdated`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())",
    [cp.zoneId, cp.name, cp.type, cp.current, cp.target, cp.unit, cp.min, cp.max]
  );
}
console.log(`Inserted ${controlPoints.length} control points`);

// ─── Sensor Readings (last 24 hours, every 15 min) ─────────────────
const now = Date.now();
const sensorTypes = ["temperature", "humidity", "co2", "noise", "light", "occupancy"];
const sensorUnits = { temperature: "°C", humidity: "%", co2: "ppm", noise: "dB", light: "lux", occupancy: "" };

// Base values per zone type
const baseValues = {
  lobby:          { temperature: 21, humidity: 45, co2: 450, noise: 42, light: 350, occupancy: 3 },
  meeting_room:   { temperature: 22, humidity: 42, co2: 600, noise: 35, light: 500, occupancy: 0 },
  open_space:     { temperature: 22, humidity: 44, co2: 550, noise: 45, light: 450, occupancy: 12 },
  kitchen:        { temperature: 23, humidity: 50, co2: 500, noise: 48, light: 400, occupancy: 2 },
  private_office: { temperature: 21.5, humidity: 43, co2: 480, noise: 30, light: 500, occupancy: 1 },
  common_area:    { temperature: 21, humidity: 44, co2: 520, noise: 40, light: 380, occupancy: 8 },
};

let readingCount = 0;
const batchValues = [];
const BATCH_SIZE = 500;

for (let i = 0; i < zones.length; i++) {
  const z = zones[i];
  const zid = zoneIds[i];
  const base = baseValues[z.type];
  
  // Last 6 hours of data, every 15 min = 24 readings per sensor
  for (let t = 0; t < 24; t++) {
    const ts = now - (24 - t) * 15 * 60 * 1000;
    const hourOfDay = new Date(ts).getHours();
    const isWorkHours = hourOfDay >= 8 && hourOfDay <= 18;
    
    for (const sType of sensorTypes) {
      let val = base[sType];
      // Add time-based variation
      if (isWorkHours) {
        if (sType === "co2") val += Math.random() * 200;
        if (sType === "noise") val += Math.random() * 15;
        if (sType === "occupancy") val = Math.round(val * (0.5 + Math.random()));
      } else {
        if (sType === "occupancy") val = 0;
        if (sType === "noise") val = base[sType] * 0.5;
        if (sType === "co2") val = base[sType] * 0.7;
      }
      // Add random noise
      val += (Math.random() - 0.5) * (val * 0.1);
      val = Math.round(val * 100) / 100;
      
      batchValues.push([zid, sType, val.toString(), sensorUnits[sType], ts]);
      readingCount++;
      
      if (batchValues.length >= BATCH_SIZE) {
        const placeholders = batchValues.map(() => "(?, ?, ?, ?, ?)").join(", ");
        await conn.execute(
          `INSERT INTO room_sensor_readings (zoneId, sensorType, value, unit, recordedAt) VALUES ${placeholders}`,
          batchValues.flat()
        );
        batchValues.length = 0;
      }
    }
  }
}

if (batchValues.length > 0) {
  const placeholders = batchValues.map(() => "(?, ?, ?, ?, ?)").join(", ");
  await conn.execute(
    `INSERT INTO room_sensor_readings (zoneId, sensorType, value, unit, recordedAt) VALUES ${placeholders}`,
    batchValues.flat()
  );
}
console.log(`Inserted ${readingCount} sensor readings`);

// ─── Automation Rules ───────────────────────────────────────────────
const rules = [
  { zoneId: zoneIds[0], locationId: 1, name: "Lobby verwarming werkdagen", trigger: "schedule", triggerConfig: { days: [1,2,3,4,5], startHour: 7, endHour: 19 }, action: "set_temperature", actionConfig: { temperature: 21 } },
  { zoneId: zoneIds[1], locationId: 1, name: "Boardroom AV aan bij boeking", trigger: "booking_start", triggerConfig: { resourceTypes: ["meeting_room"] }, action: "set_av", actionConfig: { power: "on", input: "hdmi1" } },
  { zoneId: zoneIds[1], locationId: 1, name: "Boardroom AV uit na boeking", trigger: "booking_end", triggerConfig: { resourceTypes: ["meeting_room"] }, action: "set_av", actionConfig: { power: "standby" } },
  { zoneId: zoneIds[4], locationId: 1, name: "Workspace verlichting bij bezetting", trigger: "occupancy", triggerConfig: { minOccupancy: 1 }, action: "set_lights", actionConfig: { level: 80, scene: "werkdag" } },
  { zoneId: zoneIds[4], locationId: 1, name: "Workspace licht uit bij leeg", trigger: "occupancy", triggerConfig: { maxOccupancy: 0 }, action: "set_lights", actionConfig: { level: 10, scene: "nacht" } },
  { zoneId: null, locationId: 1, name: "CO2 alert boven 1000ppm", trigger: "sensor_threshold", triggerConfig: { sensorType: "co2", operator: "gt", value: 1000 }, action: "send_alert", actionConfig: { level: "warning", message: "CO2 niveau te hoog - ventilatie verhogen" } },
  { zoneId: null, locationId: 1, name: "Temperatuur alert boven 26°C", trigger: "sensor_threshold", triggerConfig: { sensorType: "temperature", operator: "gt", value: 26 }, action: "send_alert", actionConfig: { level: "warning", message: "Temperatuur te hoog - airco controleren" } },
  { zoneId: zoneIds[9], locationId: 1, name: "Event Space preset bij boeking", trigger: "booking_start", triggerConfig: {}, action: "set_lights", actionConfig: { level: 100, scene: "presentatie" } },
];

for (const r of rules) {
  await conn.execute(
    "INSERT INTO room_automation_rules (zoneId, locationId, name, triggerType, triggerConfig, actionType, actionConfig) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [r.zoneId, r.locationId, r.name, r.trigger, JSON.stringify(r.triggerConfig), r.action, JSON.stringify(r.actionConfig)]
  );
}
console.log(`Inserted ${rules.length} automation rules`);

// ─── Alert Thresholds ───────────────────────────────────────────────
const thresholds = [
  { zoneId: null, locationId: 1, sensorType: "temperature", operator: "gt", value: 26, level: "warning", roles: ["admin"], cooldown: 30 },
  { zoneId: null, locationId: 1, sensorType: "temperature", operator: "lt", value: 17, level: "critical", roles: ["admin"], cooldown: 15 },
  { zoneId: null, locationId: 1, sensorType: "co2", operator: "gt", value: 1000, level: "warning", roles: ["admin"], cooldown: 30 },
  { zoneId: null, locationId: 1, sensorType: "co2", operator: "gt", value: 1500, level: "critical", roles: ["admin"], cooldown: 10 },
  { zoneId: null, locationId: 1, sensorType: "humidity", operator: "gt", value: 65, level: "warning", roles: ["admin"], cooldown: 60 },
  { zoneId: null, locationId: 1, sensorType: "humidity", operator: "lt", value: 25, level: "warning", roles: ["admin"], cooldown: 60 },
  { zoneId: null, locationId: 1, sensorType: "noise", operator: "gt", value: 70, level: "info", roles: ["admin"], cooldown: 15 },
];

for (const t of thresholds) {
  await conn.execute(
    "INSERT INTO alert_thresholds (zoneId, locationId, sensorType, operator, thresholdValue, alertLevel, notifyRoles, cooldownMinutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [t.zoneId, t.locationId, t.sensorType, t.operator, t.value, t.level, JSON.stringify(t.roles), t.cooldown]
  );
}
console.log(`Inserted ${thresholds.length} alert thresholds`);

await conn.end();
console.log("\nRoom Control demo data seeded successfully!");
