import {
import { createLogger } from "./_core/logger";

const log = createLogger("Database"); eq, and, gte, lte, desc, sql, asc, like, or, inArray, isNull, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, locations, resources, companies, creditBundles,
  wallets, creditLedger, bookings, dayMultipliers, visitors,
  companyBranding, employeePhotos, devices, sensors, accessLog,
  notifications, invites,
  crmLeads, InsertCrmLead, crmLeadActivities, crmCampaigns, InsertCrmCampaign,
  crmCampaignSteps, crmCampaignEnrollments, crmEmailTemplates,
  crmTriggers, InsertCrmTrigger, crmTriggerLogs,
  crmWebsiteVisitors, InsertCrmWebsiteVisitor,
  memberProfiles, InsertMemberProfile,
  reengagementFunnel, InsertReengagementEntry,
  creditPackages, InsertCreditPackage,
  budgetControls, InsertBudgetControl,
  commitContracts, InsertCommitContract,
  creditBonuses, InsertCreditBonus,
  walletTransactions, InsertWalletTransaction,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      log.warn("Failed to connect", { error: String(error) });
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
  else if (user.openId === ENV.ownerOpenId) { values.role = 'administrator'; updateSet.role = 'administrator'; }
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

export async function updateUserRole(userId: number, role: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role: role as any }).where(eq(users.id, userId));
}

export async function getAllUsersWithRoles() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    avatarUrl: users.avatarUrl,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users).orderBy(desc(users.createdAt));
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

// ─── Resource Types ───
import {
  resourceTypes, InsertResourceType, resourceRates, InsertResourceRate,
  resourceRules, InsertResourceRule, resourceCategories, bookingPolicies, InsertBookingPolicy,
  resourceAmenities, resourceAmenityMap, resourceSchedules, resourceBlockedDates,
} from "../drizzle/schema";

export async function getResourceTypes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resourceTypes).where(eq(resourceTypes.isActive, true)).orderBy(asc(resourceTypes.name));
}

export async function getResourceTypeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(resourceTypes).where(eq(resourceTypes.id, id)).limit(1);
  return result[0];
}

export async function createResourceType(data: InsertResourceType) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(resourceTypes).values(data);
  return result[0]?.insertId;
}

export async function updateResourceType(id: number, data: Partial<InsertResourceType>) {
  const db = await getDb();
  if (!db) return;
  await db.update(resourceTypes).set(data).where(eq(resourceTypes.id, id));
}

export async function deleteResourceType(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(resourceTypes).set({ isActive: false }).where(eq(resourceTypes.id, id));
}

// ─── Resource Rates ───
export async function getResourceRates(resourceTypeId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(resourceRates.isActive, true)];
  if (resourceTypeId) conditions.push(eq(resourceRates.resourceTypeId, resourceTypeId));
  return db.select().from(resourceRates).where(and(...conditions)).orderBy(asc(resourceRates.sortOrder));
}

export async function getResourceRateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(resourceRates).where(eq(resourceRates.id, id)).limit(1);
  return result[0];
}

export async function createResourceRate(data: InsertResourceRate) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(resourceRates).values(data);
  return result[0]?.insertId;
}

export async function updateResourceRate(id: number, data: Partial<InsertResourceRate>) {
  const db = await getDb();
  if (!db) return;
  await db.update(resourceRates).set(data).where(eq(resourceRates.id, id));
}

export async function deleteResourceRate(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(resourceRates).set({ isActive: false }).where(eq(resourceRates.id, id));
}

// ─── Resource Rules ───
export async function getResourceRules(scope?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(resourceRules.isActive, true)];
  if (scope) conditions.push(eq(resourceRules.scope, scope as any));
  return db.select().from(resourceRules).where(and(...conditions)).orderBy(asc(resourceRules.evaluationOrder));
}

export async function getResourceRuleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(resourceRules).where(eq(resourceRules.id, id)).limit(1);
  return result[0];
}

export async function createResourceRule(data: InsertResourceRule) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(resourceRules).values(data);
  return result[0]?.insertId;
}

export async function updateResourceRule(id: number, data: Partial<InsertResourceRule>) {
  const db = await getDb();
  if (!db) return;
  await db.update(resourceRules).set(data).where(eq(resourceRules.id, id));
}

export async function deleteResourceRule(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(resourceRules).set({ isActive: false }).where(eq(resourceRules.id, id));
}

// ─── Resource Categories ───
export async function getResourceCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resourceCategories).where(eq(resourceCategories.isActive, true)).orderBy(asc(resourceCategories.sortOrder));
}

// ─── Booking Policies ───
export async function getBookingPolicies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookingPolicies).where(eq(bookingPolicies.isActive, true)).orderBy(asc(bookingPolicies.name));
}

export async function getBookingPolicyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookingPolicies).where(eq(bookingPolicies.id, id)).limit(1);
  return result[0];
}

export async function createBookingPolicy(data: InsertBookingPolicy) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(bookingPolicies).values(data);
  return result[0]?.insertId;
}

export async function updateBookingPolicy(id: number, data: Partial<InsertBookingPolicy>) {
  const db = await getDb();
  if (!db) return;
  await db.update(bookingPolicies).set(data).where(eq(bookingPolicies.id, id));
}

export async function deleteBookingPolicy(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(bookingPolicies).set({ isActive: false }).where(eq(bookingPolicies.id, id));
}

// ─── Resource Amenities ───
export async function getResourceAmenities() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resourceAmenities).where(eq(resourceAmenities.isActive, true)).orderBy(asc(resourceAmenities.name));
}

export async function getAmenitiesForResource(resourceId: number) {
  const db = await getDb();
  if (!db) return [];
  const maps = await db.select().from(resourceAmenityMap).where(eq(resourceAmenityMap.resourceId, resourceId));
  if (maps.length === 0) return [];
  const amenityIds = maps.map(m => m.amenityId);
  return db.select().from(resourceAmenities).where(inArray(resourceAmenities.id, amenityIds));
}

