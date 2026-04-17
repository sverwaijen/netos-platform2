import { z } from "zod";
import { eq, and, desc, sql, gte, lte, like, or, ne, inArray, type SQL } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  signageScreens,
  signageScreenGroups,
  signageScreenGroupMembers,
  signageContent,
  signagePlaylists,
  signagePlaylistItems,
  signageProvisioningTemplates,
  wayfindingBuildings,
  wayfindingCompanyAssignments,
  wayfindingCompanyPresence,
  signageHeartbeats,
  signageAuditLog,
  kitchenMenuItems,
  gymSchedules,
  locations,
  companies,
  accessLog,
  users,
} from "../../drizzle/schema";
import { nanoid } from "nanoid";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "administrator" && ctx.user.role !== "host") throw new Error("Forbidden: admin access required");
  return next({ ctx });
});

// ─── Enum type aliases for signage columns ─────────────────────────
type ScreenType = "reception" | "gym" | "kitchen" | "wayfinding" | "general" | "meeting_room" | "elevator" | "parking" | "menu";
type ScreenStatus = "online" | "offline" | "provisioning" | "maintenance" | "error";
type ContentType = "image" | "video" | "pdf" | "html" | "url" | "menu_card" | "wayfinding" | "gym_schedule" | "weather" | "clock" | "news_ticker" | "company_presence" | "welcome_screen" | "announcement";
type KitchenCategory = "breakfast" | "lunch" | "dinner" | "snack" | "drink" | "soup" | "salad" | "sandwich" | "special";
type GymCategory = "cardio" | "strength" | "yoga" | "pilates" | "hiit" | "cycling" | "boxing" | "stretching" | "meditation" | "egym";

