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
  primaryColor: varchar("primaryColor", { length: 9 }).default("#1a1a2e"),
  secondaryColor: varchar("secondaryColor", { length: 9 }).default("#e94560"),
  accentColor: varchar("accentColor", { length: 9 }).default("#b8a472"),
  fontFamily: varchar("fontFamily", { length: 128 }).default("Montserrat"),
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

// ─── Resource Types (Nexudus-style shared rate templates) ───────────
export const resourceTypes = mysqlTable("resource_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  defaultCapacity: int("defaultCapacity").default(1),
  chargingUnit: mysqlEnum("chargingUnit", ["per_hour", "per_day", "per_use", "per_week", "per_month"]).default("per_hour").notNull(),
  timeSlotMinutes: int("timeSlotMinutes").default(15),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResourceType = typeof resourceTypes.$inferSelect;
export type InsertResourceType = typeof resourceTypes.$inferInsert;

// ─── Resource Rates (Multi-rate pricing per resource type) ──────────
export const resourceRates = mysqlTable("resource_rates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  resourceTypeId: int("resourceTypeId").notNull(),
  creditCost: decimal("creditCost", { precision: 10, scale: 2 }).notNull(),
  chargingUnit: mysqlEnum("chargingUnit", ["per_hour", "per_day", "per_use", "per_week", "per_month"]).default("per_hour").notNull(),
  maxPriceCap: decimal("maxPriceCap", { precision: 10, scale: 2 }),
  initialFixedCost: decimal("initialFixedCost", { precision: 10, scale: 2 }),
  initialFixedMinutes: int("initialFixedMinutes"),
  perAttendeePricing: boolean("perAttendeePricing").default(false),
  isDefault: boolean("isDefault").default(false),
  appliesToCustomerType: mysqlEnum("appliesToCustomerType", ["all", "members_only", "guests_only", "specific_plans", "specific_tiers"]).default("all"),
  appliesToTiers: json("appliesToTiers").$type<string[]>(),
  appliesToBundleIds: json("appliesToBundleIds").$type<number[]>(),
  creditCostInCredits: int("creditCostInCredits"),
  validDaysOfWeek: json("validDaysOfWeek").$type<number[]>(),
  validTimeStart: varchar("validTimeStart", { length: 5 }),
  validTimeEnd: varchar("validTimeEnd", { length: 5 }),
  validFromDate: bigint("validFromDate", { mode: "number" }),
  validToDate: bigint("validToDate", { mode: "number" }),
  maxBookingLengthMinutes: int("maxBookingLengthMinutes"),
  isActive: boolean("isActive").default(true),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResourceRate = typeof resourceRates.$inferSelect;
export type InsertResourceRate = typeof resourceRates.$inferInsert;

// ─── Resource Rules (Condition + Limit engine) ──────────────────────
export const resourceRules = mysqlTable("resource_rules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  scope: mysqlEnum("scope", ["global", "individual"]).default("individual").notNull(),
  resourceId: int("resourceId"),
  resourceTypeId: int("resourceTypeId"),
  conditionType: mysqlEnum("conditionType", [
    "customer_type",
    "plan_type",
    "tier_type",
    "time_of_day",
    "day_of_week",
    "advance_booking",
    "booking_length",
    "zone_access",
  ]).notNull(),
  conditionValue: json("conditionValue").$type<Record<string, unknown>>(),
  limitType: mysqlEnum("limitType", [
    "block_booking",
    "restrict_hours",
    "max_duration",
    "min_duration",
    "max_advance_days",
    "min_advance_hours",
    "max_bookings_per_day",
    "max_bookings_per_week",
    "require_approval",
  ]).notNull(),
  limitValue: json("limitValue").$type<Record<string, unknown>>(),
  evaluationOrder: int("evaluationOrder").default(0),
  stopEvaluation: boolean("stopEvaluation").default(false),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResourceRule = typeof resourceRules.$inferSelect;
export type InsertResourceRule = typeof resourceRules.$inferInsert;

// ─── Resource Categories ────────────────────────────────────────────
export const resourceCategories = mysqlTable("resource_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResourceCategory = typeof resourceCategories.$inferSelect;

// ─── Booking Policies (Global + Per-Location) ──────────────────────
export const bookingPolicies = mysqlTable("booking_policies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  locationId: int("locationId"),
  resourceTypeId: int("resourceTypeId"),
  bufferMinutes: int("bufferMinutes").default(0),
  minAdvanceMinutes: int("minAdvanceMinutes").default(0),
  maxAdvanceDays: int("maxAdvanceDays").default(90),
  minDurationMinutes: int("minDurationMinutes").default(15),
  maxDurationMinutes: int("maxDurationMinutes").default(480),
  freeCancelMinutes: int("freeCancelMinutes").default(1440),
  lateCancelFeePercent: int("lateCancelFeePercent").default(50),
  noShowFeePercent: int("noShowFeePercent").default(100),
  autoCheckInMinutes: int("autoCheckInMinutes").default(15),
  autoCancelNoCheckIn: boolean("autoCancelNoCheckIn").default(true),
  allowRecurring: boolean("allowRecurring").default(true),
  requireApproval: boolean("requireApproval").default(false),
  allowGuestBooking: boolean("allowGuestBooking").default(false),
  maxAttendeesOverride: int("maxAttendeesOverride"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BookingPolicy = typeof bookingPolicies.$inferSelect;
export type InsertBookingPolicy = typeof bookingPolicies.$inferInsert;

// ─── Resource Amenities ─────────────────────────────────────────────
export const resourceAmenities = mysqlTable("resource_amenities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  icon: varchar("icon", { length: 64 }),
  category: mysqlEnum("category", ["tech", "furniture", "comfort", "accessibility", "catering"]).default("tech"),
  isActive: boolean("isActive").default(true),
});

export type ResourceAmenity = typeof resourceAmenities.$inferSelect;

// ─── Resource-Amenity Junction ──────────────────────────────────────
export const resourceAmenityMap = mysqlTable("resource_amenity_map", {
  id: int("id").autoincrement().primaryKey(),
  resourceId: int("resourceId").notNull(),
  amenityId: int("amenityId").notNull(),
});

// ─── Resource Availability Schedules ────────────────────────────────
export const resourceSchedules = mysqlTable("resource_schedules", {
  id: int("id").autoincrement().primaryKey(),
  resourceId: int("resourceId"),
  resourceTypeId: int("resourceTypeId"),
  locationId: int("locationId"),
  dayOfWeek: int("dayOfWeek").notNull(),
  openTime: varchar("openTime", { length: 5 }).notNull(),
  closeTime: varchar("closeTime", { length: 5 }).notNull(),
  isActive: boolean("isActive").default(true),
});

export type ResourceSchedule = typeof resourceSchedules.$inferSelect;

// ─── Resource Blocked Dates ─────────────────────────────────────────
export const resourceBlockedDates = mysqlTable("resource_blocked_dates", {
  id: int("id").autoincrement().primaryKey(),
  resourceId: int("resourceId"),
  locationId: int("locationId"),
  startDate: bigint("startDate", { mode: "number" }).notNull(),
  endDate: bigint("endDate", { mode: "number" }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResourceBlockedDate = typeof resourceBlockedDates.$inferSelect;

// ─── Company Branding Scraped Data ──────────────────────────────────
export const companyBrandingScraped = mysqlTable("company_branding_scraped", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  websiteUrl: text("websiteUrl"),
  scrapedLogoUrl: text("scrapedLogoUrl"),
  scrapedFaviconUrl: text("scrapedFaviconUrl"),
  scrapedColors: json("scrapedColors").$type<string[]>(),
  scrapedImages: json("scrapedImages").$type<string[]>(),
  scrapedFonts: json("scrapedFonts").$type<string[]>(),
  scrapedTitle: varchar("scrapedTitle", { length: 256 }),
  scrapedDescription: text("scrapedDescription"),
  status: mysqlEnum("status", ["pending", "scraping", "completed", "failed"]).default("pending"),
  lastScrapedAt: timestamp("lastScrapedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompanyBrandingScraped = typeof companyBrandingScraped.$inferSelect;


// ─── Product Catalog (Butler Kiosk) ─────────────────────────────────
export const productCategories = mysqlTable("product_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  locationId: int("locationId"), // null = all locations
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductCategory = typeof productCategories.$inferSelect;

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  priceCredits: decimal("priceCredits", { precision: 10, scale: 2 }).notNull(), // credit cost
  priceEur: decimal("priceEur", { precision: 10, scale: 2 }).notNull(), // EUR cost for Stripe/PIN
  sku: varchar("sku", { length: 64 }),
  stockTracking: boolean("stockTracking").default(false),
  stockQuantity: int("stockQuantity").default(0),
  isActive: boolean("isActive").default(true),
  isBookingAddon: boolean("isBookingAddon").default(false), // can be added to bookings
  chargePerBookingHour: boolean("chargePerBookingHour").default(false), // prorate by booking length
  allowMultipleQuantity: boolean("allowMultipleQuantity").default(true),
  maxQuantityPerOrder: int("maxQuantityPerOrder").default(10),
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("21.00"), // NL BTW
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;

// ─── Product-Resource Links (Booking Add-ons) ───────────────────────
export const productResourceLinks = mysqlTable("product_resource_links", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  resourceTypeId: int("resourceTypeId"), // link to resource type (null = all)
  resourceId: int("resourceId"), // link to specific resource (null = all of type)
  isRequired: boolean("isRequired").default(false), // mandatory add-on
  isDefault: boolean("isDefault").default(false), // pre-checked in booking
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductResourceLink = typeof productResourceLinks.$inferSelect;

// ─── Kiosk Orders ───────────────────────────────────────────────────
export const kioskOrders = mysqlTable("kiosk_orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull(),
  locationId: int("locationId").notNull(),
  userId: int("userId"), // null for guest/walk-in
  companyId: int("companyId"), // for "on company tab" payments
  bookingId: int("bookingId"), // linked booking (if add-on order)
  status: mysqlEnum("status", ["pending", "processing", "completed", "cancelled", "refunded"]).default("pending"),
  paymentMethod: mysqlEnum("paymentMethod", [
    "personal_credits",
    "company_credits",
    "stripe_card",
    "company_invoice",
    "cash",
  ]).notNull(),
  subtotalCredits: decimal("subtotalCredits", { precision: 10, scale: 2 }).default("0"),
  subtotalEur: decimal("subtotalEur", { precision: 10, scale: 2 }).default("0"),
  vatAmount: decimal("vatAmount", { precision: 10, scale: 2 }).default("0"),
  totalCredits: decimal("totalCredits", { precision: 10, scale: 2 }).default("0"),
  totalEur: decimal("totalEur", { precision: 10, scale: 2 }).default("0"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 256 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KioskOrder = typeof kioskOrders.$inferSelect;

export const kioskOrderItems = mysqlTable("kiosk_order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 256 }).notNull(), // snapshot
  quantity: int("quantity").notNull().default(1),
  unitPriceCredits: decimal("unitPriceCredits", { precision: 10, scale: 2 }).notNull(),
  unitPriceEur: decimal("unitPriceEur", { precision: 10, scale: 2 }).notNull(),
  totalCredits: decimal("totalCredits", { precision: 10, scale: 2 }).notNull(),
  totalEur: decimal("totalEur", { precision: 10, scale: 2 }).notNull(),
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("21.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KioskOrderItem = typeof kioskOrderItems.$inferSelect;

// ─── Booking Add-ons (Products added to bookings) ───────────────────
export const bookingAddons = mysqlTable("booking_addons", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull().default(1),
  unitPriceCredits: decimal("unitPriceCredits", { precision: 10, scale: 2 }).notNull(),
  totalCredits: decimal("totalCredits", { precision: 10, scale: 2 }).notNull(),
  proratedByHours: boolean("proratedByHours").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BookingAddon = typeof bookingAddons.$inferSelect;


// ─── Parking Zones ─────────────────────────────────────────────────
export const parkingZones = mysqlTable("parking_zones", {
  id: int("id").autoincrement().primaryKey(),
  locationId: int("locationId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull(),
  totalSpots: int("totalSpots").notNull().default(0),
  type: mysqlEnum("type", ["indoor", "outdoor", "underground", "rooftop"]).default("outdoor"),
  accessMethod: mysqlEnum("accessMethod", ["barrier", "anpr", "manual", "salto"]).default("barrier"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ParkingZone = typeof parkingZones.$inferSelect;

// ─── Parking Spots ─────────────────────────────────────────────────
export const parkingSpots = mysqlTable("parking_spots", {
  id: int("id").autoincrement().primaryKey(),
  zoneId: int("zoneId").notNull(),
  spotNumber: varchar("spotNumber", { length: 16 }).notNull(),
  type: mysqlEnum("type", ["standard", "electric", "disabled", "motorcycle", "reserved"]).default("standard"),
  status: mysqlEnum("status", ["available", "occupied", "reserved", "maintenance", "blocked"]).default("available"),
  sensorId: varchar("sensorId", { length: 128 }),
  assignedUserId: int("assignedUserId"),
  assignedCompanyId: int("assignedCompanyId"),
  isActive: boolean("isActive").default(true),
});

export type ParkingSpot = typeof parkingSpots.$inferSelect;

// ─── Parking Pricing Rules ─────────────────────────────────────────
export const parkingPricing = mysqlTable("parking_pricing", {
  id: int("id").autoincrement().primaryKey(),
  zoneId: int("zoneId"),
  name: varchar("name", { length: 128 }).notNull(),
  rateType: mysqlEnum("rateType", ["hourly", "daily", "monthly", "flat"]).notNull(),
  priceEur: decimal("priceEur", { precision: 10, scale: 2 }).notNull(),
  priceCredits: decimal("priceCredits", { precision: 10, scale: 2 }),
  appliesToType: mysqlEnum("appliesToType", ["all", "members", "guests", "companies"]).default("all"),
  dayBeforeDiscount: int("dayBeforeDiscount").default(0), // % discount for advance booking
  maxDailyCapEur: decimal("maxDailyCapEur", { precision: 10, scale: 2 }),
  freeMinutes: int("freeMinutes").default(0),
  validDays: json("validDays").$type<number[]>(), // 0-6
  validTimeStart: varchar("validTimeStart", { length: 5 }),
  validTimeEnd: varchar("validTimeEnd", { length: 5 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ParkingPricingRule = typeof parkingPricing.$inferSelect;

// ─── Parking Permits ───────────────────────────────────────────────
export const parkingPermits = mysqlTable("parking_permits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  companyId: int("companyId"),
  zoneId: int("zoneId").notNull(),
  licensePlate: varchar("licensePlate", { length: 20 }).notNull(),
  vehicleDescription: varchar("vehicleDescription", { length: 256 }),
  type: mysqlEnum("type", ["monthly", "annual", "reserved", "visitor"]).default("monthly"),
  status: mysqlEnum("status", ["active", "expired", "suspended", "cancelled"]).default("active"),
  startDate: bigint("startDate", { mode: "number" }).notNull(),
  endDate: bigint("endDate", { mode: "number" }),
  spotId: int("spotId"), // assigned spot (if reserved)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ParkingPermit = typeof parkingPermits.$inferSelect;

// ─── Parking Sessions ──────────────────────────────────────────────
export const parkingSessions = mysqlTable("parking_sessions", {
  id: int("id").autoincrement().primaryKey(),
  zoneId: int("zoneId").notNull(),
  spotId: int("spotId"),
  userId: int("userId"),
  permitId: int("permitId"),
  licensePlate: varchar("licensePlate", { length: 20 }),
  entryTime: bigint("entryTime", { mode: "number" }).notNull(),
  exitTime: bigint("exitTime", { mode: "number" }),
  durationMinutes: int("durationMinutes"),
  status: mysqlEnum("status", ["active", "completed", "overstay"]).default("active"),
  amountEur: decimal("amountEur", { precision: 10, scale: 2 }),
  amountCredits: decimal("amountCredits", { precision: 10, scale: 2 }),
  paymentMethod: mysqlEnum("paymentMethod", ["credits", "stripe", "permit", "free"]),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "waived"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ParkingSession = typeof parkingSessions.$inferSelect;

// ─── Parking Reservations ──────────────────────────────────────────
export const parkingReservations = mysqlTable("parking_reservations", {
  id: int("id").autoincrement().primaryKey(),
  zoneId: int("zoneId").notNull(),
  spotId: int("spotId"),
  userId: int("userId").notNull(),
  licensePlate: varchar("licensePlate", { length: 20 }),
  reservationDate: bigint("reservationDate", { mode: "number" }).notNull(),
  startTime: bigint("startTime", { mode: "number" }).notNull(),
  endTime: bigint("endTime", { mode: "number" }).notNull(),
  status: mysqlEnum("status", ["confirmed", "checked_in", "completed", "cancelled", "no_show"]).default("confirmed"),
  discountApplied: int("discountApplied").default(0),
  amountEur: decimal("amountEur", { precision: 10, scale: 2 }),
  amountCredits: decimal("amountCredits", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ParkingReservation = typeof parkingReservations.$inferSelect;

// ─── Support Tickets (Zendesk-style) ───────────────────────────────
export const tickets = mysqlTable("tickets", {
  id: int("id").autoincrement().primaryKey(),
  ticketNumber: varchar("ticketNumber", { length: 32 }).notNull().unique(),
  subject: varchar("subject", { length: 512 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["new", "open", "pending", "on_hold", "solved", "closed"]).default("new").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal"),
  category: mysqlEnum("category", [
    "general", "billing", "access", "booking", "parking", "maintenance",
    "wifi", "catering", "equipment", "noise", "cleaning", "other",
  ]).default("general"),
  channel: mysqlEnum("channel", ["web", "email", "chat", "phone", "app", "walk_in"]).default("web"),
  requesterId: int("requesterId"), // user who submitted
  assignedToId: int("assignedToId"), // staff member
  locationId: int("locationId"),
  resourceId: int("resourceId"),
  tags: json("tags").$type<string[]>(),
  aiSuggestion: text("aiSuggestion"),
  aiCategory: varchar("aiCategory", { length: 64 }),
  aiSentiment: mysqlEnum("aiSentiment", ["positive", "neutral", "negative"]),
  aiAutoResolved: boolean("aiAutoResolved").default(false),
  slaDeadline: bigint("slaDeadline", { mode: "number" }),
  firstResponseAt: bigint("firstResponseAt", { mode: "number" }),
  resolvedAt: bigint("resolvedAt", { mode: "number" }),
  closedAt: bigint("closedAt", { mode: "number" }),
  satisfactionRating: int("satisfactionRating"), // 1-5
  satisfactionComment: text("satisfactionComment"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ticket = typeof tickets.$inferSelect;

// ─── Ticket Messages ───────────────────────────────────────────────
export const ticketMessages = mysqlTable("ticket_messages", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  senderId: int("senderId"), // null for system/AI messages
  senderType: mysqlEnum("senderType", ["requester", "agent", "system", "ai"]).default("requester"),
  body: text("body").notNull(),
  isInternal: boolean("isInternal").default(false), // internal note vs public reply
  attachments: json("attachments").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TicketMessage = typeof ticketMessages.$inferSelect;

// ─── Ticket SLA Policies ───────────────────────────────────────────
export const ticketSlaPolicies = mysqlTable("ticket_sla_policies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).notNull(),
  firstResponseMinutes: int("firstResponseMinutes").notNull(),
  resolutionMinutes: int("resolutionMinutes").notNull(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TicketSlaPolicy = typeof ticketSlaPolicies.$inferSelect;

// ─── Canned Responses ──────────────────────────────────────────────
export const cannedResponses = mysqlTable("canned_responses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  body: text("body").notNull(),
  category: varchar("category", { length: 64 }),
  shortcut: varchar("shortcut", { length: 32 }),
  usageCount: int("usageCount").default(0),
  createdByUserId: int("createdByUserId"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CannedResponse = typeof cannedResponses.$inferSelect;

// ─── Room Control Zones ────────────────────────────────────────────
export const roomControlZones = mysqlTable("room_control_zones", {
  id: int("id").autoincrement().primaryKey(),
  locationId: int("locationId").notNull(),
  resourceId: int("resourceId"),
  name: varchar("name", { length: 128 }).notNull(),
  floor: varchar("floor", { length: 16 }),
  type: mysqlEnum("type", ["meeting_room", "open_space", "private_office", "common_area", "lobby", "kitchen"]).default("meeting_room"),
  hvacEnabled: boolean("hvacEnabled").default(true),
  lightingEnabled: boolean("lightingEnabled").default(true),
  avEnabled: boolean("avEnabled").default(false),
  blindsEnabled: boolean("blindsEnabled").default(false),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoomControlZone = typeof roomControlZones.$inferSelect;

// ─── Room Control Points ───────────────────────────────────────────
export const roomControlPoints = mysqlTable("room_control_points", {
  id: int("id").autoincrement().primaryKey(),
  zoneId: int("zoneId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  type: mysqlEnum("type", ["hvac_temp", "hvac_mode", "light_level", "light_scene", "av_power", "av_input", "blinds_position", "ventilation"]).notNull(),
  currentValue: varchar("currentValue", { length: 64 }),
  targetValue: varchar("targetValue", { length: 64 }),
  unit: varchar("unit", { length: 16 }),
  minValue: decimal("minValue", { precision: 8, scale: 2 }),
  maxValue: decimal("maxValue", { precision: 8, scale: 2 }),
  isControllable: boolean("isControllable").default(true),
  lastUpdated: timestamp("lastUpdated"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoomControlPoint = typeof roomControlPoints.$inferSelect;

// ─── Room Sensor Readings (Time-series) ────────────────────────────
export const roomSensorReadings = mysqlTable("room_sensor_readings", {
  id: int("id").autoincrement().primaryKey(),
  zoneId: int("zoneId").notNull(),
  sensorType: mysqlEnum("sensorType", ["temperature", "humidity", "co2", "noise", "light", "occupancy", "pm25", "voc"]).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 16 }),
  recordedAt: bigint("recordedAt", { mode: "number" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoomSensorReading = typeof roomSensorReadings.$inferSelect;

// ─── Room Automation Rules ─────────────────────────────────────────
export const roomAutomationRules = mysqlTable("room_automation_rules", {
  id: int("id").autoincrement().primaryKey(),
  zoneId: int("zoneId"),
  locationId: int("locationId"),
  name: varchar("name", { length: 256 }).notNull(),
  triggerType: mysqlEnum("triggerType", ["schedule", "occupancy", "sensor_threshold", "booking_start", "booking_end"]).notNull(),
  triggerConfig: json("triggerConfig").$type<Record<string, unknown>>(),
  actionType: mysqlEnum("actionType", ["set_temperature", "set_lights", "set_av", "set_blinds", "send_alert"]).notNull(),
  actionConfig: json("actionConfig").$type<Record<string, unknown>>(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoomAutomationRule = typeof roomAutomationRules.$inferSelect;

// ─── Alert Thresholds ──────────────────────────────────────────────
export const alertThresholds = mysqlTable("alert_thresholds", {
  id: int("id").autoincrement().primaryKey(),
  zoneId: int("zoneId"),
  locationId: int("locationId"),
  sensorType: mysqlEnum("sensorType", ["temperature", "humidity", "co2", "noise", "light", "occupancy", "pm25", "voc"]).notNull(),
  operator: mysqlEnum("operator", ["gt", "lt", "gte", "lte", "eq"]).notNull(),
  thresholdValue: decimal("thresholdValue", { precision: 10, scale: 2 }).notNull(),
  alertLevel: mysqlEnum("alertLevel", ["info", "warning", "critical"]).default("warning"),
  notifyRoles: json("notifyRoles").$type<string[]>(),
  cooldownMinutes: int("cooldownMinutes").default(30),
  isActive: boolean("isActive").default(true),
  lastTriggeredAt: bigint("lastTriggeredAt", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertThreshold = typeof alertThresholds.$inferSelect;

// ─── Operations Agenda ─────────────────────────────────────────────
export const opsAgenda = mysqlTable("ops_agenda", {
  id: int("id").autoincrement().primaryKey(),
  locationId: int("locationId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["event", "maintenance", "cleaning", "delivery", "meeting", "inspection", "other"]).default("event"),
  startTime: bigint("startTime", { mode: "number" }).notNull(),
  endTime: bigint("endTime", { mode: "number" }),
  assignedToId: int("assignedToId"),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal"),
  isRecurring: boolean("isRecurring").default(false),
  recurringPattern: json("recurringPattern").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpsAgendaItem = typeof opsAgenda.$inferSelect;

// ─── CRM: Automation Triggers ────────────────────────────────────────
export const crmTriggers = mysqlTable("crm_triggers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true),
  eventType: mysqlEnum("eventType", [
    "lead_created",
    "stage_change",
    "website_visit",
    "form_submit",
    "email_opened",
    "email_replied",
    "inactivity",
    "score_threshold",
    "tag_added",
    "manual",
  ]).notNull(),
  conditions: json("conditions").$type<Record<string, any>>(),
  actions: json("actions").$type<Array<{
    type: "ai_enrich" | "ai_score" | "ai_outreach" | "assign_user" | "change_stage" | "add_tag" | "send_email" | "notify_owner" | "create_task" | "ai_analyze";
    config: Record<string, any>;
  }>>(),
  executionCount: int("executionCount").default(0),
  lastExecutedAt: timestamp("lastExecutedAt"),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmTrigger = typeof crmTriggers.$inferSelect;
export type InsertCrmTrigger = typeof crmTriggers.$inferInsert;

// ─── CRM: Trigger Execution Log ─────────────────────────────────────
export const crmTriggerLogs = mysqlTable("crm_trigger_logs", {
  id: int("id").autoincrement().primaryKey(),
  triggerId: int("triggerId").notNull(),
  leadId: int("leadId"),
  eventData: json("eventData"),
  actionsExecuted: json("actionsExecuted").$type<Array<{
    type: string;
    status: "success" | "failed" | "skipped";
    result?: any;
    error?: string;
  }>>(),
  status: mysqlEnum("status", ["success", "partial", "failed"]).default("success"),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
});

export type CrmTriggerLog = typeof crmTriggerLogs.$inferSelect;

// ─── CRM: Website Visitors (LeadInfo-style) ─────────────────────────
export const crmWebsiteVisitors = mysqlTable("crm_website_visitors", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  companyName: varchar("companyName", { length: 256 }),
  companyDomain: varchar("companyDomain", { length: 256 }),
  companyIndustry: varchar("companyIndustry", { length: 128 }),
  companySize: varchar("companySize", { length: 32 }),
  companyRevenue: varchar("companyRevenue", { length: 64 }),
  companyLinkedIn: varchar("companyLinkedIn", { length: 512 }),
  city: varchar("city", { length: 128 }),
  country: varchar("country", { length: 64 }),
  pagesViewed: json("pagesViewed").$type<string[]>(),
  totalPageViews: int("totalPageViews").default(1),
  totalVisits: int("totalVisits").default(1),
  firstVisitAt: timestamp("firstVisitAt").defaultNow().notNull(),
  lastVisitAt: timestamp("lastVisitAt").defaultNow().notNull(),
  referrer: varchar("referrer", { length: 512 }),
  utmSource: varchar("utmSource", { length: 128 }),
  utmMedium: varchar("utmMedium", { length: 128 }),
  utmCampaign: varchar("utmCampaign", { length: 128 }),
  matchedLeadId: int("matchedLeadId"),
  enrichmentData: json("enrichmentData"),
  isIdentified: boolean("isIdentified").default(false),
  status: mysqlEnum("status", ["new", "identified", "matched", "outreach_sent", "ignored"]).default("new"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrmWebsiteVisitor = typeof crmWebsiteVisitors.$inferSelect;
export type InsertCrmWebsiteVisitor = typeof crmWebsiteVisitors.$inferInsert;

// ─── Members: Tier System ───────────────────────────────────────────
export const memberProfiles = mysqlTable("member_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  companyId: int("companyId"),
  tier: mysqlEnum("tier", [
    "prospect",
    "vergaderen",
    "gebaloteerd",
  ]).default("prospect").notNull(),
  displayName: varchar("displayName", { length: 256 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  companyName: varchar("companyName", { length: 256 }),
  jobTitle: varchar("jobTitle", { length: 128 }),
  linkedIn: varchar("linkedIn", { length: 512 }),
  photoUrl: text("photoUrl"),
  locationPreference: varchar("locationPreference", { length: 128 }),
  creditBalance: decimal("creditBalance", { precision: 12, scale: 2 }).default("0"),
  creditBundleType: varchar("creditBundleType", { length: 64 }),
  totalBookings: int("totalBookings").default(0),
  totalSpent: decimal("totalSpent", { precision: 12, scale: 2 }).default("0"),
  lastActiveAt: timestamp("lastActiveAt"),
  ballotDate: timestamp("ballotDate"),
  ballotSponsor: varchar("ballotSponsor", { length: 256 }),
  source: varchar("source", { length: 128 }),
  funnelStage: varchar("funnelStage", { length: 64 }),
  notes: text("notes"),
  tags: json("tags").$type<string[]>(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MemberProfile = typeof memberProfiles.$inferSelect;
export type InsertMemberProfile = typeof memberProfiles.$inferInsert;

// ─── Re-engagement Funnel ───────────────────────────────────────────
export const reengagementFunnel = mysqlTable("reengagement_funnel", {
  id: int("id").autoincrement().primaryKey(),
  memberProfileId: int("memberProfileId"),
  contactName: varchar("contactName", { length: 256 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }),
  companyName: varchar("companyName", { length: 256 }),
  previousRelationship: varchar("previousRelationship", { length: 128 }),
  stage: mysqlEnum("stage", [
    "identified",
    "invited",
    "opened",
    "applied",
    "interview",
    "accepted",
    "declined",
  ]).default("identified").notNull(),
  inviteSentAt: timestamp("inviteSentAt"),
  inviteOpenedAt: timestamp("inviteOpenedAt"),
  applicationDate: timestamp("applicationDate"),
  personalMessage: text("personalMessage"),
  aiGeneratedInvite: text("aiGeneratedInvite"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReengagementEntry = typeof reengagementFunnel.$inferSelect;
export type InsertReengagementEntry = typeof reengagementFunnel.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════
// ─── SIGNAGE MODULE ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

// ─── Signage Screens (Physical display devices) ────────────────────
export const signageScreens = mysqlTable("signage_screens", {
  id: int("id").autoincrement().primaryKey(),
  locationId: int("locationId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  screenType: mysqlEnum("screenType", [
    "reception",
    "gym",
    "kitchen",
    "wayfinding",
    "general",
    "meeting_room",
    "elevator",
    "parking",
  ]).notNull(),
  orientation: mysqlEnum("orientation", ["portrait", "landscape"]).default("portrait"),
  resolution: varchar("resolution", { length: 32 }).default("1080x1920"), // WxH
  floor: varchar("floor", { length: 16 }),
  zone: varchar("zone", { length: 64 }),
  provisioningToken: varchar("provisioningToken", { length: 128 }).unique(),
  status: mysqlEnum("status", ["online", "offline", "provisioning", "maintenance", "error"]).default("provisioning"),
  lastHeartbeat: timestamp("lastHeartbeat"),
  currentPlaylistId: int("currentPlaylistId"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  macAddress: varchar("macAddress", { length: 17 }),
  userAgent: text("userAgent"),
  firmwareVersion: varchar("firmwareVersion", { length: 32 }),
  brightness: int("brightness").default(100),
  volume: int("volume").default(0),
  isActive: boolean("isActive").default(true),
  tags: json("tags").$type<string[]>(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SignageScreen = typeof signageScreens.$inferSelect;
export type InsertSignageScreen = typeof signageScreens.$inferInsert;

// ─── Signage Screen Groups (Logical grouping for bulk management) ──
export const signageScreenGroups = mysqlTable("signage_screen_groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  locationId: int("locationId"),
  screenType: mysqlEnum("screenType", [
    "reception", "gym", "kitchen", "wayfinding", "general",
    "meeting_room", "elevator", "parking",
  ]),
  color: varchar("color", { length: 7 }).default("#627653"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SignageScreenGroup = typeof signageScreenGroups.$inferSelect;

// ─── Screen-Group Membership ───────────────────────────────────────
export const signageScreenGroupMembers = mysqlTable("signage_screen_group_members", {
  id: int("id").autoincrement().primaryKey(),
  screenId: int("screenId").notNull(),
  groupId: int("groupId").notNull(),
});

// ─── Signage Content Items ─────────────────────────────────────────
export const signageContent = mysqlTable("signage_content", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  contentType: mysqlEnum("contentType", [
    "image",
    "video",
    "html",
    "url",
    "menu_card",
    "wayfinding",
    "gym_schedule",
    "weather",
    "clock",
    "news_ticker",
    "company_presence",
    "welcome_screen",
    "announcement",
  ]).notNull(),
  mediaUrl: text("mediaUrl"),
  htmlContent: text("htmlContent"),
  externalUrl: text("externalUrl"),
  duration: int("duration").default(15), // seconds to display
  templateData: json("templateData").$type<Record<string, unknown>>(), // dynamic data for templates
  targetScreenTypes: json("targetScreenTypes").$type<string[]>(), // which screen types can show this
  locationId: int("locationId"), // null = all locations
  isActive: boolean("isActive").default(true),
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  priority: int("priority").default(0), // higher = more important
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SignageContentItem = typeof signageContent.$inferSelect;
export type InsertSignageContent = typeof signageContent.$inferInsert;

// ─── Signage Playlists ─────────────────────────────────────────────
export const signagePlaylists = mysqlTable("signage_playlists", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  screenType: mysqlEnum("screenType", [
    "reception", "gym", "kitchen", "wayfinding", "general",
    "meeting_room", "elevator", "parking",
  ]),
  locationId: int("locationId"), // null = global
  isDefault: boolean("isDefault").default(false),
  isActive: boolean("isActive").default(true),
  scheduleType: mysqlEnum("scheduleType", ["always", "time_based", "day_based"]).default("always"),
  scheduleConfig: json("scheduleConfig").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SignagePlaylist = typeof signagePlaylists.$inferSelect;
export type InsertSignagePlaylist = typeof signagePlaylists.$inferInsert;

// ─── Playlist Items (Content in a playlist with ordering) ──────────
export const signagePlaylistItems = mysqlTable("signage_playlist_items", {
  id: int("id").autoincrement().primaryKey(),
  playlistId: int("playlistId").notNull(),
  contentId: int("contentId").notNull(),
  sortOrder: int("sortOrder").default(0),
  durationOverride: int("durationOverride"), // override content default duration
  isActive: boolean("isActive").default(true),
});

export type SignagePlaylistItem = typeof signagePlaylistItems.$inferSelect;

// ─── Signage Provisioning Templates ────────────────────────────────
export const signageProvisioningTemplates = mysqlTable("signage_provisioning_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  screenType: mysqlEnum("screenType", [
    "reception", "gym", "kitchen", "wayfinding", "general",
    "meeting_room", "elevator", "parking",
  ]).notNull(),
  defaultPlaylistId: int("defaultPlaylistId"),
  defaultOrientation: mysqlEnum("defaultOrientation", ["portrait", "landscape"]).default("portrait"),
  defaultResolution: varchar("defaultResolution", { length: 32 }).default("1080x1920"),
  defaultBrightness: int("defaultBrightness").default(100),
  autoAssignLocation: boolean("autoAssignLocation").default(true),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SignageProvisioningTemplate = typeof signageProvisioningTemplates.$inferSelect;

// ─── Wayfinding: Building Directory ────────────────────────────────
export const wayfindingBuildings = mysqlTable("wayfinding_buildings", {
  id: int("id").autoincrement().primaryKey(),
  locationId: int("locationId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  code: varchar("code", { length: 16 }), // e.g. "A", "B", "C"
  address: text("address"),
  floors: int("floors").default(1),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WayfindingBuilding = typeof wayfindingBuildings.$inferSelect;

// ─── Wayfinding: Company-Building Assignments ──────────────────────
export const wayfindingCompanyAssignments = mysqlTable("wayfinding_company_assignments", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  buildingId: int("buildingId").notNull(),
  floor: varchar("floor", { length: 16 }),
  roomNumber: varchar("roomNumber", { length: 32 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WayfindingCompanyAssignment = typeof wayfindingCompanyAssignments.$inferSelect;

// ─── Wayfinding: Company Check-In/Out (Dynamic Presence) ──────────
export const wayfindingCompanyPresence = mysqlTable("wayfinding_company_presence", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  locationId: int("locationId").notNull(),
  buildingId: int("buildingId"),
  isPresent: boolean("isPresent").default(false),
  checkedInAt: timestamp("checkedInAt"),
  checkedOutAt: timestamp("checkedOutAt"),
  checkedInByUserId: int("checkedInByUserId"),
  method: mysqlEnum("method", ["manual", "access_log", "auto", "api"]).default("manual"),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD for daily tracking
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WayfindingCompanyPresence = typeof wayfindingCompanyPresence.$inferSelect;

// ─── Signage Screen Heartbeats (Monitoring) ────────────────────────
export const signageHeartbeats = mysqlTable("signage_heartbeats", {
  id: int("id").autoincrement().primaryKey(),
  screenId: int("screenId").notNull(),
  status: mysqlEnum("status", ["online", "offline", "error", "maintenance", "provisioning"]).default("online"),
  currentContentId: int("currentContentId"),
  currentPlaylistId: int("currentPlaylistId"),
  cpuUsage: decimal("cpuUsage", { precision: 5, scale: 2 }),
  memoryUsage: decimal("memoryUsage", { precision: 5, scale: 2 }),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  uptime: int("uptime"), // seconds
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SignageHeartbeat = typeof signageHeartbeats.$inferSelect;

// ─── Signage Audit Log ─────────────────────────────────────────────
export const signageAuditLog = mysqlTable("signage_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  screenId: int("screenId"),
  action: mysqlEnum("action", [
    "provisioned",
    "content_changed",
    "playlist_assigned",
    "screen_online",
    "screen_offline",
    "settings_changed",
    "error_reported",
    "reboot",
    "firmware_update",
  ]).notNull(),
  description: text("description"),
  userId: int("userId"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SignageAuditLogEntry = typeof signageAuditLog.$inferSelect;

// ─── Kitchen Menu Items (for kitchen screens) ──────────────────────
export const kitchenMenuItems = mysqlTable("kitchen_menu_items", {
  id: int("id").autoincrement().primaryKey(),
  locationId: int("locationId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "breakfast", "lunch", "dinner", "snack", "drink",
    "soup", "salad", "sandwich", "special",
  ]).notNull(),
  price: decimal("price", { precision: 8, scale: 2 }),
  imageUrl: text("imageUrl"),
  allergens: json("allergens").$type<string[]>(),
  isVegan: boolean("isVegan").default(false),
  isVegetarian: boolean("isVegetarian").default(false),
  isGlutenFree: boolean("isGlutenFree").default(false),
  isAvailable: boolean("isAvailable").default(true),
  dayOfWeek: json("dayOfWeek").$type<number[]>(), // null = every day
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KitchenMenuItem = typeof kitchenMenuItems.$inferSelect;
export type InsertKitchenMenuItem = typeof kitchenMenuItems.$inferInsert;

// ─── Gym Schedules (for gym screens) ───────────────────────────────
export const gymSchedules = mysqlTable("gym_schedules", {
  id: int("id").autoincrement().primaryKey(),
  locationId: int("locationId").notNull(),
  className: varchar("className", { length: 256 }).notNull(),
  instructor: varchar("instructor", { length: 128 }),
  description: text("description"),
  category: mysqlEnum("category", [
    "cardio", "strength", "yoga", "pilates", "hiit",
    "cycling", "boxing", "stretching", "meditation", "egym",
  ]).notNull(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0=Sunday
  startTime: varchar("startTime", { length: 5 }).notNull(), // HH:MM
  endTime: varchar("endTime", { length: 5 }).notNull(),
  maxParticipants: int("maxParticipants").default(20),
  currentParticipants: int("currentParticipants").default(0),
  imageUrl: text("imageUrl"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GymSchedule = typeof gymSchedules.$inferSelect;
export type InsertGymSchedule = typeof gymSchedules.$inferInsert;
