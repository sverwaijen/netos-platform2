import { eq, and, gte, lte, desc, sql, asc, like, or, inArray, isNull, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, locations, resources, companies, creditBundles,
  wallets, creditLedger, bookings, dayMultipliers, visitors,
  companyBranding, employeePhotos, devices, sensors, accessLog,
  notifications, invites,
  crmLeads, InsertCrmLead, crmLeadActivities, crmCampaigns, InsertCrmCampaign,
  crmCampaignSteps, crmCampaignEnrollments, crmEmailTemplates,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod", "phone", "avatarUrl"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    values[field] = value ?? null;
    updateSet[field] = value ?? null;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUserProfile(userId: number, data: { name?: string; phone?: string; avatarUrl?: string; companyId?: number; onboardingComplete?: boolean }) {
  const db = await getDb();
  if (!db) return;
  const updateSet: Record<string, unknown> = {};
  if (data.name !== undefined) updateSet.name = data.name;
  if (data.phone !== undefined) updateSet.phone = data.phone;
  if (data.avatarUrl !== undefined) updateSet.avatarUrl = data.avatarUrl;
  if (data.companyId !== undefined) updateSet.companyId = data.companyId;
  if (data.onboardingComplete !== undefined) updateSet.onboardingComplete = data.onboardingComplete;
  if (Object.keys(updateSet).length > 0) {
    await db.update(users).set(updateSet).where(eq(users.id, userId));
  }
}

export async function searchUsers(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(
    or(like(users.name, `%${query}%`), like(users.email, `%${query}%`))
  ).orderBy(desc(users.createdAt)).limit(limit);
}

// ─── Locations ───
export async function getAllLocations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(locations).where(eq(locations.isActive, true)).orderBy(asc(locations.name));
}

export async function getLocationBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(locations).where(eq(locations.slug, slug)).limit(1);
  return result[0];
}

export async function getLocationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
  return result[0];
}

// ─── Resources ───
export async function getResourcesByLocation(locationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resources).where(and(eq(resources.locationId, locationId), eq(resources.isActive, true))).orderBy(asc(resources.type), asc(resources.name));
}

export async function getResourceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
  return result[0];
}

export async function getResourceStats() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    locationId: resources.locationId,
    type: resources.type,
    count: sql<number>`COUNT(*)`,
  }).from(resources).where(eq(resources.isActive, true)).groupBy(resources.locationId, resources.type);
}

export async function searchResources(filters: {
  locationId?: number; type?: string; zone?: string; minCapacity?: number; maxCostPerHour?: number; query?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(resources.isActive, true)];
  if (filters.locationId) conditions.push(eq(resources.locationId, filters.locationId));
  if (filters.type) conditions.push(eq(resources.type, filters.type as any));
  if (filters.zone) conditions.push(eq(resources.zone, filters.zone as any));
  if (filters.minCapacity) conditions.push(gte(resources.capacity, filters.minCapacity));
  if (filters.maxCostPerHour) conditions.push(lte(resources.creditCostPerHour, String(filters.maxCostPerHour)));
  if (filters.query) conditions.push(like(resources.name, `%${filters.query}%`));
  return db.select().from(resources).where(and(...conditions)).orderBy(asc(resources.type), asc(resources.name)).limit(100);
}

export async function getResourceAvailability(resourceId: number, dateStart: number, dateEnd: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: bookings.id,
    startTime: bookings.startTime,
    endTime: bookings.endTime,
    status: bookings.status,
  }).from(bookings).where(
    and(
      eq(bookings.resourceId, resourceId),
      ne(bookings.status, "cancelled"),
      lte(bookings.startTime, dateEnd),
      gte(bookings.endTime, dateStart),
    )
  ).orderBy(asc(bookings.startTime));
}

// ─── Companies ───
export async function getAllCompanies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies).where(eq(companies.isActive, true)).orderBy(desc(companies.memberCount));
}

export async function getCompanyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result[0];
}

