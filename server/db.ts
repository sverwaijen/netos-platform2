/**
 * Dual-driver database layer — Supabase PostgreSQL (primary) + MySQL (fallback)
 *
 * When SUPABASE_DB_URL is set, all queries go through drizzle-orm/node-postgres.
 * Otherwise, falls back to drizzle-orm/mysql2 using DATABASE_URL.
 *
 * Key differences handled:
 *  - MySQL `onDuplicateKeyUpdate` → PG `onConflictDoUpdate`
 *  - MySQL `result[0].insertId` → PG `.returning()` or `RETURNING id`
 *  - MySQL `DAYOFWEEK(FROM_UNIXTIME(...))` → PG `EXTRACT(DOW FROM to_timestamp(...))`
 */
import { eq, and, gte, lte, desc, sql, asc, like, or, inArray, isNull, ne } from "drizzle-orm";
import { ENV } from './_core/env';

// ─── Dynamic schema imports ─────────────────────────────────────────
// We import both schemas; the correct one is selected at runtime based on driver.
import * as mysqlSchema from "../drizzle/schema";
import * as pgSchema from "../drizzle/pg-schema";

// ─── Driver detection ───────────────────────────────────────────────
type AnyDrizzle = any; // union of MySqlDatabase | NodePgDatabase
let _db: AnyDrizzle | null = null;
let _driver: "pg" | "mysql" | null = null;

export function getDriver(): "pg" | "mysql" | null { return _driver; }

/**
 * Returns the active schema module (pg or mysql) based on the current driver.
 */
function S() {
  return _driver === "pg" ? pgSchema : mysqlSchema;
}

export async function getDb(): Promise<AnyDrizzle | null> {
  if (_db) return _db;

  // Try Supabase PG first
  let pgUrl = ENV.supabaseDbUrl || process.env.SUPABASE_DB_URL;
  if (pgUrl) {
    // Auto-rewrite direct Supabase host to session pooler (IPv4 compatible)
    // Direct: postgresql://postgres:PASS@db.PROJECT.supabase.co:5432/postgres
    // Pooler: postgresql://postgres.PROJECT:PASS@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
    const directMatch = pgUrl.match(/postgresql:\/\/postgres:([^@]+)@db\.([a-z0-9]+)\.supabase\.co:(\d+)\/(.+)/);
    if (directMatch) {
      const [, password, projectRef, , dbName] = directMatch;
      pgUrl = `postgresql://postgres.${projectRef}:${password}@aws-1-eu-central-1.pooler.supabase.com:5432/${dbName}`;
      console.log(`[Database] Rewrote direct Supabase URL to session pooler`);
    }
    try {
      const pg = await import("pg");
      const { drizzle } = await import("drizzle-orm/node-postgres");
      const pool = new pg.default.Pool({
        connectionString: pgUrl,
        ssl: { rejectUnauthorized: false },
        max: 8,
        idleTimeoutMillis: 20000,
        connectionTimeoutMillis: 10000,
      });
      pool.on('error', (err) => console.error('[Database] Pool error:', err.message));
      _db = drizzle(pool);
      _driver = "pg";
      console.log("[Database] Connected to Supabase PostgreSQL");
      return _db;
    } catch (error) {
      console.warn("[Database] Failed to connect to Supabase PG:", error);
    }
  }

  // Fallback to MySQL
  if (process.env.DATABASE_URL) {
    try {
      const { drizzle } = await import("drizzle-orm/mysql2");
      _db = drizzle(process.env.DATABASE_URL);
      _driver = "mysql";
      console.log("[Database] Connected to MySQL (fallback)");
      return _db;
    } catch (error) {
      console.warn("[Database] Failed to connect to MySQL:", error);
      _db = null;
    }
  }

  return null;
}

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Cross-driver insert that returns the new auto-increment id.
 * PG uses RETURNING, MySQL uses insertId.
 */
async function insertReturningId(db: AnyDrizzle, table: any, values: any): Promise<number | null> {
  if (_driver === "pg") {
    const result = await (db.insert as any)(table).values(values).returning({ id: table.id });
    return result[0]?.id ?? null;
  } else {
    const result = await (db.insert as any)(table).values(values);
    return result[0]?.insertId ?? null;
  }
}

/**
 * Run a callback inside a database transaction.
 * Drizzle PG supports db.transaction(); MySQL uses db.transaction().
 * Falls back to non-transactional execution if transaction is unsupported.
 */
export async function withTransaction<T>(fn: (tx: AnyDrizzle) => Promise<T>): Promise<T> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  if (typeof (db as any).transaction === "function") {
    return (db as any).transaction(fn);
  }
  // Fallback: run without transaction wrapper
  return fn(db);
}

// ─── Users ──────────────────────────────────────────────────────────────────
export async function upsertUser(user: mysqlSchema.InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const schema = S();
  const values: any = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod", "phone", "avatarUrl"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = (user as any)[field];
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

  if (_driver === "pg") {
    await (db.insert as any)(schema.users).values(values).onConflictDoUpdate({
      target: schema.users.openId,
      set: updateSet,
    });
  } else {
    await (db.insert as any)(schema.users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await (db.select() as any).from(S().users).where(eq(S().users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().users).orderBy(desc(S().users.createdAt));
}

export async function updateUserRole(userId: number, role: string) {
  const db = await getDb();
  if (!db) return;
  await (db.update(S().users) as any).set({ role: role as any }).where(eq(S().users.id, userId));
}

export async function getAllUsersWithRoles() {
  const db = await getDb();
  if (!db) return [];
  return (db.select({
    id: S().users.id,
    name: S().users.name,
    email: S().users.email,
    role: S().users.role,
    avatarUrl: S().users.avatarUrl,
    createdAt: S().users.createdAt,
    lastSignedIn: S().users.lastSignedIn,
  }) as any).from(S().users).orderBy(desc(S().users.createdAt));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await (db.select() as any).from(S().users).where(eq(S().users.id, id)).limit(1);
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
    await (db.update as any)(S().users).set(updateSet).where(eq(S().users.id, userId));
  }
}

export async function searchUsers(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().users).where(
    or(like(S().users.name, `%${query}%`), like(S().users.email, `%${query}%`))
  ).orderBy(desc(S().users.createdAt)).limit(limit);
}

// ─── Locations ──────────────────────────────────────────────────────
export async function getAllLocations() {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().locations).where(eq(S().locations.isActive, true)).orderBy(asc(S().locations.name));
}

export async function getLocationBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await (db.select() as any).from(S().locations).where(eq(S().locations.slug, slug)).limit(1);
  return result[0];
}

export async function getLocationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await (db.select() as any).from(S().locations).where(eq(S().locations.id, id)).limit(1);
  return result[0];
}

// ─── Resources ──────────────────────────────────────────────────────
export async function getResourcesByLocation(locationId: number) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().resources).where(and(eq(S().resources.locationId, locationId), eq(S().resources.isActive, true))).orderBy(asc(S().resources.type), asc(S().resources.name));
}

export async function getResourceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await (db.select() as any).from(S().resources).where(eq(S().resources.id, id)).limit(1);
  return result[0];
}

export async function getResourceStats() {
  const db = await getDb();
  if (!db) return [];
  return (db.select as any)({
    locationId: S().resources.locationId,
    type: S().resources.type,
    count: sql<number>`COUNT(*)`,
  }).from(S().resources).where(eq(S().resources.isActive, true)).groupBy(S().resources.locationId, S().resources.type);
}

export async function searchResources(filters: {
  locationId?: number; type?: string; zone?: string; minCapacity?: number; maxCostPerHour?: number; query?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const s = S();
  const conditions = [eq(s.resources.isActive, true)];
  if (filters.locationId) conditions.push(eq(s.resources.locationId, filters.locationId));
  if (filters.type) conditions.push(eq(s.resources.type, filters.type as any));
  if (filters.zone) conditions.push(eq(s.resources.zone, filters.zone as any));
  if (filters.minCapacity) conditions.push(gte(s.resources.capacity, filters.minCapacity));
  if (filters.maxCostPerHour) conditions.push(lte(s.resources.creditCostPerHour, String(filters.maxCostPerHour)));
  if (filters.query) conditions.push(like(s.resources.name, `%${filters.query}%`));
  return (db.select() as any).from(s.resources).where(and(...conditions)).orderBy(asc(s.resources.type), asc(s.resources.name)).limit(100);
}

export async function getResourceAvailability(resourceId: number, dateStart: number, dateEnd: number) {
  const db = await getDb();
  if (!db) return [];
  const s = S();
  return (db.select as any)({
    id: s.bookings.id,
    startTime: s.bookings.startTime,
    endTime: s.bookings.endTime,
    status: s.bookings.status,
  }).from(s.bookings).where(
    and(
      eq(s.bookings.resourceId, resourceId),
      ne(s.bookings.status, "cancelled"),
      lte(s.bookings.startTime, dateEnd),
      gte(s.bookings.endTime, dateStart),
    )
  ).orderBy(asc(s.bookings.startTime));
}

// ─── Companies ──────────────────────────────────────────────────────
export async function getAllCompanies() {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().companies).where(eq(S().companies.isActive, true)).orderBy(desc(S().companies.memberCount));
}

export async function getCompanyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await (db.select() as any).from(S().companies).where(eq(S().companies.id, id)).limit(1);
  return result[0];
}

export async function getCompanyMembers(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().users).where(eq(S().users.companyId, companyId)).orderBy(asc(S().users.name));
}