export async function setResourceAmenities(resourceId: number, amenityIds: number[]) {
  const db = await getDb();
  if (!db) return;
  await db.delete(resourceAmenityMap).where(eq(resourceAmenityMap.resourceId, resourceId));
  for (const amenityId of amenityIds) {
    await db.insert(resourceAmenityMap).values({ resourceId, amenityId });
  }
}

// ─── Resource Schedules ───
export async function getResourceSchedules(locationId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(resourceSchedules.isActive, true)];
  if (locationId) conditions.push(eq(resourceSchedules.locationId, locationId));
  return db.select().from(resourceSchedules).where(and(...conditions)).orderBy(asc(resourceSchedules.dayOfWeek));
}

export async function updateResourceSchedule(id: number, data: { openTime?: string; closeTime?: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) return;
  await db.update(resourceSchedules).set(data).where(eq(resourceSchedules.id, id));
}

export async function createResourceSchedule(data: { resourceId?: number; resourceTypeId?: number; locationId?: number; dayOfWeek: number; openTime: string; closeTime: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(resourceSchedules).values(data);
}

// ─── Resource Blocked Dates ───
export async function getBlockedDates(locationId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (locationId) {
    return db.select().from(resourceBlockedDates).where(eq(resourceBlockedDates.locationId, locationId)).orderBy(desc(resourceBlockedDates.startDate));
  }
  return db.select().from(resourceBlockedDates).orderBy(desc(resourceBlockedDates.startDate));
}

export async function createBlockedDate(data: { resourceId?: number; locationId?: number; startDate: number; endDate: number; reason?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(resourceBlockedDates).values(data);
}

export async function deleteBlockedDate(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(resourceBlockedDates).where(eq(resourceBlockedDates.id, id));
}

// ─── CRM: Triggers ───
export async function getCrmTriggers(filters?: { isActive?: boolean; eventType?: string }) {
  const db = await getDb();
  if (!db) return [];
  let q = db.select().from(crmTriggers).orderBy(desc(crmTriggers.createdAt));
  const rows = await q;
  let result = rows;
  if (filters?.isActive !== undefined) result = result.filter(r => r.isActive === filters.isActive);
  if (filters?.eventType) result = result.filter(r => r.eventType === filters.eventType);
  return result;
}

export async function getCrmTriggerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(crmTriggers).where(eq(crmTriggers.id, id));
  return rows[0] || null;
}

export async function createCrmTrigger(data: InsertCrmTrigger) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(crmTriggers).values(data);
  return result.insertId;
}

export async function updateCrmTrigger(id: number, data: Partial<InsertCrmTrigger>) {
  const db = await getDb();
  if (!db) return;
  await db.update(crmTriggers).set(data).where(eq(crmTriggers.id, id));
}

export async function deleteCrmTrigger(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(crmTriggers).where(eq(crmTriggers.id, id));
}

export async function addCrmTriggerLog(data: { triggerId: number; leadId?: number; eventData?: any; actionsExecuted?: any; status?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(crmTriggerLogs).values(data as any);
  await db.update(crmTriggers).set({ executionCount: sql`execution_count + 1`, lastExecutedAt: new Date() } as any).where(eq(crmTriggers.id, data.triggerId));
}

export async function getCrmTriggerLogs(triggerId?: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  let q = db.select().from(crmTriggerLogs).orderBy(desc(crmTriggerLogs.executedAt)).limit(limit);
  if (triggerId) {
    return db.select().from(crmTriggerLogs).where(eq(crmTriggerLogs.triggerId, triggerId)).orderBy(desc(crmTriggerLogs.executedAt)).limit(limit);
  }
  return q;
}

// ─── CRM: Website Visitors ───
export async function getCrmWebsiteVisitors(filters?: { status?: string; isIdentified?: boolean }, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(crmWebsiteVisitors).orderBy(desc(crmWebsiteVisitors.lastVisitAt)).limit(limit);
  let result = rows;
  if (filters?.status) result = result.filter(r => r.status === filters.status);
  if (filters?.isIdentified !== undefined) result = result.filter(r => r.isIdentified === filters.isIdentified);
  return result;
}

export async function createCrmWebsiteVisitor(data: InsertCrmWebsiteVisitor) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(crmWebsiteVisitors).values(data);
  return result.insertId;
}

export async function updateCrmWebsiteVisitor(id: number, data: Partial<InsertCrmWebsiteVisitor>) {
  const db = await getDb();
  if (!db) return;
  await db.update(crmWebsiteVisitors).set(data).where(eq(crmWebsiteVisitors.id, id));
}

// ─── Member Profiles ───
export async function getMemberProfiles(filters?: { tier?: string; search?: string; isActive?: boolean; tags?: string[] }, limit = 200) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(memberProfiles).orderBy(desc(memberProfiles.createdAt)).limit(limit);
  let result = rows;
  if (filters?.tier) result = result.filter(r => r.tier === filters.tier);
  if (filters?.isActive !== undefined) result = result.filter(r => r.isActive === filters.isActive);
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(r =>
      r.displayName.toLowerCase().includes(s) ||
      (r.companyName && r.companyName.toLowerCase().includes(s)) ||
      (r.email && r.email.toLowerCase().includes(s))
    );
  }
  if (filters?.tags?.length) {
    result = result.filter(r => r.tags && filters.tags!.some(t => (r.tags as string[]).includes(t)));
  }
  return result;
}

export async function getMemberProfileById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(memberProfiles).where(eq(memberProfiles.id, id));
  return rows[0] || null;
}

export async function createMemberProfile(data: InsertMemberProfile) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(memberProfiles).values(data);
  return result.insertId;
}

export async function updateMemberProfile(id: number, data: Partial<InsertMemberProfile>) {
  const db = await getDb();
  if (!db) return;
  await db.update(memberProfiles).set(data).where(eq(memberProfiles.id, id));
}

export async function deleteMemberProfile(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(memberProfiles).where(eq(memberProfiles.id, id));
}

