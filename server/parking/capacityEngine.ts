/**
 * Parking Capacity Engine
 *
 * Core intelligence for the next-level parking platform.
 * Handles overbooking calculations, pool FCFS logic, SLA enforcement,
 * and real-time access decisions.
 *
 * Based on the Critical Ratio model from airline yield management:
 *   Optimal overbooking = Cu / (Cu + Co)
 *   Cu = cost of empty spot (underbooking)
 *   Co = cost of denying entry (overbooking/compensation)
 */

import { getDb, getDriver } from "../db";
import * as pgSchema from "../../drizzle/pg-schema";
function S(): any { return pgSchema; }
import { eq, and, sql, gte, lte, desc, count } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────

export interface CapacityState {
  zoneId: number;
  totalSpots: number;
  reservedSpots: number; // platinum fixed
  floatingSpots: number; // totalSpots - reservedSpots
  occupied: number;
  available: number;
  occupancyPercent: number;
  // Pool breakdown
  poolGuaranteedUsed: number;
  poolOverflowUsed: number;
  payPerUseUsed: number;
  visitorUsed: number;
  memberUsed: number;
  // Overbooking
  overbookingEnabled: boolean;
  overbookingRatio: number;
  maxPermitsAllowed: number; // floating * overbookingRatio
  currentPermitsIssued: number;
  headroom: number; // how many more permits can be safely issued
  criticalRatio: number; // Cu / (Cu + Co)
  // Predictions
  predictedPeakToday: number;
  noShowRateAvg: number;
}

export interface AccessDecision {
  granted: boolean;
  reason: string;
  accessType: "member" | "visitor" | "external" | "pay_per_use" | "pool_guaranteed" | "pool_overflow";
  poolId?: number;
  permitId?: number;
  sessionId?: number;
  pricePerHour?: number;
  priceDayCap?: number;
  slaTier?: string;
  fallbackZoneId?: number;
  fallbackZoneName?: string;
}

export interface PoolStatus {
  poolId: number;
  poolName: string;
  guaranteedSpots: number;
  currentGuaranteedUsed: number;
  guaranteedAvailable: number;
  totalPoolMembers: number;
  isGuaranteedFull: boolean;
  overflowActive: number;
  overflowPriceEur: string;
  overflowPriceDay: string;
  predictedFullAt?: string; // estimated time pool fills up
}

// ─── Capacity Calculation ─────────────────────────────────────────

export async function getCapacityState(zoneId: number): Promise<CapacityState | null> {
  const db = await getDb();
  if (!db) return null;

  const zones = await db.select().from(S().parkingZones).where(eq(S().parkingZones.id, zoneId));
  const zone = zones[0];
  if (!zone) return null;

  // Count active sessions by type
  const activeSessions = await db.select().from(S().parkingSessions)
    .where(and(eq(S().parkingSessions.zoneId, zoneId), eq(S().parkingSessions.status, "active")));

  const occupied = activeSessions.length;
  const poolGuaranteedUsed = activeSessions.filter((s: any) => s.accessType === "pool_guaranteed").length;
  const poolOverflowUsed = activeSessions.filter((s: any) => s.accessType === "pool_overflow").length;
  const payPerUseUsed = activeSessions.filter((s: any) => s.accessType === "pay_per_use").length;
  const visitorUsed = activeSessions.filter((s: any) => s.accessType === "visitor").length;
  const memberUsed = activeSessions.filter((s: any) => s.accessType === "member" || s.accessType === "external").length;

  const reservedSpots = zone.reservedSpots || 0;
  const floatingSpots = zone.totalSpots - reservedSpots;
  const available = zone.totalSpots - occupied;
  const occupancyPercent = zone.totalSpots > 0 ? Math.round((occupied / zone.totalSpots) * 100) : 0;

  // Count active permits for this zone
  const activePermits = await db.select({ cnt: count() }).from(S().parkingPermits)
    .where(and(eq(S().parkingPermits.zoneId, zoneId), eq(S().parkingPermits.status, "active")));
  const currentPermitsIssued = activePermits[0]?.cnt || 0;

  // Overbooking calculations
  const overbookingEnabled = zone.overbookingEnabled ?? false;
  const overbookingRatio = parseFloat(String(zone.overbookingRatio || "1.20"));
  const noShowRateAvg = parseFloat(String(zone.noShowRateAvg || "0.25"));
  const Cu = parseFloat(String(zone.costUnderbooking || "75"));
  const Co = parseFloat(String(zone.costOverbooking || "50"));
  const criticalRatio = Cu / (Cu + Co); // optimal probability threshold

  const maxPermitsAllowed = Math.floor(floatingSpots * overbookingRatio);
  const headroom = maxPermitsAllowed - currentPermitsIssued;

  // Simple peak prediction based on current trajectory
  const predictedPeakToday = Math.min(100, Math.round(occupancyPercent * (1 + noShowRateAvg * 0.3)));

  return {
    zoneId,
    totalSpots: zone.totalSpots,
    reservedSpots,
    floatingSpots,
    occupied,
    available,
    occupancyPercent,
    poolGuaranteedUsed,
    poolOverflowUsed,
    payPerUseUsed,
    visitorUsed,
    memberUsed,
    overbookingEnabled,
    overbookingRatio,
    maxPermitsAllowed,
    currentPermitsIssued,
    headroom,
    criticalRatio,
    predictedPeakToday,
    noShowRateAvg,
  };
}