export async function getCompanyBookings(companyId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const members = await getCompanyMembers(companyId);
  if (members.length === 0) return [];
  const memberIds = members.map((m: any) => m.id);
  return (db.select() as any).from(S().bookings).where(inArray(S().bookings.userId, memberIds)).orderBy(desc(S().bookings.startTime)).limit(limit);
}

// ─── Credit Bundles ─────────────────────────────────────────────────
export async function getAllBundles() {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().creditBundles).where(eq(S().creditBundles.isActive, true)).orderBy(asc(S().creditBundles.priceEur));
}

// ─── Wallets ────────────────────────────────────────────────────────
export async function getWalletsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().wallets).where(eq(S().wallets.ownerId, userId));
}

export async function getWalletById(walletId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await (db.select() as any).from(S().wallets).where(eq(S().wallets.id, walletId)).limit(1);
  return result[0];
}

export async function getCompanyWallet(companyId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await (db.select() as any).from(S().wallets).where(and(eq(S().wallets.ownerId, companyId), eq(S().wallets.type, "company"))).limit(1);
  return result[0];
}

export async function createWallet(data: { type: "company" | "personal"; ownerId: number; bundleId?: number; maxRollover?: number; balance?: string }) {
  const db = await getDb();
  if (!db) return;
  await (db.insert as any)(S().wallets).values({
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
  await (db.update as any)(S().wallets).set({ balance: newBalance }).where(eq(S().wallets.id, walletId));
}

export async function ensurePersonalWallet(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const s = S();
  const existing = await (db.select() as any).from(s.wallets).where(and(eq(s.wallets.ownerId, userId), eq(s.wallets.type, "personal"))).limit(1);
  if (existing[0]) return existing[0];
  await (db.insert as any)(s.wallets).values({ type: "personal", ownerId: userId, balance: "10", maxRollover: 0 });
  const created = await (db.select() as any).from(s.wallets).where(and(eq(s.wallets.ownerId, userId), eq(s.wallets.type, "personal"))).limit(1);
  return created[0] ?? null;
}

// ─── Wallet Stripe helpers ──────────────────────────────────────────
export async function getWalletByStripeSubscriptionId(subscriptionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await (db.select() as any).from(S().wallets).where(eq(S().wallets.stripeSubscriptionId, subscriptionId)).limit(1);
  return result[0];
}

export async function updateWalletStripeIds(walletId: number, data: {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  bundleId?: number;
}) {
  const db = await getDb();
  if (!db) return;
  const setObj: any = {};
  if (data.stripeCustomerId !== undefined) setObj.stripeCustomerId = data.stripeCustomerId;
  if (data.stripeSubscriptionId !== undefined) setObj.stripeSubscriptionId = data.stripeSubscriptionId;
  if (data.bundleId !== undefined) setObj.bundleId = data.bundleId;
  await (db.update as any)(S().wallets).set(setObj).where(eq(S().wallets.id, walletId));
}

export async function updateBundleStripeIds(bundleId: number, stripeProductId: string, stripePriceId: string) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().creditBundles).set({ stripeProductId, stripePriceId }).where(eq(S().creditBundles.id, bundleId));
}

// ─── Credit Ledger ──────────────────────────────────────────────────
export async function addLedgerEntry(data: {
  walletId: number; type: "grant" | "spend" | "rollover" | "breakage" | "topup" | "refund" | "transfer";
  amount: string; balanceAfter: string; description?: string; referenceType?: string; referenceId?: number; multiplier?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await (db.insert as any)(S().creditLedger).values(data);
}

export async function getLedgerByWallet(walletId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().creditLedger).where(eq(S().creditLedger.walletId, walletId)).orderBy(desc(S().creditLedger.createdAt)).limit(limit);
}

export async function getLedgerSummary(walletId: number) {
  const db = await getDb();
  if (!db) return { totalSpent: 0, totalGranted: 0, totalTopup: 0, totalBreakage: 0 };
  const result = await (db.select as any)({
    totalSpent: sql<number>`COALESCE(SUM(CASE WHEN type = 'spend' THEN ABS(amount) ELSE 0 END), 0)`,
    totalGranted: sql<number>`COALESCE(SUM(CASE WHEN type = 'grant' THEN amount ELSE 0 END), 0)`,
    totalTopup: sql<number>`COALESCE(SUM(CASE WHEN type = 'topup' THEN amount ELSE 0 END), 0)`,
    totalBreakage: sql<number>`COALESCE(SUM(CASE WHEN type = 'breakage' THEN ABS(amount) ELSE 0 END), 0)`,
  }).from(S().creditLedger).where(eq(S().creditLedger.walletId, walletId));
  return result[0] ?? { totalSpent: 0, totalGranted: 0, totalTopup: 0, totalBreakage: 0 };
}

// ─── Bookings ───────────────────────────────────────────────────────
export async function createBooking(data: {
  userId: number; resourceId: number; locationId: number; walletId?: number;
  startTime: number; endTime: number; creditsCost: string; multiplierApplied?: string; notes?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await (db.insert as any)(S().bookings).values({ ...data, status: "confirmed" });
}

export async function getBookingsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().bookings).where(eq(S().bookings.userId, userId)).orderBy(desc(S().bookings.startTime)).limit(limit);
}

export async function getBookingsByLocation(locationId: number, startAfter: number, endBefore: number) {
  const db = await getDb();
  if (!db) return [];
  const s = S();
  return (db.select() as any).from(s.bookings).where(
    and(eq(s.bookings.locationId, locationId), gte(s.bookings.startTime, startAfter), lte(s.bookings.endTime, endBefore), ne(s.bookings.status, "cancelled"))
  );
}

export async function getAllBookings(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().bookings).orderBy(desc(S().bookings.createdAt)).limit(limit);
}

export async function updateBookingStatus(id: number, status: "confirmed" | "checked_in" | "completed" | "cancelled" | "no_show") {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().bookings).set({ status }).where(eq(S().bookings.id, id));
}

export async function getBookingsWithDetails(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const userBookings = await (db.select() as any).from(S().bookings).where(eq(S().bookings.userId, userId)).orderBy(desc(S().bookings.startTime)).limit(limit);
  if (userBookings.length === 0) return [];
  // Batch load resources and locations to avoid N+1
  const resourceIds = Array.from(new Set(userBookings.map((b: any) => b.resourceId).filter(Boolean))) as number[];
  const locationIds = Array.from(new Set(userBookings.map((b: any) => b.locationId).filter(Boolean))) as number[];
  const [resources, locations] = await Promise.all([
    resourceIds.length ? (db.select() as any).from(S().resources).where(inArray(S().resources.id, resourceIds as number[])) : [],
    locationIds.length ? (db.select() as any).from(S().locations).where(inArray(S().locations.id, locationIds as number[])) : [],
  ]);
  const resourceMap = new Map((resources as any[]).map((r: any) => [r.id, r]));
  const locationMap = new Map((locations as any[]).map((l: any) => [l.id, l]));
  return userBookings.map((b: any) => {
    const resource = resourceMap.get(b.resourceId);
    const location = locationMap.get(b.locationId);
    return { ...b, resourceName: resource?.name ?? `Resource #${b.resourceId}`, resourceType: resource?.type ?? "desk", locationName: location?.name ?? `Location #${b.locationId}`, locationCity: location?.city ?? "" };
  });
}

// ─── Day Multipliers ────────────────────────────────────────────────
export async function getMultiplierForDay(locationId: number, dayOfWeek: number) {
  const db = await getDb();
  if (!db) return 1.0;
  const s = S();
  const result = await (db.select() as any).from(s.dayMultipliers).where(
    and(eq(s.dayMultipliers.locationId, locationId), eq(s.dayMultipliers.dayOfWeek, dayOfWeek), eq(s.dayMultipliers.isActive, true))
  ).limit(1);
  return result[0] ? parseFloat(result[0].multiplier) : 1.0;
}

export async function getMultipliersForLocation(locationId: number) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().dayMultipliers).where(eq(S().dayMultipliers.locationId, locationId)).orderBy(asc(S().dayMultipliers.dayOfWeek));
}

// ─── Visitors ───────────────────────────────────────────────────────
export async function createVisitor(data: {
  invitedByUserId: number; companyId?: number; name: string; email?: string; phone?: string;
  licensePlate?: string; visitDate: number; locationId: number; accessToken: string;
}) {
  const db = await getDb();
  if (!db) return;
  await (db.insert as any)(S().visitors).values(data);
}

export async function getVisitorsByLocation(locationId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().visitors).where(eq(S().visitors.locationId, locationId)).orderBy(desc(S().visitors.visitDate)).limit(limit);
}

export async function getVisitorsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().visitors).where(eq(S().visitors.invitedByUserId, userId)).orderBy(desc(S().visitors.visitDate));
}

export async function updateVisitorStatus(id: number, status: "invited" | "checked_in" | "checked_out" | "cancelled") {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().visitors).set({ status }).where(eq(S().visitors.id, id));
}

// ─── Company Branding ───────────────────────────────────────────────
export async function getBrandingByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await (db.select() as any).from(S().companyBranding).where(eq(S().companyBranding.companyId, companyId)).limit(1);
  return result[0];
}