export async function getCompanyMembers(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.companyId, companyId)).orderBy(asc(users.name));
}

export async function getCompanyBookings(companyId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const members = await getCompanyMembers(companyId);
  if (members.length === 0) return [];
  const memberIds = members.map(m => m.id);
  return db.select().from(bookings).where(inArray(bookings.userId, memberIds)).orderBy(desc(bookings.startTime)).limit(limit);
}

// ─── Credit Bundles ───
export async function getAllBundles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditBundles).where(eq(creditBundles.isActive, true)).orderBy(asc(creditBundles.priceEur));
}

// ─── Wallets ───
export async function getWalletsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wallets).where(eq(wallets.ownerId, userId));
}

export async function getWalletById(walletId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(wallets).where(eq(wallets.id, walletId)).limit(1);
  return result[0];
}

export async function getCompanyWallet(companyId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(wallets).where(and(eq(wallets.ownerId, companyId), eq(wallets.type, "company"))).limit(1);
  return result[0];
}

export async function createWallet(data: { type: "company" | "personal"; ownerId: number; bundleId?: number; maxRollover?: number; balance?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(wallets).values({
    type: data.type,
    ownerId: data.ownerId,
    bundleId: data.bundleId,
    maxRollover: data.maxRollover ?? 0,
    balance: data.balance ?? "0",
  });
}

export async function updateWalletBalance(walletId: number, newBalance: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(wallets).set({ balance: newBalance }).where(eq(wallets.id, walletId));
}

export async function ensurePersonalWallet(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(wallets).where(and(eq(wallets.ownerId, userId), eq(wallets.type, "personal"))).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(wallets).values({ type: "personal", ownerId: userId, balance: "10", maxRollover: 0 });
  const created = await db.select().from(wallets).where(and(eq(wallets.ownerId, userId), eq(wallets.type, "personal"))).limit(1);
  return created[0] ?? null;
}

// ─── Credit Ledger ───
export async function addLedgerEntry(data: {
  walletId: number; type: "grant" | "spend" | "rollover" | "breakage" | "topup" | "refund" | "transfer";
  amount: string; balanceAfter: string; description?: string; referenceType?: string; referenceId?: number; multiplier?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(creditLedger).values(data);
}

export async function getLedgerByWallet(walletId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditLedger).where(eq(creditLedger.walletId, walletId)).orderBy(desc(creditLedger.createdAt)).limit(limit);
}

export async function getLedgerSummary(walletId: number) {
  const db = await getDb();
  if (!db) return { totalSpent: 0, totalGranted: 0, totalTopup: 0, totalBreakage: 0 };
  const result = await db.select({
    totalSpent: sql<number>`COALESCE(SUM(CASE WHEN type = 'spend' THEN ABS(amount) ELSE 0 END), 0)`,
    totalGranted: sql<number>`COALESCE(SUM(CASE WHEN type = 'grant' THEN amount ELSE 0 END), 0)`,
    totalTopup: sql<number>`COALESCE(SUM(CASE WHEN type = 'topup' THEN amount ELSE 0 END), 0)`,
    totalBreakage: sql<number>`COALESCE(SUM(CASE WHEN type = 'breakage' THEN ABS(amount) ELSE 0 END), 0)`,
  }).from(creditLedger).where(eq(creditLedger.walletId, walletId));
  return result[0] ?? { totalSpent: 0, totalGranted: 0, totalTopup: 0, totalBreakage: 0 };
}

// ─── Bookings ───
export async function createBooking(data: {
  userId: number; resourceId: number; locationId: number; walletId?: number;
  startTime: number; endTime: number; creditsCost: string; multiplierApplied?: string; notes?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(bookings).values({ ...data, status: "confirmed" });
}

export async function getBookingsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.startTime)).limit(limit);
}

