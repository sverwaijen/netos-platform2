import { z } from "zod";
import { nanoid } from "nanoid";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb, getDriver } from "../db";
import * as pgSchema from "../../drizzle/pg-schema";
function S(): any { return pgSchema; }
import { eq, and, desc, sql, gte, lte, count } from "drizzle-orm";
import {
  getCapacityState, getPoolStatus, makeAccessDecision,
  getOverbookingAdvice, handleSlaViolation, takeCapacitySnapshot,
} from "../parking/capacityEngine";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "administrator" && ctx.user.role !== "host") throw new Error("Forbidden");
  return next({ ctx });
});

// ─── Parking Zones Router ───
export const parkingZonesRouter = router({
  list: publicProcedure.input(z.object({ locationId: z.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    if (input?.locationId) {
      return db.select().from(S().parkingZones).where(eq(S().parkingZones.locationId, input.locationId)).orderBy(S().parkingZones.name);
    }
    return db.select().from(S().parkingZones).orderBy(S().parkingZones.name);
  }),

  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select().from(S().parkingZones).where(eq(S().parkingZones.id, input.id));
    return rows[0] ?? null;
  }),

  create: adminProcedure.input(z.object({
    locationId: z.number(),
    name: z.string(),
    slug: z.string(),
    totalSpots: z.number(),
    reservedSpots: z.number().optional(),
    type: z.enum(["indoor", "outdoor", "underground", "rooftop"]).optional(),
    accessMethod: z.enum(["barrier", "anpr", "manual", "salto"]).optional(),
    overbookingEnabled: z.boolean().optional(),
    overbookingRatio: z.string().optional(),
    payPerUseEnabled: z.boolean().optional(),
    payPerUseThreshold: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.insert(S().parkingZones).values(input);
    return { success: true };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    totalSpots: z.number().optional(),
    reservedSpots: z.number().optional(),
    type: z.enum(["indoor", "outdoor", "underground", "rooftop"]).optional(),
    accessMethod: z.enum(["barrier", "anpr", "manual", "salto"]).optional(),
    overbookingEnabled: z.boolean().optional(),
    overbookingRatio: z.string().optional(),
    costUnderbooking: z.string().optional(),
    costOverbooking: z.string().optional(),
    payPerUseEnabled: z.boolean().optional(),
    payPerUseThreshold: z.number().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const { id, ...data } = input;
    await db.update(S().parkingZones).set(data).where(eq(S().parkingZones.id, id));
    return { success: true };
  }),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.delete(S().parkingZones).where(eq(S().parkingZones.id, input.id));
    return { success: true };
  }),

  stats: publicProcedure.input(z.object({ zoneId: z.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { totalSpots: 0, occupied: 0, available: 0, reserved: 0, revenue: 0, poolGuaranteed: 0, poolOverflow: 0, payPerUse: 0, visitors: 0 };

    const spotsQuery = input?.zoneId
      ? db.select().from(S().parkingSpots).where(eq(S().parkingSpots.zoneId, input.zoneId))
      : db.select().from(S().parkingSpots);
    const spots = await spotsQuery;

    const occupied = spots.filter((s: any) => s.status === "occupied").length;
    const reserved = spots.filter((s: any) => s.status === "reserved").length;
    const available = spots.filter((s: any) => s.status === "available").length;

    // Session-based stats
    const sessionsFilter = input?.zoneId
      ? and(eq(S().parkingSessions.status, "active"), eq(S().parkingSessions.zoneId, input.zoneId))
      : eq(S().parkingSessions.status, "active");
    const activeSessions = await db.select().from(S().parkingSessions).where(sessionsFilter!);
    const poolGuaranteed = activeSessions.filter((s: any) => s.accessType === "pool_guaranteed").length;
    const poolOverflow = activeSessions.filter((s: any) => s.accessType === "pool_overflow").length;
    const payPerUse = activeSessions.filter((s: any) => s.accessType === "pay_per_use").length;
    const visitors = activeSessions.filter((s: any) => s.accessType === "visitor").length;

    // Revenue this month
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const revenueFilter = input?.zoneId
      ? and(eq(S().parkingSessions.zoneId, input.zoneId), gte(S().parkingSessions.entryTime, monthStart))
      : gte(S().parkingSessions.entryTime, monthStart);
    const revenueSessions = await db.select().from(S().parkingSessions).where(revenueFilter!);
    const revenue = revenueSessions.reduce((sum: any, s: any) => sum + parseFloat(String(s.amountEur || "0")), 0);

    return {
      totalSpots: spots.length,
      occupied, available, reserved, revenue: Math.round(revenue * 100) / 100,
      poolGuaranteed, poolOverflow, payPerUse, visitors,
    };
  }),

  // Capacity Engine state
  capacity: publicProcedure.input(z.object({ zoneId: z.number() })).query(async ({ input }) => {
    return getCapacityState(input.zoneId);
  }),

  // Overbooking advice for admin
  overbookingAdvice: adminProcedure.input(z.object({ zoneId: z.number() })).query(async ({ input }) => {
    return getOverbookingAdvice(input.zoneId);
  }),

  // Take capacity snapshot (called periodically or on-demand)
  snapshot: adminProcedure.input(z.object({ zoneId: z.number() })).mutation(async ({ input }) => {
    await takeCapacitySnapshot(input.zoneId);
    return { success: true };
  }),

  // Capacity history for charts
  capacityHistory: publicProcedure.input(z.object({
    zoneId: z.number(),
    hoursBack: z.number().optional(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const since = Date.now() - ((input.hoursBack || 24) * 60 * 60 * 1000);
    return db.select().from(S().parkingCapacitySnapshots)
      .where(and(
        eq(S().parkingCapacitySnapshots.zoneId, input.zoneId),
        gte(S().parkingCapacitySnapshots.timestamp, since),
      ))
      .orderBy(S().parkingCapacitySnapshots.timestamp)
      .limit(288); // 5-min intervals for 24h
  }),
});

// ─── Parking Spots Router ───
export const parkingSpotsRouter = router({
  list: publicProcedure.input(z.object({ zoneId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(S().parkingSpots).where(eq(S().parkingSpots.zoneId, input.zoneId)).orderBy(S().parkingSpots.spotNumber);
  }),

  updateStatus: adminProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["available", "occupied", "reserved", "maintenance", "blocked"]),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.update(S().parkingSpots).set({ status: input.status }).where(eq(S().parkingSpots.id, input.id));
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
    await db.insert(S().parkingSpots).values(spots);
    return { success: true, count: input.count };
  }),
});