// ─── Pool Status ──────────────────────────────────────────────────

export async function getPoolStatus(poolId: number): Promise<PoolStatus | null> {
  const db = await getDb();
  if (!db) return null;

  const pools = await db.select().from(S().parkingPools).where(eq(S().parkingPools.id, poolId));
  const pool = pools[0];
  if (!pool) return null;

  // Count active guaranteed sessions for this pool
  const guaranteedSessions = await db.select({ cnt: count() }).from(S().parkingSessions)
    .where(and(
      eq(S().parkingSessions.poolId, poolId),
      eq(S().parkingSessions.status, "active"),
      eq(S().parkingSessions.accessType, "pool_guaranteed"),
    ));
  const currentGuaranteedUsed = guaranteedSessions[0]?.cnt || 0;

  // Count active overflow sessions
  const overflowSessions = await db.select({ cnt: count() }).from(S().parkingSessions)
    .where(and(
      eq(S().parkingSessions.poolId, poolId),
      eq(S().parkingSessions.status, "active"),
      eq(S().parkingSessions.accessType, "pool_overflow"),
    ));
  const overflowActive = overflowSessions[0]?.cnt || 0;

  // Count total pool members
  const members = await db.select({ cnt: count() }).from(S().parkingPoolMembers)
    .where(and(eq(S().parkingPoolMembers.poolId, poolId), eq(S().parkingPoolMembers.status, "active")));
  const totalPoolMembers = members[0]?.cnt || 0;

  const guaranteedAvailable = pool.guaranteedSpots - currentGuaranteedUsed;
  const isGuaranteedFull = guaranteedAvailable <= 0;

  return {
    poolId: pool.id,
    poolName: pool.name,
    guaranteedSpots: pool.guaranteedSpots,
    currentGuaranteedUsed,
    guaranteedAvailable: Math.max(0, guaranteedAvailable),
    totalPoolMembers,
    isGuaranteedFull,
    overflowActive,
    overflowPriceEur: String(pool.overflowPriceEur || "2.50"),
    overflowPriceDay: String(pool.overflowPriceDay || "15.00"),
  };
}

// ─── Access Decision Engine ───────────────────────────────────────

/**
 * Core access decision: should this vehicle be allowed in?
 * Called by ANPR webhook or QR scanner.
 *
 * Priority order:
 * 1. Platinum (reserved spot) → always allowed
 * 2. Gold → allowed unless physically full
 * 3. Pool guaranteed (first N) → allowed if pool has guaranteed spots left
 * 4. Silver → allowed unless >95% full
 * 5. Pool overflow (car N+1) → allowed if zone has capacity, charged per-use
 * 6. Bronze → allowed only if <80% full
 * 7. Pay-per-use → allowed if zone has capacity and pay-per-use enabled
 * 8. Visitor → allowed if valid visitor permit exists
 */