export async function getBookingsByLocation(locationId: number, startAfter: number, endBefore: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(
    and(eq(bookings.locationId, locationId), gte(bookings.startTime, startAfter), lte(bookings.endTime, endBefore), ne(bookings.status, "cancelled"))
  );
}

export async function getAllBookings(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(limit);
}

export async function updateBookingStatus(id: number, status: "confirmed" | "checked_in" | "completed" | "cancelled" | "no_show") {
  const db = await getDb();
  if (!db) return;
  await db.update(bookings).set({ status }).where(eq(bookings.id, id));
}

export async function getBookingsWithDetails(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const userBookings = await db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.startTime)).limit(limit);
  const enriched = [];
  for (const b of userBookings) {
    const resource = await getResourceById(b.resourceId);
    const location = await getLocationById(b.locationId);
    enriched.push({ ...b, resourceName: resource?.name ?? `Resource #${b.resourceId}`, resourceType: resource?.type ?? "desk", locationName: location?.name ?? `Location #${b.locationId}`, locationCity: location?.city ?? "" });
  }
  return enriched;
}

// ─── Day Multipliers ───
export async function getMultiplierForDay(locationId: number, dayOfWeek: number) {
  const db = await getDb();
  if (!db) return 1.0;
  const result = await db.select().from(dayMultipliers).where(
    and(eq(dayMultipliers.locationId, locationId), eq(dayMultipliers.dayOfWeek, dayOfWeek), eq(dayMultipliers.isActive, true))
  ).limit(1);
  return result[0] ? parseFloat(result[0].multiplier) : 1.0;
}

export async function getMultipliersForLocation(locationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dayMultipliers).where(eq(dayMultipliers.locationId, locationId)).orderBy(asc(dayMultipliers.dayOfWeek));
}

// ─── Visitors ───
export async function createVisitor(data: {
  invitedByUserId: number; companyId?: number; name: string; email?: string; phone?: string;
  licensePlate?: string; visitDate: number; locationId: number; accessToken: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(visitors).values(data);
}

export async function getVisitorsByLocation(locationId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(visitors).where(eq(visitors.locationId, locationId)).orderBy(desc(visitors.visitDate)).limit(limit);
}

export async function getVisitorsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(visitors).where(eq(visitors.invitedByUserId, userId)).orderBy(desc(visitors.visitDate));
}

export async function updateVisitorStatus(id: number, status: "invited" | "checked_in" | "checked_out" | "cancelled") {
  const db = await getDb();
  if (!db) return;
  await db.update(visitors).set({ status }).where(eq(visitors.id, id));
}

// ─── Company Branding ───
export async function getBrandingByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companyBranding).where(eq(companyBranding.companyId, companyId)).limit(1);
  return result[0];
}

export async function upsertBranding(companyId: number, data: { logoUrl?: string; primaryColor?: string; secondaryColor?: string; welcomeMessage?: string; backgroundImageUrl?: string }) {
  const db = await getDb();
  if (!db) return;
  const existing = await getBrandingByCompany(companyId);
  if (existing) {
    await db.update(companyBranding).set(data).where(eq(companyBranding.companyId, companyId));
  } else {
    await db.insert(companyBranding).values({ companyId, ...data });
  }
}

// ─── Employee Photos ───
export async function getEmployeePhotosByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employeePhotos).where(eq(employeePhotos.companyId, companyId));
}

// ─── Devices ───
export async function getDevicesByLocation(locationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(devices).where(eq(devices.locationId, locationId)).orderBy(asc(devices.name));
}

export async function getDeviceStats() {
  const db = await getDb();
  if (!db) return { total: 0, online: 0, offline: 0 };
  const result = await db.select({
    total: sql<number>`COUNT(*)`,
    online: sql<number>`SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END)`,
    offline: sql<number>`SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END)`,
  }).from(devices);
  return result[0] ?? { total: 0, online: 0, offline: 0 };
}

export async function getSensorsByDevice(deviceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sensors).where(eq(sensors.deviceId, deviceId));
}