// ═══════════════════════════════════════════════════════════════════════
// ─── SCREEN MANAGEMENT ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export const signageScreensRouter = router({
  list: protectedProcedure.input(z.object({
    locationId: z.number().optional(),
    screenType: z.string().optional(),
    status: z.string().optional(),
    search: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: (SQL | undefined)[] = [];
    if (input?.locationId) conditions.push(eq(signageScreens.locationId, input.locationId));
    if (input?.screenType) conditions.push(eq(signageScreens.screenType, input.screenType as ScreenType));
    if (input?.status) conditions.push(eq(signageScreens.status, input.status as ScreenStatus));
    if (input?.search) conditions.push(or(
      like(signageScreens.name, `%${input.search}%`),
      like(signageScreens.ipAddress, `%${input.search}%`),
    ));
    const q = conditions.length > 0
      ? db.select().from(signageScreens).where(and(...conditions))
      : db.select().from(signageScreens);
    return q.orderBy(signageScreens.name);
  }),

  byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const [screen] = await db.select().from(signageScreens).where(eq(signageScreens.id, input.id)).limit(1);
    if (!screen) return null;
    // Get playlist info
    let playlist = null;
    if (screen.currentPlaylistId) {
      const [pl] = await db.select().from(signagePlaylists).where(eq(signagePlaylists.id, screen.currentPlaylistId)).limit(1);
      playlist = pl || null;
    }
    // Get recent heartbeats
    const heartbeats = await db.select().from(signageHeartbeats)
      .where(eq(signageHeartbeats.screenId, input.id))
      .orderBy(desc(signageHeartbeats.createdAt))
      .limit(10);
    // Get audit log
    const auditEntries = await db.select().from(signageAuditLog)
      .where(eq(signageAuditLog.screenId, input.id))
      .orderBy(desc(signageAuditLog.createdAt))
      .limit(20);
    return { ...screen, playlist, heartbeats, auditLog: auditEntries };
  }),

  create: adminProcedure.input(z.object({
    locationId: z.number(),
    name: z.string().min(1),
    screenType: z.enum(["reception", "gym", "kitchen", "wayfinding", "general", "meeting_room", "elevator", "parking"]),
    orientation: z.enum(["portrait", "landscape"]).optional(),
    resolution: z.string().optional(),
    floor: z.string().optional(),
    zone: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const provisioningToken = `SGN-${nanoid(16)}`;
    const [result] = await db.insert(signageScreens).values({
      ...input,
      provisioningToken,
      status: "provisioning",
      tags: input.tags || [],
    }).$returningId();
    // Log the creation
    await db.insert(signageAuditLog).values({
      screenId: result.id,
      action: "provisioned",
      description: `Screen "${input.name}" created with type "${input.screenType}"`,
      userId: ctx.user.id,
    });
    return { id: result.id, provisioningToken };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    screenType: z.enum(["reception", "gym", "kitchen", "wayfinding", "general", "meeting_room", "elevator", "parking"]).optional(),
    orientation: z.enum(["portrait", "landscape"]).optional(),
    resolution: z.string().optional(),
    floor: z.string().optional(),
    zone: z.string().optional(),
    currentPlaylistId: z.number().nullable().optional(),
    brightness: z.number().optional(),
    volume: z.number().optional(),
    isActive: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const { id, ...updates } = input;
    const setObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) setObj[k] = v;
    }
    if (Object.keys(setObj).length > 0) {
      await db.update(signageScreens).set(setObj).where(eq(signageScreens.id, id));
      await db.insert(signageAuditLog).values({
        screenId: id,
        action: "settings_changed",
        description: `Settings updated: ${Object.keys(setObj).join(", ")}`,
        userId: ctx.user.id,
        metadata: setObj,
      });
    }
    return { success: true };
  }),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.delete(signageScreens).where(eq(signageScreens.id, input.id));
    return { success: true };
  }),

  assignPlaylist: adminProcedure.input(z.object({
    screenId: z.number(),
    playlistId: z.number().nullable(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.update(signageScreens)
      .set({ currentPlaylistId: input.playlistId })
      .where(eq(signageScreens.id, input.screenId));
    await db.insert(signageAuditLog).values({
      screenId: input.screenId,
      action: "playlist_assigned",
      description: input.playlistId ? `Playlist #${input.playlistId} assigned` : "Playlist removed",
      userId: ctx.user.id,
    });
    return { success: true };
  }),

  bulkAssignPlaylist: adminProcedure.input(z.object({
    screenIds: z.array(z.number()),
    playlistId: z.number().nullable(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    for (const screenId of input.screenIds) {
      await db.update(signageScreens)
        .set({ currentPlaylistId: input.playlistId })
        .where(eq(signageScreens.id, screenId));
    }
    return { success: true, count: input.screenIds.length };
  }),

  reboot: adminProcedure.input(z.object({ screenId: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.insert(signageAuditLog).values({
      screenId: input.screenId,
      action: "reboot",
      description: "Remote reboot requested",
      userId: ctx.user.id,
    });
    return { success: true };
  }),

  stats: protectedProcedure.input(z.object({ locationId: z.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { total: 0, online: 0, offline: 0, provisioning: 0, error: 0, maintenance: 0 };
    const conditions: (SQL | undefined)[] = [eq(signageScreens.isActive, true)];
    if (input?.locationId) conditions.push(eq(signageScreens.locationId, input.locationId));
    const screens = await db.select().from(signageScreens).where(and(...conditions));
    return {
      total: screens.length,
      online: screens.filter(s => s.status === "online").length,
      offline: screens.filter(s => s.status === "offline").length,
      provisioning: screens.filter(s => s.status === "provisioning").length,
      error: screens.filter(s => s.status === "error").length,
      maintenance: screens.filter(s => s.status === "maintenance").length,
    };
  }),

  // ─── Auto-Provisioning Endpoint (public, called by screen device) ──
  provision: publicProcedure.input(z.object({
    token: z.string(),
    ipAddress: z.string().optional(),
    macAddress: z.string().optional(),
    userAgent: z.string().optional(),
    firmwareVersion: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    // Find screen by provisioning token
    const [screen] = await db.select().from(signageScreens)
      .where(eq(signageScreens.provisioningToken, input.token))
      .limit(1);
    if (!screen) throw new Error("Invalid provisioning token");

    // Update screen with device info
    await db.update(signageScreens).set({
      status: "online",
      ipAddress: input.ipAddress || null,
      macAddress: input.macAddress || null,
      userAgent: input.userAgent || null,
      firmwareVersion: input.firmwareVersion || null,
      lastHeartbeat: new Date(),
    }).where(eq(signageScreens.id, screen.id));

    // Find matching provisioning template
    const [template] = await db.select().from(signageProvisioningTemplates)
      .where(and(
        eq(signageProvisioningTemplates.screenType, screen.screenType),
        eq(signageProvisioningTemplates.isActive, true),
      )).limit(1);

    // Auto-assign default playlist from template
    if (template?.defaultPlaylistId && !screen.currentPlaylistId) {
      await db.update(signageScreens)
        .set({ currentPlaylistId: template.defaultPlaylistId })
        .where(eq(signageScreens.id, screen.id));
    }

    await db.insert(signageAuditLog).values({
      screenId: screen.id,
      action: "provisioned",
      description: `Device provisioned from ${input.ipAddress || "unknown"}`,
      metadata: { macAddress: input.macAddress, userAgent: input.userAgent },
    });

    // Return screen config
    const [location] = await db.select().from(locations)
      .where(eq(locations.id, screen.locationId)).limit(1);

    return {
      screenId: screen.id,
      screenType: screen.screenType,
      orientation: screen.orientation,
      resolution: screen.resolution,
      brightness: screen.brightness,
      volume: screen.volume,
      playlistId: template?.defaultPlaylistId || screen.currentPlaylistId,
      locationId: screen.locationId,
      locationName: location?.name || "",
      floor: screen.floor,
      zone: screen.zone,
    };
  }),

  // ─── Heartbeat Endpoint (public, called by screen device) ──────────
  heartbeat: publicProcedure.input(z.object({
    screenId: z.number(),
    status: z.enum(["online", "offline", "error", "maintenance", "provisioning"]).optional(),
    currentContentId: z.number().optional(),
    currentPlaylistId: z.number().optional(),
    cpuUsage: z.number().optional(),
    memoryUsage: z.number().optional(),
    temperature: z.number().optional(),
    uptime: z.number().optional(),
    errorMessage: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const { screenId, ...heartbeatData } = input;
    // Update screen status
    await db.update(signageScreens).set({
      status: input.status || "online",
      lastHeartbeat: new Date(),
    }).where(eq(signageScreens.id, screenId));
    // Record heartbeat
    await db.insert(signageHeartbeats).values({
      screenId,
      status: input.status || "online",
      currentContentId: input.currentContentId || null,
      currentPlaylistId: input.currentPlaylistId || null,
      cpuUsage: input.cpuUsage?.toFixed(2) || null,
      memoryUsage: input.memoryUsage?.toFixed(2) || null,
      temperature: input.temperature?.toFixed(2) || null,
      uptime: input.uptime || null,
      errorMessage: input.errorMessage || null,
    });
    // Get latest config for the screen (so it can update itself)
    const [screen] = await db.select().from(signageScreens)
      .where(eq(signageScreens.id, screenId)).limit(1);
    return {
      playlistId: screen?.currentPlaylistId,
      brightness: screen?.brightness,
      volume: screen?.volume,
      isActive: screen?.isActive,
    };
  }),
});

// ═══════════════════════════════════════════════════════════════════════
// ─── SCREEN GROUPS ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export const signageGroupsRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const groups = await db.select().from(signageScreenGroups).orderBy(signageScreenGroups.name);
    // Get member counts
    const result = [];
    for (const group of groups) {
      const members = await db.select().from(signageScreenGroupMembers)
        .where(eq(signageScreenGroupMembers.groupId, group.id));
      result.push({ ...group, memberCount: members.length });
    }
    return result;
  }),

  create: adminProcedure.input(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    locationId: z.number().optional(),
    screenType: z.enum(["reception", "gym", "kitchen", "wayfinding", "general", "meeting_room", "elevator", "parking"]).optional(),
    color: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.insert(signageScreenGroups).values(input);
    return { success: true };
  }),

  addMember: adminProcedure.input(z.object({
    groupId: z.number(),
    screenId: z.number(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.insert(signageScreenGroupMembers).values(input);
    return { success: true };
  }),

  removeMember: adminProcedure.input(z.object({
    groupId: z.number(),
    screenId: z.number(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.delete(signageScreenGroupMembers).where(and(
      eq(signageScreenGroupMembers.groupId, input.groupId),
      eq(signageScreenGroupMembers.screenId, input.screenId),
    ));
    return { success: true };
  }),
});

// ═══════════════════════════════════════════════════════════════════════
// ─── CONTENT MANAGEMENT ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export const signageContentRouter = router({
  list: protectedProcedure.input(z.object({
    contentType: z.string().optional(),
    locationId: z.number().optional(),
    search: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: (SQL | undefined)[] = [eq(signageContent.isActive, true)];
    if (input?.contentType) conditions.push(eq(signageContent.contentType, input.contentType as ContentType));
    if (input?.locationId) conditions.push(or(
      eq(signageContent.locationId, input.locationId),
      sql`${signageContent.locationId} IS NULL`,
    ));
    if (input?.search) conditions.push(like(signageContent.title, `%${input.search}%`));
    return db.select().from(signageContent).where(and(...conditions)).orderBy(desc(signageContent.updatedAt));
  }),

  byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const [item] = await db.select().from(signageContent).where(eq(signageContent.id, input.id)).limit(1);
    return item || null;
  }),

  create: adminProcedure.input(z.object({
    title: z.string().min(1),
    contentType: z.enum([
      "image", "video", "pdf", "html", "url", "menu_card", "wayfinding",
      "gym_schedule", "weather", "clock", "news_ticker",
      "company_presence", "welcome_screen", "announcement",
    ]),
    mediaUrl: z.string().optional(),
    htmlContent: z.string().optional(),
    externalUrl: z.string().optional(),
    duration: z.number().optional(),
    templateData: z.record(z.string(), z.unknown()).optional(),
    targetScreenTypes: z.array(z.string()).optional(),
    locationId: z.number().optional(),
    priority: z.number().optional(),
    validFrom: z.string().optional(),
    validUntil: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const values = {
      ...input,
      createdByUserId: ctx.user.id,
      validFrom: input.validFrom ? new Date(input.validFrom) : null,
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
    } as typeof signageContent.$inferInsert;
    await db.insert(signageContent).values(values);
    return { success: true };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    mediaUrl: z.string().optional(),
    htmlContent: z.string().optional(),
    externalUrl: z.string().optional(),
    duration: z.number().optional(),
    templateData: z.record(z.string(), z.unknown()).optional(),
    targetScreenTypes: z.array(z.string()).optional(),
    priority: z.number().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const { id, ...updates } = input;
    const setObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) setObj[k] = v;
    }
    if (Object.keys(setObj).length > 0) {
      await db.update(signageContent).set(setObj).where(eq(signageContent.id, id));
    }
    return { success: true };
  }),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.update(signageContent).set({ isActive: false }).where(eq(signageContent.id, input.id));
    return { success: true };
  }),
});