export async function makeAccessDecision(
  zoneId: number,
  licensePlate: string,
  qrToken?: string,
): Promise<AccessDecision> {
  const db = await getDb();
  if (!db) return { granted: false, reason: "Database unavailable", accessType: "member" };

  const capacity = await getCapacityState(zoneId);
  if (!capacity) return { granted: false, reason: "Zone niet gevonden", accessType: "member" };

  const physicallyFull = capacity.available <= 0;

  // 1. Check visitor permit (QR token)
  if (qrToken) {
    const visitorPermits = await db.select().from(S().parkingVisitorPermits)
      .where(and(
        eq(S().parkingVisitorPermits.qrToken, qrToken),
        eq(S().parkingVisitorPermits.status, "active"),
        eq(S().parkingVisitorPermits.zoneId, zoneId),
      ));
    const vp = visitorPermits[0];
    if (vp) {
      const now = Date.now();
      if (now >= Number(vp.validFrom) && now <= Number(vp.validUntil)) {
        if ((vp.usedEntries || 0) < (vp.maxEntries || 1)) {
          if (!physicallyFull) {
            // Update used entries
            await db.update(S().parkingVisitorPermits)
              .set({ usedEntries: (vp.usedEntries || 0) + 1 })
              .where(eq(S().parkingVisitorPermits.id, vp.id));
            return {
              granted: true,
              reason: `Welkom ${vp.visitorName}`,
              accessType: "visitor",
            };
          }
          return { granted: false, reason: "Terrein is vol. Neem contact op met uw gastheer.", accessType: "visitor" };
        }
        return { granted: false, reason: "Bezoekerspas is al gebruikt", accessType: "visitor" };
      }
      return { granted: false, reason: "Bezoekerspas is verlopen of nog niet geldig", accessType: "visitor" };
    }
  }

  // 2. Check license plate against permits
  const permits = await db.select().from(S().parkingPermits)
    .where(and(
      eq(S().parkingPermits.licensePlate, licensePlate.toUpperCase().replace(/[\s-]/g, "")),
      eq(S().parkingPermits.zoneId, zoneId),
      eq(S().parkingPermits.status, "active"),
    ));

  if (permits.length > 0) {
    const permit = permits[0];
    const tier = permit.slaTier || "silver";

    // Platinum: always in (reserved spot)
    if (tier === "platinum") {
      return {
        granted: true,
        reason: "Welkom. Uw vaste plek is gereserveerd.",
        accessType: "member",
        permitId: permit.id,
        slaTier: "platinum",
      };
    }

    // Pool permit: check pool status
    if (permit.type === "pool" && permit.poolId) {
      const poolStatus = await getPoolStatus(permit.poolId);
      if (poolStatus) {
        if (!poolStatus.isGuaranteedFull) {
          // Guaranteed spot in pool
          return {
            granted: true,
            reason: `Welkom. Pool-plek ${poolStatus.currentGuaranteedUsed + 1}/${poolStatus.guaranteedSpots} (gegarandeerd).`,
            accessType: "pool_guaranteed",
            poolId: permit.poolId,
            permitId: permit.id,
            slaTier: tier,
          };
        }
        // Pool guaranteed is full → overflow
        if (!physicallyFull) {
          return {
            granted: true,
            reason: `Pool is vol. U parkeert op overflow-basis (€${poolStatus.overflowPriceEur}/uur, max €${poolStatus.overflowPriceDay}/dag).`,
            accessType: "pool_overflow",
            poolId: permit.poolId,
            permitId: permit.id,
            pricePerHour: parseFloat(poolStatus.overflowPriceEur),
            priceDayCap: parseFloat(poolStatus.overflowPriceDay),
            slaTier: tier,
          };
        }
        return {
          granted: false,
          reason: "Pool en terrein zijn vol. Geen plek beschikbaar.",
          accessType: "pool_overflow",
          poolId: permit.poolId,
        };
      }
    }

    // Gold: allowed unless physically full
    if (tier === "gold") {
      if (!physicallyFull) {
        return {
          granted: true,
          reason: "Welkom. Premium floating toegang.",
          accessType: "member",
          permitId: permit.id,
          slaTier: "gold",
        };
      }
      // SLA violation for Gold
      return {
        granted: false,
        reason: "Onze excuses. Het terrein is onverwacht vol. U ontvangt compensatie.",
        accessType: "member",
        slaTier: "gold",
        permitId: permit.id,
      };
    }

    // Silver: allowed unless >95% full
    if (tier === "silver") {
      if (capacity.occupancyPercent <= 95) {
        return {
          granted: true,
          reason: "Welkom. Standaard floating toegang.",
          accessType: "member",
          permitId: permit.id,
          slaTier: "silver",
        };
      }
      return {
        granted: false,
        reason: "Terrein is bijna vol. Silver-vergunningen zijn tijdelijk geblokkeerd.",
        accessType: "member",
        slaTier: "silver",
        permitId: permit.id,
      };
    }

    // Bronze: only if <80% full
    if (tier === "bronze") {
      if (capacity.occupancyPercent < 80) {
        return {
          granted: true,
          reason: "Welkom. Daluren-toegang.",
          accessType: "member",
          permitId: permit.id,
          slaTier: "bronze",
        };
      }
      return {
        granted: false,
        reason: "Terrein is te druk voor Bronze-vergunningen (>80% bezet).",
        accessType: "member",
        slaTier: "bronze",
        permitId: permit.id,
      };
    }

    // Default member access
    if (!physicallyFull) {
      return {
        granted: true,
        reason: "Welkom.",
        accessType: "member",
        permitId: permit.id,
        slaTier: tier,
      };
    }
  }

  // 3. Check pool membership by license plate
  const poolMembers = await db.select().from(S().parkingPoolMembers)
    .where(and(
      eq(S().parkingPoolMembers.status, "active"),
    ));
  // Filter by license plate in application (drizzle doesn't support OR on two columns easily)
  const matchingPoolMember = poolMembers.find((pm: any) =>
    pm.licensePlate?.toUpperCase().replace(/[\s-]/g, "") === licensePlate.toUpperCase().replace(/[\s-]/g, "") ||
    pm.licensePlate2?.toUpperCase().replace(/[\s-]/g, "") === licensePlate.toUpperCase().replace(/[\s-]/g, "")
  );

  if (matchingPoolMember) {
    const poolStatus = await getPoolStatus(matchingPoolMember.poolId);
    if (poolStatus) {
      // Check the pool's zone matches
      const poolData = await db.select().from(S().parkingPools).where(eq(S().parkingPools.id, matchingPoolMember.poolId));
      if (poolData[0] && poolData[0].zoneId === zoneId) {
        if (!poolStatus.isGuaranteedFull) {
          return {
            granted: true,
            reason: `Welkom. Pool-plek ${poolStatus.currentGuaranteedUsed + 1}/${poolStatus.guaranteedSpots} (gegarandeerd).`,
            accessType: "pool_guaranteed",
            poolId: matchingPoolMember.poolId,
          };
        }
        if (!physicallyFull) {
          return {
            granted: true,
            reason: `Pool is vol. Overflow-tarief: €${poolStatus.overflowPriceEur}/uur.`,
            accessType: "pool_overflow",
            poolId: matchingPoolMember.poolId,
            pricePerHour: parseFloat(poolStatus.overflowPriceEur),
            priceDayCap: parseFloat(poolStatus.overflowPriceDay),
          };
        }
        return {
          granted: false,
          reason: "Pool en terrein zijn vol.",
          accessType: "pool_overflow",
          poolId: matchingPoolMember.poolId,
        };
      }
    }
  }

  // 4. Check visitor permits by license plate
  if (licensePlate) {
    const visitorByPlate = await db.select().from(S().parkingVisitorPermits)
      .where(and(
        eq(S().parkingVisitorPermits.licensePlate, licensePlate.toUpperCase().replace(/[\s-]/g, "")),
        eq(S().parkingVisitorPermits.status, "active"),
        eq(S().parkingVisitorPermits.zoneId, zoneId),
      ));
    const vp = visitorByPlate[0];
    if (vp) {
      const now = Date.now();
      if (now >= Number(vp.validFrom) && now <= Number(vp.validUntil) && !physicallyFull) {
        await db.update(S().parkingVisitorPermits)
          .set({ usedEntries: (vp.usedEntries || 0) + 1 })
          .where(eq(S().parkingVisitorPermits.id, vp.id));
        return {
          granted: true,
          reason: `Welkom ${vp.visitorName}`,
          accessType: "visitor",
        };
      }
    }
  }

  // 5. Pay-per-use (unknown vehicle)
  const zone = (await db.select().from(S().parkingZones).where(eq(S().parkingZones.id, zoneId)))[0];
  if (zone?.payPerUseEnabled && !physicallyFull) {
    const threshold = zone.payPerUseThreshold || 85;
    if (capacity.occupancyPercent < threshold) {
      return {
        granted: true,
        reason: "Welkom. Betaald parkeren gestart.",
        accessType: "pay_per_use",
      };
    }
    return {
      granted: false,
      reason: `Betaald parkeren is gesloten (bezetting > ${threshold}%).`,
      accessType: "pay_per_use",
    };
  }

  // 6. No match → deny
  return {
    granted: false,
    reason: "Geen geldige vergunning gevonden voor dit kenteken.",
    accessType: "member",
  };
}