export async function getSensorStats() {
  const db = await getDb();
  if (!db) return { total: 0, active: 0 };
  const result = await db.select({
    total: sql<number>`COUNT(*)`,
    active: sql<number>`SUM(CASE WHEN isActive = true THEN 1 ELSE 0 END)`,
  }).from(sensors);
  return result[0] ?? { total: 0, active: 0 };
}

// ─── Access Log ───
export async function getAccessLogByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accessLog).where(eq(accessLog.userId, userId)).orderBy(desc(accessLog.createdAt)).limit(limit);
}

export async function getAccessLogByLocation(locationId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accessLog).where(eq(accessLog.locationId, locationId)).orderBy(desc(accessLog.createdAt)).limit(limit);
}

export async function createAccessLogEntry(data: {
  userId?: number; resourceId?: number; locationId: number; zone?: string; action: string; method?: string; saltoEventId?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(accessLog).values(data as any);
}

// ─── Notifications ───
export async function getNotificationsForUser(userId: number | null, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  if (userId) {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
  }
  return db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function createNotification(data: { userId?: number; type: string; title: string; message?: string; metadata?: any }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data as any);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

// ─── Invites ───
export async function createInvite(data: { email?: string; phone?: string; companyId?: number; invitedByUserId: number; role?: string; token: string; expiresAt: Date }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(invites).values(data as any);
}

export async function getInvitesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invites).where(eq(invites.invitedByUserId, userId)).orderBy(desc(invites.createdAt));
}

export async function getInviteByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invites).where(eq(invites.token, token)).limit(1);
  return result[0];
}

export async function updateInviteStatus(id: number, status: "pending" | "accepted" | "expired") {
  const db = await getDb();
  if (!db) return;
  await db.update(invites).set({ status }).where(eq(invites.id, id));
}

// ─── Dashboard Stats (Enhanced) ───
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalCompanies: 0, totalBookings: 0, totalResources: 0, totalDevices: 0, devicesOnline: 0, totalSensors: 0 };

  const [userCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
  const [companyCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(companies).where(eq(companies.isActive, true));
  const [bookingCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(bookings);
  const [resourceCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(resources).where(eq(resources.isActive, true));
  const deviceStats = await getDeviceStats();
  const sensorStats = await getSensorStats();

  return {
    totalUsers: userCount?.count ?? 0,
    totalCompanies: companyCount?.count ?? 0,
    totalBookings: bookingCount?.count ?? 0,
    totalResources: resourceCount?.count ?? 0,
    totalDevices: deviceStats.total,
    devicesOnline: deviceStats.online,
    totalSensors: sensorStats.total,
    sensorsActive: sensorStats.active,
  };
}

export async function getBookingsByDayOfWeek() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    dayOfWeek: sql<number>`DAYOFWEEK(FROM_UNIXTIME(startTime / 1000))`,
    count: sql<number>`COUNT(*)`,
    totalCredits: sql<number>`COALESCE(SUM(creditsCost), 0)`,
  }).from(bookings).where(ne(bookings.status, "cancelled")).groupBy(sql`DAYOFWEEK(FROM_UNIXTIME(startTime / 1000))`);
}

export async function getResourceTypeDistribution() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    type: resources.type,
    count: sql<number>`COUNT(*)`,
  }).from(resources).where(eq(resources.isActive, true)).groupBy(resources.type);
}

export async function getRecentBookings(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const recent = await db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(limit);
  const enriched = [];
  for (const b of recent) {
    const resource = await getResourceById(b.resourceId);
    const location = await getLocationById(b.locationId);
    const user = await getUserById(b.userId);
    enriched.push({
      ...b,
      resourceName: resource?.name ?? `Resource #${b.resourceId}`,
      resourceType: resource?.type ?? "desk",
      locationName: location?.name ?? `Location #${b.locationId}`,
      userName: user?.name ?? `User #${b.userId}`,
    });
  }
  return enriched;
}