export async function getMemberStats() {
  const db = await getDb();
  if (!db) return { total: 0, gebaloteerd: 0, vergaderen: 0, prospect: 0, active: 0 };
  const rows = await db.select().from(memberProfiles);
  return {
    total: rows.length,
    gebaloteerd: rows.filter(r => r.tier === "gebaloteerd").length,
    vergaderen: rows.filter(r => r.tier === "vergaderen").length,
    prospect: rows.filter(r => r.tier === "prospect").length,
    active: rows.filter(r => r.isActive).length,
  };
}

// ─── Re-engagement Funnel ───
export async function getReengagementEntries(filters?: { stage?: string }, limit = 200) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(reengagementFunnel).orderBy(desc(reengagementFunnel.createdAt)).limit(limit);
  if (filters?.stage) return rows.filter(r => r.stage === filters.stage);
  return rows;
}

export async function createReengagementEntry(data: InsertReengagementEntry) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(reengagementFunnel).values(data);
  return result.insertId;
}

export async function updateReengagementEntry(id: number, data: Partial<InsertReengagementEntry>) {
  const db = await getDb();
  if (!db) return;
  await db.update(reengagementFunnel).set(data).where(eq(reengagementFunnel.id, id));
}

export async function getReengagementStats() {
  const db = await getDb();
  if (!db) return { total: 0, identified: 0, invited: 0, opened: 0, applied: 0, accepted: 0, declined: 0 };
  const rows = await db.select().from(reengagementFunnel);
  const stages = ["identified", "invited", "opened", "applied", "interview", "accepted", "declined"] as const;
  const stats: Record<string, number> = { total: rows.length };
  stages.forEach(s => { stats[s] = rows.filter(r => r.stage === s).length; });
  return stats;
}


// ═══════════════════════════════════════════════════════════════════════
// ─── ROZ HUUROVEREENKOMSTEN ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
import {
  rozPricingTiers, InsertRozPricingTier,
  rozContracts, InsertRozContract,
  rozInvoices, InsertRozInvoice,
} from "../drizzle/schema";

// ─── ROZ Pricing Tiers ───
export async function getRozPricingTiers(filters?: { resourceId?: number; locationId?: number; resourceTypeId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(rozPricingTiers.isActive, true)];
  if (filters?.resourceId) conditions.push(eq(rozPricingTiers.resourceId, filters.resourceId));
  if (filters?.locationId) conditions.push(eq(rozPricingTiers.locationId, filters.locationId));
  if (filters?.resourceTypeId) conditions.push(eq(rozPricingTiers.resourceTypeId, filters.resourceTypeId));
  return db.select().from(rozPricingTiers).where(and(...conditions)).orderBy(asc(rozPricingTiers.sortOrder));
}

export async function getRozPricingTierById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(rozPricingTiers).where(eq(rozPricingTiers.id, id)).limit(1);
  return result[0];
}

export async function createRozPricingTier(data: InsertRozPricingTier) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(rozPricingTiers).values(data);
  return result[0]?.insertId;
}

export async function updateRozPricingTier(id: number, data: Partial<InsertRozPricingTier>) {
  const db = await getDb();
  if (!db) return;
  await db.update(rozPricingTiers).set(data).where(eq(rozPricingTiers.id, id));
}

export async function deleteRozPricingTier(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(rozPricingTiers).set({ isActive: false }).where(eq(rozPricingTiers.id, id));
}

// ─── ROZ Contracts ───
export async function getRozContracts(filters?: { status?: string; resourceId?: number; companyId?: number; userId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(rozContracts).orderBy(desc(rozContracts.createdAt));
  let result = rows;
  if (filters?.status) result = result.filter(r => r.status === filters.status);
  if (filters?.resourceId) result = result.filter(r => r.resourceId === filters.resourceId);
  if (filters?.companyId) result = result.filter(r => r.companyId === filters.companyId);
  if (filters?.userId) result = result.filter(r => r.userId === filters.userId);
  return result;
}

export async function getRozContractById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(rozContracts).where(eq(rozContracts.id, id)).limit(1);
  return result[0];
}

export async function createRozContract(data: InsertRozContract) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(rozContracts).values(data);
  return result[0]?.insertId;
}

export async function updateRozContract(id: number, data: Partial<InsertRozContract>) {
  const db = await getDb();
  if (!db) return;
  await db.update(rozContracts).set(data).where(eq(rozContracts.id, id));
}

// ─── ROZ Invoices ───
export async function getRozInvoices(filters?: { contractId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(rozInvoices).orderBy(desc(rozInvoices.createdAt));
  let result = rows;
  if (filters?.contractId) result = result.filter(r => r.contractId === filters.contractId);
  if (filters?.status) result = result.filter(r => r.status === filters.status);
  return result;
}

export async function getRozInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(rozInvoices).where(eq(rozInvoices.id, id)).limit(1);
  return result[0];
}

export async function createRozInvoice(data: InsertRozInvoice) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(rozInvoices).values(data);
  return result[0]?.insertId;
}

export async function updateRozInvoice(id: number, data: Partial<InsertRozInvoice>) {
  const db = await getDb();
  if (!db) return;
  await db.update(rozInvoices).set(data).where(eq(rozInvoices.id, id));
}

