import { eq, and, gte, lte, desc, sql, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, locations, resources, companies, creditBundles,
  wallets, creditLedger, bookings, dayMultipliers, visitors,
  companyBranding, employeePhotos, devices, sensors, accessLog,
  notifications, invites,
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
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
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

// ─── Bookings ───
export async function createBooking(data: {
  userId: number; resourceId: number; locationId: number; walletId?: number;
  startTime: number; endTime: number; creditsCost: string; multiplierApplied?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(bookings).values({ ...data, status: "confirmed" });
}

export async function getBookingsByUser(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.startTime)).limit(limit);
}

export async function getBookingsByLocation(locationId: number, startAfter: number, endBefore: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(
    and(eq(bookings.locationId, locationId), gte(bookings.startTime, startAfter), lte(bookings.endTime, endBefore), eq(bookings.status, "confirmed"))
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

// ─── Company Branding ───
export async function getBrandingByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companyBranding).where(eq(companyBranding.companyId, companyId)).limit(1);
  return result[0];
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

// ─── Dashboard Stats ───
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalCompanies: 0, totalBookings: 0, totalResources: 0, totalDevices: 0 };

  const [userCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
  const [companyCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(companies).where(eq(companies.isActive, true));
  const [bookingCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(bookings);
  const [resourceCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(resources).where(eq(resources.isActive, true));
  const deviceStats = await getDeviceStats();

  return {
    totalUsers: userCount?.count ?? 0,
    totalCompanies: companyCount?.count ?? 0,
    totalBookings: bookingCount?.count ?? 0,
    totalResources: resourceCount?.count ?? 0,
    totalDevices: deviceStats.total,
    devicesOnline: deviceStats.online,
  };
}