export async function upsertBranding(companyId: number, data: { logoUrl?: string; primaryColor?: string; secondaryColor?: string; welcomeMessage?: string; backgroundImageUrl?: string }) {
  const db = await getDb();
  if (!db) return;
  const existing = await getBrandingByCompany(companyId);
  if (existing) {
    await (db.update as any)(S().companyBranding).set(data).where(eq(S().companyBranding.companyId, companyId));
  } else {
    await (db.insert as any)(S().companyBranding).values({ companyId, ...data });
  }
}

// ─── Employee Photos ────────────────────────────────────────────────
export async function getEmployeePhotosByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().employeePhotos).where(eq(S().employeePhotos.companyId, companyId));
}

// ─── Devices ────────────────────────────────────────────────────────
export async function getDevicesByLocation(locationId: number) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().devices).where(eq(S().devices.locationId, locationId)).orderBy(asc(S().devices.name));
}

export async function getDeviceStats() {
  const db = await getDb();
  if (!db) return { total: 0, online: 0, offline: 0 };
  const result = await (db.select as any)({
    total: sql<number>`COUNT(*)`,
    online: sql<number>`SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END)`,
    offline: sql<number>`SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END)`,
  }).from(S().devices);
  const r = result[0] ?? { total: 0, online: 0, offline: 0 };
  return { total: Number(r.total ?? 0), online: Number(r.online ?? 0), offline: Number(r.offline ?? 0) };
}

export async function getSensorsByDevice(deviceId: number) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().sensors).where(eq(S().sensors.deviceId, deviceId));
}

export async function getSensorStats() {
  const db = await getDb();
  if (!db) return { total: 0, active: 0 };
  const s = S();
  const result = await (db.select as any)({
    total: sql<number>`COUNT(*)`,
    active: sql<number>`SUM(CASE WHEN "isActive" = true THEN 1 ELSE 0 END)`,
  }).from(s.sensors);
  const r = result[0] ?? { total: 0, active: 0 };
  return { total: Number(r.total ?? 0), active: Number(r.active ?? 0) };
}

// ─── Access Log ─────────────────────────────────────────────────────
export async function getAccessLogByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().accessLog).where(eq(S().accessLog.userId, userId)).orderBy(desc(S().accessLog.createdAt)).limit(limit);
}

export async function getAccessLogByLocation(locationId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().accessLog).where(eq(S().accessLog.locationId, locationId)).orderBy(desc(S().accessLog.createdAt)).limit(limit);
}

export async function createAccessLogEntry(data: {
  userId?: number; resourceId?: number; locationId: number; zone?: string; action: string; method?: string; saltoEventId?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await (db.insert as any)(S().accessLog).values(data as any);
}

// ─── Notifications ──────────────────────────────────────────────────
export async function getNotificationsForUser(userId: number | null, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  if (userId) {
    return (db.select() as any).from(S().notifications).where(eq(S().notifications.userId, userId)).orderBy(desc(S().notifications.createdAt)).limit(limit);
  }
  return (db.select() as any).from(S().notifications).orderBy(desc(S().notifications.createdAt)).limit(limit);
}

export async function createNotification(data: { userId?: number; type: string; title: string; message?: string; metadata?: any }) {
  const db = await getDb();
  if (!db) return;
  await (db.insert as any)(S().notifications).values(data as any);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().notifications).set({ isRead: true }).where(eq(S().notifications.id, id));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().notifications).set({ isRead: true }).where(and(eq(S().notifications.userId, userId), eq(S().notifications.isRead, false)));
}

// ─── Invites ────────────────────────────────────────────────────────
export async function createInvite(data: { email?: string; phone?: string; companyId?: number; invitedByUserId: number; role?: string; token: string; expiresAt: Date }) {
  const db = await getDb();
  if (!db) return;
  await (db.insert as any)(S().invites).values(data as any);
}

export async function getInvitesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().invites).where(eq(S().invites.invitedByUserId, userId)).orderBy(desc(S().invites.createdAt));
}

export async function getInviteByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await (db.select() as any).from(S().invites).where(eq(S().invites.token, token)).limit(1);
  return result[0];
}

export async function updateInviteStatus(id: number, status: "pending" | "accepted" | "expired") {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().invites).set({ status }).where(eq(S().invites.id, id));
}

// ─── Dashboard Stats ────────────────────────────────────────────────
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalCompanies: 0, totalBookings: 0, totalResources: 0, totalDevices: 0, devicesOnline: 0, totalSensors: 0 };
  const s = S();

  // Run COUNT queries in two parallel batches to stay within pool limits
  const [userCount, companyCount, bookingCount] = await Promise.all([
    (db.select as any)({ count: sql<number>`COUNT(*)` }).from(s.users),
    (db.select as any)({ count: sql<number>`COUNT(*)` }).from(s.companies).where(eq(s.companies.isActive, true)),
    (db.select as any)({ count: sql<number>`COUNT(*)` }).from(s.bookings),
  ]);
  const [resourceCount, deviceStats, sensorStats] = await Promise.all([
    (db.select as any)({ count: sql<number>`COUNT(*)` }).from(s.resources).where(eq(s.resources.isActive, true)),
    getDeviceStats(),
    getSensorStats(),
  ]);

  return {
    totalUsers: Number(userCount[0]?.count ?? 0),
    totalCompanies: Number(companyCount[0]?.count ?? 0),
    totalBookings: Number(bookingCount[0]?.count ?? 0),
    totalResources: Number(resourceCount[0]?.count ?? 0),
    totalDevices: Number(deviceStats.total),
    devicesOnline: Number(deviceStats.online),
    totalSensors: Number(sensorStats.total),
    sensorsActive: Number(sensorStats.active ?? 0),
  };
}

export async function getBookingsByDayOfWeek() {
  const db = await getDb();
  if (!db) return [];
  const s = S();

  if (_driver === "pg") {
    // PG: EXTRACT(DOW ...) returns 0=Sunday..6=Saturday
    return (db.select as any)({
      dayOfWeek: sql<number>`EXTRACT(DOW FROM to_timestamp("startTime" / 1000))::int + 1`,
      count: sql<number>`COUNT(*)`,
      totalCredits: sql<number>`COALESCE(SUM("creditsCost"::numeric), 0)`,
    }).from(s.bookings).where(ne(s.bookings.status, "cancelled")).groupBy(sql`EXTRACT(DOW FROM to_timestamp("startTime" / 1000))`);
  } else {
    // MySQL: DAYOFWEEK returns 1=Sunday..7=Saturday
    return (db.select as any)({
      dayOfWeek: sql<number>`DAYOFWEEK(FROM_UNIXTIME(startTime / 1000))`,
      count: sql<number>`COUNT(*)`,
      totalCredits: sql<number>`COALESCE(SUM(creditsCost), 0)`,
    }).from(s.bookings).where(ne(s.bookings.status, "cancelled")).groupBy(sql`DAYOFWEEK(FROM_UNIXTIME(startTime / 1000))`);
  }
}

export async function getResourceTypeDistribution() {
  const db = await getDb();
  if (!db) return [];
  const s = S();
  return (db.select as any)({
    type: s.resources.type,
    count: sql<number>`COUNT(*)`,
  }).from(s.resources).where(eq(s.resources.isActive, true)).groupBy(s.resources.type);
}

export async function getRecentBookings(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const s = S();
  // Single query with JOINs instead of N+1 (was 31 queries for 10 rows)
  if (_driver === "pg") {
    const rows = await db.execute(sql`
      SELECT b.*, r.name AS "resourceName", r.type AS "resourceType",
             l.name AS "locationName", u.name AS "userName"
      FROM bookings b
      LEFT JOIN resources r ON r.id = b."resourceId"
      LEFT JOIN locations l ON l.id = b."locationId"
      LEFT JOIN users u ON u.id = b."userId"
      ORDER BY b."createdAt" DESC
      LIMIT ${limit}
    `);
    return (rows as any).rows ?? rows;
  } else {
    const rows = await db.execute(sql`
      SELECT b.*, r.name AS resourceName, r.type AS resourceType,
             l.name AS locationName, u.name AS userName
      FROM bookings b
      LEFT JOIN resources r ON r.id = b.resourceId
      LEFT JOIN locations l ON l.id = b.locationId
      LEFT JOIN users u ON u.id = b.userId
      ORDER BY b.createdAt DESC
      LIMIT ${limit}
    `);
    return (rows as any)[0] ?? rows;
  }
}