// ─── ROZ Resource Update (set ROZ fields on a resource) ───
export async function updateResourceRozSettings(resourceId: number, data: {
  areaM2?: string; isRozEligible?: boolean; rozContractType?: string;
  rozServiceChargeModel?: string; rozVatRate?: string; rozIndexation?: string;
  rozIndexationPct?: string; rozTenantProtection?: boolean;
  rozMinLeaseTerm?: number; rozNoticePeriodMonths?: number;
}) {
  const db = await getDb();
  if (!db) return;
  const updateSet: Record<string, unknown> = {};
  if (data.areaM2 !== undefined) {
    updateSet.areaM2 = data.areaM2;
    // Auto-set ROZ eligibility based on area >= 100m²
    updateSet.isRozEligible = parseFloat(data.areaM2) >= 100;
  }
  if (data.isRozEligible !== undefined) updateSet.isRozEligible = data.isRozEligible;
  if (data.rozContractType !== undefined) updateSet.rozContractType = data.rozContractType;
  if (data.rozServiceChargeModel !== undefined) updateSet.rozServiceChargeModel = data.rozServiceChargeModel;
  if (data.rozVatRate !== undefined) updateSet.rozVatRate = data.rozVatRate;
  if (data.rozIndexation !== undefined) updateSet.rozIndexation = data.rozIndexation;
  if (data.rozIndexationPct !== undefined) updateSet.rozIndexationPct = data.rozIndexationPct;
  if (data.rozTenantProtection !== undefined) updateSet.rozTenantProtection = data.rozTenantProtection;
  if (data.rozMinLeaseTerm !== undefined) updateSet.rozMinLeaseTerm = data.rozMinLeaseTerm;
  if (data.rozNoticePeriodMonths !== undefined) updateSet.rozNoticePeriodMonths = data.rozNoticePeriodMonths;
  if (Object.keys(updateSet).length > 0) {
    await db.update(resources).set(updateSet).where(eq(resources.id, resourceId));
  }
}

// ─── ROZ Stats ───
export async function getRozStats() {
  const db = await getDb();
  if (!db) return { totalContracts: 0, activeContracts: 0, totalMonthlyRevenue: 0, rozEligibleResources: 0 };
  const contracts = await db.select().from(rozContracts);
  const rozResources = await db.select().from(resources).where(eq(resources.isRozEligible, true));
  const active = contracts.filter(c => c.status === "active");
  const monthlyRevenue = active.reduce((sum, c) => sum + parseFloat(c.monthlyRentCredits) + parseFloat(c.monthlyServiceCharge || "0"), 0);
  return {
    totalContracts: contracts.length,
    activeContracts: active.length,
    totalMonthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
    rozEligibleResources: rozResources.length,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// CREDIT SYSTEM UPGRADE
// ═══════════════════════════════════════════════════════════════════════

// ─── Credit Packages CRUD ───────────────────────────────────────────
export async function getCreditPackages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditPackages).where(eq(creditPackages.isActive, true)).orderBy(asc(creditPackages.sortOrder));
}

export async function getCreditPackageById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(creditPackages).where(eq(creditPackages.id, id)).limit(1);
  return result[0];
}

export async function getCreditPackageBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(creditPackages).where(eq(creditPackages.slug, slug)).limit(1);
  return result[0];
}

export async function createCreditPackage(data: InsertCreditPackage) {
  const db = await getDb();
  if (!db) return;
  await db.insert(creditPackages).values(data);
}

export async function updateCreditPackage(id: number, data: Partial<InsertCreditPackage>) {
  const db = await getDb();
  if (!db) return;
  const updateSet: Record<string, unknown> = {};
  if (data.name !== undefined) updateSet.name = data.name;
  if (data.slug !== undefined) updateSet.slug = data.slug;
  if (data.credits !== undefined) updateSet.credits = data.credits;
  if (data.priceEur !== undefined) updateSet.priceEur = data.priceEur;
  if (data.pricePerCredit !== undefined) updateSet.pricePerCredit = data.pricePerCredit;
  if (data.discountPercent !== undefined) updateSet.discountPercent = data.discountPercent;
  if (data.description !== undefined) updateSet.description = data.description;
  if (data.features !== undefined) updateSet.features = data.features;
  if (data.isActive !== undefined) updateSet.isActive = data.isActive;
  if (data.sortOrder !== undefined) updateSet.sortOrder = data.sortOrder;
  if (Object.keys(updateSet).length > 0) {
    await db.update(creditPackages).set(updateSet).where(eq(creditPackages.id, id));
  }
}

export async function deleteCreditPackage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(creditPackages).set({ isActive: false }).where(eq(creditPackages.id, id));
}

// ─── Core Credit Consumption (FIFO: expiring first, then permanent) ─
export async function consumeCredits(
  walletId: number,
  amount: number,
  description: string,
  referenceType?: string,
  referenceId?: number,
  multiplier?: number,
): Promise<{ newBalance: string; newPermanentBalance: string; totalConsumed: number; fromExpiring: number; fromPermanent: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const wallet = await getWalletById(walletId);
  if (!wallet) throw new Error("Wallet not found");

  let expiringBalance = parseFloat(wallet.balance);
  let permBalance = parseFloat(wallet.permanentBalance ?? "0");
  const totalAvailable = expiringBalance + permBalance;

  if (totalAvailable < amount) {
    // Check auto top-up before failing
    if (wallet.autoTopUpEnabled && wallet.autoTopUpAmount) {
      const topUpAmt = parseFloat(wallet.autoTopUpAmount);
      permBalance += topUpAmt;
      await db.update(wallets).set({ permanentBalance: permBalance.toFixed(2) }).where(eq(wallets.id, walletId));
      await db.insert(creditLedger).values({
        walletId,
        type: "topup",
        amount: topUpAmt.toFixed(2),
        balanceAfter: (expiringBalance + permBalance).toFixed(2),
        description: `Auto top-up triggered (${topUpAmt} credits)`,
        source: "topup",
      });
      await db.insert(notifications).values({
        userId: wallet.type === "personal" ? wallet.ownerId : null,
        type: "auto_topup_triggered",
        title: "Auto Top-Up Triggered",
        message: `${topUpAmt} credits were automatically added to your wallet.`,
        metadata: JSON.stringify({ walletId, amount: topUpAmt }),
      });
    }

    // Re-check after potential top-up
    const updatedTotal = expiringBalance + permBalance;
    if (updatedTotal < amount) {
      throw new Error(`Insufficient credits. Need ${amount.toFixed(1)}, have ${updatedTotal.toFixed(1)}`);
    }
  }

  // FIFO deduction: expiring credits first
  let fromExpiring = 0;
  let fromPermanent = 0;

  if (expiringBalance >= amount) {
    fromExpiring = amount;
    expiringBalance -= amount;
  } else {
    fromExpiring = expiringBalance;
    fromPermanent = amount - expiringBalance;
    expiringBalance = 0;
    permBalance -= fromPermanent;
  }

  const newBalance = expiringBalance.toFixed(2);
  const newPermBalance = permBalance.toFixed(2);
  const currentMonthlySpent = parseFloat(wallet.monthlySpent ?? "0") + amount;

  await db.update(wallets).set({
    balance: newBalance,
    permanentBalance: newPermBalance,
    monthlySpent: currentMonthlySpent.toFixed(2),
  }).where(eq(wallets.id, walletId));

  await db.insert(creditLedger).values({
    walletId,
    type: "spend",
    amount: (-amount).toFixed(2),
    balanceAfter: (expiringBalance + permBalance).toFixed(2),
    description,
    referenceType,
    referenceId,
    multiplier: multiplier?.toFixed(2),
    source: fromPermanent > 0 ? "package" : "subscription",
  });

  // Check threshold alerts
  await checkCreditThreshold(walletId);

  return { newBalance, newPermanentBalance: newPermBalance, totalConsumed: amount, fromExpiring, fromPermanent };
}