// ═══════════════════════════════════════════════════════════════════════
// ─── PLAYLIST MANAGEMENT ────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export const signagePlaylistsRouter = router({
  list: protectedProcedure.input(z.object({
    screenType: z.string().optional(),
    locationId: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: (SQL | undefined)[] = [eq(signagePlaylists.isActive, true)];
    if (input?.screenType) conditions.push(eq(signagePlaylists.screenType, input.screenType as typeof signagePlaylists.screenType.enumValues[number]));
    if (input?.locationId) conditions.push(or(
      eq(signagePlaylists.locationId, input.locationId),
      sql`${signagePlaylists.locationId} IS NULL`,
    ));
    const playlists = await db.select().from(signagePlaylists).where(and(...conditions)).orderBy(signagePlaylists.name);
    // Get item counts and assigned screen counts
    const result = [];
    for (const pl of playlists) {
      const items = await db.select().from(signagePlaylistItems)
        .where(eq(signagePlaylistItems.playlistId, pl.id));
      const screens = await db.select().from(signageScreens)
        .where(eq(signageScreens.currentPlaylistId, pl.id));
      result.push({ ...pl, itemCount: items.length, screenCount: screens.length });
    }
    return result;
  }),

  byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const [playlist] = await db.select().from(signagePlaylists).where(eq(signagePlaylists.id, input.id)).limit(1);
    if (!playlist) return null;
    const items = await db.select({
      id: signagePlaylistItems.id,
      contentId: signagePlaylistItems.contentId,
      sortOrder: signagePlaylistItems.sortOrder,
      durationOverride: signagePlaylistItems.durationOverride,
      isActive: signagePlaylistItems.isActive,
      contentTitle: signageContent.title,
      contentType: signageContent.contentType,
      mediaUrl: signageContent.mediaUrl,
      duration: signageContent.duration,
    }).from(signagePlaylistItems)
      .innerJoin(signageContent, eq(signageContent.id, signagePlaylistItems.contentId))
      .where(eq(signagePlaylistItems.playlistId, input.id))
      .orderBy(signagePlaylistItems.sortOrder);
    return { ...playlist, items };
  }),

  create: adminProcedure.input(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    screenType: z.enum(["reception", "gym", "kitchen", "wayfinding", "general", "meeting_room", "elevator", "parking"]).optional(),
    locationId: z.number().optional(),
    isDefault: z.boolean().optional(),
    scheduleType: z.enum(["always", "time_based", "day_based"]).optional(),
    scheduleConfig: z.record(z.string(), z.unknown()).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [result] = await db.insert(signagePlaylists).values(input).$returningId();
    return { success: true, id: result.id };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
    scheduleType: z.enum(["always", "time_based", "day_based"]).optional(),
    scheduleConfig: z.record(z.string(), z.unknown()).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const { id, ...updates } = input;
    const setObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) setObj[k] = v;
    }
    if (Object.keys(setObj).length > 0) {
      await db.update(signagePlaylists).set(setObj).where(eq(signagePlaylists.id, id));
    }
    return { success: true };
  }),

  addItem: adminProcedure.input(z.object({
    playlistId: z.number(),
    contentId: z.number(),
    sortOrder: z.number().optional(),
    durationOverride: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.insert(signagePlaylistItems).values(input);
    return { success: true };
  }),

  removeItem: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.delete(signagePlaylistItems).where(eq(signagePlaylistItems.id, input.id));
    return { success: true };
  }),

  reorderItems: adminProcedure.input(z.object({
    playlistId: z.number(),
    itemIds: z.array(z.number()),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    for (let i = 0; i < input.itemIds.length; i++) {
      await db.update(signagePlaylistItems)
        .set({ sortOrder: i })
        .where(eq(signagePlaylistItems.id, input.itemIds[i]));
    }
    return { success: true };
  }),
});