export async function getLocationBookingStats() {
  const db = await getDb();
  if (!db) return [];
  const locs = await getAllLocations();
  const stats = [];
  for (const loc of locs) {
    const [bookingCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(bookings).where(eq(bookings.locationId, loc.id));
    const [resourceCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(resources).where(and(eq(resources.locationId, loc.id), eq(resources.isActive, true)));
    const [revenue] = await db.select({ total: sql<number>`COALESCE(SUM(creditsCost), 0)` }).from(bookings).where(and(eq(bookings.locationId, loc.id), ne(bookings.status, "cancelled")));
    stats.push({
      locationId: loc.id,
      locationName: loc.name,
      city: loc.city,
      totalBookings: bookingCount?.count ?? 0,
      totalResources: resourceCount?.count ?? 0,
      totalRevenue: revenue?.total ?? 0,
      occupancyRate: resourceCount?.count ? Math.min(95, Math.round(((bookingCount?.count ?? 0) / (resourceCount?.count * 30)) * 100)) : 0,
    });
  }
  return stats;
}

// ─── CRM: Leads ───
export async function getCrmLeads(filters?: { stage?: string; source?: string; search?: string; assignedToUserId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (filters?.stage) conditions.push(eq(crmLeads.stage, filters.stage as any));
  if (filters?.source) conditions.push(eq(crmLeads.source, filters.source as any));
  if (filters?.assignedToUserId) conditions.push(eq(crmLeads.assignedToUserId, filters.assignedToUserId));
  if (filters?.search) conditions.push(or(like(crmLeads.companyName, `%${filters.search}%`), like(crmLeads.contactName, `%${filters.search}%`), like(crmLeads.contactEmail, `%${filters.search}%`)));
  return db.select().from(crmLeads).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(crmLeads.updatedAt)).limit(200);
}

export async function getCrmLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(crmLeads).where(eq(crmLeads.id, id)).limit(1);
  return result[0];
}

export async function createCrmLead(data: InsertCrmLead) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(crmLeads).values(data);
  return result[0]?.insertId;
}

export async function updateCrmLead(id: number, data: Partial<InsertCrmLead>) {
  const db = await getDb();
  if (!db) return;
  await db.update(crmLeads).set(data).where(eq(crmLeads.id, id));
}

export async function deleteCrmLead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(crmLeads).where(eq(crmLeads.id, id));
}

export async function getCrmLeadsByStage() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    stage: crmLeads.stage,
    count: sql<number>`COUNT(*)`,
    totalValue: sql<number>`COALESCE(SUM(estimatedValue), 0)`,
  }).from(crmLeads).groupBy(crmLeads.stage);
}

// ─── CRM: Lead Activities ───
export async function getCrmLeadActivities(leadId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crmLeadActivities).where(eq(crmLeadActivities.leadId, leadId)).orderBy(desc(crmLeadActivities.createdAt)).limit(limit);
}

export async function addCrmLeadActivity(data: { leadId: number; userId?: number; type: string; title: string; description?: string; metadata?: any }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(crmLeadActivities).values(data as any);
}

// ─── CRM: Campaigns ───
export async function getCrmCampaigns(filters?: { status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (filters?.status) conditions.push(eq(crmCampaigns.status, filters.status as any));
  return db.select().from(crmCampaigns).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(crmCampaigns.updatedAt)).limit(100);
}

export async function getCrmCampaignById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(crmCampaigns).where(eq(crmCampaigns.id, id)).limit(1);
  return result[0];
}

export async function createCrmCampaign(data: InsertCrmCampaign) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(crmCampaigns).values(data);
  return result[0]?.insertId;
}

export async function updateCrmCampaign(id: number, data: Partial<InsertCrmCampaign>) {
  const db = await getDb();
  if (!db) return;
  await db.update(crmCampaigns).set(data).where(eq(crmCampaigns.id, id));
}