// ─── Purchase Credit Package ────────────────────────────────────────
export async function purchasePackage(walletId: number, packageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const pkg = await getCreditPackageById(packageId);
  if (!pkg) throw new Error("Credit package not found");

  const wallet = await getWalletById(walletId);
  if (!wallet) throw new Error("Wallet not found");

  const currentPerm = parseFloat(wallet.permanentBalance ?? "0");
  const newPermBalance = (currentPerm + pkg.credits).toFixed(2);
  const currentBalance = parseFloat(wallet.balance);

  await db.update(wallets).set({ permanentBalance: newPermBalance }).where(eq(wallets.id, walletId));

  await db.insert(creditLedger).values({
    walletId,
    type: "package_purchase",
    amount: pkg.credits.toString(),
    balanceAfter: (currentBalance + currentPerm + pkg.credits).toFixed(2),
    description: `Purchased ${pkg.name} (${pkg.credits} credits)`,
    source: "package",
    packageId,
  });

  return { newPermanentBalance: newPermBalance, creditsAdded: pkg.credits, packageName: pkg.name };
}

// ─── Monthly Rollover Processing ────────────────────────────────────
export async function processMonthlyRollover(walletId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const wallet = await getWalletById(walletId);
  if (!wallet) throw new Error("Wallet not found");

  const currentBalance = parseFloat(wallet.balance);
  const rolloverPct = wallet.rolloverPercent ?? 0;
  const maxRollover = wallet.maxRollover ?? 0;

  let rolloverAmount = Math.floor(currentBalance * rolloverPct / 100);
  if (maxRollover > 0) rolloverAmount = Math.min(rolloverAmount, maxRollover);
  const breakageAmount = currentBalance - rolloverAmount;

  // Record breakage (expired credits)
  if (breakageAmount > 0) {
    await db.insert(creditLedger).values({
      walletId,
      type: "expiration",
      amount: (-breakageAmount).toFixed(2),
      balanceAfter: (rolloverAmount + parseFloat(wallet.permanentBalance ?? "0")).toFixed(2),
      description: `Monthly credit expiration: ${breakageAmount.toFixed(1)} credits expired`,
      source: "subscription",
    });
  }

  // Record rollover
  if (rolloverAmount > 0) {
    await db.insert(creditLedger).values({
      walletId,
      type: "rollover",
      amount: rolloverAmount.toFixed(2),
      balanceAfter: (rolloverAmount + parseFloat(wallet.permanentBalance ?? "0")).toFixed(2),
      description: `Rolled over ${rolloverAmount} credits (${rolloverPct}%)`,
      source: "subscription",
    });
  }

  // Calculate new expiration (end of next month)
  const now = new Date();
  const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);

  // Reset balance to rollover + new monthly grant
  const bundle = wallet.bundleId ? await getBundleById(wallet.bundleId) : null;
  const monthlyGrant = bundle?.creditsPerMonth ?? 0;
  const newBalance = (rolloverAmount + monthlyGrant).toFixed(2);

  await db.update(wallets).set({
    balance: newBalance,
    rolloverBalance: rolloverAmount.toFixed(2),
    creditExpiresAt: nextMonthEnd.getTime(),
    monthlySpent: "0",
  }).where(eq(wallets.id, walletId));

  // Grant new monthly credits
  if (monthlyGrant > 0) {
    await db.insert(creditLedger).values({
      walletId,
      type: "grant",
      amount: monthlyGrant.toFixed(2),
      balanceAfter: (parseFloat(newBalance) + parseFloat(wallet.permanentBalance ?? "0")).toFixed(2),
      description: `Monthly credit grant: ${monthlyGrant} credits`,
      source: "subscription",
      expiresAt: nextMonthEnd.getTime(),
    });
  }

  // Notification
  await db.insert(notifications).values({
    userId: wallet.type === "personal" ? wallet.ownerId : null,
    type: "rollover_processed",
    title: "Monthly Credits Processed",
    message: `${rolloverAmount} credits rolled over, ${breakageAmount.toFixed(0)} expired. ${monthlyGrant} new credits granted.`,
    metadata: JSON.stringify({ walletId, rolloverAmount, breakageAmount, monthlyGrant }),
  });

  return { rolloverAmount, breakageAmount, monthlyGrant, newBalance };
}