// ─── Overbooking Advisor ──────────────────────────────────────────

export interface OverbookingAdvice {
  currentPermits: number;
  maxSafePermits: number;
  headroom: number;
  criticalRatio: number;
  overbookingRatio: number;
  noShowRate: number;
  recommendation: string;
  riskLevel: "low" | "medium" | "high";
}

export async function getOverbookingAdvice(zoneId: number): Promise<OverbookingAdvice | null> {
  const capacity = await getCapacityState(zoneId);
  if (!capacity) return null;

  let recommendation: string;
  let riskLevel: "low" | "medium" | "high";

  if (capacity.headroom > 10) {
    recommendation = `U kunt veilig nog ${capacity.headroom} vergunningen uitgeven. Huidige no-show rate: ${(capacity.noShowRateAvg * 100).toFixed(0)}%.`;
    riskLevel = "low";
  } else if (capacity.headroom > 0) {
    recommendation = `Nog ${capacity.headroom} vergunningen mogelijk. Wees voorzichtig met Gold/Silver SLA-garanties.`;
    riskLevel = "medium";
  } else {
    recommendation = `Maximum bereikt. Meer vergunningen uitgeven verhoogt het risico op SLA-schendingen.`;
    riskLevel = "high";
  }

  return {
    currentPermits: capacity.currentPermitsIssued,
    maxSafePermits: capacity.maxPermitsAllowed,
    headroom: Math.max(0, capacity.headroom),
    criticalRatio: capacity.criticalRatio,
    overbookingRatio: capacity.overbookingRatio,
    noShowRate: capacity.noShowRateAvg,
    recommendation,
    riskLevel,
  };
}

