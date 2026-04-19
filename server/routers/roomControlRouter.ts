import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  roomControlZones, roomControlPoints, roomSensorReadings,
  roomAutomationRules, alertThresholds,
} from "../../drizzle/schema";
import { eq, and, desc, gte, lte, type SQL } from "drizzle-orm";
import { getSensorSimulator } from "../integrations/sensorSimulator";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "administrator" && ctx.user.role !== "host") throw new Error("Forbidden");
  return next({ ctx });
});

// ─── Room Control Zones ───
export const roomControlZonesRouter = router({
  list: protectedProcedure.input(z.object({
    locationId: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    if (input?.locationId) {
      return db.select().from(roomControlZones).where(eq(roomControlZones.locationId, input.locationId)).orderBy(roomControlZones.name);
    }
    return db.select().from(roomControlZones).orderBy(roomControlZones.name);
  }),

  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select().from(roomControlZones).where(eq(roomControlZones.id, input.id));
    if (!rows[0]) return null;
    const points = await db.select().from(roomControlPoints).where(eq(roomControlPoints.zoneId, input.id));
    return { ...rows[0], controlPoints: points };
  }),

  create: adminProcedure.input(z.object({
    locationId: z.number(),
    resourceId: z.number().optional(),
    name: z.string(),
    floor: z.string().optional(),
    type: z.enum(["meeting_room", "open_space", "private_office", "common_area", "lobby", "kitchen"]).optional(),
    hvacEnabled: z.boolean().optional(),
    lightingEnabled: z.boolean().optional(),
    avEnabled: z.boolean().optional(),
    blindsEnabled: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.insert(roomControlZones).values(input);
    return { success: true };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    hvacEnabled: z.boolean().optional(),
    lightingEnabled: z.boolean().optional(),
    avEnabled: z.boolean().optional(),
    blindsEnabled: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const { id, ...data } = input;
    await db.update(roomControlZones).set(data).where(eq(roomControlZones.id, id));
    return { success: true };
  }),
});