// ─── Credit Threshold Alerts ────────────────────────────────────────
export async function checkCreditThreshold(walletId: number) {
  const db = await getDb();
  if (!db) return;

  const wallet = await getWalletById(walletId);
  if (!wallet || !wallet.bundleId) return;

  const bundle = await getBundleById(wallet.bundleId);
  if (!bundle) return;

  const monthlySpent = parseFloat(wallet.monthlySpent ?? "0");
  const monthlyAlloc = bundle.creditsPerMonth;
  const usagePct = monthlyAlloc > 0 ? (monthlySpent / monthlyAlloc) * 100 : 0;

  const userId = wallet.type === "personal" ? wallet.ownerId : null;

  if (usagePct >= 100) {
    await db.insert(notifications).values({
      userId,
      type: "credit_threshold_100",
      title: "Credits Fully Used",
      message: `You've used 100% of your monthly ${monthlyAlloc} credits. Additional usage will be charged at the standard rate.`,
      metadata: JSON.stringify({ walletId, usagePct: Math.round(usagePct), monthlySpent }),
    });
  } else if (usagePct >= 80) {
    await db.insert(notifications).values({
      userId,
      type: "credit_threshold_80",
      title: "Credit Usage at 80%",
      message: `You've used ${Math.round(usagePct)}% of your monthly credits (${monthlySpent.toFixed(0)}/${monthlyAlloc}).`,
      metadata: JSON.stringify({ walletId, usagePct: Math.round(usagePct), monthlySpent }),
    });
  }
}

// ─── Bundle by ID ───────────────────────────────────────────────────
export async function getBundleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(creditBundles).where(eq(creditBundles.id, id)).limit(1);
  return result[0];
}

export async function getBundleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(creditBundles).where(eq(creditBundles.slug, slug)).limit(1);
  return result[0];
}

export async function createBundle(data: Partial<InsertCreditBonus> & { name: string; slug: string; creditsPerMonth: number; priceEur: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(creditBundles).values(data as any);
}

export async function updateBundle(id: number, data: Partial<InsertCreditBonus>) {
  const db = await getDb();
  if (!db) return;
  const updateSet: Record<string, unknown> = {};
  const fields = [
    "name", "slug", "creditsPerMonth", "priceEur", "description", "features",
    "isPopular", "isActive", "targetAudience", "contractType", "contractDurationMonths",
    "rolloverPercent", "pricePerCredit", "walletType", "budgetControlLevel", "overageRate",
    "minCommitMonths", "maxRolloverCredits",
  ] as const;
  for (const f of fields) {
    if ((data as any)[f] !== undefined) updateSet[f] = (data as any)[f];
  }
  if (Object.keys(updateSet).length > 0) {
    await db.update(creditBundles).set(updateSet).where(eq(creditBundles.id, id));
  }
}

// ─── Wallet Auto Top-Up Settings ────────────────────────────────────
export async function setWalletAutoTopUp(walletId: number, enabled: boolean, threshold?: string, amount?: string) {
  const db = await getDb();
  if (!db) return;
  const updateSet: Record<string, unknown> = { autoTopUpEnabled: enabled };
  if (threshold !== undefined) updateSet.autoTopUpThreshold = threshold;
  if (amount !== undefined) updateSet.autoTopUpAmount = amount;
  await db.update(wallets).set(updateSet).where(eq(wallets.id, walletId));
}

// ─── Wallet Detailed Balance ────────────────────────────────────────
export async function getWalletDetailedBalance(walletId: number) {
  const db = await getDb();
  if (!db) return null;
  const wallet = await getWalletById(walletId);
  if (!wallet) return null;

  const bundle = wallet.bundleId ? await getBundleById(wallet.bundleId) : null;
  const controls = await getBudgetControlsByWallet(walletId);

  return {
    balance: wallet.balance,
    permanentBalance: wallet.permanentBalance ?? "0",
    totalBalance: (parseFloat(wallet.balance) + parseFloat(wallet.permanentBalance ?? "0")).toFixed(2),
    expiringCredits: wallet.balance,
    creditExpiresAt: wallet.creditExpiresAt,
    rolloverPercent: wallet.rolloverPercent ?? 0,
    maxRollover: wallet.maxRollover ?? 0,
    monthlySpent: wallet.monthlySpent ?? "0",
    monthlyAllocation: bundle?.creditsPerMonth ?? 0,
    autoTopUpEnabled: wallet.autoTopUpEnabled ?? false,
    autoTopUpThreshold: wallet.autoTopUpThreshold,
    autoTopUpAmount: wallet.autoTopUpAmount,
    contractType: wallet.contractType,
    contractEndDate: wallet.contractEndDate,
    bundleName: bundle?.name,
    budgetControls: controls,
  };
}

// ─── Budget Controls CRUD ───────────────────────────────────────────
export async function getBudgetControlsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(budgetControls).where(and(eq(budgetControls.companyId, companyId), eq(budgetControls.isActive, true))).orderBy(asc(budgetControls.controlType));
}

export async function getBudgetControlsByWallet(walletId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(budgetControls).where(and(eq(budgetControls.walletId, walletId), eq(budgetControls.isActive, true)));
}

export async function getBudgetControlForUser(walletId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(budgetControls).where(
    and(eq(budgetControls.walletId, walletId), eq(budgetControls.targetUserId, userId), eq(budgetControls.isActive, true))
  ).limit(1);
  return result[0];
}

export async function createBudgetControl(data: InsertBudgetControl) {
  const db = await getDb();
  if (!db) return;
  await db.insert(budgetControls).values(data);
}

export async function updateBudgetControl(id: number, data: Partial<InsertBudgetControl>) {
  const db = await getDb();
  if (!db) return;
  const updateSet: Record<string, unknown> = {};
  const fields = ["controlType", "targetUserId", "targetTeam", "capAmount", "periodType", "allowedLocationIds", "allowedResourceTypes", "approvalThreshold", "approverUserId", "isActive"] as const;
  for (const f of fields) {
    if ((data as any)[f] !== undefined) updateSet[f] = (data as any)[f];
  }
  if (Object.keys(updateSet).length > 0) {
    await db.update(budgetControls).set(updateSet).where(eq(budgetControls.id, id));
  }
}

export async function deleteBudgetControl(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(budgetControls).set({ isActive: false }).where(eq(budgetControls.id, id));
}

