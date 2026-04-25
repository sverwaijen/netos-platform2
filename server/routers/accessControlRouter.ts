import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { accessLog } from "../../drizzle/pg-schema";
import { eq, and, desc, sql, gte, count } from "drizzle-orm";
import {
  listAccessPoints, getAccessPoint, remoteOpenDoor, getAuditTrail,
  listAccessGroups, getUserAccessRights, setUserAccessRights,
  createSaltoUser, issueMobileKey, revokeMobileKey, listMobileKeys, initSaltoKS,
} from "../integrations/saltoKS";

// --- Helpers ---

/** Check if Salto KS is configured via env vars */
function isSaltoConfigured(): boolean {
  return !!(
    process.env.SALTO_KS_API_URL &&
    process.env.SALTO_KS_CLIENT_ID &&
    process.env.SALTO_KS_CLIENT_SECRET &&
    process.env.SALTO_KS_SITE_ID
  );
}

/** Initialize Salto KS from env if not yet done */
let saltoInitialized = false;
function ensureSaltoInit(): void {
  if (saltoInitialized) return;
  if (!isSaltoConfigured()) return;
  initSaltoKS({
    apiUrl: process.env.SALTO_KS_API_URL!,
    clientId: process.env.SALTO_KS_CLIENT_ID!,
    clientSecret: process.env.SALTO_KS_CLIENT_SECRET!,
    siteId: process.env.SALTO_KS_SITE_ID!,
  });
  saltoInitialized = true;
}

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "administrator" && ctx.user.role !== "host") {
    throw new Error("Forbidden: admin or host role required");
  }
  return next({ ctx });
});

// --- Access Control Router ---