// ─── Parking Pricing Router ───
export const parkingPricingRouter = router({
  list: publicProcedure.input(z.object({ zoneId: z.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    if (input?.zoneId) {
      return db.select().from(S().parkingPricing).where(eq(S().parkingPricing.zoneId, input.zoneId));
    }
    return db.select().from(S().parkingPricing);
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
    await db.insert(S().parkingPricing).values(input);
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
    await db.update(S().parkingPricing).set(data).where(eq(S().parkingPricing.id, id));
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
    if (input?.userId) conditions.push(eq(S().parkingReservations.userId, input.userId));
    if (input?.zoneId) conditions.push(eq(S().parkingReservations.zoneId, input.zoneId));
    if (conditions.length > 0) {
      return db.select().from(S().parkingReservations).where(and(...conditions)).orderBy(desc(S().parkingReservations.createdAt));
    }
    return db.select().from(S().parkingReservations).orderBy(desc(S().parkingReservations.createdAt));
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
    await db.insert(S().parkingReservations).values({
      ...input,
      userId: ctx.user.id,
      status: "confirmed",
    });
    return { success: true };
  }),

  cancel: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.update(S().parkingReservations).set({ status: "cancelled" }).where(eq(S().parkingReservations.id, input.id));
    return { success: true };
  }),
});