export async function checkBudgetAllowance(
  walletId: number,
  userId: number,
  amount: number,
  resourceType?: string,
  locationId?: number,
): Promise<{ allowed: boolean; reason?: string; remainingBudget: number }> {
  const db = await getDb();
  if (!db) return { allowed: true, remainingBudget: Infinity };

  const controls = await db.select().from(budgetControls).where(
    and(eq(budgetControls.walletId, walletId), eq(budgetControls.isActive, true))
  );

  for (const ctrl of controls) {
    // Per-employee spending cap
    if (ctrl.controlType === "per_employee_cap" && ctrl.capAmount) {
      if (ctrl.targetUserId && ctrl.targetUserId !== userId) continue;
      const cap = parseFloat(ctrl.capAmount);
      const spent = parseFloat(ctrl.currentSpend ?? "0");
      if (spent + amount > cap) {
        return { allowed: false, reason: `Spending cap exceeded. Limit: ${cap}, spent: ${spent.toFixed(1)}, requested: ${amount.toFixed(1)}`, remainingBudget: cap - spent };
      }
    }

    // Location restriction
    if (ctrl.controlType === "location_restriction" && ctrl.allowedLocationIds && locationId) {
      const allowed = ctrl.allowedLocationIds as number[];
      if (!allowed.includes(locationId)) {
        return { allowed: false, reason: `Credits not valid at this location`, remainingBudget: 0 };
      }
    }

    // Resource type restriction
    if (ctrl.controlType === "resource_type_restriction" && ctrl.allowedResourceTypes && resourceType) {
      const allowed = ctrl.allowedResourceTypes as string[];
      if (!allowed.includes(resourceType)) {
        return { allowed: false, reason: `Credits not valid for this resource type`, remainingBudget: 0 };
      }
    }

    // Approval threshold
    if (ctrl.controlType === "approval_threshold" && ctrl.approvalThreshold) {
      const threshold = parseFloat(ctrl.approvalThreshold);
      if (amount > threshold) {
        return { allowed: false, reason: `Booking exceeds ${threshold} credits and requires manager approval`, remainingBudget: threshold };
      }
    }
  }

  return { allowed: true, remainingBudget: Infinity };
}

// ─── Commit Contracts CRUD ──────────────────────────────────────────
export async function getCommitContractsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(commitContracts).where(eq(commitContracts.companyId, companyId)).orderBy(desc(commitContracts.startDate));
}

export async function getCommitContractById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(commitContracts).where(eq(commitContracts.id, id)).limit(1);
  return result[0];
}

export async function createCommitContract(data: InsertCommitContract) {
  const db = await getDb();
  if (!db) return;
  await db.insert(commitContracts).values(data);
}

export async function updateCommitContract(id: number, data: Partial<InsertCommitContract>) {
  const db = await getDb();
  if (!db) return;
  const updateSet: Record<string, unknown> = {};
  const fields = [
    "name", "totalCommitCredits", "totalCommitEur", "commitPeriodMonths",
    "startDate", "endDate", "prepaidAmount", "monthlyAllocation",
    "rampedCommitments", "discountPercent", "trueUpEnabled", "trueUpDate",
    "earlyRenewalBonus", "status", "notes",
  ] as const;
  for (const f of fields) {
    if ((data as any)[f] !== undefined) updateSet[f] = (data as any)[f];
  }
  if (Object.keys(updateSet).length > 0) {
    await db.update(commitContracts).set(updateSet).where(eq(commitContracts.id, id));
  }
}

export async function processCommitDrawdown(contractId: number, amount: number) {
  const db = await getDb();
  if (!db) return undefined;
  const contract = await getCommitContractById(contractId);
  if (!contract) throw new Error("Contract not found");
  const newDrawdown = (parseFloat(contract.drawdownUsed ?? "0") + amount).toFixed(2);
  await db.update(commitContracts).set({ drawdownUsed: newDrawdown }).where(eq(commitContracts.id, contractId));
  return {
    used: parseFloat(newDrawdown),
    remaining: parseFloat(contract.totalCommitCredits) - parseFloat(newDrawdown),
    utilizationPercent: Math.round((parseFloat(newDrawdown) / parseFloat(contract.totalCommitCredits)) * 100),
  };
}

export async function getCommitContractUtilization(contractId: number) {
  const contract = await getCommitContractById(contractId);
  if (!contract) return null;
  const used = parseFloat(contract.drawdownUsed ?? "0");
  const total = parseFloat(contract.totalCommitCredits);
  const elapsed = Date.now() - (contract.startDate ?? Date.now());
  const totalDuration = (contract.endDate ?? Date.now()) - (contract.startDate ?? Date.now());
  const timePct = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
  return {
    used,
    total,
    remaining: total - used,
    utilizationPercent: total > 0 ? Math.round((used / total) * 100) : 0,
    timeElapsedPercent: Math.min(Math.round(timePct), 100),
    prepaid: parseFloat(contract.prepaidAmount ?? "0"),
    monthlyAllocation: parseFloat(contract.monthlyAllocation ?? "0"),
  };
}

export async function checkCommitTrueUp(contractId: number) {
  const contract = await getCommitContractById(contractId);
  if (!contract || !contract.trueUpEnabled) return null;
  const used = parseFloat(contract.drawdownUsed ?? "0");
  const total = parseFloat(contract.totalCommitCredits);
  const shortfall = total - used;
  return { shortfall: shortfall > 0 ? shortfall : 0, used, total, trueUpNeeded: shortfall > 0 };
}

// ─── Credit Bonuses CRUD ────────────────────────────────────────────
export async function getCreditBonusesByWallet(walletId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditBonuses).where(eq(creditBonuses.walletId, walletId)).orderBy(desc(creditBonuses.createdAt));
}

export async function getPendingBonuses(walletId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditBonuses).where(
    and(eq(creditBonuses.walletId, walletId), eq(creditBonuses.isApplied, false))
  ).orderBy(asc(creditBonuses.createdAt));
}