export const accessControlRouter = router({
  /** Check if Salto KS integration is active */
  status: protectedProcedure.query(() => {
    return {
      configured: isSaltoConfigured(),
      provider: "salto_ks" as const,
    };
  }),

  /** List all access points (doors/locks) */
  listDoors: adminProcedure.query(async () => {
    ensureSaltoInit();
    if (!isSaltoConfigured()) {
      return [
        { id: "door-main-entrance", name: "Hoofdingang", type: "entrance", locationId: 1, status: "online" },
        { id: "door-parking-gate", name: "Parkeergarage Ingang", type: "barrier", locationId: 1, status: "online" },
        { id: "door-office-wing-a", name: "Kantoorvleugel A", type: "office", locationId: 1, status: "online" },
        { id: "door-meeting-room-1", name: "Vergaderruimte 1", type: "meeting_room", locationId: 1, status: "online" },
        { id: "door-server-room", name: "Serverruimte", type: "restricted", locationId: 1, status: "online" },
      ];
    }
    return listAccessPoints();
  }),

  /** Get details of a specific access point */
  getDoor: adminProcedure
    .input(z.object({ accessPointId: z.string() }))
    .query(async ({ input }) => {
      ensureSaltoInit();
      if (!isSaltoConfigured()) {
        return {
          id: input.accessPointId,
          name: input.accessPointId,
          type: "unknown",
          status: "offline",
          note: "Salto KS niet geconfigureerd",
        };
      }
      return getAccessPoint(input.accessPointId);
    }),

  /** Remote open a door */
  openDoor: adminProcedure
    .input(z.object({
      accessPointId: z.string(),
      locationId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      ensureSaltoInit();
      const db = await getDb();

      if (db) {
        await db.insert(accessLog).values({
          userId: ctx.user.id,
          locationId: input.locationId,
          action: "entry",
          method: "manual",
          saltoEventId: `remote-open-${Date.now()}`,
        });
      }

      if (!isSaltoConfigured()) {
        return {
          success: true,
          mock: true,
          message: "Deur geopend (simulatie - Salto KS niet geconfigureerd)",
        };
      }

      await remoteOpenDoor(input.accessPointId);
      return { success: true, mock: false, message: "Deur geopend via Salto KS" };
    }),

  /** Get audit trail of door events */
  auditTrail: adminProcedure
    .input(z.object({
      accessPointId: z.string().optional(),
      userId: z.string().optional(),
      limit: z.number().min(1).max(500).optional(),
    }))
    .query(async ({ input }) => {
      ensureSaltoInit();
      if (!isSaltoConfigured()) {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(accessLog).orderBy(desc(accessLog.createdAt)).limit(input.limit ?? 50);
      }
      return getAuditTrail({
        accessPointId: input.accessPointId,
        userId: input.userId,
        limit: input.limit ?? 50,
      });
    }),

  /** List access groups */
  listGroups: adminProcedure.query(async () => {
    ensureSaltoInit();
    if (!isSaltoConfigured()) {
      return [
        { id: "group-general", name: "Algemeen Toegang", description: "Hoofdingang en gemeenschappelijke ruimtes" },
        { id: "group-parking", name: "Parkeergarage", description: "Parkeergarage en slagboom" },
        { id: "group-office-a", name: "Kantoorvleugel A", description: "Alle deuren kantoorvleugel A" },
        { id: "group-facility", name: "Facility", description: "Technische ruimtes en serverruimte" },
      ];
    }
    return listAccessGroups();
  }),

  /** Get access rights for a specific user */
  userRights: adminProcedure
    .input(z.object({ saltoUserId: z.string() }))
    .query(async ({ input }) => {
      ensureSaltoInit();
      if (!isSaltoConfigured()) {
        return { userId: input.saltoUserId, groups: ["group-general"] };
      }
      return getUserAccessRights(input.saltoUserId);
    }),

  /** Set access rights for a user */
  setUserRights: adminProcedure
    .input(z.object({
      saltoUserId: z.string(),
      accessGroupIds: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      ensureSaltoInit();
      if (!isSaltoConfigured()) {
        return { success: true, mock: true };
      }
      await setUserAccessRights(input.saltoUserId, input.accessGroupIds);
      return { success: true, mock: false };
    }),

  /** Provision a new Salto user */
  provisionUser: adminProcedure
    .input(z.object({
      netosUserId: z.number(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      ensureSaltoInit();
      if (!isSaltoConfigured()) {
        return { success: true, mock: true, saltoUserId: `mock-salto-${input.netosUserId}` };
      }
      const result = await createSaltoUser({
        externalId: String(input.netosUserId),
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
      });
      return { success: true, mock: false, saltoUserId: result?.id };
    }),

  /** Issue a mobile key to a user */
  issueMobileKey: adminProcedure
    .input(z.object({
      saltoUserId: z.string(),
      accessGroupId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      ensureSaltoInit();
      if (!isSaltoConfigured()) {
        return { success: true, mock: true, keyId: `mock-key-${Date.now()}` };
      }
      const result = await issueMobileKey(input.saltoUserId, input.accessGroupId);
      return { success: true, mock: false, keyId: result?.id };
    }),

  /** Revoke a mobile key */
  revokeMobileKey: adminProcedure
    .input(z.object({
      saltoUserId: z.string(),
      keyId: z.string(),
    }))
    .mutation(async ({ input }) => {
      ensureSaltoInit();
      if (!isSaltoConfigured()) {
        return { success: true, mock: true };
      }
      await revokeMobileKey(input.saltoUserId, input.keyId);
      return { success: true, mock: false };
    }),

  /** List mobile keys for a user */
  listMobileKeys: adminProcedure
    .input(z.object({ saltoUserId: z.string() }))
    .query(async ({ input }) => {
      ensureSaltoInit();
      if (!isSaltoConfigured()) {
        return [{ id: "mock-key-1", userId: input.saltoUserId, status: "active", issuedAt: new Date().toISOString() }];
      }
      return listMobileKeys(input.saltoUserId);
    }),

  /** Access log statistics for dashboard */
  stats: adminProcedure
    .input(z.object({
      locationId: z.number(),
      since: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { totalEvents: 0, entries: 0, exits: 0, denied: 0 };

      const sinceDate = input.since
        ? new Date(input.since)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);

      const results = await db
        .select({ action: accessLog.action, eventCount: count() })
        .from(accessLog)
        .where(and(eq(accessLog.locationId, input.locationId), gte(accessLog.createdAt, sinceDate)))
        .groupBy(accessLog.action);

      const stats = { totalEvents: 0, entries: 0, exits: 0, denied: 0 };
      for (const row of results) {
        const c = Number(row.eventCount);
        stats.totalEvents += c;
        if (row.action === "entry") stats.entries = c;
        else if (row.action === "exit") stats.exits = c;
        else if (row.action === "denied") stats.denied = c;
      }
      return stats;
    }),
});

// --- Parking-Access Integration ---

export const parkingAccessControlRouter = router({
  /** Validate if a user has parking access via Salto KS groups */
  validateParkingAccess: protectedProcedure
    .input(z.object({
      saltoUserId: z.string().optional(),
      locationId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      ensureSaltoInit();
      if (isSaltoConfigured() && input.saltoUserId) {
        const rights = await getUserAccessRights(input.saltoUserId);
        const parkingGroupIds = ["group-parking"];
        const hasAccess = Array.isArray(rights?.access_group_ids)
          ? rights.access_group_ids.some((id: string) => parkingGroupIds.includes(id))
          : false;
        return { hasAccess, source: "salto_ks" as const };
      }
      return { hasAccess: true, source: "local_permit" as const };
    }),

  /** Log parking gate open/close via Salto */
  logParkingGateEvent: protectedProcedure
    .input(z.object({
      locationId: z.number(),
      action: z.enum(["entry", "exit"]),
      accessPointId: z.string().optional(),
      licensePlate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db.insert(accessLog).values({
        userId: ctx.user.id,
        locationId: input.locationId,
        zone: "zone_0",
        action: input.action,
        method: "ble",
        saltoEventId: input.accessPointId
          ? `parking-${input.accessPointId}-${Date.now()}`
          : undefined,
      });

      return { success: true };
    }),
});