export async function getLocationBookingStats() {
  const db = await getDb();
  if (!db) return [];
  // Single aggregated query instead of N+1 (was 22+ queries for 7 locations)
  if (_driver === "pg") {
    const rows = await db.execute(sql`
      SELECT l.id AS "locationId", l.name AS "locationName", l.city,
             COALESCE(bc.cnt, 0)::int AS "totalBookings",
             COALESCE(rc.cnt, 0)::int AS "totalResources",
             COALESCE(rev.total, 0)::numeric AS "totalRevenue"
      FROM locations l
      LEFT JOIN (
        SELECT "locationId", COUNT(*)::int AS cnt FROM bookings GROUP BY "locationId"
      ) bc ON bc."locationId" = l.id
      LEFT JOIN (
        SELECT "locationId", COUNT(*)::int AS cnt FROM resources WHERE "isActive" = true GROUP BY "locationId"
      ) rc ON rc."locationId" = l.id
      LEFT JOIN (
        SELECT "locationId", SUM("creditsCost"::numeric) AS total FROM bookings WHERE status != 'cancelled' GROUP BY "locationId"
      ) rev ON rev."locationId" = l.id
      ORDER BY l.name
    `);
    return ((rows as any).rows ?? rows).map((r: any) => ({
      ...r,
      totalBookings: Number(r.totalBookings ?? 0),
      totalResources: Number(r.totalResources ?? 0),
      totalRevenue: Number(r.totalRevenue ?? 0),
      occupancyRate: r.totalResources ? Math.min(95, Math.round((Number(r.totalBookings) / (Number(r.totalResources) * 30)) * 100)) : 0,
    }));
  } else {
    const rows = await db.execute(sql`
      SELECT l.id AS locationId, l.name AS locationName, l.city,
             COALESCE(bc.cnt, 0) AS totalBookings,
             COALESCE(rc.cnt, 0) AS totalResources,
             COALESCE(rev.total, 0) AS totalRevenue
      FROM locations l
      LEFT JOIN (
        SELECT locationId, COUNT(*) AS cnt FROM bookings GROUP BY locationId
      ) bc ON bc.locationId = l.id
      LEFT JOIN (
        SELECT locationId, COUNT(*) AS cnt FROM resources WHERE isActive = true GROUP BY locationId
      ) rc ON rc.locationId = l.id
      LEFT JOIN (
        SELECT locationId, SUM(creditsCost) AS total FROM bookings WHERE status != 'cancelled' GROUP BY locationId
      ) rev ON rev.locationId = l.id
      ORDER BY l.name
    `);
    return ((rows as any)[0] ?? rows).map((r: any) => ({
      ...r,
      totalBookings: Number(r.totalBookings ?? 0),
      totalResources: Number(r.totalResources ?? 0),
      totalRevenue: Number(r.totalRevenue ?? 0),
      occupancyRate: r.totalResources ? Math.min(95, Math.round((Number(r.totalBookings) / (Number(r.totalResources) * 30)) * 100)) : 0,
    }));
  }
}

// ─── CRM: Leads ─────────────────────────────────────────────────────
export async function getCrmLeads(filters?: { stage?: string; source?: string; search?: string; assignedToUserId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const s = S();
  const conditions: any[] = [];
  if (filters?.stage) conditions.push(eq(s.crmLeads.stage, filters.stage as any));
  if (filters?.source) conditions.push(eq(s.crmLeads.source, filters.source as any));
  if (filters?.assignedToUserId) conditions.push(eq(s.crmLeads.assignedToUserId, filters.assignedToUserId));
  if (filters?.search) conditions.push(or(like(s.crmLeads.companyName, `%${filters.search}%`), like(s.crmLeads.contactName, `%${filters.search}%`), like(s.crmLeads.contactEmail, `%${filters.search}%`)));
  return (db.select() as any).from(s.crmLeads).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(s.crmLeads.updatedAt)).limit(200);
}

export async function getCrmLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await (db.select() as any).from(S().crmLeads).where(eq(S().crmLeads.id, id)).limit(1);
  return result[0];
}

export async function createCrmLead(data: mysqlSchema.InsertCrmLead) {
  const db = await getDb();
  if (!db) return null;
  return insertReturningId(db, S().crmLeads, data);
}

export async function updateCrmLead(id: number, data: Partial<mysqlSchema.InsertCrmLead>) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().crmLeads).set(data).where(eq(S().crmLeads.id, id));
}

export async function deleteCrmLead(id: number) {
  const db = await getDb();
  if (!db) return;
  await (db.delete as any)(S().crmLeads).where(eq(S().crmLeads.id, id));
}

export async function getCrmLeadsByStage() {
  const db = await getDb();
  if (!db) return [];
  const s = S();
  return (db.select as any)({
    stage: s.crmLeads.stage,
    count: sql<number>`COUNT(*)`,
    totalValue: sql<number>`COALESCE(SUM("estimatedValue"::numeric), 0)`,
  }).from(s.crmLeads).groupBy(s.crmLeads.stage);
}

// ─── CRM: Lead Activities ───────────────────────────────────────────
export async function getCrmLeadActivities(leadId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().crmLeadActivities).where(eq(S().crmLeadActivities.leadId, leadId)).orderBy(desc(S().crmLeadActivities.createdAt)).limit(limit);
}

export async function addCrmLeadActivity(data: { leadId: number; userId?: number; type: string; title: string; description?: string; metadata?: any }) {
  const db = await getDb();
  if (!db) return;
  await (db.insert as any)(S().crmLeadActivities).values(data as any);
}

// ─── CRM: Campaigns ────────────────────────────────────────────────
export async function getCrmCampaigns(filters?: { status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const s = S();
  const conditions: any[] = [];
  if (filters?.status) conditions.push(eq(s.crmCampaigns.status, filters.status as any));
  return (db.select() as any).from(s.crmCampaigns).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(s.crmCampaigns.updatedAt)).limit(100);
}

export async function getCrmCampaignById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await (db.select() as any).from(S().crmCampaigns).where(eq(S().crmCampaigns.id, id)).limit(1);
  return result[0];
}

export async function createCrmCampaign(data: mysqlSchema.InsertCrmCampaign) {
  const db = await getDb();
  if (!db) return null;
  return insertReturningId(db, S().crmCampaigns, data);
}

export async function updateCrmCampaign(id: number, data: Partial<mysqlSchema.InsertCrmCampaign>) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().crmCampaigns).set(data).where(eq(S().crmCampaigns.id, id));
}

// ─── CRM: Campaign Steps ───────────────────────────────────────────
export async function getCrmCampaignSteps(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().crmCampaignSteps).where(eq(S().crmCampaignSteps.campaignId, campaignId)).orderBy(asc(S().crmCampaignSteps.stepOrder));
}

export async function createCrmCampaignStep(data: { campaignId: number; stepOrder: number; delayDays?: number; subject?: string; body?: string; isAiGenerated?: boolean }) {
  const db = await getDb();
  if (!db) return;
  await (db.insert as any)(S().crmCampaignSteps).values(data);
}

export async function updateCrmCampaignStep(id: number, data: { subject?: string; body?: string; delayDays?: number }) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().crmCampaignSteps).set(data).where(eq(S().crmCampaignSteps.id, id));
}

export async function deleteCrmCampaignStep(id: number) {
  const db = await getDb();
  if (!db) return;
  await (db.delete as any)(S().crmCampaignSteps).where(eq(S().crmCampaignSteps.id, id));
}

// ─── CRM: Campaign Enrollments ──────────────────────────────────────
export async function getCrmCampaignEnrollments(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  const enrollments = await (db.select() as any).from(S().crmCampaignEnrollments).where(eq(S().crmCampaignEnrollments.campaignId, campaignId)).orderBy(desc(S().crmCampaignEnrollments.enrolledAt));
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
  await (db.insert as any)(S().crmCampaignEnrollments).values({ campaignId, leadId, status: "active" });
  const campaign = await getCrmCampaignById(campaignId);
  if (campaign) {
    await (db.update as any)(S().crmCampaigns).set({ totalLeads: (campaign.totalLeads ?? 0) + 1 }).where(eq(S().crmCampaigns.id, campaignId));
  }
}

// ─── CRM: Email Templates ──────────────────────────────────────────
export async function getCrmEmailTemplates() {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().crmEmailTemplates).orderBy(desc(S().crmEmailTemplates.updatedAt));
}

export async function createCrmEmailTemplate(data: { name: string; subject: string; body: string; category?: string; isAiGenerated?: boolean; createdByUserId?: number }) {
  const db = await getDb();
  if (!db) return;
  await (db.insert as any)(S().crmEmailTemplates).values(data);
}

export async function updateCrmEmailTemplate(id: number, data: { name?: string; subject?: string; body?: string; category?: string }) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().crmEmailTemplates).set(data).where(eq(S().crmEmailTemplates.id, id));
}

export async function deleteCrmEmailTemplate(id: number) {
  const db = await getDb();
  if (!db) return;
  await (db.delete as any)(S().crmEmailTemplates).where(eq(S().crmEmailTemplates.id, id));
}

// ─── CRM: Pipeline Stats ───────────────────────────────────────────
export async function getCrmPipelineStats() {
  const db = await getDb();
  if (!db) return { totalLeads: 0, totalValue: 0, wonValue: 0, lostCount: 0, conversionRate: 0, avgDealSize: 0, leadsBySource: [], leadsByStage: [] };
  const s = S();

  const [totalCount] = await (db.select as any)({ count: sql<number>`COUNT(*)` }).from(s.crmLeads);
  const [totalVal] = await (db.select as any)({ total: sql<number>`COALESCE(SUM("estimatedValue"::numeric), 0)` }).from(s.crmLeads);
  const [wonVal] = await (db.select as any)({ total: sql<number>`COALESCE(SUM("estimatedValue"::numeric), 0)`, count: sql<number>`COUNT(*)` }).from(s.crmLeads).where(eq(s.crmLeads.stage, "won"));
  const [lostCount] = await (db.select as any)({ count: sql<number>`COUNT(*)` }).from(s.crmLeads).where(eq(s.crmLeads.stage, "lost"));

  const leadsBySource = await (db.select as any)({
    source: s.crmLeads.source,
    count: sql<number>`COUNT(*)`,
  }).from(s.crmLeads).groupBy(s.crmLeads.source);

  const leadsByStage = await getCrmLeadsByStage();

  const totalLeads = Number(totalCount?.count ?? 0);
  const wonCountN = Number(wonVal?.count ?? 0);

  return {
    totalLeads,
    totalValue: Number(totalVal?.total ?? 0),
    wonValue: Number(wonVal?.total ?? 0),
    lostCount: Number(lostCount?.count ?? 0),
    conversionRate: totalLeads > 0 ? Math.round((wonCountN / totalLeads) * 100) : 0,
    avgDealSize: wonCountN > 0 ? Math.round(Number(wonVal?.total ?? 0) / wonCountN) : 0,
    leadsBySource: leadsBySource.map((r: any) => ({ ...r, count: Number(r.count ?? 0) })),
    leadsByStage,
  };
}