export async function createCreditBonus(data: InsertCreditBonus) {
  const db = await getDb();
  if (!db) return;
  await db.insert(creditBonuses).values(data);
}

export async function applyBonus(bonusId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(creditBonuses).where(eq(creditBonuses.id, bonusId)).limit(1);
  const bonus = result[0];
  if (!bonus) throw new Error("Bonus not found");
  if (bonus.isApplied) throw new Error("Bonus already applied");
  if (!bonus.walletId) throw new Error("No wallet linked to bonus");

  const wallet = await getWalletById(bonus.walletId);
  if (!wallet) throw new Error("Wallet not found");

  // Add bonus to permanent balance (bonuses don't expire unless explicitly set)
  const currentPerm = parseFloat(wallet.permanentBalance ?? "0");
  const bonusAmount = parseFloat(bonus.amount);
  const newPerm = (currentPerm + bonusAmount).toFixed(2);

  await db.update(wallets).set({ permanentBalance: newPerm }).where(eq(wallets.id, bonus.walletId));

  await db.insert(creditLedger).values({
    walletId: bonus.walletId,
    type: "bonus",
    amount: bonus.amount,
    balanceAfter: (parseFloat(wallet.balance) + currentPerm + bonusAmount).toFixed(2),
    description: bonus.description ?? `Bonus: ${bonus.type}`,
    source: "bonus",
  });

  await db.update(creditBonuses).set({ isApplied: true, appliedAt: new Date() }).where(eq(creditBonuses.id, bonusId));

  // Notification
  await db.insert(notifications).values({
    userId: bonus.userId,
    type: "bonus_awarded",
    title: "Bonus Credits Awarded!",
    message: `${bonusAmount} bonus credits have been added to your wallet.`,
    metadata: JSON.stringify({ bonusId, amount: bonusAmount, type: bonus.type }),
  });

  return { applied: true, amount: bonusAmount, newPermanentBalance: newPerm };
}

export async function createReferralBonus(referrerUserId: number, referredCompanyId: number, amount: number = 50) {
  const db = await getDb();
  if (!db) return;
  // Find referrer's personal wallet
  const referrerWallets = await db.select().from(wallets).where(
    and(eq(wallets.ownerId, referrerUserId), eq(wallets.type, "personal"))
  ).limit(1);
  const walletId = referrerWallets[0]?.id;

  await db.insert(creditBonuses).values({
    type: "referral",
    walletId,
    userId: referrerUserId,
    referrerUserId,
    referredCompanyId,
    amount: amount.toFixed(2),
    description: `Referral bonus for bringing in a new company`,
  });
}

// ─── Enhanced Ledger Summary ────────────────────────────────────────
export async function getEnhancedLedgerSummary(walletId: number) {
  const db = await getDb();
  if (!db) return { totalSpent: 0, totalGranted: 0, totalTopup: 0, totalBreakage: 0, totalPackages: 0, totalOverage: 0, totalBonuses: 0, totalExpired: 0 };
  const result = await db.select({
    totalSpent: sql<number>`COALESCE(SUM(CASE WHEN type = 'spend' THEN ABS(amount) ELSE 0 END), 0)`,
    totalGranted: sql<number>`COALESCE(SUM(CASE WHEN type = 'grant' THEN amount ELSE 0 END), 0)`,
    totalTopup: sql<number>`COALESCE(SUM(CASE WHEN type = 'topup' THEN amount ELSE 0 END), 0)`,
    totalBreakage: sql<number>`COALESCE(SUM(CASE WHEN type = 'breakage' THEN ABS(amount) ELSE 0 END), 0)`,
    totalPackages: sql<number>`COALESCE(SUM(CASE WHEN type = 'package_purchase' THEN amount ELSE 0 END), 0)`,
    totalOverage: sql<number>`COALESCE(SUM(CASE WHEN type = 'overage' THEN ABS(amount) ELSE 0 END), 0)`,
    totalBonuses: sql<number>`COALESCE(SUM(CASE WHEN type = 'bonus' THEN amount ELSE 0 END), 0)`,
    totalExpired: sql<number>`COALESCE(SUM(CASE WHEN type = 'expiration' THEN ABS(amount) ELSE 0 END), 0)`,
  }).from(creditLedger).where(eq(creditLedger.walletId, walletId));
  return result[0] ?? { totalSpent: 0, totalGranted: 0, totalTopup: 0, totalBreakage: 0, totalPackages: 0, totalOverage: 0, totalBonuses: 0, totalExpired: 0 };
}

// ─── Credit Admin Stats ─────────────────────────────────────────────
export async function getCreditSystemStats() {
  const db = await getDb();
  if (!db) return { totalWallets: 0, totalCreditsInCirculation: 0, totalPermanentCredits: 0, totalMonthlyBurn: 0, activeContracts: 0, totalBonusesPending: 0 };

  const allWallets = await db.select().from(wallets);
  const activeCommits = await db.select().from(commitContracts).where(eq(commitContracts.status, "active"));
  const pendingBonusResult = await db.select({
    count: sql<number>`COUNT(*)`,
    totalAmount: sql<number>`COALESCE(SUM(amount), 0)`,
  }).from(creditBonuses).where(eq(creditBonuses.isApplied, false));

  const totalExpiring = allWallets.reduce((s, w) => s + parseFloat(w.balance), 0);
  const totalPermanent = allWallets.reduce((s, w) => s + parseFloat(w.permanentBalance ?? "0"), 0);
  const monthlyBurn = allWallets.reduce((s, w) => s + parseFloat(w.monthlySpent ?? "0"), 0);

  return {
    totalWallets: allWallets.length,
    totalCreditsInCirculation: Math.round((totalExpiring + totalPermanent) * 100) / 100,
    totalPermanentCredits: Math.round(totalPermanent * 100) / 100,
    totalMonthlyBurn: Math.round(monthlyBurn * 100) / 100,
    activeContracts: activeCommits.length,
    totalBonusesPending: pendingBonusResult[0]?.count ?? 0,
  };
}
