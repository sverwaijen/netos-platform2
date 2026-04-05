import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  parkingZones, parkingSpots, parkingPricing, parkingPermits,
  parkingSessions, parkingReservations,
} from "../../drizzle/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new Error("Forbidden");
  return next({ ctx });
});

// ─── Parking Zones Router ───
export const parkingZonesRouter = router({
  list: publicProcedure.input(z.object({ locationId: z.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    if (input?.locationId) {
      return db.select().from(parkingZones).where(eq(parkingZones.locationId, input.locationId)).orderBy(parkingZones.name);
    }
    return db.select().from(parkingZones).orderBy(parkingZones.name);
  }),

  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select().from(parkingZones).where(eq(parkingZones.id, input.id));
    return rows[0] ?? null;
  }),

  create: adminProcedure.input(z.object({
    locationId: z.number(),
    name: z.string(),
    slug: z.string(),
    totalSpots: z.number(),
    type: z.enum(["indoor", "outdoor", "underground", "rooftop"]).optional(),
    accessMethod: z.enum(["barrier", "anpr", "manual", "salto"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.insert(parkingZones).values(input);
    return { success: true };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    totalSpots: z.number().optional(),
    type: z.enum(["indoor", "outdoor", "underground", "rooftop"]).optional(),
    accessMethod: z.enum(["barrier", "anpr", "manual", "salto"]).optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const { id, ...data } = input;
    await db.update(parkingZones).set(data).where(eq(parkingZones.id, id));
    return { success: true };
  }),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.delete(parkingZones).where(eq(parkingZones.id, input.id));
    return { success: true };
  }),

  stats: publicProcedure.input(z.object({ zoneId: z.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { totalSpots: 0, occupied: 0, available: 0, reserved: 0, revenue: 0 };
    
    const spotsQuery = input?.zoneId
      ? db.select().from(parkingSpots).where(eq(parkingSpots.zoneId, input.zoneId))
      : db.select().from(parkingSpots);
    const spots = await spotsQuery;
    
    const occupied = spots.filter(s => s.status === "occupied").length;
    const reserved = spots.filter(s => s.status === "reserved").length;
    const available = spots.filter(s => s.status === "available").length;
    
    const now = Date.now();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const sessionsQuery = input?.zoneId
      ? db.select().from(parkingSessions).where(and(eq(parkingSessions.zoneId, input.zoneId), gte(parkingSessions.entryTime, monthStart)))
      : db.select().from(parkingSessions).where(gte(parkingSessions.entryTime, monthStart));
    const sessions = await sessionsQuery;
    const revenue = sessions.reduce((sum, s) => sum + parseFloat(String(s.amountEur || "0")), 0);
    
    return { totalSpots: spots.length, occupied, available, reserved, revenue: Math.round(revenue * 100) / 100 };
  }),
});

// ─── Parking Spots Router ───
export const parkingSpotsRouter = router({
  list: publicProcedure.input(z.object({ zoneId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(parkingSpots).where(eq(parkingSpots.zoneId, input.zoneId)).orderBy(parkingSpots.spotNumber);
  }),

  updateStatus: adminProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["available", "occupied", "reserved", "maintenance", "blocked"]),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.update(parkingSpots).set({ status: input.status }).where(eq(parkingSpots.id, input.id));
    return { success: true };
  }),

  bulkCreate: adminProcedure.input(z.object({
    zoneId: z.number(),
    prefix: z.string(),
    count: z.number(),
    type: z.enum(["standard", "electric", "disabled", "motorcycle", "reserved"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const spots = Array.from({ length: input.count }, (_, i) => ({
      zoneId: input.zoneId,
      spotNumber: `${input.prefix}${String(i + 1).padStart(3, "0")}`,
      type: input.type || ("standard" as const),
    }));
    await db.insert(parkingSpots).values(spots);
    return { success: true, count: input.count };
  }),
});

// ─── Parking Pricing Router ───
export const parkingPricingRouter = router({
  list: publicProcedure.input(z.object({ zoneId: z.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    if (input?.zoneId) {
      return db.select().from(parkingPricing).where(eq(parkingPricing.zoneId, input.zoneId));
    }
    return db.select().from(parkingPricing);
  }),

  create: adminProcedure.input(z.object({
    zoneId: z.number().optional(),
    name: z.string(),
    rateType: z.enum(["hourly", "daily", "monthly", "flat"]),
    priceEur: z.string(),
    priceCredits: z.string().optional(),
    appliesToType: z.enum(["all", "members", "guests", "companies"]).optional(),
    dayBeforeDiscount: z.number().optional(),
    maxDailyCapEur: z.string().optional(),
    freeMinutes: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.insert(parkingPricing).values(input);
    return { success: true };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    priceEur: z.string().optional(),
    priceCredits: z.string().optional(),
    dayBeforeDiscount: z.number().optional(),
    maxDailyCapEur: z.string().optional(),
    freeMinutes: z.number().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const { id, ...data } = input;
    await db.update(parkingPricing).set(data).where(eq(parkingPricing.id, id));
    return { success: true };
  }),
});

// ─── Parking Reservations Router ───
export const parkingReservationsRouter = router({
  list: protectedProcedure.input(z.object({
    userId: z.number().optional(),
    zoneId: z.number().optional(),
    status: z.string().optional(),
  }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions = [];
    if (input?.userId) conditions.push(eq(parkingReservations.userId, input.userId));
    if (input?.zoneId) conditions.push(eq(parkingReservations.zoneId, input.zoneId));
    if (conditions.length > 0) {
      return db.select().from(parkingReservations).where(and(...conditions)).orderBy(desc(parkingReservations.createdAt));
    }
    return db.select().from(parkingReservations).orderBy(desc(parkingReservations.createdAt));
  }),

  create: protectedProcedure.input(z.object({
    zoneId: z.number(),
    spotId: z.number().optional(),
    licensePlate: z.string().optional(),
    reservationDate: z.number(),
    startTime: z.number(),
    endTime: z.number(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.insert(parkingReservations).values({
      ...input,
      userId: ctx.user.id,
      status: "confirmed",
    });
    return { success: true };
  }),

  cancel: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.update(parkingReservations).set({ status: "cancelled" }).where(eq(parkingReservations.id, input.id));
    return { success: true };
  }),
});

// ─── Parking Sessions Router ───
export const parkingSessionsRouter = router({
  active: publicProcedure.input(z.object({ zoneId: z.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    if (input?.zoneId) {
      return db.select().from(parkingSessions).where(and(eq(parkingSessions.zoneId, input.zoneId), eq(parkingSessions.status, "active"))).orderBy(desc(parkingSessions.entryTime));
    }
    return db.select().from(parkingSessions).where(eq(parkingSessions.status, "active")).orderBy(desc(parkingSessions.entryTime));
  }),

  history: protectedProcedure.input(z.object({
    zoneId: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const q = input?.zoneId
      ? db.select().from(parkingSessions).where(eq(parkingSessions.zoneId, input.zoneId))
      : db.select().from(parkingSessions);
    return q.orderBy(desc(parkingSessions.entryTime)).limit(input?.limit || 50);
  }),

  startSession: adminProcedure.input(z.object({
    zoneId: z.number(),
    spotId: z.number().optional(),
    userId: z.number().optional(),
    licensePlate: z.string().optional(),
    permitId: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.insert(parkingSessions).values({
      ...input,
      entryTime: Date.now(),
      status: "active",
    });
    if (input.spotId) {
      await db.update(parkingSpots).set({ status: "occupied" }).where(eq(parkingSpots.id, input.spotId));
    }
    return { success: true };
  }),

  endSession: adminProcedure.input(z.object({
    id: z.number(),
    amountEur: z.string().optional(),
    paymentMethod: z.enum(["credits", "stripe", "permit", "free"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const sessions = await db.select().from(parkingSessions).where(eq(parkingSessions.id, input.id));
    const session = sessions[0];
    if (!session) return { success: false };
    const exitTime = Date.now();
    const durationMinutes = Math.round((exitTime - Number(session.entryTime)) / 60000);
    await db.update(parkingSessions).set({
      exitTime,
      durationMinutes,
      status: "completed",
      amountEur: input.amountEur,
      paymentMethod: input.paymentMethod || "free",
      paymentStatus: "paid",
    }).where(eq(parkingSessions.id, input.id));
    if (session.spotId) {
      await db.update(parkingSpots).set({ status: "available" }).where(eq(parkingSpots.id, session.spotId));
    }
    return { success: true, durationMinutes };
  }),
});

// ─── Parking Permits Router ───
export const parkingPermitsRouter = router({
  list: protectedProcedure.input(z.object({
    userId: z.number().optional(),
    zoneId: z.number().optional(),
    status: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions = [];
    if (input?.userId) conditions.push(eq(parkingPermits.userId, input.userId));
    if (input?.zoneId) conditions.push(eq(parkingPermits.zoneId, input.zoneId));
    if (input?.status) conditions.push(eq(parkingPermits.status, input.status as any));
    if (conditions.length > 0) {
      return db.select().from(parkingPermits).where(and(...conditions)).orderBy(desc(parkingPermits.createdAt));
    }
    return db.select().from(parkingPermits).orderBy(desc(parkingPermits.createdAt));
  }),

  create: adminProcedure.input(z.object({
    userId: z.number().optional(),
    companyId: z.number().optional(),
    zoneId: z.number(),
    licensePlate: z.string(),
    vehicleDescription: z.string().optional(),
    type: z.enum(["monthly", "annual", "reserved", "visitor"]).optional(),
    startDate: z.number(),
    endDate: z.number().optional(),
    spotId: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.insert(parkingPermits).values(input);
    return { success: true };
  }),

  updateStatus: adminProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["active", "expired", "suspended", "cancelled"]),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.update(parkingPermits).set({ status: input.status }).where(eq(parkingPermits.id, input.id));
    return { success: true };
  }),
});