// ─── Resource Types ─────────────────────────────────────────────────
export async function getResourceTypes() {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().resourceTypes).where(eq(S().resourceTypes.isActive, true)).orderBy(asc(S().resourceTypes.name));
}

export async function getResourceTypeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await (db.select() as any).from(S().resourceTypes).where(eq(S().resourceTypes.id, id)).limit(1);
  return result[0];
}

export async function createResourceType(data: mysqlSchema.InsertResourceType) {
  const db = await getDb();
  if (!db) return null;
  return insertReturningId(db, S().resourceTypes, data);
}

export async function updateResourceType(id: number, data: Partial<mysqlSchema.InsertResourceType>) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().resourceTypes).set(data).where(eq(S().resourceTypes.id, id));
}

export async function deleteResourceType(id: number) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().resourceTypes).set({ isActive: false }).where(eq(S().resourceTypes.id, id));
}

// ─── Resource Rates ─────────────────────────────────────────────────
export async function getResourceRates(resourceTypeId?: number) {
  const db = await getDb();
  if (!db) return [];
  const s = S();
  const conditions = [eq(s.resourceRates.isActive, true)];
  if (resourceTypeId) conditions.push(eq(s.resourceRates.resourceTypeId, resourceTypeId));
  return (db.select() as any).from(s.resourceRates).where(and(...conditions)).orderBy(asc(s.resourceRates.sortOrder));
}

export async function getResourceRateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await (db.select() as any).from(S().resourceRates).where(eq(S().resourceRates.id, id)).limit(1);
  return result[0];
}

export async function createResourceRate(data: mysqlSchema.InsertResourceRate) {
  const db = await getDb();
  if (!db) return null;
  return insertReturningId(db, S().resourceRates, data);
}

export async function updateResourceRate(id: number, data: Partial<mysqlSchema.InsertResourceRate>) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().resourceRates).set(data).where(eq(S().resourceRates.id, id));
}

export async function deleteResourceRate(id: number) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().resourceRates).set({ isActive: false }).where(eq(S().resourceRates.id, id));
}

// ─── Resource Rules ─────────────────────────────────────────────────
export async function getResourceRules(scope?: string) {
  const db = await getDb();
  if (!db) return [];
  const s = S();
  const conditions = [eq(s.resourceRules.isActive, true)];
  if (scope) conditions.push(eq(s.resourceRules.scope, scope as any));
  return (db.select() as any).from(s.resourceRules).where(and(...conditions)).orderBy(asc(s.resourceRules.evaluationOrder));
}

export async function getResourceRuleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await (db.select() as any).from(S().resourceRules).where(eq(S().resourceRules.id, id)).limit(1);
  return result[0];
}

export async function createResourceRule(data: mysqlSchema.InsertResourceRule) {
  const db = await getDb();
  if (!db) return null;
  return insertReturningId(db, S().resourceRules, data);
}

export async function updateResourceRule(id: number, data: Partial<mysqlSchema.InsertResourceRule>) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().resourceRules).set(data).where(eq(S().resourceRules.id, id));
}

export async function deleteResourceRule(id: number) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().resourceRules).set({ isActive: false }).where(eq(S().resourceRules.id, id));
}

// ─── Resource Categories ────────────────────────────────────────────
export async function getResourceCategories() {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().resourceCategories).where(eq(S().resourceCategories.isActive, true)).orderBy(asc(S().resourceCategories.sortOrder));
}

// ─── Booking Policies ───────────────────────────────────────────────
export async function getBookingPolicies() {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().bookingPolicies).where(eq(S().bookingPolicies.isActive, true)).orderBy(asc(S().bookingPolicies.name));
}

export async function getBookingPolicyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await (db.select() as any).from(S().bookingPolicies).where(eq(S().bookingPolicies.id, id)).limit(1);
  return result[0];
}

export async function createBookingPolicy(data: mysqlSchema.InsertBookingPolicy) {
  const db = await getDb();
  if (!db) return null;
  return insertReturningId(db, S().bookingPolicies, data);
}

export async function updateBookingPolicy(id: number, data: Partial<mysqlSchema.InsertBookingPolicy>) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().bookingPolicies).set(data).where(eq(S().bookingPolicies.id, id));
}

export async function deleteBookingPolicy(id: number) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().bookingPolicies).set({ isActive: false }).where(eq(S().bookingPolicies.id, id));
}

// ─── Resource Amenities ─────────────────────────────────────────────
export async function getResourceAmenities() {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().resourceAmenities).where(eq(S().resourceAmenities.isActive, true)).orderBy(asc(S().resourceAmenities.name));
}

export async function getAmenitiesForResource(resourceId: number) {
  const db = await getDb();
  if (!db) return [];
  const maps = await (db.select() as any).from(S().resourceAmenityMap).where(eq(S().resourceAmenityMap.resourceId, resourceId));
  if (maps.length === 0) return [];
  const amenityIds = maps.map((m: any) => m.amenityId);
  return (db.select() as any).from(S().resourceAmenities).where(inArray(S().resourceAmenities.id, amenityIds));
}

export async function setResourceAmenities(resourceId: number, amenityIds: number[]) {
  const db = await getDb();
  if (!db) return;
  await (db.delete as any)(S().resourceAmenityMap).where(eq(S().resourceAmenityMap.resourceId, resourceId));
  for (const amenityId of amenityIds) {
    await (db.insert as any)(S().resourceAmenityMap).values({ resourceId, amenityId });
  }
}

// ─── Resource Schedules ─────────────────────────────────────────────
export async function getResourceSchedules(locationId?: number) {
  const db = await getDb();
  if (!db) return [];
  const s = S();
  const conditions = [eq(s.resourceSchedules.isActive, true)];
  if (locationId) conditions.push(eq(s.resourceSchedules.locationId, locationId));
  return (db.select() as any).from(s.resourceSchedules).where(and(...conditions)).orderBy(asc(s.resourceSchedules.dayOfWeek));
}

export async function updateResourceSchedule(id: number, data: { openTime?: string; closeTime?: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().resourceSchedules).set(data).where(eq(S().resourceSchedules.id, id));
}

export async function createResourceSchedule(data: { resourceId?: number; resourceTypeId?: number; locationId?: number; dayOfWeek: number; openTime: string; closeTime: string }) {
  const db = await getDb();
  if (!db) return;
  await (db.insert as any)(S().resourceSchedules).values(data);
}

// ─── Resource Blocked Dates ─────────────────────────────────────────
export async function getBlockedDates(locationId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (locationId) {
    return (db.select() as any).from(S().resourceBlockedDates).where(eq(S().resourceBlockedDates.locationId, locationId)).orderBy(desc(S().resourceBlockedDates.startDate));
  }
  return (db.select() as any).from(S().resourceBlockedDates).orderBy(desc(S().resourceBlockedDates.startDate));
}

export async function createBlockedDate(data: { resourceId?: number; locationId?: number; startDate: number; endDate: number; reason?: string }) {
  const db = await getDb();
  if (!db) return;
  await (db.insert as any)(S().resourceBlockedDates).values(data);
}

export async function deleteBlockedDate(id: number) {
  const db = await getDb();
  if (!db) return;
  await (db.delete as any)(S().resourceBlockedDates).where(eq(S().resourceBlockedDates.id, id));
}

// ─── CRM: Triggers ──────────────────────────────────────────────────
export async function getCrmTriggers(filters?: { isActive?: boolean; eventType?: string }) {
  const db = await getDb();
  if (!db) return [];
  const rows = await (db.select() as any).from(S().crmTriggers).orderBy(desc(S().crmTriggers.createdAt));
  let result = rows;
  if (filters?.isActive !== undefined) result = result.filter((r: any) => r.isActive === filters.isActive);
  if (filters?.eventType) result = result.filter((r: any) => r.eventType === filters.eventType);
  return result;
}

export async function getCrmTriggerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await (db.select() as any).from(S().crmTriggers).where(eq(S().crmTriggers.id, id));
  return rows[0] || null;
}

export async function createCrmTrigger(data: mysqlSchema.InsertCrmTrigger) {
  const db = await getDb();
  if (!db) return null;
  return insertReturningId(db, S().crmTriggers, data);
}

export async function updateCrmTrigger(id: number, data: Partial<mysqlSchema.InsertCrmTrigger>) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().crmTriggers).set(data).where(eq(S().crmTriggers.id, id));
}

export async function deleteCrmTrigger(id: number) {
  const db = await getDb();
  if (!db) return;
  await (db.delete as any)(S().crmTriggers).where(eq(S().crmTriggers.id, id));
}

export async function addCrmTriggerLog(data: { triggerId: number; leadId?: number; eventData?: any; actionsExecuted?: any; status?: string }) {
  const db = await getDb();
  if (!db) return;
  await (db.insert as any)(S().crmTriggerLogs).values(data as any);
  await (db.update as any)(S().crmTriggers).set({ executionCount: sql`"executionCount" + 1`, lastExecutedAt: new Date() } as any).where(eq(S().crmTriggers.id, data.triggerId));
}