// ─── Parking Sessions Router ───
export const parkingSessionsRouter = router({
  active: publicProcedure.input(z.object({ zoneId: z.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    if (input?.zoneId) {
      return db.select().from(S().parkingSessions).where(and(eq(S().parkingSessions.zoneId, input.zoneId), eq(S().parkingSessions.status, "active"))).orderBy(desc(S().parkingSessions.entryTime));
    }
    return db.select().from(S().parkingSessions).where(eq(S().parkingSessions.status, "active")).orderBy(desc(S().parkingSessions.entryTime));
  }),

  history: protectedProcedure.input(z.object({
    zoneId: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const q = input?.zoneId
      ? db.select().from(S().parkingSessions).where(eq(S().parkingSessions.zoneId, input.zoneId))
      : db.select().from(S().parkingSessions);
    return q.orderBy(desc(S().parkingSessions.entryTime)).limit(input?.limit || 50);
  }),

  // Enhanced start session with access type tracking
  startSession: adminProcedure.input(z.object({
    zoneId: z.number(),
    spotId: z.number().optional(),
    userId: z.number().optional(),
    licensePlate: z.string().optional(),
    permitId: z.number().optional(),
    poolId: z.number().optional(),
    entryMethod: z.enum(["anpr", "qr", "manual", "app"]).optional(),
    accessType: z.enum(["member", "visitor", "external", "pay_per_use", "pool_guaranteed", "pool_overflow"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.insert(S().parkingSessions).values({
      ...input,
      entryTime: Date.now(),
      status: "active",
    });
    if (input.spotId) {
      await db.update(S().parkingSpots).set({ status: "occupied" }).where(eq(S().parkingSpots.id, input.spotId));
    }
    // Update pool member stats
    if (input.poolId && input.userId) {
      const members = await db.select().from(S().parkingPoolMembers)
        .where(and(eq(S().parkingPoolMembers.poolId, input.poolId), eq(S().parkingPoolMembers.userId, input.userId)));
      if (members[0]) {
        const updates: any = { totalSessions: (members[0].totalSessions || 0) + 1 };
        if (input.accessType === "pool_overflow") {
          updates.totalOverflowSessions = (members[0].totalOverflowSessions || 0) + 1;
        }
        await db.update(S().parkingPoolMembers).set(updates).where(eq(S().parkingPoolMembers.id, members[0].id));
      }
    }
    return { success: true };
  }),

  endSession: adminProcedure.input(z.object({
    id: z.number(),
    amountEur: z.string().optional(),
    paymentMethod: z.enum(["credits", "stripe", "permit", "free", "pool"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const sessions = await db.select().from(S().parkingSessions).where(eq(S().parkingSessions.id, input.id));
    const session = sessions[0];
    if (!session) return { success: false };
    const exitTime = Date.now();
    const durationMinutes = Math.round((exitTime - Number(session.entryTime)) / 60000);

    // Calculate overflow price if applicable
    let finalAmount = input.amountEur;
    if (session.accessType === "pool_overflow" && session.poolId && !finalAmount) {
      const pool = (await db.select().from(S().parkingPools).where(eq(S().parkingPools.id, session.poolId)))[0];
      if (pool) {
        const hours = durationMinutes / 60;
        const hourlyRate = parseFloat(String(pool.overflowPriceEur || "2.50"));
        const dayCap = parseFloat(String(pool.overflowPriceDay || "15.00"));
        finalAmount = String(Math.min(hours * hourlyRate, dayCap).toFixed(2));
      }
    }

    await db.update(S().parkingSessions).set({
      exitTime,
      durationMinutes,
      status: "completed",
      amountEur: finalAmount,
      paymentMethod: input.paymentMethod || (session.accessType === "pool_guaranteed" ? "pool" : "free"),
      paymentStatus: "paid",
    }).where(eq(S().parkingSessions.id, input.id));
    if (session.spotId) {
      await db.update(S().parkingSpots).set({ status: "available" }).where(eq(S().parkingSpots.id, session.spotId));
    }
    return { success: true, durationMinutes, amountEur: finalAmount };
  }),
});

// ─── Parking Permits Router ───
export const parkingPermitsRouter = router({
  list: protectedProcedure.input(z.object({
    userId: z.number().optional(),
    zoneId: z.number().optional(),
    poolId: z.number().optional(),
    slaTier: z.string().optional(),
    status: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions = [];
    if (input?.userId) conditions.push(eq(S().parkingPermits.userId, input.userId));
    if (input?.zoneId) conditions.push(eq(S().parkingPermits.zoneId, input.zoneId));
    if (input?.poolId) conditions.push(eq(S().parkingPermits.poolId, input.poolId));
    if (input?.slaTier) conditions.push(eq(S().parkingPermits.slaTier, input.slaTier as any));
    if (input?.status) conditions.push(eq(S().parkingPermits.status, input.status as any));
    if (conditions.length > 0) {
      return db.select().from(S().parkingPermits).where(and(...conditions)).orderBy(desc(S().parkingPermits.createdAt));
    }
    return db.select().from(S().parkingPermits).orderBy(desc(S().parkingPermits.createdAt));
  }),

  create: adminProcedure.input(z.object({
    userId: z.number().optional(),
    companyId: z.number().optional(),
    poolId: z.number().optional(),
    zoneId: z.number(),
    licensePlate: z.string(),
    vehicleDescription: z.string().optional(),
    type: z.enum(["monthly", "annual", "reserved", "visitor", "pool", "external"]).optional(),
    slaTier: z.enum(["platinum", "gold", "silver", "bronze"]).optional(),
    startDate: z.number(),
    endDate: z.number().optional(),
    spotId: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.insert(S().parkingPermits).values(input);
    return { success: true };
  }),

  updateStatus: adminProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["active", "expired", "suspended", "cancelled"]),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.update(S().parkingPermits).set({ status: input.status }).where(eq(S().parkingPermits.id, input.id));
    return { success: true };
  }),

  updateTier: adminProcedure.input(z.object({
    id: z.number(),
    slaTier: z.enum(["platinum", "gold", "silver", "bronze"]),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.update(S().parkingPermits).set({ slaTier: input.slaTier }).where(eq(S().parkingPermits.id, input.id));
    return { success: true };
  }),
});

// ─── Parking Pools Router (NEW) ───
export const parkingPoolsRouter = router({
  list: publicProcedure.input(z.object({ zoneId: z.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    if (input?.zoneId) {
      return db.select().from(S().parkingPools).where(eq(S().parkingPools.zoneId, input.zoneId)).orderBy(S().parkingPools.name);
    }
    return db.select().from(S().parkingPools).orderBy(S().parkingPools.name);
  }),

  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select().from(S().parkingPools).where(eq(S().parkingPools.id, input.id));
    return rows[0] ?? null;
  }),

  status: publicProcedure.input(z.object({ poolId: z.number() })).query(async ({ input }) => {
    return getPoolStatus(input.poolId);
  }),

  create: adminProcedure.input(z.object({
    zoneId: z.number(),
    companyId: z.number().optional(),
    name: z.string(),
    guaranteedSpots: z.number(),
    maxMembers: z.number().optional(),
    overflowPriceEur: z.string().optional(),
    overflowPriceDay: z.string().optional(),
    monthlyFeeEur: z.string().optional(),
    slaTier: z.enum(["platinum", "gold", "silver", "bronze"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.insert(S().parkingPools).values(input);
    return { success: true };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    guaranteedSpots: z.number().optional(),
    maxMembers: z.number().optional(),
    overflowPriceEur: z.string().optional(),
    overflowPriceDay: z.string().optional(),
    monthlyFeeEur: z.string().optional(),
    slaTier: z.enum(["platinum", "gold", "silver", "bronze"]).optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const { id, ...data } = input;
    await db.update(S().parkingPools).set(data).where(eq(S().parkingPools.id, id));
    return { success: true };
  }),

  // Pool members management
  members: publicProcedure.input(z.object({ poolId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(S().parkingPoolMembers)
      .where(and(eq(S().parkingPoolMembers.poolId, input.poolId), eq(S().parkingPoolMembers.status, "active")))
      .orderBy(S().parkingPoolMembers.joinedAt);
  }),

  addMember: adminProcedure.input(z.object({
    poolId: z.number(),
    userId: z.number(),
    licensePlate: z.string().optional(),
    licensePlate2: z.string().optional(),
    role: z.enum(["admin", "member"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    // Check max members
    const pool = (await db.select().from(S().parkingPools).where(eq(S().parkingPools.id, input.poolId)))[0];
    if (pool && pool.maxMembers && pool.maxMembers > 0) {
      const currentCount = await db.select({ cnt: count() }).from(S().parkingPoolMembers)
        .where(and(eq(S().parkingPoolMembers.poolId, input.poolId), eq(S().parkingPoolMembers.status, "active")));
      if ((currentCount[0]?.cnt || 0) >= pool.maxMembers) {
        throw new Error(`Pool is vol (max ${pool.maxMembers} leden)`);
      }
    }
    await db.insert(S().parkingPoolMembers).values(input);
    return { success: true };
  }),

  removeMember: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.update(S().parkingPoolMembers).set({ status: "removed" }).where(eq(S().parkingPoolMembers.id, input.id));
    return { success: true };
  }),

  updateMemberPlate: protectedProcedure.input(z.object({
    id: z.number(),
    licensePlate: z.string().optional(),
    licensePlate2: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const { id, ...data } = input;
    await db.update(S().parkingPoolMembers).set(data).where(eq(S().parkingPoolMembers.id, id));
    return { success: true };
  }),
});

// ─── Parking Access Router (NEW - ANPR/QR Webhook) ───
export const parkingAccessRouter = router({
  // Main access decision endpoint (called by ANPR camera or QR scanner)
  requestAccess: publicProcedure.input(z.object({
    zoneId: z.number(),
    licensePlate: z.string().optional(),
    qrToken: z.string().optional(),
    method: z.enum(["anpr", "qr", "manual", "app"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { granted: false, reason: "System unavailable" };

    const startTime = Date.now();
    const plate = input.licensePlate?.toUpperCase().replace(/[\s-]/g, "") || "";
    const decision = await makeAccessDecision(input.zoneId, plate, input.qrToken);
    const responseTimeMs = Date.now() - startTime;

    // Log the access attempt
    await db.insert(S().parkingAccessLog).values({
      zoneId: input.zoneId,
      direction: "entry",
      method: input.method || "anpr",
      licensePlate: plate || undefined,
      qrToken: input.qrToken,
      granted: decision.granted,
      denialReason: decision.granted ? undefined : decision.reason,
      poolId: decision.poolId,
      permitId: decision.permitId,
      responseTimeMs,
      timestamp: startTime,
    });

    // If granted, auto-start a session
    if (decision.granted) {
      const result = await db.insert(S().parkingSessions).values({
        zoneId: input.zoneId,
        licensePlate: plate || undefined,
        permitId: decision.permitId,
        poolId: decision.poolId,
        entryMethod: input.method || "anpr",
        accessType: decision.accessType,
        entryTime: Date.now(),
        status: "active",
      });

      // Update access log with session ID
      // (simplified - in production you'd use the insert ID)
    }

    // If denied and has SLA tier, handle violation
    if (!decision.granted && decision.slaTier && decision.slaTier !== "bronze") {
      await handleSlaViolation(
        input.zoneId,
        0, // userId would come from permit lookup
        decision.permitId,
        decision.poolId,
        decision.slaTier,
      );
    }

    return {
      ...decision,
      responseTimeMs,
    };
  }),

  // Exit event
  recordExit: publicProcedure.input(z.object({
    zoneId: z.number(),
    licensePlate: z.string().optional(),
    qrToken: z.string().optional(),
    method: z.enum(["anpr", "qr", "manual", "app"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };

    const plate = input.licensePlate?.toUpperCase().replace(/[\s-]/g, "") || "";

    // Find active session
    const sessions = await db.select().from(S().parkingSessions)
      .where(and(
        eq(S().parkingSessions.zoneId, input.zoneId),
        eq(S().parkingSessions.status, "active"),
        plate ? eq(S().parkingSessions.licensePlate, plate) : sql`1=1`,
      ))
      .orderBy(desc(S().parkingSessions.entryTime))
      .limit(1);

    const session = sessions[0];
    if (!session) return { success: false, reason: "No active session found" };

    const exitTime = Date.now();
    const durationMinutes = Math.round((exitTime - Number(session.entryTime)) / 60000);

    // Calculate amount for overflow/pay-per-use
    let amountEur: string | undefined;
    if (session.accessType === "pool_overflow" && session.poolId) {
      const pool = (await db.select().from(S().parkingPools).where(eq(S().parkingPools.id, session.poolId)))[0];
      if (pool) {
        const hours = durationMinutes / 60;
        const hourly = parseFloat(String(pool.overflowPriceEur || "2.50"));
        const cap = parseFloat(String(pool.overflowPriceDay || "15.00"));
        amountEur = Math.min(hours * hourly, cap).toFixed(2);
      }
    }

    await db.update(S().parkingSessions).set({
      exitTime,
      durationMinutes,
      status: "completed",
      amountEur,
      paymentMethod: session.accessType === "pool_guaranteed" ? "pool" : session.accessType === "pay_per_use" ? "stripe" : "permit",
      paymentStatus: "paid",
    }).where(eq(S().parkingSessions.id, session.id));

    // Log exit
    await db.insert(S().parkingAccessLog).values({
      zoneId: input.zoneId,
      direction: "exit",
      method: input.method || "anpr",
      licensePlate: plate || undefined,
      granted: true,
      sessionId: session.id,
      timestamp: exitTime,
    });

    if (session.spotId) {
      await db.update(S().parkingSpots).set({ status: "available" }).where(eq(S().parkingSpots.id, session.spotId));
    }

    return { success: true, durationMinutes, amountEur };
  }),

  // Access log for admin
  log: adminProcedure.input(z.object({
    zoneId: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    if (input?.zoneId) {
      return db.select().from(S().parkingAccessLog)
        .where(eq(S().parkingAccessLog.zoneId, input.zoneId))
        .orderBy(desc(S().parkingAccessLog.timestamp))
        .limit(input?.limit || 100);
    }
    return db.select().from(S().parkingAccessLog)
      .orderBy(desc(S().parkingAccessLog.timestamp))
      .limit(input?.limit || 100);
  }),
});

// ─── Parking Visitor Permits Router (NEW) ───
export const parkingVisitorPermitsRouter = router({
  list: protectedProcedure.input(z.object({
    zoneId: z.number().optional(),
    invitedByUserId: z.number().optional(),
    status: z.string().optional(),
  }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions = [];
    if (input?.zoneId) conditions.push(eq(S().parkingVisitorPermits.zoneId, input.zoneId));
    if (input?.invitedByUserId) conditions.push(eq(S().parkingVisitorPermits.invitedByUserId, input.invitedByUserId));
    if (input?.status) conditions.push(eq(S().parkingVisitorPermits.status, input.status as any));
    if (conditions.length > 0) {
      return db.select().from(S().parkingVisitorPermits).where(and(...conditions)).orderBy(desc(S().parkingVisitorPermits.createdAt));
    }
    return db.select().from(S().parkingVisitorPermits).orderBy(desc(S().parkingVisitorPermits.createdAt));
  }),

  // Create visitor permit (generates QR token and shareable link)
  create: protectedProcedure.input(z.object({
    zoneId: z.number(),
    visitorName: z.string(),
    visitorEmail: z.string().optional(),
    visitorPhone: z.string().optional(),
    licensePlate: z.string().optional(),
    validFrom: z.number(),
    validUntil: z.number(),
    maxEntries: z.number().optional(),
    shareMethod: z.enum(["whatsapp", "email", "sms", "link"]).optional(),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: false, qrToken: "", shareUrl: "" };

    const qrToken = nanoid(24);
    const shareUrl = `/parking/visitor/${qrToken}`;

    await db.insert(S().parkingVisitorPermits).values({
      ...input,
      licensePlate: input.licensePlate?.toUpperCase().replace(/[\s-]/g, ""),
      invitedByUserId: ctx.user.id,
      qrToken,
    });

    return {
      success: true,
      qrToken,
      shareUrl,
      // WhatsApp deep link
      whatsappUrl: input.visitorPhone
        ? `https://wa.me/${input.visitorPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
            `Hoi ${input.visitorName}, je bent uitgenodigd om te parkeren. Scan deze QR-code bij de slagboom: ${shareUrl}`
          )}`
        : undefined,
    };
  }),

  // Validate QR token (called by scanner)
  validate: publicProcedure.input(z.object({ qrToken: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select().from(S().parkingVisitorPermits)
      .where(eq(S().parkingVisitorPermits.qrToken, input.qrToken));
    const permit = rows[0];
    if (!permit) return null;
    const now = Date.now();
    return {
      ...permit,
      isValid: permit.status === "active" &&
        now >= Number(permit.validFrom) &&
        now <= Number(permit.validUntil) &&
        (permit.usedEntries || 0) < (permit.maxEntries || 1),
    };
  }),

  cancel: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.update(S().parkingVisitorPermits).set({ status: "cancelled" }).where(eq(S().parkingVisitorPermits.id, input.id));
    return { success: true };
  }),
});

// ─── SLA Violations Router (NEW) ───
export const parkingSlaRouter = router({
  list: adminProcedure.input(z.object({
    zoneId: z.number().optional(),
    status: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions = [];
    if (input?.zoneId) conditions.push(eq(S().parkingSlaViolations.zoneId, input.zoneId));
    if (input?.status) conditions.push(eq(S().parkingSlaViolations.compensationStatus, input.status as any));
    if (conditions.length > 0) {
      return db.select().from(S().parkingSlaViolations).where(and(...conditions)).orderBy(desc(S().parkingSlaViolations.timestamp));
    }
    return db.select().from(S().parkingSlaViolations).orderBy(desc(S().parkingSlaViolations.timestamp));
  }),

  resolve: adminProcedure.input(z.object({
    id: z.number(),
    compensationStatus: z.enum(["credited", "waived"]),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.update(S().parkingSlaViolations).set({
      compensationStatus: input.compensationStatus,
      resolvedAt: Date.now(),
    }).where(eq(S().parkingSlaViolations.id, input.id));
    return { success: true };
  }),

  stats: adminProcedure.input(z.object({ zoneId: z.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { total: 0, pending: 0, totalCompensation: 0 };
    const conditions = [];
    if (input?.zoneId) conditions.push(eq(S().parkingSlaViolations.zoneId, input.zoneId));
    const all = conditions.length > 0
      ? await db.select().from(S().parkingSlaViolations).where(and(...conditions))
      : await db.select().from(S().parkingSlaViolations);
    const pending = all.filter((v: any) => v.compensationStatus === "pending").length;
    const totalCompensation = all.reduce((sum: any, v: any) => sum + parseFloat(String(v.compensationEur || "0")), 0);
    return { total: all.length, pending, totalCompensation: Math.round(totalCompensation * 100) / 100 };
  }),
});
