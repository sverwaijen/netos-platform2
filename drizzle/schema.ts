import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "user", "guest"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  companyId: int("companyId"),
  invitedBy: int("invitedBy"),
  onboardingComplete: boolean("onboardingComplete").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Locations ───────────────────────────────────────────────────────
export const locations = mysqlTable("locations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  address: text("address").notNull(),
  city: varchar("city", { length: 64 }).notNull(),
  postalCode: varchar("postalCode", { length: 12 }),
  lat: decimal("lat", { precision: 10, scale: 6 }),
  lng: decimal("lng", { precision: 10, scale: 6 }),
  imageUrl: text("imageUrl"),
  totalResources: int("totalResources").default(0),
  isActive: boolean("isActive").default(true),
  timezone: varchar("timezone", { length: 64 }).default("Europe/Amsterdam"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Location = typeof locations.$inferSelect;

// ─── Resources ───────────────────────────────────────────────────────
export const resources = mysqlTable("resources", {
  id: int("id").autoincrement().primaryKey(),
  locationId: int("locationId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  type: mysqlEnum("type", [
    "desk",
    "meeting_room",
    "private_office",
    "open_space",
    "locker",
    "gym",
    "phone_booth",
    "event_space",
  ]).notNull(),
  zone: mysqlEnum("zone", ["zone_0", "zone_1", "zone_2", "zone_3"]).notNull(),
  capacity: int("capacity").default(1),
  floor: varchar("floor", { length: 16 }),
  amenities: json("amenities").$type<string[]>(),
  creditCostPerHour: decimal("creditCostPerHour", { precision: 8, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  isActive: boolean("isActive").default(true),
  mapX: decimal("mapX", { precision: 6, scale: 2 }),
  mapY: decimal("mapY", { precision: 6, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Resource = typeof resources.$inferSelect;

// ─── Companies ───────────────────────────────────────────────────────
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#1a1a2e"),
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#e94560"),
  memberCount: int("memberCount").default(0),
  tier: mysqlEnum("tier", ["bronze", "silver", "gold"]).default("bronze"),
  totalSpend: decimal("totalSpend", { precision: 12, scale: 2 }).default("0"),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).default("5"),
  isActive: boolean("isActive").default(true),
  auth0OrgId: varchar("auth0OrgId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;

// ─── Credit Bundles (Subscription Plans) ─────────────────────────────
export const creditBundles = mysqlTable("credit_bundles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  creditsPerMonth: int("creditsPerMonth").notNull(),
  priceEur: decimal("priceEur", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  features: json("features").$type<string[]>(),
  isPopular: boolean("isPopular").default(false),
  isActive: boolean("isActive").default(true),
  stripeProductId: varchar("stripeProductId", { length: 128 }),
  stripePriceId: varchar("stripePriceId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditBundle = typeof creditBundles.$inferSelect;

// ─── Wallets ─────────────────────────────────────────────────────────
export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["company", "personal"]).notNull(),
  ownerId: int("ownerId").notNull(), // userId for personal, companyId for company
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0").notNull(),
  rolloverBalance: decimal("rolloverBalance", { precision: 12, scale: 2 }).default("0"),
  bundleId: int("bundleId"),
  maxRollover: int("maxRollover").default(0),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wallet = typeof wallets.$inferSelect;

// ─── Credit Ledger (Double-Entry) ────────────────────────────────────
export const creditLedger = mysqlTable("credit_ledger", {
  id: int("id").autoincrement().primaryKey(),
  walletId: int("walletId").notNull(),
  type: mysqlEnum("type", [
    "grant",
    "spend",
    "rollover",
    "breakage",
    "topup",
    "refund",
    "transfer",
  ]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  balanceAfter: decimal("balanceAfter", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  referenceType: varchar("referenceType", { length: 64 }),
  referenceId: int("referenceId"),
  multiplier: decimal("multiplier", { precision: 4, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditLedgerEntry = typeof creditLedger.$inferSelect;

// ─── Bookings ────────────────────────────────────────────────────────
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  resourceId: int("resourceId").notNull(),
  locationId: int("locationId").notNull(),
  walletId: int("walletId"),
  startTime: bigint("startTime", { mode: "number" }).notNull(),
  endTime: bigint("endTime", { mode: "number" }).notNull(),
  creditsCost: decimal("creditsCost", { precision: 10, scale: 2 }).notNull(),
  multiplierApplied: decimal("multiplierApplied", { precision: 4, scale: 2 }).default("1.00"),
  status: mysqlEnum("status", [
    "confirmed",
    "checked_in",
    "completed",
    "cancelled",
    "no_show",
  ])
    .default("confirmed")
    .notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;

// ─── Day Multipliers ─────────────────────────────────────────────────
export const dayMultipliers = mysqlTable("day_multipliers", {
  id: int("id").autoincrement().primaryKey(),
  locationId: int("locationId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0=Sunday, 1=Monday, ...
  multiplier: decimal("multiplier", { precision: 4, scale: 2 }).notNull(),
  isActive: boolean("isActive").default(true),
});

export type DayMultiplier = typeof dayMultipliers.$inferSelect;

// ─── Visitors ────────────────────────────────────────────────────────
export const visitors = mysqlTable("visitors", {
  id: int("id").autoincrement().primaryKey(),
  invitedByUserId: int("invitedByUserId").notNull(),
  companyId: int("companyId"),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  licensePlate: varchar("licensePlate", { length: 20 }),
  visitDate: bigint("visitDate", { mode: "number" }).notNull(),
  locationId: int("locationId").notNull(),
  status: mysqlEnum("status", ["invited", "checked_in", "checked_out", "cancelled"])
    .default("invited")
    .notNull(),
  accessToken: varchar("accessToken", { length: 128 }),
  deepLinkSent: boolean("deepLinkSent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Visitor = typeof visitors.$inferSelect;

// ─── Company Branding (Signing Platform) ─────────────────────────────
export const companyBranding = mysqlTable("company_branding", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#1a1a2e"),
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#e94560"),
  welcomeMessage: text("welcomeMessage"),
  backgroundImageUrl: text("backgroundImageUrl"),
  isActive: boolean("isActive").default(true),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompanyBranding = typeof companyBranding.$inferSelect;

// ─── Employee Photos (Signing Platform) ──────────────────────────────
export const employeePhotos = mysqlTable("employee_photos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyId: int("companyId").notNull(),
  photoUrl: text("photoUrl").notNull(),
  displayName: varchar("displayName", { length: 128 }),
  jobTitle: varchar("jobTitle", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmployeePhoto = typeof employeePhotos.$inferSelect;

// ─── Devices (NETOS Netlink IoT) ─────────────────────────────────────
export const devices = mysqlTable("devices", {
  id: int("id").autoincrement().primaryKey(),
  locationId: int("locationId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  type: mysqlEnum("type", ["netlink", "display", "sensor_hub", "door_controller"]).notNull(),
  serialNumber: varchar("serialNumber", { length: 128 }),
  status: mysqlEnum("status", ["online", "offline", "maintenance"]).default("online"),
  lastPing: timestamp("lastPing"),
  firmwareVersion: varchar("firmwareVersion", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Device = typeof devices.$inferSelect;

// ─── Sensors ─────────────────────────────────────────────────────────
export const sensors = mysqlTable("sensors", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: int("deviceId").notNull(),
  resourceId: int("resourceId"),
  type: mysqlEnum("type", ["occupancy", "temperature", "humidity", "co2", "light", "motion"]).notNull(),
  currentValue: decimal("currentValue", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 16 }),
  lastReading: timestamp("lastReading"),
  isActive: boolean("isActive").default(true),
});

export type Sensor = typeof sensors.$inferSelect;

// ─── Access Log (Salto KS Audit Trail) ───────────────────────────────
export const accessLog = mysqlTable("access_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  resourceId: int("resourceId"),
  locationId: int("locationId").notNull(),
  zone: mysqlEnum("zone", ["zone_0", "zone_1", "zone_2", "zone_3"]),
  action: mysqlEnum("action", ["entry", "exit", "denied", "key_provisioned"]).notNull(),
  method: mysqlEnum("method", ["ble", "nfc", "qr", "manual"]),
  saltoEventId: varchar("saltoEventId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AccessLogEntry = typeof accessLog.$inferSelect;

// ─── Notifications ───────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  type: mysqlEnum("type", [
    "enterprise_signup",
    "breakage_milestone",
    "occupancy_anomaly",
    "credit_inflation",
    "monthly_report",
    "booking_reminder",
    "visitor_arrival",
    "system",
  ]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message"),
  isRead: boolean("isRead").default(false),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ─── Invites ─────────────────────────────────────────────────────────
export const invites = mysqlTable("invites", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  companyId: int("companyId"),
  invitedByUserId: int("invitedByUserId"),
  role: mysqlEnum("role", ["admin", "user", "guest"]).default("user"),
  token: varchar("token", { length: 128 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "accepted", "expired"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type Invite = typeof invites.$inferSelect;

// ─── CRM: Leads ─────────────────────────────────────────────────────
export const crmLeads = mysqlTable("crm_leads", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 256 }).notNull(),
  contactName: varchar("contactName", { length: 256 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  companySize: varchar("companySize", { length: 32 }),
  industry: varchar("industry", { length: 128 }),
  website: varchar("website", { length: 512 }),
  locationPreference: varchar("locationPreference", { length: 128 }),
  budgetRange: varchar("budgetRange", { length: 64 }),
  source: mysqlEnum("source", [
    "website",
    "referral",
    "event",
    "cold_outreach",
    "linkedin",
    "partner",
    "inbound",
    "other",
  ]).default("inbound"),
  stage: mysqlEnum("stage", [
    "new",
    "qualified",
    "tour_scheduled",
    "proposal",
    "negotiation",
    "won",
    "lost",
  ]).default("new").notNull(),
  score: int("score").default(0),
  estimatedValue: decimal("estimatedValue", { precision: 12, scale: 2 }),
  assignedToUserId: int("assignedToUserId"),
  notes: text("notes"),
  lostReason: text("lostReason"),
  wonDate: timestamp("wonDate"),
  nextFollowUp: bigint("nextFollowUp", { mode: "number" }),
  tags: json("tags").$type<string[]>(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmLead = typeof crmLeads.$inferSelect;
export type InsertCrmLead = typeof crmLeads.$inferInsert;

// ─── CRM: Lead Activities ───────────────────────────────────────────
export const crmLeadActivities = mysqlTable("crm_lead_activities", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  userId: int("userId"),
  type: mysqlEnum("type", [
    "note",
    "email_sent",
    "email_opened",
    "email_clicked",
    "email_replied",
    "call",
    "meeting",
    "tour",
    "proposal_sent",
    "stage_change",
    "score_change",
    "task",
  ]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrmLeadActivity = typeof crmLeadActivities.$inferSelect;

// ─── CRM: Campaigns ────────────────────────────────────────────────
export const crmCampaigns = mysqlTable("crm_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["email_sequence", "one_off", "drip", "event"]).default("email_sequence"),
  status: mysqlEnum("status", ["draft", "active", "paused", "completed", "archived"]).default("draft").notNull(),
  targetAudience: text("targetAudience"),
  totalLeads: int("totalLeads").default(0),
  sentCount: int("sentCount").default(0),
  openCount: int("openCount").default(0),
  clickCount: int("clickCount").default(0),
  replyCount: int("replyCount").default(0),
  conversionCount: int("conversionCount").default(0),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmCampaign = typeof crmCampaigns.$inferSelect;
export type InsertCrmCampaign = typeof crmCampaigns.$inferInsert;

// ─── CRM: Campaign Steps (Email Sequence Steps) ────────────────────
export const crmCampaignSteps = mysqlTable("crm_campaign_steps", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  stepOrder: int("stepOrder").notNull(),
  delayDays: int("delayDays").default(0),
  subject: varchar("subject", { length: 512 }),
  body: text("body"),
  isAiGenerated: boolean("isAiGenerated").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrmCampaignStep = typeof crmCampaignSteps.$inferSelect;

// ─── CRM: Campaign Enrollments ─────────────────────────────────────
export const crmCampaignEnrollments = mysqlTable("crm_campaign_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  leadId: int("leadId").notNull(),
  currentStepId: int("currentStepId"),
  status: mysqlEnum("status", ["active", "completed", "paused", "bounced", "unsubscribed"]).default("active").notNull(),
  nextSendAt: bigint("nextSendAt", { mode: "number" }),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type CrmCampaignEnrollment = typeof crmCampaignEnrollments.$inferSelect;

// ─── CRM: Email Templates ──────────────────────────────────────────
export const crmEmailTemplates = mysqlTable("crm_email_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  subject: varchar("subject", { length: 512 }).notNull(),
  body: text("body").notNull(),
  category: varchar("category", { length: 64 }),
  isAiGenerated: boolean("isAiGenerated").default(false),
  usageCount: int("usageCount").default(0),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmEmailTemplate = typeof crmEmailTemplates.$inferSelect;