export async function getCrmTriggerLogs(triggerId?: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  if (triggerId) {
    return (db.select() as any).from(S().crmTriggerLogs).where(eq(S().crmTriggerLogs.triggerId, triggerId)).orderBy(desc(S().crmTriggerLogs.executedAt)).limit(limit);
  }
  return (db.select() as any).from(S().crmTriggerLogs).orderBy(desc(S().crmTriggerLogs.executedAt)).limit(limit);
}

// ─── CRM: Website Visitors ─────────────────────────────────────────
export async function getCrmWebsiteVisitors(filters?: { status?: string; isIdentified?: boolean }, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  const rows = await (db.select() as any).from(S().crmWebsiteVisitors).orderBy(desc(S().crmWebsiteVisitors.lastVisitAt)).limit(limit);
  let result = rows;
  if (filters?.status) result = result.filter((r: any) => r.status === filters.status);
  if (filters?.isIdentified !== undefined) result = result.filter((r: any) => r.isIdentified === filters.isIdentified);
  return result;
}

export async function createCrmWebsiteVisitor(data: mysqlSchema.InsertCrmWebsiteVisitor) {
  const db = await getDb();
  if (!db) return null;
  return insertReturningId(db, S().crmWebsiteVisitors, data);
}

export async function updateCrmWebsiteVisitor(id: number, data: Partial<mysqlSchema.InsertCrmWebsiteVisitor>) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().crmWebsiteVisitors).set(data).where(eq(S().crmWebsiteVisitors.id, id));
}

// ─── Member Profiles ────────────────────────────────────────────────
export async function getMemberProfiles(filters?: { tier?: string; search?: string; isActive?: boolean; tags?: string[] }, limit = 200) {
  const db = await getDb();
  if (!db) return [];
  const rows = await (db.select() as any).from(S().memberProfiles).orderBy(desc(S().memberProfiles.createdAt)).limit(limit);
  let result = rows;
  if (filters?.tier) result = result.filter((r: any) => r.tier === filters.tier);
  if (filters?.isActive !== undefined) result = result.filter((r: any) => r.isActive === filters.isActive);
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    result = result.filter((r: any) =>
      r.displayName.toLowerCase().includes(s) ||
      (r.companyName && r.companyName.toLowerCase().includes(s)) ||
      (r.email && r.email.toLowerCase().includes(s))
    );
  }
  if (filters?.tags?.length) {
    result = result.filter((r: any) => r.tags && filters.tags!.some(t => (r.tags as string[]).includes(t)));
  }
  return result;
}

export async function getMemberProfileById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await (db.select() as any).from(S().memberProfiles).where(eq(S().memberProfiles.id, id));
  return rows[0] || null;
}

export async function createMemberProfile(data: mysqlSchema.InsertMemberProfile) {
  const db = await getDb();
  if (!db) return null;
  return insertReturningId(db, S().memberProfiles, data);
}

export async function updateMemberProfile(id: number, data: Partial<mysqlSchema.InsertMemberProfile>) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().memberProfiles).set(data).where(eq(S().memberProfiles.id, id));
}

export async function deleteMemberProfile(id: number) {
  const db = await getDb();
  if (!db) return;
  await (db.delete as any)(S().memberProfiles).where(eq(S().memberProfiles.id, id));
}

export async function getMemberStats() {
  const db = await getDb();
  if (!db) return { total: 0, gebaloteerd: 0, vergaderen: 0, prospect: 0, active: 0 };
  const rows = await (db.select() as any).from(S().memberProfiles);
  return {
    total: rows.length,
    gebaloteerd: rows.filter((r: any) => r.tier === "gebaloteerd").length,
    vergaderen: rows.filter((r: any) => r.tier === "vergaderen").length,
    prospect: rows.filter((r: any) => r.tier === "prospect").length,
    active: rows.filter((r: any) => r.isActive).length,
  };
}

// ─── Re-engagement Funnel ───────────────────────────────────────────
export async function getReengagementEntries(filters?: { stage?: string }, limit = 200) {
  const db = await getDb();
  if (!db) return [];
  const rows = await (db.select() as any).from(S().reengagementFunnel).orderBy(desc(S().reengagementFunnel.createdAt)).limit(limit);
  if (filters?.stage) return rows.filter((r: any) => r.stage === filters.stage);
  return rows;
}

export async function createReengagementEntry(data: mysqlSchema.InsertReengagementEntry) {
  const db = await getDb();
  if (!db) return null;
  return insertReturningId(db, S().reengagementFunnel, data);
}

export async function updateReengagementEntry(id: number, data: Partial<mysqlSchema.InsertReengagementEntry>) {
  const db = await getDb();
  if (!db) return;
  await (db.update as any)(S().reengagementFunnel).set(data).where(eq(S().reengagementFunnel.id, id));
}

export async function getReengagementStats() {
  const db = await getDb();
  if (!db) return { total: 0, identified: 0, invited: 0, opened: 0, applied: 0, accepted: 0, declined: 0 };
  const rows = await (db.select() as any).from(S().reengagementFunnel);
  const stages = ["identified", "invited", "opened", "applied", "interview", "accepted", "declined"] as const;
  const stats: Record<string, number> = { total: rows.length };
  stages.forEach(s => { stats[s] = rows.filter((r: any) => r.stage === s).length; });
  return stats;
}


// ═══════════════════════════════════════════════════════════════════════
// ─── ROZ HUUROVEREENKOMSTEN ────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export async function getRozPricingTiers(filters?: { resourceId?: number; locationId?: number; resourceTypeId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [eq(S().rozPricingTiers.isActive, true)];
  if (filters?.resourceId) conditions.push(eq(S().rozPricingTiers.resourceId, filters.resourceId));
  if (filters?.locationId) conditions.push(eq(S().rozPricingTiers.locationId, filters.locationId));
  if (filters?.resourceTypeId) conditions.push(eq(S().rozPricingTiers.resourceTypeId, filters.resourceTypeId));
  return db.select().from(S().rozPricingTiers).where(and(...conditions)).orderBy(asc(S().rozPricingTiers.sortOrder));
}

export async function getRozPricingTierById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(S().rozPricingTiers).where(eq(S().rozPricingTiers.id, id)).limit(1);
  return result[0];
}

export async function createRozPricingTier(data: any) {
  const db = await getDb();
  if (!db) return null;
  if (_driver === "pg") {
    const result = await db.insert(S().rozPricingTiers).values(data).returning({ id: S().rozPricingTiers.id });
    return result[0]?.id;
  }
  const result = await db.insert(S().rozPricingTiers).values(data);
  return result[0]?.insertId;
}

export async function updateRozPricingTier(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(S().rozPricingTiers).set(data).where(eq(S().rozPricingTiers.id, id));
}

export async function deleteRozPricingTier(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(S().rozPricingTiers).set({ isActive: false }).where(eq(S().rozPricingTiers.id, id));
}

// ─── ROZ Contracts ───
export async function getRozContracts(filters?: { status?: string; resourceId?: number; companyId?: number; userId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(S().rozContracts).orderBy(desc(S().rozContracts.createdAt));
  let result = rows;
  if (filters?.status) result = result.filter((r: any) => r.status === filters.status);
  if (filters?.resourceId) result = result.filter((r: any) => r.resourceId === filters.resourceId);
  if (filters?.companyId) result = result.filter((r: any) => r.companyId === filters.companyId);
  if (filters?.userId) result = result.filter((r: any) => r.userId === filters.userId);
  return result;
}

export async function getRozContractById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(S().rozContracts).where(eq(S().rozContracts.id, id)).limit(1);
  return result[0];
}

export async function createRozContract(data: any) {
  const db = await getDb();
  if (!db) return null;
  if (_driver === "pg") {
    const result = await db.insert(S().rozContracts).values(data).returning({ id: S().rozContracts.id });
    return result[0]?.id;
  }
  const result = await db.insert(S().rozContracts).values(data);
  return result[0]?.insertId;
}

export async function updateRozContract(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(S().rozContracts).set(data).where(eq(S().rozContracts.id, id));
}

// ─── ROZ Invoices ───
export async function getRozInvoices(filters?: { contractId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(S().rozInvoices).orderBy(desc(S().rozInvoices.createdAt));
  let result = rows;
  if (filters?.contractId) result = result.filter((r: any) => r.contractId === filters.contractId);
  if (filters?.status) result = result.filter((r: any) => r.status === filters.status);
  return result;
}

export async function getRozInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(S().rozInvoices).where(eq(S().rozInvoices.id, id)).limit(1);
  return result[0];
}

export async function createRozInvoice(data: any) {
  const db = await getDb();
  if (!db) return null;
  if (_driver === "pg") {
    const result = await db.insert(S().rozInvoices).values(data).returning({ id: S().rozInvoices.id });
    return result[0]?.id;
  }
  const result = await db.insert(S().rozInvoices).values(data);
  return result[0]?.insertId;
}

export async function updateRozInvoice(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(S().rozInvoices).set(data).where(eq(S().rozInvoices.id, id));
}

// ─── ROZ Resource ROZ Settings ───
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
    await db.update(S().resources).set(updateSet).where(eq(S().resources.id, resourceId));
  }
}