// ─── Room Control Points ───
export const roomControlPointsRouter = router({
  list: protectedProcedure.input(z.object({ zoneId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(roomControlPoints).where(eq(roomControlPoints.zoneId, input.zoneId));
  }),

  setTarget: adminProcedure.input(z.object({
    id: z.number(),
    targetValue: z.string(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.update(roomControlPoints).set({
      targetValue: input.targetValue,
      lastUpdated: new Date(),
    }).where(eq(roomControlPoints.id, input.id));
    return { success: true };
  }),

  create: adminProcedure.input(z.object({
    zoneId: z.number(),
    name: z.string(),
    type: z.enum(["hvac_temp", "hvac_mode", "light_level", "light_scene", "av_power", "av_input", "blinds_position", "ventilation"]),
    unit: z.string().optional(),
    minValue: z.string().optional(),
    maxValue: z.string().optional(),
    currentValue: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.insert(roomControlPoints).values(input);
    return { success: true };
  }),

  setTemperatureTarget: protectedProcedure.input(z.object({
    zoneId: z.number(),
    targetTemp: z.number(),
  })).mutation(async ({ input }) => {
    const simulator = getSensorSimulator();
    simulator.initializeZone(input.zoneId);
    const success = simulator.setTargetTemperature(input.zoneId, input.targetTemp);
    return { success };
  }),

  toggleLight: protectedProcedure.input(z.object({
    zoneId: z.number(),
    on: z.boolean(),
  })).mutation(async ({ input }) => {
    const simulator = getSensorSimulator();
    simulator.initializeZone(input.zoneId);
    const success = simulator.toggleLight(input.zoneId, input.on);
    return { success };
  }),

  setDimmerLevel: protectedProcedure.input(z.object({
    zoneId: z.number(),
    level: z.number(),
  })).mutation(async ({ input }) => {
    const simulator = getSensorSimulator();
    simulator.initializeZone(input.zoneId);
    const success = simulator.setDimmerLevel(input.zoneId, input.level);
    return { success };
  }),

  getControls: protectedProcedure.input(z.object({ zoneId: z.number() })).query(async ({ input }) => {
    const simulator = getSensorSimulator();
    simulator.initializeZone(input.zoneId);
    return simulator.getControls(input.zoneId);
  }),
});

// ─── Sensor Readings ───
export const sensorReadingsRouter = router({
  latest: protectedProcedure.input(z.object({
    zoneId: z.number(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    // Get latest reading per sensor type
    const readings = await db.select().from(roomSensorReadings)
      .where(eq(roomSensorReadings.zoneId, input.zoneId))
      .orderBy(desc(roomSensorReadings.recordedAt))
      .limit(50);
    
    // Deduplicate by sensor type (keep latest)
    const seen = new Map<string, typeof readings[0]>();
    for (const r of readings) {
      if (!seen.has(r.sensorType)) seen.set(r.sensorType, r);
    }
    return Array.from(seen.values());
  }),

  history: protectedProcedure.input(z.object({
    zoneId: z.number(),
    sensorType: z.enum(["temperature", "humidity", "co2", "noise", "light", "occupancy", "pm25", "voc"]),
    hours: z.number().optional(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const since = Date.now() - (input.hours || 24) * 3600000;
    return db.select().from(roomSensorReadings)
      .where(and(
        eq(roomSensorReadings.zoneId, input.zoneId),
        eq(roomSensorReadings.sensorType, input.sensorType),
        gte(roomSensorReadings.recordedAt, since),
      ))
      .orderBy(roomSensorReadings.recordedAt)
      .limit(500);
  }),

  record: adminProcedure.input(z.object({
    zoneId: z.number(),
    sensorType: z.enum(["temperature", "humidity", "co2", "noise", "light", "occupancy", "pm25", "voc"]),
    value: z.string(),
    unit: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.insert(roomSensorReadings).values({
      zoneId: input.zoneId,
      sensorType: input.sensorType,
      value: input.value,
      unit: input.unit,
      recordedAt: Date.now(),
    });
    return { success: true };
  }),

  allZonesLatest: protectedProcedure.input(z.object({
    locationId: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    const zones = input?.locationId
      ? await db.select().from(roomControlZones).where(eq(roomControlZones.locationId, input.locationId))
      : await db.select().from(roomControlZones);

    const result = [];
    for (const zone of zones) {
      const readings = await db.select().from(roomSensorReadings)
        .where(eq(roomSensorReadings.zoneId, zone.id))
        .orderBy(desc(roomSensorReadings.recordedAt))
        .limit(20);

      const latestByType = new Map<string, typeof readings[0]>();
      for (const r of readings) {
        if (!latestByType.has(r.sensorType)) latestByType.set(r.sensorType, r);
      }

      result.push({
        zone,
        readings: Array.from(latestByType.values()),
      });
    }
    return result;
  }),

  getLiveReadings: protectedProcedure.input(z.object({ zoneId: z.number() })).query(async ({ input }) => {
    const simulator = getSensorSimulator();
    simulator.initializeZone(input.zoneId);
    return simulator.getReadings(input.zoneId);
  }),

  getAlerts: protectedProcedure.input(z.object({ zoneId: z.number() })).query(async ({ input }) => {
    const simulator = getSensorSimulator();
    simulator.initializeZone(input.zoneId);
    return simulator.getAlerts(input.zoneId);
  }),
});

// ─── Automation Rules ───
export const automationRulesRouter = router({
  list: adminProcedure.input(z.object({
    zoneId: z.number().optional(),
    locationId: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: SQL[] = [];
    if (input?.zoneId) conditions.push(eq(roomAutomationRules.zoneId, input.zoneId));
    if (input?.locationId) conditions.push(eq(roomAutomationRules.locationId, input.locationId));
    const q = conditions.length > 0
      ? db.select().from(roomAutomationRules).where(and(...conditions))
      : db.select().from(roomAutomationRules);
    return q.orderBy(roomAutomationRules.name);
  }),

  create: adminProcedure.input(z.object({
    zoneId: z.number().optional(),
    locationId: z.number().optional(),
    name: z.string(),
    triggerType: z.enum(["schedule", "occupancy", "sensor_threshold", "booking_start", "booking_end"]),
    triggerConfig: z.record(z.string(), z.unknown()).optional(),
    actionType: z.enum(["set_temperature", "set_lights", "set_av", "set_blinds", "send_alert"]),
    actionConfig: z.record(z.string(), z.unknown()).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.insert(roomAutomationRules).values(input);
    return { success: true };
  }),

  toggle: adminProcedure.input(z.object({
    id: z.number(),
    isActive: z.boolean(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.update(roomAutomationRules).set({ isActive: input.isActive }).where(eq(roomAutomationRules.id, input.id));
    return { success: true };
  }),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.delete(roomAutomationRules).where(eq(roomAutomationRules.id, input.id));
    return { success: true };
  }),
});

// ─── Alert Thresholds ───
export const alertThresholdsRouter = router({
  list: adminProcedure.input(z.object({
    zoneId: z.number().optional(),
    locationId: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: SQL[] = [];
    if (input?.zoneId) conditions.push(eq(alertThresholds.zoneId, input.zoneId));
    if (input?.locationId) conditions.push(eq(alertThresholds.locationId, input.locationId));
    const q = conditions.length > 0
      ? db.select().from(alertThresholds).where(and(...conditions))
      : db.select().from(alertThresholds);
    return q;
  }),

  create: adminProcedure.input(z.object({
    zoneId: z.number().optional(),
    locationId: z.number().optional(),
    sensorType: z.enum(["temperature", "humidity", "co2", "noise", "light", "occupancy", "pm25", "voc"]),
    operator: z.enum(["gt", "lt", "gte", "lte", "eq"]),
    thresholdValue: z.string(),
    alertLevel: z.enum(["info", "warning", "critical"]).optional(),
    cooldownMinutes: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.insert(alertThresholds).values(input);
    return { success: true };
  }),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.delete(alertThresholds).where(eq(alertThresholds.id, input.id));
    return { success: true };
  }),
});