// ─── SLA Violation Handler ────────────────────────────────────────

export async function handleSlaViolation(
  zoneId: number,
  userId: number,
  permitId: number | undefined,
  poolId: number | undefined,
  slaTier: string,
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Determine compensation based on SLA tier
  let compensationEur = "0";
  let compensationCredits = "0";
  switch (slaTier) {
    case "platinum":
      compensationEur = "25.00";
      compensationCredits = "50.00";
      break;
    case "gold":
      compensationEur = "10.00";
      compensationCredits = "20.00";
      break;
    case "silver":
      compensationEur = "5.00";
      compensationCredits = "10.00";
      break;
    default:
      break; // Bronze gets no compensation
  }

  await db.insert(S().parkingSlaViolations).values({
    zoneId,
    userId,
    permitId,
    poolId,
    slaTier: slaTier as any,
    violationType: "denied_entry",
    compensationEur,
    compensationCredits,
    compensationStatus: slaTier === "bronze" ? "waived" : "pending",
    timestamp: Date.now(),
  });
}

// ─── Capacity Snapshot (for analytics) ────────────────────────────

export async function takeCapacitySnapshot(zoneId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const capacity = await getCapacityState(zoneId);
  if (!capacity) return;

  await db.insert(S().parkingCapacitySnapshots).values({
    zoneId,
    timestamp: Date.now(),
    totalSpots: capacity.totalSpots,
    occupied: capacity.occupied,
    reserved: capacity.reservedSpots,
    poolGuaranteed: capacity.poolGuaranteedUsed,
    poolOverflow: capacity.poolOverflowUsed,
    payPerUse: capacity.payPerUseUsed,
    visitors: capacity.visitorUsed,
    occupancyPercent: String(capacity.occupancyPercent),
    predictedPeak: String(capacity.predictedPeakToday),
    overbookingHeadroom: capacity.headroom,
  });
}