// ─── ROZ Stats ───
export async function getRozStats() {
  const db = await getDb();
  if (!db) return { totalContracts: 0, activeContracts: 0, totalMonthlyRevenue: 0, rozEligibleResources: 0 };
  const contracts = await db.select().from(S().rozContracts);
  const rozResources = await db.select().from(S().resources).where(eq(S().resources.isRozEligible, true));
  const active = contracts.filter((c: any) => c.status === "active");
  const monthlyRevenue = active.reduce((sum: number, c: any) => sum + parseFloat(c.monthlyRentCredits) + parseFloat(c.monthlyServiceCharge || "0"), 0);
  return {
    totalContracts: contracts.length,
    activeContracts: active.length,
    totalMonthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
    rozEligibleResources: rozResources.length,
  };
}

// ─── Resource CRUD ──────────────────────────────────────────────────
export async function getAllResources() {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().resources).orderBy(asc(S().resources.locationId), asc(S().resources.type), asc(S().resources.name));
}

export async function createResource(data: {
  locationId: number;
  name: string;
  type: string;
  zone: string;
  capacity?: number;
  floor?: string;
  creditCostPerHour: string;
  imageUrl?: string;
  areaM2?: string;
  amenities?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await (db.insert(S().resources).values(data) as any).returning();
  return result;
}

export async function updateResource(id: number, data: {
  name?: string;
  type?: string;
  zone?: string;
  capacity?: number;
  floor?: string;
  creditCostPerHour?: string;
  imageUrl?: string;
  isActive?: boolean;
  areaM2?: string;
  amenities?: string[];
  isRozEligible?: boolean;
  rozContractType?: string;
  rozServiceChargeModel?: string;
  rozVatRate?: string;
  rozIndexation?: string;
  rozIndexationPct?: string;
  rozTenantProtection?: boolean;
  rozMinLeaseTerm?: number;
  rozNoticePeriodMonths?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await (db.update(S().resources) as any).set(data).where(eq(S().resources.id, id));
  return { id };
}

export async function deleteResource(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await (db.update(S().resources) as any).set({ isActive: false }).where(eq(S().resources.id, id));
  return { id };
}


// ═══════════════════════════════════════════════════════════════════════
// Credit System Upgrade — Packages, Budget Controls, Commit Contracts, Bonuses
// ═══════════════════════════════════════════════════════════════════════

// ─── Credit Packages ────────────────────────────────────────────────
export async function getCreditPackages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(S().creditPackages).where(eq(S().creditPackages.isActive, true)).orderBy(asc(S().creditPackages.sortOrder));
}
export async function getCreditPackageById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(S().creditPackages).where(eq(S().creditPackages.id, id)).limit(1);
  return result[0];
}
export async function getCreditPackageBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(S().creditPackages).where(eq(S().creditPackages.slug, slug)).limit(1);
  return result[0];
}
export async function createCreditPackage(data: any) {
  const db = await getDb();
  if (!db) return null;
  if (_driver === "pg") {
    const result = await db.insert(S().creditPackages).values(data).returning({ id: S().creditPackages.id });
    return result[0]?.id;
  }
  const result = await db.insert(S().creditPackages).values(data);
  return (result as any)[0]?.insertId;
}
export async function updateCreditPackage(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(S().creditPackages).set(data).where(eq(S().creditPackages.id, id));
}
export async function deleteCreditPackage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(S().creditPackages).set({ isActive: false }).where(eq(S().creditPackages.id, id));
}
export async function purchasePackage(walletId: number, packageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const pkg = await getCreditPackageById(packageId);
  if (!pkg) throw new Error("Package not found");
  const wallet = await getWalletById(walletId);
  if (!wallet) throw new Error("Wallet not found");
  const newBalance = (parseFloat(wallet.balance ?? "0") + (pkg as any).credits).toFixed(2);
  await db.update(S().wallets).set({ balance: newBalance }).where(eq(S().wallets.id, walletId));
  await (db.insert as any)(S().creditLedger).values({
    walletId,
    type: "topup",
    amount: String((pkg as any).credits),
    balanceAfter: newBalance,
    description: `Purchased package: ${(pkg as any).name}`,
    referenceType: "credit_package",
    referenceId: packageId,
    source: "package",
    packageId,
  });
  return { newBalance, credits: (pkg as any).credits };
}

// ─── Budget Controls ────────────────────────────────────────────────
export async function getBudgetControlsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(S().budgetControls).where(eq(S().budgetControls.companyId, companyId)).orderBy(desc(S().budgetControls.createdAt));
}
export async function getBudgetControlsByWallet(walletId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(S().budgetControls).where(eq(S().budgetControls.walletId, walletId)).orderBy(desc(S().budgetControls.createdAt));
}
export async function createBudgetControl(data: any) {
  const db = await getDb();
  if (!db) return null;
  if (_driver === "pg") {
    const result = await db.insert(S().budgetControls).values(data).returning({ id: S().budgetControls.id });
    return result[0]?.id;
  }
  const result = await db.insert(S().budgetControls).values(data);
  return (result as any)[0]?.insertId;
}
export async function updateBudgetControl(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(S().budgetControls).set(data).where(eq(S().budgetControls.id, id));
}
export async function deleteBudgetControl(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(S().budgetControls).set({ isActive: false }).where(eq(S().budgetControls.id, id));
}
export async function checkBudgetAllowance(walletId: number, userId: number, amount: number, resourceType?: string, locationId?: number) {
  const db = await getDb();
  if (!db) return { allowed: true, reason: null };
  const controls = await db.select().from(S().budgetControls)
    .where(and(eq(S().budgetControls.walletId, walletId), eq(S().budgetControls.isActive, true)));
  for (const ctrl of controls) {
    const c = ctrl as any;
    if (c.controlType === "per_employee_cap" && c.targetUserId === userId) {
      if (c.capAmount && parseFloat(c.currentSpend ?? "0") + amount > parseFloat(c.capAmount)) {
        return { allowed: false, reason: `Employee cap exceeded (${c.capAmount} per ${c.periodType})` };
      }
    }
    if (c.controlType === "location_restriction" && locationId && c.allowedLocationIds) {
      if (!c.allowedLocationIds.includes(locationId)) {
        return { allowed: false, reason: "Location not allowed by budget control" };
      }
    }
    if (c.controlType === "resource_type_restriction" && resourceType && c.allowedResourceTypes) {
      if (!c.allowedResourceTypes.includes(resourceType)) {
        return { allowed: false, reason: "Resource type not allowed by budget control" };
      }
    }
    if (c.controlType === "approval_threshold" && c.approvalThreshold) {
      if (amount > parseFloat(c.approvalThreshold)) {
        return { allowed: false, reason: `Amount exceeds approval threshold (${c.approvalThreshold})` };
      }
    }
  }
  return { allowed: true, reason: null };
}

// ─── Commit Contracts ───────────────────────────────────────────────
export async function getCommitContractsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(S().commitContracts).where(eq(S().commitContracts.companyId, companyId)).orderBy(desc(S().commitContracts.createdAt));
}
export async function getCommitContractById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(S().commitContracts).where(eq(S().commitContracts.id, id)).limit(1);
  return result[0];
}
export async function createCommitContract(data: any) {
  const db = await getDb();
  if (!db) return null;
  if (_driver === "pg") {
    const result = await db.insert(S().commitContracts).values(data).returning({ id: S().commitContracts.id });
    return result[0]?.id;
  }
  const result = await db.insert(S().commitContracts).values(data);
  return (result as any)[0]?.insertId;
}
export async function updateCommitContract(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(S().commitContracts).set(data).where(eq(S().commitContracts.id, id));
}
export async function getCommitContractUtilization(id: number) {
  const contract = await getCommitContractById(id);
  if (!contract) return null;
  const c = contract as any;
  const totalCommit = parseFloat(c.totalCommitCredits ?? "0");
  const drawdown = parseFloat(c.drawdownUsed ?? "0");
  const elapsed = Date.now() - (c.startDate ?? 0);
  const totalDuration = (c.endDate ?? 0) - (c.startDate ?? 0);
  const timePercent = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
  const usagePercent = totalCommit > 0 ? (drawdown / totalCommit) * 100 : 0;
  return {
    totalCommitCredits: totalCommit,
    drawdownUsed: drawdown,
    remaining: totalCommit - drawdown,
    usagePercent: Math.round(usagePercent * 100) / 100,
    timePercent: Math.min(Math.round(timePercent * 100) / 100, 100),
    onTrack: usagePercent <= timePercent + 10,
    monthlyAllocation: parseFloat(c.monthlyAllocation ?? "0"),
  };
}
export async function checkCommitTrueUp(id: number) {
  const util = await getCommitContractUtilization(id);
  if (!util) return null;
  const shortfall = util.totalCommitCredits - util.drawdownUsed;
  return {
    ...util,
    shortfall: shortfall > 0 ? shortfall : 0,
    trueUpRequired: shortfall > 0 && util.timePercent >= 100,
  };
}