// ─── CRM: Campaign Steps ───
export async function getCrmCampaignSteps(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crmCampaignSteps).where(eq(crmCampaignSteps.campaignId, campaignId)).orderBy(asc(crmCampaignSteps.stepOrder));
}

export async function createCrmCampaignStep(data: { campaignId: number; stepOrder: number; delayDays?: number; subject?: string; body?: string; isAiGenerated?: boolean }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(crmCampaignSteps).values(data);
}

export async function updateCrmCampaignStep(id: number, data: { subject?: string; body?: string; delayDays?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.update(crmCampaignSteps).set(data).where(eq(crmCampaignSteps.id, id));
}

export async function deleteCrmCampaignStep(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(crmCampaignSteps).where(eq(crmCampaignSteps.id, id));
}

// ─── CRM: Campaign Enrollments ───
export async function getCrmCampaignEnrollments(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  const enrollments = await db.select().from(crmCampaignEnrollments).where(eq(crmCampaignEnrollments.campaignId, campaignId)).orderBy(desc(crmCampaignEnrollments.enrolledAt));
  const enriched = [];
  for (const e of enrollments) {
    const lead = await getCrmLeadById(e.leadId);
    enriched.push({ ...e, leadName: lead?.companyName ?? "Unknown", contactName: lead?.contactName ?? "" });
  }
  return enriched;
}

export async function enrollLeadInCampaign(campaignId: number, leadId: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(crmCampaignEnrollments).values({ campaignId, leadId, status: "active" });
  // Update campaign total leads count
  const campaign = await getCrmCampaignById(campaignId);
  if (campaign) {
    await db.update(crmCampaigns).set({ totalLeads: (campaign.totalLeads ?? 0) + 1 }).where(eq(crmCampaigns.id, campaignId));
  }
}

// ─── CRM: Email Templates ───
export async function getCrmEmailTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crmEmailTemplates).orderBy(desc(crmEmailTemplates.updatedAt));
}

export async function createCrmEmailTemplate(data: { name: string; subject: string; body: string; category?: string; isAiGenerated?: boolean; createdByUserId?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(crmEmailTemplates).values(data);
}

export async function updateCrmEmailTemplate(id: number, data: { name?: string; subject?: string; body?: string; category?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(crmEmailTemplates).set(data).where(eq(crmEmailTemplates.id, id));
}

export async function deleteCrmEmailTemplate(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(crmEmailTemplates).where(eq(crmEmailTemplates.id, id));
}

// ─── CRM: Pipeline Stats ───
export async function getCrmPipelineStats() {
  const db = await getDb();
  if (!db) return { totalLeads: 0, totalValue: 0, wonValue: 0, lostCount: 0, conversionRate: 0, avgDealSize: 0, leadsBySource: [], leadsByStage: [] };

  const [totalCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(crmLeads);
  const [totalVal] = await db.select({ total: sql<number>`COALESCE(SUM(estimatedValue), 0)` }).from(crmLeads);
  const [wonVal] = await db.select({ total: sql<number>`COALESCE(SUM(estimatedValue), 0)`, count: sql<number>`COUNT(*)` }).from(crmLeads).where(eq(crmLeads.stage, "won"));
  const [lostCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(crmLeads).where(eq(crmLeads.stage, "lost"));

  const leadsBySource = await db.select({
    source: crmLeads.source,
    count: sql<number>`COUNT(*)`,
  }).from(crmLeads).groupBy(crmLeads.source);

  const leadsByStage = await getCrmLeadsByStage();

  const totalLeads = totalCount?.count ?? 0;
  const wonCount = wonVal?.count ?? 0;

  return {
    totalLeads,
    totalValue: totalVal?.total ?? 0,
    wonValue: wonVal?.total ?? 0,
    lostCount: lostCount?.count ?? 0,
    conversionRate: totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0,
    avgDealSize: wonCount > 0 ? Math.round((wonVal?.total ?? 0) / wonCount) : 0,
    leadsBySource,
    leadsByStage,
  };
}