// ═══════════════════════════════════════════════════════════════════════
// ─── PROVISIONING TEMPLATES ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export const signageProvisioningRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(signageProvisioningTemplates).orderBy(signageProvisioningTemplates.name);
  }),

  create: adminProcedure.input(z.object({
    name: z.string().min(1),
    screenType: z.enum(["reception", "gym", "kitchen", "wayfinding", "general", "meeting_room", "elevator", "parking"]),
    defaultPlaylistId: z.number().optional(),
    defaultOrientation: z.enum(["portrait", "landscape"]).optional(),
    defaultResolution: z.string().optional(),
    defaultBrightness: z.number().optional(),
    autoAssignLocation: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.insert(signageProvisioningTemplates).values(input);
    return { success: true };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    defaultPlaylistId: z.number().optional(),
    defaultBrightness: z.number().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const { id, ...updates } = input;
    const setObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) setObj[k] = v;
    }
    if (Object.keys(setObj).length > 0) {
      await db.update(signageProvisioningTemplates).set(setObj).where(eq(signageProvisioningTemplates.id, id));
    }
    return { success: true };
  }),
});

// ═══════════════════════════════════════════════════════════════════════
// ─── WAYFINDING ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export const wayfindingRouter = router({
  // ─── Buildings ───
  buildings: protectedProcedure.input(z.object({
    locationId: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: (SQL | undefined)[] = [eq(wayfindingBuildings.isActive, true)];
    if (input?.locationId) conditions.push(eq(wayfindingBuildings.locationId, input.locationId));
    return db.select().from(wayfindingBuildings).where(and(...conditions)).orderBy(wayfindingBuildings.name);
  }),

  createBuilding: adminProcedure.input(z.object({
    locationId: z.number(),
    name: z.string().min(1),
    code: z.string().optional(),
    address: z.string().optional(),
    floors: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.insert(wayfindingBuildings).values(input);
    return { success: true };
  }),

  updateBuilding: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    code: z.string().optional(),
    address: z.string().optional(),
    floors: z.number().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const { id, ...updates } = input;
    const setObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) setObj[k] = v;
    }
    if (Object.keys(setObj).length > 0) {
      await db.update(wayfindingBuildings).set(setObj).where(eq(wayfindingBuildings.id, id));
    }
    return { success: true };
  }),

  // ─── Company Assignments ───
  companyAssignments: protectedProcedure.input(z.object({
    buildingId: z.number().optional(),
    companyId: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: (SQL | undefined)[] = [eq(wayfindingCompanyAssignments.isActive, true)];
    if (input?.buildingId) conditions.push(eq(wayfindingCompanyAssignments.buildingId, input.buildingId));
    if (input?.companyId) conditions.push(eq(wayfindingCompanyAssignments.companyId, input.companyId));
    const assignments = await db.select().from(wayfindingCompanyAssignments).where(and(...conditions));
    // Enrich with company and building names
    const allCompanies = await db.select().from(companies);
    const allBuildings = await db.select().from(wayfindingBuildings);
    const companyMap = new Map(allCompanies.map(c => [c.id, c]));
    const buildingMap = new Map(allBuildings.map(b => [b.id, b]));
    return assignments.map(a => ({
      ...a,
      companyName: companyMap.get(a.companyId)?.name || "Unknown",
      companyLogo: companyMap.get(a.companyId)?.logoUrl,
      buildingName: buildingMap.get(a.buildingId)?.name || "Unknown",
      buildingCode: buildingMap.get(a.buildingId)?.code,
    }));
  }),

  assignCompany: adminProcedure.input(z.object({
    companyId: z.number(),
    buildingId: z.number(),
    floor: z.string().optional(),
    roomNumber: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.insert(wayfindingCompanyAssignments).values(input);
    return { success: true };
  }),

  removeAssignment: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.update(wayfindingCompanyAssignments)
      .set({ isActive: false })
      .where(eq(wayfindingCompanyAssignments.id, input.id));
    return { success: true };
  }),

  // ─── Company Presence (Dynamic check-in/out) ───
  companyPresenceToday: publicProcedure.input(z.object({
    locationId: z.number(),
    buildingId: z.number().optional(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const today = new Date().toISOString().split("T")[0];
    const conditions: (SQL | undefined)[] = [
      eq(wayfindingCompanyPresence.locationId, input.locationId),
      eq(wayfindingCompanyPresence.date, today),
      eq(wayfindingCompanyPresence.isPresent, true),
    ];
    if (input.buildingId) conditions.push(eq(wayfindingCompanyPresence.buildingId, input.buildingId));
    const presenceRecords = await db.select().from(wayfindingCompanyPresence).where(and(...conditions));

    // Enrich with company + assignment data
    const companyIds = presenceRecords.map(p => p.companyId);
    if (companyIds.length === 0) return [];
    const allCompanies = await db.select().from(companies);
    const allAssignments = await db.select().from(wayfindingCompanyAssignments)
      .where(eq(wayfindingCompanyAssignments.isActive, true));
    const allBuildings = await db.select().from(wayfindingBuildings);
    const companyMap = new Map(allCompanies.map(c => [c.id, c]));
    const buildingMap = new Map(allBuildings.map(b => [b.id, b]));

    return presenceRecords.map(p => {
      const company = companyMap.get(p.companyId);
      const assignment = allAssignments.find(a => a.companyId === p.companyId);
      const building = p.buildingId ? buildingMap.get(p.buildingId) : null;
      return {
        ...p,
        companyName: company?.name || "Unknown",
        companyLogo: company?.logoUrl,
        buildingName: building?.name || "",
        buildingCode: building?.code || "",
        floor: assignment?.floor || "",
        roomNumber: assignment?.roomNumber || "",
      };
    });
  }),

  checkIn: protectedProcedure.input(z.object({
    companyId: z.number(),
    locationId: z.number(),
    buildingId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const today = new Date().toISOString().split("T")[0];
    // Check if already checked in today
    const existing = await db.select().from(wayfindingCompanyPresence).where(and(
      eq(wayfindingCompanyPresence.companyId, input.companyId),
      eq(wayfindingCompanyPresence.locationId, input.locationId),
      eq(wayfindingCompanyPresence.date, today),
    )).limit(1);
    if (existing[0]) {
      await db.update(wayfindingCompanyPresence).set({
        isPresent: true,
        checkedInAt: new Date(),
        checkedOutAt: null,
        checkedInByUserId: ctx.user.id,
      }).where(eq(wayfindingCompanyPresence.id, existing[0].id));
    } else {
      await db.insert(wayfindingCompanyPresence).values({
        companyId: input.companyId,
        locationId: input.locationId,
        buildingId: input.buildingId || null,
        isPresent: true,
        checkedInAt: new Date(),
        checkedInByUserId: ctx.user.id,
        method: "manual",
        date: today,
      });
    }
    return { success: true };
  }),

  checkOut: protectedProcedure.input(z.object({
    companyId: z.number(),
    locationId: z.number(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const today = new Date().toISOString().split("T")[0];
    await db.update(wayfindingCompanyPresence).set({
      isPresent: false,
      checkedOutAt: new Date(),
    }).where(and(
      eq(wayfindingCompanyPresence.companyId, input.companyId),
      eq(wayfindingCompanyPresence.locationId, input.locationId),
      eq(wayfindingCompanyPresence.date, today),
    ));
    return { success: true };
  }),

  // ─── Auto-sync presence from access_log ───
  syncPresenceFromAccessLog: protectedProcedure.input(z.object({
    locationId: z.number(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = new Date().toISOString().split("T")[0];

    // Get today's entries
    const entries = await db.select().from(accessLog).where(and(
      eq(accessLog.action, "entry"),
      eq(accessLog.locationId, input.locationId),
      gte(accessLog.createdAt, new Date(today.getTime())),
    ));

    // Get unique user IDs
    const userIdSet = new Set(entries.filter(e => e.userId).map(e => e.userId!));
    const userIds = Array.from(userIdSet);
    if (userIds.length === 0) return { synced: 0 };

    // Get users with their companies
    const allUsers = await db.select().from(users);
    const companyIds = new Set<number>();
    allUsers.filter(u => userIds.includes(u.id) && u.companyId).forEach(u => companyIds.add(u.companyId!));

    // Get company-building assignments
    const assignments = await db.select().from(wayfindingCompanyAssignments)
      .where(eq(wayfindingCompanyAssignments.isActive, true));

    let synced = 0;
    for (const companyId of Array.from(companyIds)) {
      const assignment = assignments.find(a => a.companyId === companyId);
      const existing = await db.select().from(wayfindingCompanyPresence).where(and(
        eq(wayfindingCompanyPresence.companyId, companyId),
        eq(wayfindingCompanyPresence.locationId, input.locationId),
        eq(wayfindingCompanyPresence.date, todayStr),
      )).limit(1);

      if (!existing[0]) {
        await db.insert(wayfindingCompanyPresence).values({
          companyId,
          locationId: input.locationId,
          buildingId: assignment?.buildingId || null,
          isPresent: true,
          checkedInAt: new Date(),
          method: "access_log",
          date: todayStr,
        });
        synced++;
      } else if (!existing[0].isPresent) {
        await db.update(wayfindingCompanyPresence).set({
          isPresent: true,
          checkedInAt: new Date(),
          checkedOutAt: null,
          method: "access_log",
        }).where(eq(wayfindingCompanyPresence.id, existing[0].id));
        synced++;
      }
    }
    return { synced };
  }),
});

// ═══════════════════════════════════════════════════════════════════════
// ─── KITCHEN MENU ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export const kitchenMenuRouter = router({
  list: publicProcedure.input(z.object({
    locationId: z.number(),
    category: z.string().optional(),
    dayOfWeek: z.number().optional(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: (SQL | undefined)[] = [
      eq(kitchenMenuItems.locationId, input.locationId),
      eq(kitchenMenuItems.isAvailable, true),
    ];
    if (input.category) conditions.push(eq(kitchenMenuItems.category, input.category as KitchenCategory));
    return db.select().from(kitchenMenuItems).where(and(...conditions)).orderBy(kitchenMenuItems.sortOrder);
  }),

  create: adminProcedure.input(z.object({
    locationId: z.number(),
    name: z.string().min(1),
    description: z.string().optional(),
    category: z.enum(["breakfast", "lunch", "dinner", "snack", "drink", "soup", "salad", "sandwich", "special"]),
    price: z.string().optional(),
    imageUrl: z.string().optional(),
    allergens: z.array(z.string()).optional(),
    isVegan: z.boolean().optional(),
    isVegetarian: z.boolean().optional(),
    isGlutenFree: z.boolean().optional(),
    dayOfWeek: z.array(z.number()).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.insert(kitchenMenuItems).values(input);
    return { success: true };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.string().optional(),
    imageUrl: z.string().optional(),
    isAvailable: z.boolean().optional(),
    allergens: z.array(z.string()).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const { id, ...updates } = input;
    const setObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) setObj[k] = v;
    }
    if (Object.keys(setObj).length > 0) {
      await db.update(kitchenMenuItems).set(setObj).where(eq(kitchenMenuItems.id, id));
    }
    return { success: true };
  }),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.update(kitchenMenuItems).set({ isAvailable: false }).where(eq(kitchenMenuItems.id, input.id));
    return { success: true };
  }),
});

// ═══════════════════════════════════════════════════════════════════════
// ─── GYM SCHEDULES ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export const gymScheduleRouter = router({
  list: publicProcedure.input(z.object({
    locationId: z.number(),
    dayOfWeek: z.number().optional(),
    category: z.string().optional(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: (SQL | undefined)[] = [
      eq(gymSchedules.locationId, input.locationId),
      eq(gymSchedules.isActive, true),
    ];
    if (input.dayOfWeek !== undefined) conditions.push(eq(gymSchedules.dayOfWeek, input.dayOfWeek));
    if (input.category) conditions.push(eq(gymSchedules.category, input.category as GymCategory));
    return db.select().from(gymSchedules).where(and(...conditions)).orderBy(gymSchedules.startTime);
  }),

  create: adminProcedure.input(z.object({
    locationId: z.number(),
    className: z.string().min(1),
    instructor: z.string().optional(),
    description: z.string().optional(),
    category: z.enum(["cardio", "strength", "yoga", "pilates", "hiit", "cycling", "boxing", "stretching", "meditation", "egym"]),
    dayOfWeek: z.number(),
    startTime: z.string(),
    endTime: z.string(),
    maxParticipants: z.number().optional(),
    imageUrl: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.insert(gymSchedules).values(input);
    return { success: true };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    className: z.string().optional(),
    instructor: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    maxParticipants: z.number().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const { id, ...updates } = input;
    const setObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) setObj[k] = v;
    }
    if (Object.keys(setObj).length > 0) {
      await db.update(gymSchedules).set(setObj).where(eq(gymSchedules.id, id));
    }
    return { success: true };
  }),
});

// ═══════════════════════════════════════════════════════════════════════
// ─── PUBLIC DISPLAY ENDPOINTS (No auth - called by screens) ─────────
// ═══════════════════════════════════════════════════════════════════════

export const signageDisplayRouter = router({
  // Get full screen config + playlist + content for a screen
  getScreenConfig: publicProcedure.input(z.object({
    screenId: z.number(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const [screen] = await db.select().from(signageScreens)
      .where(eq(signageScreens.id, input.screenId)).limit(1);
    if (!screen) return null;

    const [location] = await db.select().from(locations)
      .where(eq(locations.id, screen.locationId)).limit(1);

    let playlist = null;
    let playlistItems: Array<Record<string, unknown>> = [];
    if (screen.currentPlaylistId) {
      const [pl] = await db.select().from(signagePlaylists)
        .where(eq(signagePlaylists.id, screen.currentPlaylistId)).limit(1);
      playlist = pl || null;
      if (pl) {
        playlistItems = await db.select({
          id: signagePlaylistItems.id,
          contentId: signagePlaylistItems.contentId,
          sortOrder: signagePlaylistItems.sortOrder,
          durationOverride: signagePlaylistItems.durationOverride,
          title: signageContent.title,
          contentType: signageContent.contentType,
          mediaUrl: signageContent.mediaUrl,
          htmlContent: signageContent.htmlContent,
          externalUrl: signageContent.externalUrl,
          duration: signageContent.duration,
          templateData: signageContent.templateData,
          priority: signageContent.priority,
        }).from(signagePlaylistItems)
          .innerJoin(signageContent, eq(signageContent.id, signagePlaylistItems.contentId))
          .where(and(
            eq(signagePlaylistItems.playlistId, screen.currentPlaylistId!),
            eq(signagePlaylistItems.isActive, true),
            eq(signageContent.isActive, true),
          ))
          .orderBy(signagePlaylistItems.sortOrder);
      }
    }

    return {
      screen,
      location: location || null,
      playlist,
      items: playlistItems,
    };
  }),

  // Get wayfinding data for a location
  getWayfindingData: publicProcedure.input(z.object({
    locationId: z.number(),
    buildingId: z.number().optional(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { buildings: [], presentCompanies: [], allAssignments: [] };

    // Get buildings
    const buildingConditions: (SQL | undefined)[] = [
      eq(wayfindingBuildings.locationId, input.locationId),
      eq(wayfindingBuildings.isActive, true),
    ];
    if (input.buildingId) buildingConditions.push(eq(wayfindingBuildings.id, input.buildingId));
    const buildings = await db.select().from(wayfindingBuildings).where(and(...buildingConditions));

    // Get today's presence
    const today = new Date().toISOString().split("T")[0];
    const presenceConditions: (SQL | undefined)[] = [
      eq(wayfindingCompanyPresence.locationId, input.locationId),
      eq(wayfindingCompanyPresence.date, today),
      eq(wayfindingCompanyPresence.isPresent, true),
    ];
    if (input.buildingId) presenceConditions.push(eq(wayfindingCompanyPresence.buildingId, input.buildingId));
    const presenceRecords = await db.select().from(wayfindingCompanyPresence).where(and(...presenceConditions));

    // Get all assignments
    const allAssignments = await db.select().from(wayfindingCompanyAssignments)
      .where(eq(wayfindingCompanyAssignments.isActive, true));

    // Get company details
    const allCompanies = await db.select().from(companies);
    const companyMap = new Map(allCompanies.map(c => [c.id, c]));
    const buildingMap = new Map(buildings.map(b => [b.id, b]));

    const presentCompanies = presenceRecords.map(p => {
      const company = companyMap.get(p.companyId);
      const assignment = allAssignments.find(a => a.companyId === p.companyId);
      const building = p.buildingId ? buildingMap.get(p.buildingId) : null;
      return {
        companyId: p.companyId,
        companyName: company?.name || "Unknown",
        companyLogo: company?.logoUrl,
        buildingId: p.buildingId,
        buildingName: building?.name || "",
        buildingCode: building?.code || "",
        floor: assignment?.floor || "",
        roomNumber: assignment?.roomNumber || "",
        checkedInAt: p.checkedInAt,
      };
    });

    const enrichedAssignments = allAssignments.map(a => ({
      ...a,
      companyName: companyMap.get(a.companyId)?.name || "Unknown",
      companyLogo: companyMap.get(a.companyId)?.logoUrl,
      buildingName: buildingMap.get(a.buildingId)?.name || "",
      buildingCode: buildingMap.get(a.buildingId)?.code || "",
    }));

    return { buildings, presentCompanies, allAssignments: enrichedAssignments };
  }),

  // Get kitchen menu for display
  getKitchenMenu: publicProcedure.input(z.object({
    locationId: z.number(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const dayOfWeek = new Date().getDay();
    return db.select().from(kitchenMenuItems).where(and(
      eq(kitchenMenuItems.locationId, input.locationId),
      eq(kitchenMenuItems.isAvailable, true),
    )).orderBy(kitchenMenuItems.sortOrder);
  }),

  // Get gym schedule for display
  getGymSchedule: publicProcedure.input(z.object({
    locationId: z.number(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const dayOfWeek = new Date().getDay();
    return db.select().from(gymSchedules).where(and(
      eq(gymSchedules.locationId, input.locationId),
      eq(gymSchedules.isActive, true),
      eq(gymSchedules.dayOfWeek, dayOfWeek),
    )).orderBy(gymSchedules.startTime);
  }),
});