// ─── Credit Bonuses ─────────────────────────────────────────────────
export async function getCreditBonusesByWallet(walletId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(S().creditBonuses).where(eq(S().creditBonuses.walletId, walletId)).orderBy(desc(S().creditBonuses.createdAt));
}
export async function getPendingBonuses(walletId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(S().creditBonuses)
    .where(and(eq(S().creditBonuses.walletId, walletId), eq(S().creditBonuses.isApplied, false)))
    .orderBy(desc(S().creditBonuses.createdAt));
}
export async function createCreditBonus(data: any) {
  const db = await getDb();
  if (!db) return null;
  if (_driver === "pg") {
    const result = await db.insert(S().creditBonuses).values(data).returning({ id: S().creditBonuses.id });
    return result[0]?.id;
  }
  const result = await db.insert(S().creditBonuses).values(data);
  return (result as any)[0]?.insertId;
}
export async function applyBonus(bonusId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const bonusResult = await db.select().from(S().creditBonuses).where(eq(S().creditBonuses.id, bonusId)).limit(1);
  const bonus = bonusResult[0] as any;
  if (!bonus) throw new Error("Bonus not found");
  if (bonus.isApplied) throw new Error("Bonus already applied");
  if (!bonus.walletId) throw new Error("Bonus has no wallet assigned");
  const wallet = await getWalletById(bonus.walletId);
  if (!wallet) throw new Error("Wallet not found");
  const newBalance = (parseFloat(wallet.balance ?? "0") + parseFloat(bonus.amount ?? "0")).toFixed(2);
  await db.update(S().wallets).set({ balance: newBalance }).where(eq(S().wallets.id, bonus.walletId));
  await db.update(S().creditBonuses).set({ isApplied: true, appliedAt: new Date() }).where(eq(S().creditBonuses.id, bonusId));
  await (db.insert as any)(S().creditLedger).values({
    walletId: bonus.walletId,
    type: "topup",
    amount: bonus.amount,
    balanceAfter: newBalance,
    description: `Bonus applied: ${bonus.bonusType} - ${bonus.description ?? ""}`,
    source: "bonus",
  });
  return { newBalance, amount: bonus.amount };
}
export async function createReferralBonus(referrerUserId: number, referredCompanyId: number, amount?: number) {
  const bonusAmount = amount ?? 50;
  return createCreditBonus({
    bonusType: "referral",
    userId: referrerUserId,
    referredCompanyId,
    amount: String(bonusAmount),
    description: `Referral bonus for company #${referredCompanyId}`,
  });
}

// ─── Credit Admin Stats ─────────────────────────────────────────────
export async function getCreditSystemStats() {
  const db = await getDb();
  if (!db) return { totalWallets: 0, totalBalance: 0, totalPackagesSold: 0, activeBundles: 0, activeContracts: 0, pendingBonuses: 0 };
  const walletStats = await (db.select as any)({
    totalWallets: sql<number>`COUNT(*)`,
    totalBalance: sql<number>`COALESCE(SUM(CAST(balance AS DECIMAL(12,2))), 0)`,
  }).from(S().wallets);
  const bundleCount = await (db.select as any)({
    count: sql<number>`COUNT(*)`,
  }).from(S().creditBundles).where(eq(S().creditBundles.isActive, true));
  const packageCount = await (db.select as any)({
    count: sql<number>`COUNT(*)`,
  }).from(S().creditPackages).where(eq(S().creditPackages.isActive, true));
  let activeContracts = 0;
  try {
    const contractCount = await (db.select as any)({
      count: sql<number>`COUNT(*)`,
    }).from(S().commitContracts).where(eq(S().commitContracts.commitStatus, "active"));
    activeContracts = contractCount[0]?.count ?? 0;
  } catch { /* table may not exist yet */ }
  let pendingBonuses = 0;
  try {
    const bonusCount = await (db.select as any)({
      count: sql<number>`COUNT(*)`,
    }).from(S().creditBonuses).where(eq(S().creditBonuses.isApplied, false));
    pendingBonuses = bonusCount[0]?.count ?? 0;
  } catch { /* table may not exist yet */ }
  return {
    totalWallets: walletStats[0]?.totalWallets ?? 0,
    totalBalance: walletStats[0]?.totalBalance ?? 0,
    totalPackagesSold: packageCount[0]?.count ?? 0,
    activeBundles: bundleCount[0]?.count ?? 0,
    activeContracts,
    pendingBonuses,
  };
}
export async function getEnhancedLedgerSummary(walletId: number) {
  const basic = await getLedgerSummary(walletId);
  const db = await getDb();
  if (!db) return { ...basic, totalBonuses: 0, totalPackagePurchases: 0 };
  const enhanced = await (db.select as any)({
    totalBonuses: sql<number>`COALESCE(SUM(CASE WHEN source = 'bonus' THEN amount ELSE 0 END), 0)`,
    totalPackagePurchases: sql<number>`COALESCE(SUM(CASE WHEN source = 'package' THEN amount ELSE 0 END), 0)`,
  }).from(S().creditLedger).where(eq(S().creditLedger.walletId, walletId));
  return {
    ...basic,
    totalBonuses: enhanced[0]?.totalBonuses ?? 0,
    totalPackagePurchases: enhanced[0]?.totalPackagePurchases ?? 0,
  };
}

// ─── Delete CRM Website Visitor ──────────────────────────────────
export async function deleteCrmWebsiteVisitor(id: number) {
  const db = await getDb();
  if (!db) return false;
  await (db.delete(S().crmWebsiteVisitors) as any).where(eq(S().crmWebsiteVisitors.id, id));
  return true;
}


// ─── Credit Consumption (stub for booking flow) ──────────────────
export async function consumeCredits(walletId: number, amount: number, description: string) {
  const db = await getDb();
  if (!db) return false;
  // Deduct from wallet balance
  await (db.update(S().wallets) as any)
    .set({ balance: sql`${S().wallets.balance} - ${String(amount)}` })
    .where(eq(S().wallets.id, walletId));
  // Record in ledger
  await (db.insert(S().creditLedger) as any).values({
    walletId,
    amount: String(-amount),
    type: "usage",
    description,
    createdAt: new Date(),
  });
  return true;
}

// ─── Support Tickets (stub) ──────────────────────────────────────
export async function createTicket(data: { userId: number; subject: string; message?: string; category?: string }) {
  // Stub - support tickets table not yet created
  return { id: 1, ...data, status: "open", createdAt: new Date() };
}

export async function getTicketsByUser(userId: number) {
  // Stub - support tickets table not yet created
  return [];
}

// ─── Missing functions from mega-merge PRs ─────────────────────────

export async function getBundleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await (db.select() as any).from(S().creditBundles).where(eq(S().creditBundles.slug, slug)).limit(1);
  return result[0] || null;
}

export async function getBundleById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await (db.select() as any).from(S().creditBundles).where(eq(S().creditBundles.id, id)).limit(1);
  return result[0] || null;
}

export async function createBundle(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await (db.insert as any)(S().creditBundles).values(data).returning();
  return result[0];
}

export async function updateBundle(id: number, data: any) {
  const db = await getDb();
  if (!db) return { success: false };
  await (db.update as any)(S().creditBundles).set({ ...data, updatedAt: new Date() }).where(eq(S().creditBundles.id, id));
  return { success: true };
}

export async function getWalletDetailedBalance(walletId: number) {
  const db = await getDb();
  if (!db) return null;
  const wallet = await (db.select() as any).from(S().wallets).where(eq(S().wallets.id, walletId)).limit(1);
  if (!wallet[0]) return null;
  const ledger = await (db.select() as any).from(S().creditLedger).where(eq(S().creditLedger.walletId, walletId)).orderBy(desc(S().creditLedger.createdAt)).limit(20);
  return { ...wallet[0], recentTransactions: ledger };
}

export async function setWalletAutoTopUp(walletId: number, enabled: boolean, threshold?: number, amount?: number) {
  const db = await getDb();
  if (!db) return { success: false };
  await (db.update as any)(S().wallets).set({
    autoTopUpEnabled: enabled,
    autoTopUpThreshold: threshold?.toString() ?? null,
    autoTopUpAmount: amount?.toString() ?? null,
    updatedAt: new Date(),
  }).where(eq(S().wallets.id, walletId));
  return { success: true };
}

export async function processMonthlyRollover(walletId: number) {
  const db = await getDb();
  if (!db) return { success: false, reason: "No database" };
  const wallet = await (db.select() as any).from(S().wallets).where(eq(S().wallets.id, walletId)).limit(1);
  if (!wallet[0]) return { success: false, reason: "Wallet not found" };
  return { success: true, walletId, rolled: true };
}

// (getAllResources, createResource, updateResource, deleteResource, getResourceTypeDistribution already defined above)

// ─── Visitor tracking aliases (GitHub PR used different names) ──────

export async function getRecentWebsiteVisitors(limit: number = 50) {
  return getCrmWebsiteVisitors({}, limit);
}

export async function createWebsiteVisitor(data: any) {
  return createCrmWebsiteVisitor(data);
}

export async function getWebsiteVisitors(filters?: any) {
  return getCrmWebsiteVisitors(filters || {});
}

export async function updateWebsiteVisitor(id: number, data: any) {
  return updateCrmWebsiteVisitor(id, data);
}

export async function getWebsiteVisitorById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await (db.select() as any).from(S().crmWebsiteVisitors).where(eq(S().crmWebsiteVisitors.id, id)).limit(1);
  return result[0] || null;
}

export async function getVisitorsByIp(ip: string) {
  const db = await getDb();
  if (!db) return [];
  return (db.select() as any).from(S().crmWebsiteVisitors).where(eq(S().crmWebsiteVisitors.ipAddress, ip)).orderBy(desc(S().crmWebsiteVisitors.createdAt));
}

export async function deleteWebsiteVisitor(id: number) {
  return deleteCrmWebsiteVisitor(id);
}
