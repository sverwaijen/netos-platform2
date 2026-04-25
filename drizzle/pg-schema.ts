/**
 * PostgreSQL Drizzle Schema — SKYNET / TheGreen Platform
 * Mirror of drizzle/schema.ts (MySQL) but using pg-core types.
 * Used by the dual-driver in server/db.ts when SUPABASE_DB_URL is set.
 */
import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  varchar,
  timestamp,
  numeric,
  boolean,
  json,
  bigint,
} from "drizzle-orm/pg-core";

// ─── Shared PG Enums ────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["admin", "user", "guest"]);
export const resourceTypeEnum = pgEnum("resource_type_enum", ["desk", "meeting_room", "private_office", "open_space", "locker", "gym", "phone_booth", "event_space"]);
export const zoneEnum = pgEnum("zone_enum", ["zone_0", "zone_1", "zone_2", "zone_3"]);
export const companyTierEnum = pgEnum("company_tier", ["bronze", "silver", "gold"]);
export const walletTypeEnum = pgEnum("wallet_type", ["company", "personal"]);
export const ledgerTypeEnum = pgEnum("ledger_type", ["grant", "spend", "rollover", "breakage", "topup", "refund", "transfer"]);
export const bookingStatusEnum = pgEnum("booking_status", ["confirmed", "checked_in", "completed", "cancelled", "no_show"]);
export const visitorStatusEnum = pgEnum("visitor_status", ["invited", "checked_in", "checked_out", "cancelled"]);
export const deviceTypeEnum = pgEnum("device_type", ["netlink", "display", "sensor_hub", "door_controller"]);
export const deviceStatusEnum = pgEnum("device_status", ["online", "offline", "maintenance"]);
export const sensorTypeEnum = pgEnum("sensor_type_enum", ["occupancy", "temperature", "humidity", "co2", "light", "motion"]);
export const accessActionEnum = pgEnum("access_action", ["entry", "exit", "denied", "key_provisioned"]);
export const accessMethodEnum = pgEnum("access_method", ["ble", "nfc", "qr", "manual"]);
export const notificationTypeEnum = pgEnum("notification_type", ["enterprise_signup", "breakage_milestone", "occupancy_anomaly", "credit_inflation", "monthly_report", "booking_reminder", "visitor_arrival", "system"]);
export const inviteRoleEnum = pgEnum("invite_role", ["admin", "user", "guest"]);
export const inviteStatusEnum = pgEnum("invite_status", ["pending", "accepted", "expired"]);
export const crmSourceEnum = pgEnum("crm_source", ["website", "referral", "event", "cold_outreach", "linkedin", "partner", "inbound", "other"]);
export const crmStageEnum = pgEnum("crm_stage", ["new", "qualified", "tour_scheduled", "proposal", "negotiation", "won", "lost"]);
export const crmActivityTypeEnum = pgEnum("crm_activity_type", ["note", "email_sent", "email_opened", "email_clicked", "email_replied", "call", "meeting", "tour", "proposal_sent", "stage_change", "score_change", "task"]);
export const campaignTypeEnum = pgEnum("campaign_type", ["email_sequence", "one_off", "drip", "event"]);
export const campaignStatusEnum = pgEnum("campaign_status", ["draft", "active", "paused", "completed", "archived"]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", ["active", "completed", "paused", "bounced", "unsubscribed"]);
export const chargingUnitEnum = pgEnum("charging_unit", ["per_hour", "per_day", "per_use", "per_week", "per_month"]);
export const ruleScopeEnum = pgEnum("rule_scope", ["global", "individual"]);
export const conditionTypeEnum = pgEnum("condition_type", ["customer_type", "plan_type", "tier_type", "time_of_day", "day_of_week", "advance_booking", "booking_length", "zone_access"]);
export const limitTypeEnum = pgEnum("limit_type", ["block_booking", "restrict_hours", "max_duration", "min_duration", "max_advance_days", "min_advance_hours", "max_bookings_per_day", "max_bookings_per_week", "require_approval"]);
export const appliesToCustomerTypeEnum = pgEnum("applies_to_customer_type", ["all", "members_only", "guests_only", "specific_plans", "specific_tiers"]);
export const amenityCategoryEnum = pgEnum("amenity_category", ["tech", "furniture", "comfort", "accessibility", "catering"]);
export const scrapedStatusEnum = pgEnum("scraped_status", ["pending", "scraping", "completed", "failed"]);
export const parkingZoneTypeEnum = pgEnum("parking_zone_type", ["indoor", "outdoor", "underground", "rooftop"]);
export const parkingAccessMethodEnum = pgEnum("parking_access_method", ["barrier", "anpr", "manual", "salto"]);
export const parkingSpotTypeEnum = pgEnum("parking_spot_type", ["standard", "electric", "disabled", "motorcycle", "reserved"]);
export const parkingSpotStatusEnum = pgEnum("parking_spot_status", ["available", "occupied", "reserved", "maintenance", "blocked"]);
export const parkingRateTypeEnum = pgEnum("parking_rate_type", ["hourly", "daily", "monthly", "flat"]);
export const parkingAppliesToEnum = pgEnum("parking_applies_to", ["all", "members", "guests", "companies"]);
export const parkingPermitTypeEnum = pgEnum("parking_permit_type", ["monthly", "annual", "reserved", "visitor"]);
export const parkingPermitStatusEnum = pgEnum("parking_permit_status", ["active", "expired", "suspended", "cancelled"]);
export const parkingSessionStatusEnum = pgEnum("parking_session_status", ["active", "completed", "overstay"]);
export const parkingPaymentMethodEnum = pgEnum("parking_payment_method", ["credits", "stripe", "permit", "free"]);
export const parkingPaymentStatusEnum = pgEnum("parking_payment_status", ["pending", "paid", "waived"]);
export const parkingReservationStatusEnum = pgEnum("parking_reservation_status", ["confirmed", "checked_in", "completed", "cancelled", "no_show"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["new", "open", "pending", "on_hold", "solved", "closed"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "normal", "high", "urgent"]);
export const ticketCategoryEnum = pgEnum("ticket_category", ["general", "billing", "access", "booking", "parking", "maintenance", "wifi", "catering", "equipment", "noise", "cleaning", "other"]);
export const ticketChannelEnum = pgEnum("ticket_channel", ["web", "email", "chat", "phone", "app", "walk_in"]);
export const senderTypeEnum = pgEnum("sender_type", ["requester", "agent", "system", "ai"]);
export const aiSentimentEnum = pgEnum("ai_sentiment", ["positive", "neutral", "negative"]);
export const roomZoneTypeEnum = pgEnum("room_zone_type", ["meeting_room", "open_space", "private_office", "common_area", "lobby", "kitchen"]);
export const roomControlTypeEnum = pgEnum("room_control_type", ["hvac_temp", "hvac_mode", "light_level", "light_scene", "av_power", "av_input", "blinds_position", "ventilation"]);
export const roomSensorTypeEnum = pgEnum("room_sensor_type", ["temperature", "humidity", "co2", "noise", "light", "occupancy", "pm25", "voc"]);
export const automationTriggerTypeEnum = pgEnum("automation_trigger_type", ["schedule", "occupancy", "sensor_threshold", "booking_start", "booking_end"]);
export const automationActionTypeEnum = pgEnum("automation_action_type", ["set_temperature", "set_lights", "set_av", "set_blinds", "send_alert"]);
export const alertLevelEnum = pgEnum("alert_level", ["info", "warning", "critical"]);
export const alertOperatorEnum = pgEnum("alert_operator", ["gt", "lt", "gte", "lte", "eq"]);
export const opsTypeEnum = pgEnum("ops_type", ["event", "maintenance", "cleaning", "delivery", "meeting", "inspection", "other"]);
export const opsStatusEnum = pgEnum("ops_status", ["scheduled", "in_progress", "completed", "cancelled"]);
export const opsPriorityEnum = pgEnum("ops_priority", ["low", "normal", "high", "urgent"]);
export const crmTriggerEventEnum = pgEnum("crm_trigger_event", ["lead_created", "stage_change", "website_visit", "form_submit", "email_opened", "email_replied", "inactivity", "score_threshold", "tag_added", "manual"]);
export const crmTriggerLogStatusEnum = pgEnum("crm_trigger_log_status", ["success", "partial", "failed"]);
export const crmVisitorStatusEnum = pgEnum("crm_visitor_status", ["new", "identified", "matched", "outreach_sent", "ignored"]);
export const memberTierEnum = pgEnum("member_tier", ["prospect", "vergaderen", "gebaloteerd"]);
export const reengagementStageEnum = pgEnum("reengagement_stage", ["identified", "invited", "opened", "applied", "interview", "accepted", "declined"]);
export const kioskOrderStatusEnum = pgEnum("kiosk_order_status", ["pending", "processing", "completed", "cancelled", "refunded"]);
export const kioskPaymentMethodEnum = pgEnum("kiosk_payment_method", ["personal_credits", "company_credits", "stripe_card", "company_invoice", "cash"]);

// ─── Credit System Upgrade Enums ────────────────────────────────────
export const targetAudienceEnum = pgEnum("target_audience", ["freelancer", "individual", "smb", "business", "corporate"]);
export const contractTypeEnum = pgEnum("contract_type", ["monthly", "semi_annual", "annual", "multi_year"]);
export const bundleWalletTypeEnum = pgEnum("bundle_wallet_type", ["personal", "company", "both"]);
export const budgetControlLevelEnum = pgEnum("budget_control_level", ["none", "basic", "advanced", "enterprise"]);
export const enhancedLedgerTypeEnum = pgEnum("enhanced_ledger_type", ["grant", "spend", "rollover", "breakage", "topup", "refund", "transfer", "package_purchase", "overage", "bonus", "expiration"]);
export const ledgerSourceEnum = pgEnum("ledger_source", ["subscription", "package", "topup", "bonus", "manual"]);
export const enhancedNotificationTypeEnum = pgEnum("enhanced_notification_type", ["enterprise_signup", "breakage_milestone", "occupancy_anomaly", "credit_inflation", "monthly_report", "booking_reminder", "visitor_arrival", "system", "credit_threshold_80", "credit_threshold_100", "credit_expired", "auto_topup_triggered", "budget_cap_reached", "approval_required", "commit_milestone", "bonus_awarded", "rollover_processed"]);
export const budgetControlTypeEnum = pgEnum("budget_control_type", ["per_employee_cap", "team_budget", "location_restriction", "resource_type_restriction", "approval_threshold"]);
export const budgetPeriodTypeEnum = pgEnum("budget_period_type", ["daily", "weekly", "monthly"]);
export const commitStatusEnum = pgEnum("commit_status", ["draft", "pending_approval", "active", "paused", "expired", "terminated"]);
export const bonusTypeEnum = pgEnum("bonus_type", ["signup_bonus", "referral", "renewal", "daypass_conversion", "loyalty", "promotion", "manual"]);
export const walletContractTypeEnum = pgEnum("wallet_contract_type", ["monthly", "semi_annual", "annual", "multi_year"]);

// ─── Users ───────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  companyId: integer("companyId"),
  invitedBy: integer("invitedBy"),
  onboardingComplete: boolean("onboardingComplete").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  qrToken: varchar("qrToken", { length: 128 }),
});

export type PgUser = typeof users.$inferSelect;
export type PgInsertUser = typeof users.$inferInsert;

// ─── Locations ───────────────────────────────────────────────────────
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  address: text("address").notNull(),
  city: varchar("city", { length: 64 }).notNull(),
  postalCode: varchar("postalCode", { length: 12 }),
  lat: numeric("lat", { precision: 10, scale: 6 }),
  lng: numeric("lng", { precision: 10, scale: 6 }),
  imageUrl: text("imageUrl"),
  totalResources: integer("totalResources").default(0),
  isActive: boolean("isActive").default(true),
  timezone: varchar("timezone", { length: 64 }).default("Europe/Amsterdam"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Resources ───────────────────────────────────────────────────────
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  locationId: integer("locationId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  type: resourceTypeEnum("type").notNull(),
  zone: zoneEnum("zone").notNull(),
  capacity: integer("capacity").default(1),
  floor: varchar("floor", { length: 16 }),
  amenities: json("amenities").$type<string[]>(),
  creditCostPerHour: numeric("creditCostPerHour", { precision: 8, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  isActive: boolean("isActive").default(true),
  mapX: numeric("mapX", { precision: 6, scale: 2 }),
  mapY: numeric("mapY", { precision: 6, scale: 2 }),
  areaM2: numeric("areaM2", { precision: 8, scale: 2 }),
  isRozEligible: boolean("isRozEligible").default(false),
  rozContractType: varchar("rozContractType", { length: 64 }),
  rozServiceChargeModel: varchar("rozServiceChargeModel", { length: 64 }).default("voorschot"),
  rozVatRate: numeric("rozVatRate", { precision: 5, scale: 2 }).default("21.00"),
  rozIndexation: varchar("rozIndexation", { length: 32 }).default("CPI"),
  rozIndexationPct: numeric("rozIndexationPct", { precision: 5, scale: 2 }).default("2.50"),
  rozTenantProtection: boolean("rozTenantProtection").default(true),
  rozMinLeaseTerm: integer("rozMinLeaseTerm").default(1),
  rozNoticePeriodMonths: integer("rozNoticePeriodMonths").default(3),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Companies ───────────────────────────────────────────────────────
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#1a1a2e"),
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#e94560"),
  memberCount: integer("memberCount").default(0),
  tier: companyTierEnum("tier").default("bronze"),
  totalSpend: numeric("totalSpend", { precision: 12, scale: 2 }).default("0"),
  discountPercent: numeric("discountPercent", { precision: 5, scale: 2 }).default("5"),
  isActive: boolean("isActive").default(true),
  auth0OrgId: varchar("auth0OrgId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ─── Credit Bundles ──────────────────────────────────────────────────
export const creditBundles = pgTable("credit_bundles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  creditsPerMonth: integer("creditsPerMonth").notNull(),
  priceEur: numeric("priceEur", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  features: json("features").$type<string[]>(),
  isPopular: boolean("isPopular").default(false),
  isActive: boolean("isActive").default(true),
  stripeProductId: varchar("stripeProductId", { length: 128 }),
  stripePriceId: varchar("stripePriceId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  // Credit system upgrade fields
  targetAudience: targetAudienceEnum("targetAudience"),
  contractType: contractTypeEnum("contractType"),
  contractDurationMonths: integer("contractDurationMonths"),
  rolloverPercent: integer("rolloverPercent").default(0),
  pricePerCredit: numeric("pricePerCredit", { precision: 8, scale: 4 }),
  walletType: bundleWalletTypeEnum("walletType"),
  budgetControlLevel: budgetControlLevelEnum("budgetControlLevel").default("none"),
  overageRate: numeric("overageRate", { precision: 8, scale: 2 }),
  minCommitMonths: integer("minCommitMonths"),
  maxRolloverCredits: integer("maxRolloverCredits"),
});
export type CreditBundle = typeof creditBundles.$inferSelect;
export type InsertCreditBundle = typeof creditBundles.$inferInsert;

// ─── Wallets ─────────────────────────────────────────────────────────
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  type: walletTypeEnum("type").notNull(),
  ownerId: integer("ownerId").notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).default("0").notNull(),
  rolloverBalance: numeric("rolloverBalance", { precision: 12, scale: 2 }).default("0"),
  bundleId: integer("bundleId"),
  maxRollover: integer("maxRollover").default(0),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  // Credit system upgrade fields
  walletContractType: walletContractTypeEnum("walletContractType"),
  contractStartDate: bigint("contractStartDate", { mode: "number" }),
  contractEndDate: bigint("contractEndDate", { mode: "number" }),
  rolloverPercent: integer("rolloverPercent").default(0),
  spendingCapPerMonth: numeric("spendingCapPerMonth", { precision: 12, scale: 2 }),
  autoTopUpEnabled: boolean("autoTopUpEnabled").default(false),
  autoTopUpThreshold: numeric("autoTopUpThreshold", { precision: 12, scale: 2 }),
  autoTopUpAmount: numeric("autoTopUpAmount", { precision: 12, scale: 2 }),
  creditExpiresAt: bigint("creditExpiresAt", { mode: "number" }),
  permanentBalance: numeric("permanentBalance", { precision: 12, scale: 2 }).default("0.00"),
  monthlySpent: numeric("monthlySpent", { precision: 12, scale: 2 }).default("0.00"),
});
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

// ─── Credit Ledger ───────────────────────────────────────────────────
export const creditLedger = pgTable("credit_ledger", {
  id: serial("id").primaryKey(),
  walletId: integer("walletId").notNull(),
  type: ledgerTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  balanceAfter: numeric("balanceAfter", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  referenceType: varchar("referenceType", { length: 64 }),
  referenceId: integer("referenceId"),
  multiplier: numeric("multiplier", { precision: 4, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  // Credit system upgrade fields
  source: ledgerSourceEnum("source"),
  expiresAt: bigint("expiresAt", { mode: "number" }),
  packageId: integer("packageId"),
});
export type CreditLedgerEntry = typeof creditLedger.$inferSelect;

// ─── Bookings ────────────────────────────────────────────────────────
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  resourceId: integer("resourceId").notNull(),
  locationId: integer("locationId").notNull(),
  walletId: integer("walletId"),
  startTime: bigint("startTime", { mode: "number" }).notNull(),
  endTime: bigint("endTime", { mode: "number" }).notNull(),
  creditsCost: numeric("creditsCost", { precision: 10, scale: 2 }).notNull(),
  multiplierApplied: numeric("multiplierApplied", { precision: 4, scale: 2 }).default("1.00"),
  status: bookingStatusEnum("status").default("confirmed").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ─── Day Multipliers ─────────────────────────────────────────────────
export const dayMultipliers = pgTable("day_multipliers", {
  id: serial("id").primaryKey(),
  locationId: integer("locationId").notNull(),
  dayOfWeek: integer("dayOfWeek").notNull(),
  multiplier: numeric("multiplier", { precision: 4, scale: 2 }).notNull(),
  isActive: boolean("isActive").default(true),
});

// ─── Visitors ────────────────────────────────────────────────────────
export const visitors = pgTable("visitors", {
  id: serial("id").primaryKey(),
  invitedByUserId: integer("invitedByUserId").notNull(),
  companyId: integer("companyId"),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  licensePlate: varchar("licensePlate", { length: 20 }),
  visitDate: bigint("visitDate", { mode: "number" }).notNull(),
  locationId: integer("locationId").notNull(),
  status: visitorStatusEnum("status").default("invited").notNull(),
  accessToken: varchar("accessToken", { length: 128 }),
  deepLinkSent: boolean("deepLinkSent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Company Branding ────────────────────────────────────────────────
export const companyBranding = pgTable("company_branding", {
  id: serial("id").primaryKey(),
  companyId: integer("companyId").notNull(),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 9 }).default("#1a1a2e"),
  secondaryColor: varchar("secondaryColor", { length: 9 }).default("#e94560"),
  accentColor: varchar("accentColor", { length: 9 }).default("#C4B89E"),
  fontFamily: varchar("fontFamily", { length: 128 }).default("Inter"),
  welcomeMessage: text("welcomeMessage"),
  backgroundImageUrl: text("backgroundImageUrl"),
  isActive: boolean("isActive").default(true),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ─── Employee Photos ─────────────────────────────────────────────────
export const employeePhotos = pgTable("employee_photos", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  companyId: integer("companyId").notNull(),
  photoUrl: text("photoUrl").notNull(),
  displayName: varchar("displayName", { length: 128 }),
  jobTitle: varchar("jobTitle", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Devices ─────────────────────────────────────────────────────────
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  locationId: integer("locationId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  type: deviceTypeEnum("type").notNull(),
  serialNumber: varchar("serialNumber", { length: 128 }),
  status: deviceStatusEnum("status").default("online"),
  lastPing: timestamp("lastPing"),
  firmwareVersion: varchar("firmwareVersion", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Sensors ─────────────────────────────────────────────────────────
export const sensors = pgTable("sensors", {
  id: serial("id").primaryKey(),
  deviceId: integer("deviceId").notNull(),
  resourceId: integer("resourceId"),
  type: sensorTypeEnum("type").notNull(),
  currentValue: numeric("currentValue", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 16 }),
  lastReading: timestamp("lastReading"),
  isActive: boolean("isActive").default(true),
});

// ─── Access Log ──────────────────────────────────────────────────────
export const accessLog = pgTable("access_log", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  resourceId: integer("resourceId"),
  locationId: integer("locationId").notNull(),
  zone: zoneEnum("zone"),
  action: accessActionEnum("action").notNull(),
  method: accessMethodEnum("method"),
  saltoEventId: varchar("saltoEventId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Notifications ───────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message"),
  isRead: boolean("isRead").default(false),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Invites ─────────────────────────────────────────────────────────
export const invites = pgTable("invites", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  companyId: integer("companyId"),
  invitedByUserId: integer("invitedByUserId"),
  role: inviteRoleEnum("role").default("user"),
  token: varchar("token", { length: 128 }).notNull().unique(),
  status: inviteStatusEnum("status").default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

// ─── CRM: Leads ──────────────────────────────────────────────────────
export const crmLeads = pgTable("crm_leads", {
  id: serial("id").primaryKey(),
  companyName: varchar("companyName", { length: 256 }).notNull(),
  contactName: varchar("contactName", { length: 256 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  companySize: varchar("companySize", { length: 32 }),
  industry: varchar("industry", { length: 128 }),
  website: varchar("website", { length: 512 }),
  locationPreference: varchar("locationPreference", { length: 128 }),
  budgetRange: varchar("budgetRange", { length: 64 }),
  source: crmSourceEnum("source").default("inbound"),
  stage: crmStageEnum("stage").default("new").notNull(),
  score: integer("score").default(0),
  estimatedValue: numeric("estimatedValue", { precision: 12, scale: 2 }),
  assignedToUserId: integer("assignedToUserId"),
  notes: text("notes"),
  lostReason: text("lostReason"),
  wonDate: timestamp("wonDate"),
  nextFollowUp: bigint("nextFollowUp", { mode: "number" }),
  tags: json("tags").$type<string[]>(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PgCrmLead = typeof crmLeads.$inferSelect;
export type PgInsertCrmLead = typeof crmLeads.$inferInsert;

// ─── CRM: Lead Activities ────────────────────────────────────────────
export const crmLeadActivities = pgTable("crm_lead_activities", {
  id: serial("id").primaryKey(),
  leadId: integer("leadId").notNull(),
  userId: integer("userId"),
  type: crmActivityTypeEnum("type").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── CRM: Campaigns ─────────────────────────────────────────────────
export const crmCampaigns = pgTable("crm_campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  type: campaignTypeEnum("type").default("email_sequence"),
  status: campaignStatusEnum("status").default("draft").notNull(),
  targetAudience: text("targetAudience"),
  totalLeads: integer("totalLeads").default(0),
  sentCount: integer("sentCount").default(0),
  openCount: integer("openCount").default(0),
  clickCount: integer("clickCount").default(0),
  replyCount: integer("replyCount").default(0),
  conversionCount: integer("conversionCount").default(0),
  createdByUserId: integer("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PgCrmCampaign = typeof crmCampaigns.$inferSelect;
export type PgInsertCrmCampaign = typeof crmCampaigns.$inferInsert;

// ─── CRM: Campaign Steps ────────────────────────────────────────────
export const crmCampaignSteps = pgTable("crm_campaign_steps", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaignId").notNull(),
  stepOrder: integer("stepOrder").notNull(),
  delayDays: integer("delayDays").default(0),
  subject: varchar("subject", { length: 512 }),
  body: text("body"),
  isAiGenerated: boolean("isAiGenerated").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── CRM: Campaign Enrollments ───────────────────────────────────────
export const crmCampaignEnrollments = pgTable("crm_campaign_enrollments", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaignId").notNull(),
  leadId: integer("leadId").notNull(),
  currentStepId: integer("currentStepId"),
  status: enrollmentStatusEnum("status").default("active").notNull(),
  nextSendAt: bigint("nextSendAt", { mode: "number" }),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

// ─── CRM: Email Templates ────────────────────────────────────────────
export const crmEmailTemplates = pgTable("crm_email_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  subject: varchar("subject", { length: 512 }).notNull(),
  body: text("body").notNull(),
  category: varchar("category", { length: 64 }),
  isAiGenerated: boolean("isAiGenerated").default(false),
  usageCount: integer("usageCount").default(0),
  createdByUserId: integer("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ─── Resource Types ──────────────────────────────────────────────────
export const resourceTypes = pgTable("resource_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  defaultCapacity: integer("defaultCapacity").default(1),
  chargingUnit: chargingUnitEnum("chargingUnit").default("per_hour").notNull(),
  timeSlotMinutes: integer("timeSlotMinutes").default(15),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PgResourceType = typeof resourceTypes.$inferSelect;
export type PgInsertResourceType = typeof resourceTypes.$inferInsert;

// ─── Resource Rates ──────────────────────────────────────────────────
export const resourceRates = pgTable("resource_rates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  resourceTypeId: integer("resourceTypeId").notNull(),
  creditCost: numeric("creditCost", { precision: 10, scale: 2 }).notNull(),
  chargingUnit: chargingUnitEnum("chargingUnit").default("per_hour").notNull(),
  maxPriceCap: numeric("maxPriceCap", { precision: 10, scale: 2 }),
  initialFixedCost: numeric("initialFixedCost", { precision: 10, scale: 2 }),
  initialFixedMinutes: integer("initialFixedMinutes"),
  perAttendeePricing: boolean("perAttendeePricing").default(false),
  isDefault: boolean("isDefault").default(false),
  appliesToCustomerType: appliesToCustomerTypeEnum("appliesToCustomerType").default("all"),
  appliesToTiers: json("appliesToTiers").$type<string[]>(),
  appliesToBundleIds: json("appliesToBundleIds").$type<number[]>(),
  creditCostInCredits: integer("creditCostInCredits"),
  validDaysOfWeek: json("validDaysOfWeek").$type<number[]>(),
  validTimeStart: varchar("validTimeStart", { length: 5 }),
  validTimeEnd: varchar("validTimeEnd", { length: 5 }),
  validFromDate: bigint("validFromDate", { mode: "number" }),
  validToDate: bigint("validToDate", { mode: "number" }),
  maxBookingLengthMinutes: integer("maxBookingLengthMinutes"),
  isActive: boolean("isActive").default(true),
  sortOrder: integer("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PgResourceRate = typeof resourceRates.$inferSelect;
export type PgInsertResourceRate = typeof resourceRates.$inferInsert;

// ─── Resource Rules ──────────────────────────────────────────────────
export const resourceRules = pgTable("resource_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  scope: ruleScopeEnum("scope").default("individual").notNull(),
  resourceId: integer("resourceId"),
  resourceTypeId: integer("resourceTypeId"),
  conditionType: conditionTypeEnum("conditionType").notNull(),
  conditionValue: json("conditionValue").$type<Record<string, unknown>>(),
  limitType: limitTypeEnum("limitType").notNull(),
  limitValue: json("limitValue").$type<Record<string, unknown>>(),
  evaluationOrder: integer("evaluationOrder").default(0),
  stopEvaluation: boolean("stopEvaluation").default(false),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PgResourceRule = typeof resourceRules.$inferSelect;
export type PgInsertResourceRule = typeof resourceRules.$inferInsert;

// ─── Resource Categories ─────────────────────────────────────────────
export const resourceCategories = pgTable("resource_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  sortOrder: integer("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Booking Policies ────────────────────────────────────────────────
export const bookingPolicies = pgTable("booking_policies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  locationId: integer("locationId"),
  resourceTypeId: integer("resourceTypeId"),
  bufferMinutes: integer("bufferMinutes").default(0),
  minAdvanceMinutes: integer("minAdvanceMinutes").default(0),
  maxAdvanceDays: integer("maxAdvanceDays").default(90),
  minDurationMinutes: integer("minDurationMinutes").default(15),
  maxDurationMinutes: integer("maxDurationMinutes").default(480),
  freeCancelMinutes: integer("freeCancelMinutes").default(1440),
  lateCancelFeePercent: integer("lateCancelFeePercent").default(50),
  noShowFeePercent: integer("noShowFeePercent").default(100),
  autoCheckInMinutes: integer("autoCheckInMinutes").default(15),
  autoCancelNoCheckIn: boolean("autoCancelNoCheckIn").default(true),
  allowRecurring: boolean("allowRecurring").default(true),
  requireApproval: boolean("requireApproval").default(false),
  allowGuestBooking: boolean("allowGuestBooking").default(false),
  maxAttendeesOverride: integer("maxAttendeesOverride"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PgBookingPolicy = typeof bookingPolicies.$inferSelect;
export type PgInsertBookingPolicy = typeof bookingPolicies.$inferInsert;

// ─── Resource Amenities ──────────────────────────────────────────────
export const resourceAmenities = pgTable("resource_amenities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  icon: varchar("icon", { length: 64 }),
  category: amenityCategoryEnum("category").default("tech"),
  isActive: boolean("isActive").default(true),
});

// ─── Resource-Amenity Junction ───────────────────────────────────────
export const resourceAmenityMap = pgTable("resource_amenity_map", {
  id: serial("id").primaryKey(),
  resourceId: integer("resourceId").notNull(),
  amenityId: integer("amenityId").notNull(),
});

// ─── Resource Schedules ──────────────────────────────────────────────
export const resourceSchedules = pgTable("resource_schedules", {
  id: serial("id").primaryKey(),
  resourceId: integer("resourceId"),
  resourceTypeId: integer("resourceTypeId"),
  locationId: integer("locationId"),
  dayOfWeek: integer("dayOfWeek").notNull(),
  openTime: varchar("openTime", { length: 5 }).notNull(),
  closeTime: varchar("closeTime", { length: 5 }).notNull(),
  isActive: boolean("isActive").default(true),
});

// ─── Resource Blocked Dates ──────────────────────────────────────────
export const resourceBlockedDates = pgTable("resource_blocked_dates", {
  id: serial("id").primaryKey(),
  resourceId: integer("resourceId"),
  locationId: integer("locationId"),
  startDate: bigint("startDate", { mode: "number" }).notNull(),
  endDate: bigint("endDate", { mode: "number" }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Company Branding Scraped ────────────────────────────────────────
export const companyBrandingScraped = pgTable("company_branding_scraped", {
  id: serial("id").primaryKey(),
  companyId: integer("companyId").notNull(),
  websiteUrl: text("websiteUrl"),
  scrapedLogoUrl: text("scrapedLogoUrl"),
  scrapedFaviconUrl: text("scrapedFaviconUrl"),
  scrapedColors: json("scrapedColors").$type<string[]>(),
  scrapedImages: json("scrapedImages").$type<string[]>(),
  scrapedFonts: json("scrapedFonts").$type<string[]>(),
  scrapedTitle: varchar("scrapedTitle", { length: 256 }),
  scrapedDescription: text("scrapedDescription"),
  status: scrapedStatusEnum("status").default("pending"),
  lastScrapedAt: timestamp("lastScrapedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ─── Product Categories ──────────────────────────────────────────────
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  sortOrder: integer("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  locationId: integer("locationId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Products ────────────────────────────────────────────────────────
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("categoryId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  priceCredits: numeric("priceCredits", { precision: 10, scale: 2 }).notNull(),
  priceEur: numeric("priceEur", { precision: 10, scale: 2 }).notNull(),
  sku: varchar("sku", { length: 64 }),
  stockTracking: boolean("stockTracking").default(false),
  stockQuantity: integer("stockQuantity").default(0),
  isActive: boolean("isActive").default(true),
  isBookingAddon: boolean("isBookingAddon").default(false),
  chargePerBookingHour: boolean("chargePerBookingHour").default(false),
  allowMultipleQuantity: boolean("allowMultipleQuantity").default(true),
  maxQuantityPerOrder: integer("maxQuantityPerOrder").default(10),
  vatRate: numeric("vatRate", { precision: 5, scale: 2 }).default("21.00"),
  sortOrder: integer("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ─── Product Resource Links ──────────────────────────────────────────
export const productResourceLinks = pgTable("product_resource_links", {
  id: serial("id").primaryKey(),
  productId: integer("productId").notNull(),
  resourceTypeId: integer("resourceTypeId"),
  resourceId: integer("resourceId"),
  isRequired: boolean("isRequired").default(false),
  isDefault: boolean("isDefault").default(false),
  sortOrder: integer("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Kiosk Orders ────────────────────────────────────────────────────
export const kioskOrders = pgTable("kiosk_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull(),
  locationId: integer("locationId").notNull(),
  userId: integer("userId"),
  companyId: integer("companyId"),
  bookingId: integer("bookingId"),
  status: kioskOrderStatusEnum("status").default("pending"),
  paymentMethod: kioskPaymentMethodEnum("paymentMethod").notNull(),
  subtotalCredits: numeric("subtotalCredits", { precision: 10, scale: 2 }).default("0"),
  subtotalEur: numeric("subtotalEur", { precision: 10, scale: 2 }).default("0"),
  totalCredits: numeric("totalCredits", { precision: 10, scale: 2 }).default("0"),
  totalEur: numeric("totalEur", { precision: 10, scale: 2 }).default("0"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 256 }),
  notes: text("notes"),
  kitchenStatus: varchar("kitchenStatus", { length: 20 }).default("new"),
  kitchenStartedAt: timestamp("kitchenStartedAt"),
  kitchenReadyAt: timestamp("kitchenReadyAt"),
  kitchenPickedUpAt: timestamp("kitchenPickedUpAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ─── Kiosk Order Items ───────────────────────────────────────────────
export const kioskOrderItems = pgTable("kiosk_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  productId: integer("productId").notNull(),
  productName: varchar("productName", { length: 256 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPriceCredits: numeric("unitPriceCredits", { precision: 10, scale: 2 }).notNull(),
  unitPriceEur: numeric("unitPriceEur", { precision: 10, scale: 2 }).notNull(),
  totalCredits: numeric("totalCredits", { precision: 10, scale: 2 }).notNull(),
  totalEur: numeric("totalEur", { precision: 10, scale: 2 }).notNull(),
  vatRate: numeric("vatRate", { precision: 5, scale: 2 }).default("21.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Booking Addons ──────────────────────────────────────────────────
export const bookingAddons = pgTable("booking_addons", {
  id: serial("id").primaryKey(),
  bookingId: integer("bookingId").notNull(),
  productId: integer("productId").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPriceCredits: numeric("unitPriceCredits", { precision: 10, scale: 2 }).notNull(),
  totalCredits: numeric("totalCredits", { precision: 10, scale: 2 }).notNull(),
  proratedByHours: boolean("proratedByHours").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Parking Zones ───────────────────────────────────────────────────
export const parkingZones = pgTable("parking_zones", {
  id: serial("id").primaryKey(),
  locationId: integer("locationId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull(),
  totalSpots: integer("totalSpots").notNull().default(0),
  type: parkingZoneTypeEnum("type").default("outdoor"),
  accessMethod: parkingAccessMethodEnum("accessMethod").default("barrier"),
  reservedSpots: integer("reservedSpots").default(0),
  overbookingEnabled: boolean("overbookingEnabled").default(false),
  overbookingRatio: numeric("overbookingRatio", { precision: 4, scale: 2 }).default("1.20"),
  noShowRateAvg: numeric("noShowRateAvg", { precision: 4, scale: 2 }).default("0.25"),
  costUnderbooking: numeric("costUnderbooking", { precision: 8, scale: 2 }).default("75.00"),
  costOverbooking: numeric("costOverbooking", { precision: 8, scale: 2 }).default("50.00"),
  payPerUseEnabled: boolean("payPerUseEnabled").default(false),
  payPerUseThreshold: integer("payPerUseThreshold").default(85),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ─── Parking Spots ───────────────────────────────────────────────────
export const parkingSpots = pgTable("parking_spots", {
  id: serial("id").primaryKey(),
  zoneId: integer("zoneId").notNull(),
  spotNumber: varchar("spotNumber", { length: 16 }).notNull(),
  type: parkingSpotTypeEnum("type").default("standard"),
  status: parkingSpotStatusEnum("status").default("available"),
  sensorId: varchar("sensorId", { length: 128 }),
  assignedUserId: integer("assignedUserId"),
  assignedCompanyId: integer("assignedCompanyId"),
  isActive: boolean("isActive").default(true),
});

// ─── Parking Pricing ─────────────────────────────────────────────────
export const parkingPricing = pgTable("parking_pricing", {
  id: serial("id").primaryKey(),
  zoneId: integer("zoneId"),
  name: varchar("name", { length: 128 }).notNull(),
  rateType: parkingRateTypeEnum("rateType").notNull(),
  priceEur: numeric("priceEur", { precision: 10, scale: 2 }).notNull(),
  priceCredits: numeric("priceCredits", { precision: 10, scale: 2 }),
  appliesToType: parkingAppliesToEnum("appliesToType").default("all"),
  dayBeforeDiscount: integer("dayBeforeDiscount").default(0),
  maxDailyCapEur: numeric("maxDailyCapEur", { precision: 10, scale: 2 }),
  freeMinutes: integer("freeMinutes").default(0),
  validDays: json("validDays").$type<number[]>(),
  validTimeStart: varchar("validTimeStart", { length: 5 }),
  validTimeEnd: varchar("validTimeEnd", { length: 5 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Parking Permits ─────────────────────────────────────────────────
export const parkingPermits = pgTable("parking_permits", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  companyId: integer("companyId"),
  poolId: integer("poolId"),
  zoneId: integer("zoneId").notNull(),
  licensePlate: varchar("licensePlate", { length: 20 }).notNull(),
  vehicleDescription: varchar("vehicleDescription", { length: 256 }),
  type: parkingPermitTypeEnum("type").default("monthly"),
  slaTier: text("slaTier").default("silver"),
  status: parkingPermitStatusEnum("status").default("active"),
  startDate: bigint("startDate", { mode: "number" }).notNull(),
  endDate: bigint("endDate", { mode: "number" }),
  spotId: integer("spotId"),
  noShowCount: integer("noShowCount").default(0),
  penaltyPoints: integer("penaltyPoints").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ─── Parking Sessions ────────────────────────────────────────────────
export const parkingSessions = pgTable("parking_sessions", {
  id: serial("id").primaryKey(),
  zoneId: integer("zoneId").notNull(),
  spotId: integer("spotId"),
  userId: integer("userId"),
  permitId: integer("permitId"),
  poolId: integer("poolId"),
  licensePlate: varchar("licensePlate", { length: 20 }),
  entryMethod: text("entryMethod").default("anpr"),
  accessType: text("accessType").default("member"),
  entryTime: bigint("entryTime", { mode: "number" }).notNull(),
  exitTime: bigint("exitTime", { mode: "number" }),
  durationMinutes: integer("durationMinutes"),
  status: parkingSessionStatusEnum("status").default("active"),
  amountEur: numeric("amountEur", { precision: 10, scale: 2 }),
  amountCredits: numeric("amountCredits", { precision: 10, scale: 2 }),
  paymentMethod: parkingPaymentMethodEnum("paymentMethod"),
  paymentStatus: parkingPaymentStatusEnum("paymentStatus").default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Parking Reservations ────────────────────────────────────────────
export const parkingReservations = pgTable("parking_reservations", {
  id: serial("id").primaryKey(),
  zoneId: integer("zoneId").notNull(),
  spotId: integer("spotId"),
  userId: integer("userId").notNull(),
  licensePlate: varchar("licensePlate", { length: 20 }),
  reservationDate: bigint("reservationDate", { mode: "number" }).notNull(),
  startTime: bigint("startTime", { mode: "number" }).notNull(),
  endTime: bigint("endTime", { mode: "number" }).notNull(),
  status: parkingReservationStatusEnum("status").default("confirmed"),
  discountApplied: integer("discountApplied").default(0),
  amountEur: numeric("amountEur", { precision: 10, scale: 2 }),
  amountCredits: numeric("amountCredits", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Tickets ─────────────────────────────────────────────────────────
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: varchar("ticketNumber", { length: 32 }).notNull().unique(),
  subject: varchar("subject", { length: 512 }).notNull(),
  description: text("description"),
  status: ticketStatusEnum("status").default("new").notNull(),
  priority: ticketPriorityEnum("priority").default("normal"),
  category: ticketCategoryEnum("category").default("general"),
  channel: ticketChannelEnum("channel").default("web"),
  requesterId: integer("requesterId"),
  assignedToId: integer("assignedToId"),
  locationId: integer("locationId"),
  resourceId: integer("resourceId"),
  tags: json("tags").$type<string[]>(),
  aiSuggestion: text("aiSuggestion"),
  aiCategory: varchar("aiCategory", { length: 64 }),
  aiSentiment: aiSentimentEnum("aiSentiment"),
  aiAutoResolved: boolean("aiAutoResolved").default(false),
  slaDeadline: bigint("slaDeadline", { mode: "number" }),
  firstResponseAt: bigint("firstResponseAt", { mode: "number" }),
  resolvedAt: bigint("resolvedAt", { mode: "number" }),
  closedAt: bigint("closedAt", { mode: "number" }),
  satisfactionRating: integer("satisfactionRating"),
  satisfactionComment: text("satisfactionComment"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ─── Ticket Messages ─────────────────────────────────────────────────
export const ticketMessages = pgTable("ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticketId").notNull(),
  senderId: integer("senderId"),
  senderType: senderTypeEnum("senderType").default("requester"),
  body: text("body").notNull(),
  isInternal: boolean("isInternal").default(false),
  attachments: json("attachments").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Ticket SLA Policies ─────────────────────────────────────────────
export const ticketSlaPolicies = pgTable("ticket_sla_policies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  priority: ticketPriorityEnum("priority").notNull(),
  firstResponseMinutes: integer("firstResponseMinutes").notNull(),
  resolutionMinutes: integer("resolutionMinutes").notNull(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Canned Responses ────────────────────────────────────────────────
export const cannedResponses = pgTable("canned_responses", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  body: text("body").notNull(),
  category: varchar("category", { length: 64 }),
  shortcut: varchar("shortcut", { length: 32 }),
  usageCount: integer("usageCount").default(0),
  createdByUserId: integer("createdByUserId"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Room Control Zones ──────────────────────────────────────────────
export const roomControlZones = pgTable("room_control_zones", {
  id: serial("id").primaryKey(),
  locationId: integer("locationId").notNull(),
  resourceId: integer("resourceId"),
  name: varchar("name", { length: 128 }).notNull(),
  floor: varchar("floor", { length: 16 }),
  type: roomZoneTypeEnum("type").default("meeting_room"),
  hvacEnabled: boolean("hvacEnabled").default(true),
  lightingEnabled: boolean("lightingEnabled").default(true),
  avEnabled: boolean("avEnabled").default(false),
  blindsEnabled: boolean("blindsEnabled").default(false),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Room Control Points ─────────────────────────────────────────────
export const roomControlPoints = pgTable("room_control_points", {
  id: serial("id").primaryKey(),
  zoneId: integer("zoneId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  type: roomControlTypeEnum("type").notNull(),
  currentValue: varchar("currentValue", { length: 64 }),
  targetValue: varchar("targetValue", { length: 64 }),
  unit: varchar("unit", { length: 16 }),
  minValue: numeric("minValue", { precision: 8, scale: 2 }),
  maxValue: numeric("maxValue", { precision: 8, scale: 2 }),
  isControllable: boolean("isControllable").default(true),
  lastUpdated: timestamp("lastUpdated"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Room Sensor Readings ────────────────────────────────────────────
export const roomSensorReadings = pgTable("room_sensor_readings", {
  id: serial("id").primaryKey(),
  zoneId: integer("zoneId").notNull(),
  sensorType: roomSensorTypeEnum("sensorType").notNull(),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 16 }),
  recordedAt: bigint("recordedAt", { mode: "number" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Room Automation Rules ───────────────────────────────────────────
export const roomAutomationRules = pgTable("room_automation_rules", {
  id: serial("id").primaryKey(),
  zoneId: integer("zoneId"),
  locationId: integer("locationId"),
  name: varchar("name", { length: 256 }).notNull(),
  triggerType: automationTriggerTypeEnum("triggerType").notNull(),
  triggerConfig: json("triggerConfig").$type<Record<string, unknown>>(),
  actionType: automationActionTypeEnum("actionType").notNull(),
  actionConfig: json("actionConfig").$type<Record<string, unknown>>(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Alert Thresholds ────────────────────────────────────────────────
export const alertThresholds = pgTable("alert_thresholds", {
  id: serial("id").primaryKey(),
  zoneId: integer("zoneId"),
  locationId: integer("locationId"),
  sensorType: roomSensorTypeEnum("sensorType").notNull(),
  operator: alertOperatorEnum("operator").notNull(),
  thresholdValue: numeric("thresholdValue", { precision: 10, scale: 2 }).notNull(),
  alertLevel: alertLevelEnum("alertLevel").default("warning"),
  notifyRoles: json("notifyRoles").$type<string[]>(),
  cooldownMinutes: integer("cooldownMinutes").default(30),
  isActive: boolean("isActive").default(true),
  lastTriggeredAt: bigint("lastTriggeredAt", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Operations Agenda ───────────────────────────────────────────────
export const opsAgenda = pgTable("ops_agenda", {
  id: serial("id").primaryKey(),
  locationId: integer("locationId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  type: opsTypeEnum("type").default("event"),
  startTime: bigint("startTime", { mode: "number" }).notNull(),
  endTime: bigint("endTime", { mode: "number" }),
  assignedToId: integer("assignedToId"),
  status: opsStatusEnum("status").default("scheduled"),
  priority: opsPriorityEnum("priority").default("normal"),
  isRecurring: boolean("isRecurring").default(false),
  recurringPattern: json("recurringPattern").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ─── CRM: Triggers ───────────────────────────────────────────────────
export const crmTriggers = pgTable("crm_triggers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true),
  eventType: crmTriggerEventEnum("eventType").notNull(),
  conditions: json("conditions").$type<Record<string, any>>(),
  actions: json("actions").$type<Array<{ type: string; config: Record<string, any> }>>(),
  executionCount: integer("executionCount").default(0),
  lastExecutedAt: timestamp("lastExecutedAt"),
  createdByUserId: integer("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PgCrmTrigger = typeof crmTriggers.$inferSelect;
export type PgInsertCrmTrigger = typeof crmTriggers.$inferInsert;

// ─── CRM: Trigger Logs ──────────────────────────────────────────────
export const crmTriggerLogs = pgTable("crm_trigger_logs", {
  id: serial("id").primaryKey(),
  triggerId: integer("triggerId").notNull(),
  leadId: integer("leadId"),
  eventData: json("eventData"),
  actionsExecuted: json("actionsExecuted").$type<Array<{ type: string; status: string; result?: any; error?: string }>>(),
  status: crmTriggerLogStatusEnum("status").default("success"),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
});

// ─── CRM: Website Visitors ───────────────────────────────────────────
export const crmWebsiteVisitors = pgTable("crm_website_visitors", {
  id: serial("id").primaryKey(),
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
  totalPageViews: integer("totalPageViews").default(1),
  totalVisits: integer("totalVisits").default(1),
  firstVisitAt: timestamp("firstVisitAt").defaultNow().notNull(),
  lastVisitAt: timestamp("lastVisitAt").defaultNow().notNull(),
  referrer: varchar("referrer", { length: 512 }),
  utmSource: varchar("utmSource", { length: 128 }),
  utmMedium: varchar("utmMedium", { length: 128 }),
  utmCampaign: varchar("utmCampaign", { length: 128 }),
  matchedLeadId: integer("matchedLeadId"),
  enrichmentData: json("enrichmentData"),
  isIdentified: boolean("isIdentified").default(false),
  status: crmVisitorStatusEnum("status").default("new"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PgCrmWebsiteVisitor = typeof crmWebsiteVisitors.$inferSelect;
export type PgInsertCrmWebsiteVisitor = typeof crmWebsiteVisitors.$inferInsert;

// ─── Member Profiles ─────────────────────────────────────────────────
export const memberProfiles = pgTable("member_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  companyId: integer("companyId"),
  tier: memberTierEnum("tier").default("prospect").notNull(),
  displayName: varchar("displayName", { length: 256 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  companyName: varchar("companyName", { length: 256 }),
  jobTitle: varchar("jobTitle", { length: 128 }),
  linkedIn: varchar("linkedIn", { length: 512 }),
  photoUrl: text("photoUrl"),
  locationPreference: varchar("locationPreference", { length: 128 }),
  creditBalance: numeric("creditBalance", { precision: 12, scale: 2 }).default("0"),
  creditBundleType: varchar("creditBundleType", { length: 64 }),
  totalBookings: integer("totalBookings").default(0),
  totalSpent: numeric("totalSpent", { precision: 12, scale: 2 }).default("0"),
  lastActiveAt: timestamp("lastActiveAt"),
  ballotDate: timestamp("ballotDate"),
  ballotSponsor: varchar("ballotSponsor", { length: 256 }),
  source: varchar("source", { length: 128 }),
  funnelStage: varchar("funnelStage", { length: 64 }),
  notes: text("notes"),
  tags: json("tags").$type<string[]>(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PgMemberProfile = typeof memberProfiles.$inferSelect;
export type PgInsertMemberProfile = typeof memberProfiles.$inferInsert;

// ─── Re-engagement Funnel ────────────────────────────────────────────
export const reengagementFunnel = pgTable("reengagement_funnel", {
  id: serial("id").primaryKey(),
  memberProfileId: integer("memberProfileId"),
  contactName: varchar("contactName", { length: 256 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }),
  companyName: varchar("companyName", { length: 256 }),
  previousRelationship: varchar("previousRelationship", { length: 128 }),
  stage: reengagementStageEnum("stage").default("identified").notNull(),
  inviteSentAt: timestamp("inviteSentAt"),
  inviteOpenedAt: timestamp("inviteOpenedAt"),
  applicationDate: timestamp("applicationDate"),
  personalMessage: text("personalMessage"),
  aiGeneratedInvite: text("aiGeneratedInvite"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PgReengagementEntry = typeof reengagementFunnel.$inferSelect;
export type PgInsertReengagementEntry = typeof reengagementFunnel.$inferInsert;

// ─── Skynet Mirror Tables ────────────────────────────────────────────
export const skynetUsers = pgTable("skynet_users", {
  id: serial("id").primaryKey(),
  netosId: integer("netosId").unique(),
  openId: text("openId").unique(),
  name: text("name"),
  email: text("email"),
  avatarUrl: text("avatarUrl"),
  role: text("role").default("user"),
  saltoKeyId: text("saltoKeyId"),
  unifiIdentityId: text("unifiIdentityId"),
  syncedAt: timestamp("syncedAt").defaultNow(),
});

export const skynetParkingSessions = pgTable("skynet_parking_sessions", {
  id: serial("id").primaryKey(),
  netosId: integer("netosId").unique(),
  zoneId: integer("zoneId").notNull(),
  spotId: integer("spotId"),
  userId: integer("userId"),
  licensePlate: text("licensePlate"),
  entryTime: bigint("entryTime", { mode: "number" }).notNull(),
  exitTime: bigint("exitTime", { mode: "number" }),
  status: text("status").default("active"),
  syncedAt: timestamp("syncedAt").defaultNow(),
});

export const skynetTickets = pgTable("skynet_tickets", {
  id: serial("id").primaryKey(),
  netosId: integer("netosId").unique(),
  ticketNumber: text("ticketNumber").notNull(),
  subject: text("subject").notNull(),
  status: text("status").default("new"),
  priority: text("priority").default("normal"),
  requesterId: integer("requesterId"),
  assignedToId: integer("assignedToId"),
  syncedAt: timestamp("syncedAt").defaultNow(),
});

export const skynetAccessTokens = pgTable("skynet_access_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  tokenType: text("tokenType").notNull(),
  tokenValue: text("tokenValue").notNull(),
  expiresAt: bigint("expiresAt", { mode: "number" }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
});


// ═══════════════════════════════════════════════════════════════════════
// ─── SIGNAGE MODULE ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export const signageScreenTypeEnum = pgEnum("signage_screen_type", [
  "reception", "gym", "kitchen", "wayfinding", "general", "meeting_room", "elevator", "parking",
]);
export const signageScreenStatusEnum = pgEnum("signage_screen_status", [
  "online", "offline", "provisioning", "maintenance", "error",
]);
export const signageOrientationEnum = pgEnum("signage_orientation", ["portrait", "landscape"]);
export const signageContentTypeEnum = pgEnum("signage_content_type", [
  "image", "video", "html", "url", "menu_card", "wayfinding",
  "gym_schedule", "weather", "clock", "news_ticker",
  "company_presence", "welcome_screen", "announcement",
]);
export const signageScheduleTypeEnum = pgEnum("signage_schedule_type", ["always", "time_based", "day_based"]);
export const signageAuditActionEnum = pgEnum("signage_audit_action", [
  "provisioned", "content_changed", "playlist_assigned",
  "screen_online", "screen_offline", "settings_changed",
  "error_reported", "reboot", "firmware_update",
]);
export const kitchenCategoryEnum = pgEnum("kitchen_category", [
  "breakfast", "lunch", "dinner", "snack", "drink",
  "soup", "salad", "sandwich", "special",
]);
export const gymCategoryEnum = pgEnum("gym_category", [
  "cardio", "strength", "yoga", "pilates", "hiit",
  "cycling", "boxing", "stretching", "meditation", "egym",
]);
export const presenceMethodEnum = pgEnum("presence_method", ["manual", "access_log", "auto", "api"]);

// ─── Signage Screens ─────────────────────────────────────────────────
export const signageScreens = pgTable("signage_screens", {
  id: serial("id").primaryKey(),
  locationId: integer("locationId").notNull(),
  name: text("name").notNull(),
  screenType: signageScreenTypeEnum("screenType").notNull(),
  orientation: signageOrientationEnum("orientation").default("portrait"),
  resolution: text("resolution").default("1080x1920"),
  floor: text("floor"),
  zone: text("zone"),
  provisioningToken: text("provisioningToken").unique(),
  status: signageScreenStatusEnum("status").default("provisioning"),
  lastHeartbeat: timestamp("lastHeartbeat"),
  currentPlaylistId: integer("currentPlaylistId"),
  ipAddress: text("ipAddress"),
  macAddress: text("macAddress"),
  userAgent: text("userAgent"),
  firmwareVersion: text("firmwareVersion"),
  brightness: integer("brightness").default(100),
  volume: integer("volume").default(0),
  isActive: boolean("isActive").default(true),
  tags: json("tags").$type<string[]>(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type SignageScreen = typeof signageScreens.$inferSelect;
export type InsertSignageScreen = typeof signageScreens.$inferInsert;

// ─── Signage Screen Groups ──────────────────────────────────────────
export const signageScreenGroups = pgTable("signage_screen_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  locationId: integer("locationId"),
  screenType: signageScreenTypeEnum("screenType"),
  color: text("color").default("#627653"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SignageScreenGroup = typeof signageScreenGroups.$inferSelect;

// ─── Screen-Group Membership ────────────────────────────────────────
export const signageScreenGroupMembers = pgTable("signage_screen_group_members", {
  id: serial("id").primaryKey(),
  screenId: integer("screenId").notNull(),
  groupId: integer("groupId").notNull(),
});

// ─── Signage Content Items ──────────────────────────────────────────
export const signageContent = pgTable("signage_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  contentType: signageContentTypeEnum("contentType").notNull(),
  mediaUrl: text("mediaUrl"),
  htmlContent: text("htmlContent"),
  externalUrl: text("externalUrl"),
  duration: integer("duration").default(15),
  templateData: json("templateData").$type<Record<string, unknown>>(),
  targetScreenTypes: json("targetScreenTypes").$type<string[]>(),
  locationId: integer("locationId"),
  isActive: boolean("isActive").default(true),
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  priority: integer("priority").default(0),
  createdByUserId: integer("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type SignageContentItem = typeof signageContent.$inferSelect;
export type InsertSignageContent = typeof signageContent.$inferInsert;

// ─── Signage Playlists ──────────────────────────────────────────────
export const signagePlaylists = pgTable("signage_playlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  screenType: signageScreenTypeEnum("screenType"),
  locationId: integer("locationId"),
  isDefault: boolean("isDefault").default(false),
  isActive: boolean("isActive").default(true),
  scheduleType: signageScheduleTypeEnum("scheduleType").default("always"),
  scheduleConfig: json("scheduleConfig").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type SignagePlaylist = typeof signagePlaylists.$inferSelect;
export type InsertSignagePlaylist = typeof signagePlaylists.$inferInsert;

// ─── Playlist Items ─────────────────────────────────────────────────
export const signagePlaylistItems = pgTable("signage_playlist_items", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlistId").notNull(),
  contentId: integer("contentId").notNull(),
  sortOrder: integer("sortOrder").default(0),
  durationOverride: integer("durationOverride"),
  isActive: boolean("isActive").default(true),
});
export type SignagePlaylistItem = typeof signagePlaylistItems.$inferSelect;

// ─── Signage Provisioning Templates ─────────────────────────────────
export const signageProvisioningTemplates = pgTable("signage_provisioning_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  screenType: signageScreenTypeEnum("screenType").notNull(),
  defaultPlaylistId: integer("defaultPlaylistId"),
  defaultOrientation: signageOrientationEnum("defaultOrientation").default("portrait"),
  defaultResolution: text("defaultResolution").default("1080x1920"),
  defaultBrightness: integer("defaultBrightness").default(100),
  autoAssignLocation: boolean("autoAssignLocation").default(true),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SignageProvisioningTemplate = typeof signageProvisioningTemplates.$inferSelect;

// ─── Wayfinding: Buildings ──────────────────────────────────────────
export const wayfindingBuildings = pgTable("wayfinding_buildings", {
  id: serial("id").primaryKey(),
  locationId: integer("locationId").notNull(),
  name: text("name").notNull(),
  code: text("code"),
  address: text("address"),
  floors: integer("floors").default(1),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WayfindingBuilding = typeof wayfindingBuildings.$inferSelect;

// ─── Wayfinding: Company-Building Assignments ───────────────────────
export const wayfindingCompanyAssignments = pgTable("wayfinding_company_assignments", {
  id: serial("id").primaryKey(),
  companyId: integer("companyId").notNull(),
  buildingId: integer("buildingId").notNull(),
  floor: text("floor"),
  roomNumber: text("roomNumber"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WayfindingCompanyAssignment = typeof wayfindingCompanyAssignments.$inferSelect;

// ─── Wayfinding: Company Presence ───────────────────────────────────
export const wayfindingCompanyPresence = pgTable("wayfinding_company_presence", {
  id: serial("id").primaryKey(),
  companyId: integer("companyId").notNull(),
  locationId: integer("locationId").notNull(),
  buildingId: integer("buildingId"),
  isPresent: boolean("isPresent").default(false),
  checkedInAt: timestamp("checkedInAt"),
  checkedOutAt: timestamp("checkedOutAt"),
  checkedInByUserId: integer("checkedInByUserId"),
  method: presenceMethodEnum("method").default("manual"),
  date: text("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type WayfindingCompanyPresence = typeof wayfindingCompanyPresence.$inferSelect;

// ─── Signage Heartbeats ─────────────────────────────────────────────
export const signageHeartbeats = pgTable("signage_heartbeats", {
  id: serial("id").primaryKey(),
  screenId: integer("screenId").notNull(),
  status: signageScreenStatusEnum("status").default("online"),
  currentContentId: integer("currentContentId"),
  currentPlaylistId: integer("currentPlaylistId"),
  cpuUsage: text("cpuUsage"),
  memoryUsage: text("memoryUsage"),
  temperature: text("temperature"),
  uptime: integer("uptime"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SignageHeartbeat = typeof signageHeartbeats.$inferSelect;

// ─── Signage Audit Log ──────────────────────────────────────────────
export const signageAuditLog = pgTable("signage_audit_log", {
  id: serial("id").primaryKey(),
  screenId: integer("screenId"),
  action: signageAuditActionEnum("action").notNull(),
  description: text("description"),
  userId: integer("userId"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SignageAuditLogEntry = typeof signageAuditLog.$inferSelect;

// ─── Kitchen Menu Items ─────────────────────────────────────────────
export const kitchenMenuItems = pgTable("kitchen_menu_items", {
  id: serial("id").primaryKey(),
  locationId: integer("locationId").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: kitchenCategoryEnum("category").notNull(),
  price: text("price"),
  imageUrl: text("imageUrl"),
  allergens: json("allergens").$type<string[]>(),
  isVegan: boolean("isVegan").default(false),
  isVegetarian: boolean("isVegetarian").default(false),
  isGlutenFree: boolean("isGlutenFree").default(false),
  isAvailable: boolean("isAvailable").default(true),
  dayOfWeek: json("dayOfWeek").$type<number[]>(),
  sortOrder: integer("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type KitchenMenuItem = typeof kitchenMenuItems.$inferSelect;
export type InsertKitchenMenuItem = typeof kitchenMenuItems.$inferInsert;

// ─── Gym Schedules ──────────────────────────────────────────────────
export const gymSchedules = pgTable("gym_schedules", {
  id: serial("id").primaryKey(),
  locationId: integer("locationId").notNull(),
  className: text("className").notNull(),
  instructor: text("instructor"),
  description: text("description"),
  category: gymCategoryEnum("category").notNull(),
  dayOfWeek: integer("dayOfWeek").notNull(),
  startTime: text("startTime").notNull(),
  endTime: text("endTime").notNull(),
  maxParticipants: integer("maxParticipants").default(20),
  currentParticipants: integer("currentParticipants").default(0),
  imageUrl: text("imageUrl"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type GymSchedule = typeof gymSchedules.$inferSelect;
export type InsertGymSchedule = typeof gymSchedules.$inferInsert;


// ═══════════════════════════════════════════════════════════════════════
// ─── PARKING POOLS UPGRADE ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export const parkingPools = pgTable("parking_pools", {
  id: serial("id").primaryKey(),
  zoneId: integer("zoneId").notNull(),
  companyId: integer("companyId"),
  name: varchar("name", { length: 128 }).notNull(),
  guaranteedSpots: integer("guaranteedSpots").notNull().default(30),
  maxMembers: integer("maxMembers").default(0),
  overflowPriceEur: numeric("overflowPriceEur", { precision: 8, scale: 2 }).default("2.50"),
  overflowPriceDay: numeric("overflowPriceDay", { precision: 8, scale: 2 }).default("15.00"),
  monthlyFeeEur: numeric("monthlyFeeEur", { precision: 10, scale: 2 }).default("0"),
  slaTier: text("slaTier").default("gold"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type ParkingPool = typeof parkingPools.$inferSelect;

export const parkingPoolMembers = pgTable("parking_pool_members", {
  id: serial("id").primaryKey(),
  poolId: integer("poolId").notNull(),
  userId: integer("userId").notNull(),
  licensePlate: varchar("licensePlate", { length: 20 }),
  licensePlate2: varchar("licensePlate2", { length: 20 }),
  role: text("role").default("member"),
  status: text("status").default("active"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  totalSessions: integer("totalSessions").default(0),
  totalOverflowSessions: integer("totalOverflowSessions").default(0),
  noShowCount: integer("noShowCount").default(0),
});
export type ParkingPoolMember = typeof parkingPoolMembers.$inferSelect;

export const parkingAccessLog = pgTable("parking_access_log", {
  id: serial("id").primaryKey(),
  zoneId: integer("zoneId").notNull(),
  direction: text("direction").notNull(),
  method: text("method").notNull(),
  licensePlate: varchar("licensePlate", { length: 20 }),
  qrToken: varchar("qrToken", { length: 128 }),
  userId: integer("userId"),
  permitId: integer("permitId"),
  poolId: integer("poolId"),
  granted: boolean("granted").notNull().default(false),
  denialReason: varchar("denialReason", { length: 256 }),
  sessionId: integer("sessionId"),
  responseTimeMs: integer("responseTimeMs"),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
});
export type ParkingAccessLogEntry = typeof parkingAccessLog.$inferSelect;

export const parkingVisitorPermits = pgTable("parking_visitor_permits", {
  id: serial("id").primaryKey(),
  zoneId: integer("zoneId").notNull(),
  invitedByUserId: integer("invitedByUserId").notNull(),
  visitorName: varchar("visitorName", { length: 256 }).notNull(),
  visitorEmail: varchar("visitorEmail", { length: 320 }),
  visitorPhone: varchar("visitorPhone", { length: 20 }),
  licensePlate: varchar("licensePlate", { length: 20 }),
  qrToken: varchar("qrToken", { length: 128 }).notNull(),
  validFrom: bigint("validFrom", { mode: "number" }).notNull(),
  validUntil: bigint("validUntil", { mode: "number" }).notNull(),
  maxEntries: integer("maxEntries").default(1),
  usedEntries: integer("usedEntries").default(0),
  status: text("status").default("active"),
  shareMethod: text("shareMethod"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ParkingVisitorPermit = typeof parkingVisitorPermits.$inferSelect;

export const parkingSlaViolations = pgTable("parking_sla_violations", {
  id: serial("id").primaryKey(),
  zoneId: integer("zoneId").notNull(),
  userId: integer("userId").notNull(),
  permitId: integer("permitId"),
  poolId: integer("poolId"),
  slaTier: text("slaTier").notNull(),
  violationType: text("violationType").notNull(),
  compensationEur: numeric("compensationEur", { precision: 8, scale: 2 }).default("0"),
  compensationCredits: numeric("compensationCredits", { precision: 8, scale: 2 }).default("0"),
  compensationStatus: text("compensationStatus").default("pending"),
  alternativeOffered: varchar("alternativeOffered", { length: 256 }),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  resolvedAt: bigint("resolvedAt", { mode: "number" }),
  notes: text("notes"),
});
export type ParkingSlaViolation = typeof parkingSlaViolations.$inferSelect;

export const parkingCapacitySnapshots = pgTable("parking_capacity_snapshots", {
  id: serial("id").primaryKey(),
  zoneId: integer("zoneId").notNull(),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  totalSpots: integer("totalSpots").notNull(),
  occupied: integer("occupied").notNull(),
  reserved: integer("reserved").default(0),
  poolGuaranteed: integer("poolGuaranteed").default(0),
  poolOverflow: integer("poolOverflow").default(0),
  payPerUse: integer("payPerUse").default(0),
  visitors: integer("visitors").default(0),
  occupancyPercent: numeric("occupancyPercent", { precision: 5, scale: 2 }).notNull(),
  predictedPeak: numeric("predictedPeak", { precision: 5, scale: 2 }),
  overbookingHeadroom: integer("overbookingHeadroom").default(0),
});
export type ParkingCapacitySnapshot = typeof parkingCapacitySnapshots.$inferSelect;

// ═══════════════════════════════════════════════════════════════════════
// ─── MENUKAART MODULE ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export const menuSeasons = pgTable("menu_seasons", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull(),
  year: integer("year"),
  quarter: varchar("quarter", { length: 4 }),
  startDate: bigint("startDate", { mode: "number" }),
  endDate: bigint("endDate", { mode: "number" }),
  isActive: boolean("isActive").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type MenuSeason = typeof menuSeasons.$inferSelect;

export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 32 }),
  sortOrder: integer("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type MenuCategory = typeof menuCategories.$inferSelect;

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("categoryId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  priceEur: numeric("priceEur", { precision: 10, scale: 2 }).notNull(),
  memberPriceEur: numeric("memberPriceEur", { precision: 10, scale: 2 }),
  allergens: text("allergens"),
  tags: text("tags"),
  imageUrl: text("imageUrl"),
  isVegan: boolean("isVegan").default(false),
  isVegetarian: boolean("isVegetarian").default(false),
  isGlutenFree: boolean("isGlutenFree").default(false),
  isPopular: boolean("isPopular").default(false),
  isNew: boolean("isNew").default(false),
  sortOrder: integer("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type MenuItem = typeof menuItems.$inferSelect;

export const menuSeasonItems = pgTable("menu_season_items", {
  id: serial("id").primaryKey(),
  seasonId: integer("seasonId").notNull(),
  itemId: integer("itemId").notNull(),
  overridePriceEur: numeric("overridePriceEur", { precision: 10, scale: 2 }),
  overrideMemberPriceEur: numeric("overrideMemberPriceEur", { precision: 10, scale: 2 }),
  isHighlighted: boolean("isHighlighted").default(false),
  sortOrder: integer("sortOrder").default(0),
});
export type MenuSeasonItem = typeof menuSeasonItems.$inferSelect;

export const menuPreparations = pgTable("menu_preparations", {
  id: serial("id").primaryKey(),
  itemId: integer("itemId").notNull(),
  locationId: integer("locationId"),
  prepDate: bigint("prepDate", { mode: "number" }).notNull(),
  quantityPrepared: integer("quantityPrepared").notNull().default(0),
  quantitySold: integer("quantitySold").notNull().default(0),
  quantityWasted: integer("quantityWasted").notNull().default(0),
  notes: text("notes"),
  preparedBy: integer("preparedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MenuPreparation = typeof menuPreparations.$inferSelect;

export const menuArrangements = pgTable("menu_arrangements", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  priceEur: numeric("priceEur", { precision: 10, scale: 2 }).notNull(),
  memberPriceEur: numeric("memberPriceEur", { precision: 10, scale: 2 }),
  items: text("items"),
  isActive: boolean("isActive").default(true),
  sortOrder: integer("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type MenuArrangement = typeof menuArrangements.$inferSelect;

// ═══════════════════════════════════════════════════════════════════════
// ─── ROZ HUUROVEREENKOMSTEN MODULE ─────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export const rozPricingTiers = pgTable("roz_pricing_tiers", {
  id: serial("id").primaryKey(),
  resourceId: integer("resourceId"),
  resourceTypeId: integer("resourceTypeId"),
  locationId: integer("locationId"),
  name: varchar("name", { length: 128 }).notNull(),
  periodType: text("periodType").notNull(),
  periodMonths: integer("periodMonths").notNull(),
  creditCostPerMonth: numeric("creditCostPerMonth", { precision: 12, scale: 2 }).notNull(),
  creditCostPerM2PerMonth: numeric("creditCostPerM2PerMonth", { precision: 10, scale: 2 }),
  discountPercent: numeric("discountPercent", { precision: 5, scale: 2 }).default("0.00"),
  serviceChargePerMonth: numeric("serviceChargePerMonth", { precision: 10, scale: 2 }).default("0.00"),
  depositMonths: integer("depositMonths").default(3),
  isActive: boolean("isActive").default(true),
  sortOrder: integer("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type RozPricingTier = typeof rozPricingTiers.$inferSelect;
export type InsertRozPricingTier = typeof rozPricingTiers.$inferInsert;

export const rozContracts = pgTable("roz_contracts", {
  id: serial("id").primaryKey(),
  contractNumber: varchar("contractNumber", { length: 64 }).notNull().unique(),
  resourceId: integer("resourceId").notNull(),
  locationId: integer("locationId").notNull(),
  userId: integer("userId"),
  companyId: integer("companyId"),
  walletId: integer("walletId"),
  pricingTierId: integer("pricingTierId"),
  periodType: text("periodType").notNull(),
  startDate: bigint("startDate", { mode: "number" }).notNull(),
  endDate: bigint("endDate", { mode: "number" }).notNull(),
  monthlyRentCredits: numeric("monthlyRentCredits", { precision: 12, scale: 2 }).notNull(),
  monthlyServiceCharge: numeric("monthlyServiceCharge", { precision: 10, scale: 2 }).default("0.00"),
  depositAmount: numeric("depositAmount", { precision: 12, scale: 2 }).default("0.00"),
  depositPaid: boolean("depositPaid").default(false),
  indexationMethod: varchar("indexationMethod", { length: 32 }).default("CPI"),
  indexationPct: numeric("indexationPct", { precision: 5, scale: 2 }).default("2.50"),
  lastIndexationDate: bigint("lastIndexationDate", { mode: "number" }),
  nextIndexationDate: bigint("nextIndexationDate", { mode: "number" }),
  noticePeriodMonths: integer("noticePeriodMonths").default(3),
  noticeGivenDate: bigint("noticeGivenDate", { mode: "number" }),
  rozTemplateVersion: varchar("rozTemplateVersion", { length: 32 }).default("2024"),
  rozDocumentUrl: text("rozDocumentUrl"),
  status: text("status").default("draft").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type RozContract = typeof rozContracts.$inferSelect;
export type InsertRozContract = typeof rozContracts.$inferInsert;

export const rozInvoices = pgTable("roz_invoices", {
  id: serial("id").primaryKey(),
  contractId: integer("contractId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 64 }).notNull().unique(),
  periodStart: bigint("periodStart", { mode: "number" }).notNull(),
  periodEnd: bigint("periodEnd", { mode: "number" }).notNull(),
  rentCredits: numeric("rentCredits", { precision: 12, scale: 2 }).notNull(),
  serviceChargeCredits: numeric("serviceChargeCredits", { precision: 10, scale: 2 }).default("0.00"),
  indexationAdjustment: numeric("indexationAdjustment", { precision: 10, scale: 2 }).default("0.00"),
  totalCredits: numeric("totalCredits", { precision: 12, scale: 2 }).notNull(),
  walletId: integer("walletId"),
  ledgerEntryId: integer("ledgerEntryId"),
  status: text("status").default("draft").notNull(),
  dueDate: bigint("dueDate", { mode: "number" }).notNull(),
  paidDate: bigint("paidDate", { mode: "number" }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type RozInvoice = typeof rozInvoices.$inferSelect;
export type InsertRozInvoice = typeof rozInvoices.$inferInsert;

export type InsertMenuItem = typeof menuItems.$inferInsert;
export type InsertMenuCategory = typeof menuCategories.$inferInsert;
export type InsertMenuSeason = typeof menuSeasons.$inferInsert;
export type InsertMenuArrangement = typeof menuArrangements.$inferInsert;

// ─── Credit Packages (Standalone Purchases) ─────────────────────────
export const creditPackages = pgTable("credit_packages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  credits: integer("credits").notNull(),
  priceEur: numeric("priceEur", { precision: 10, scale: 2 }).notNull(),
  pricePerCredit: numeric("pricePerCredit", { precision: 8, scale: 4 }),
  discountPercent: numeric("discountPercent", { precision: 5, scale: 2 }).default("0.00"),
  description: text("description"),
  features: json("features").$type<string[]>(),
  minBundleTier: varchar("minBundleTier", { length: 64 }),
  isActive: boolean("isActive").default(true),
  stripeProductId: varchar("stripeProductId", { length: 128 }),
  stripePriceId: varchar("stripePriceId", { length: 128 }),
  sortOrder: integer("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type CreditPackage = typeof creditPackages.$inferSelect;
export type InsertCreditPackage = typeof creditPackages.$inferInsert;

// ─── Budget Controls ────────────────────────────────────────────────
export const budgetControls = pgTable("budget_controls", {
  id: serial("id").primaryKey(),
  companyId: integer("companyId").notNull(),
  walletId: integer("walletId"),
  controlType: budgetControlTypeEnum("controlType").notNull(),
  targetUserId: integer("targetUserId"),
  targetTeam: varchar("targetTeam", { length: 128 }),
  capAmount: numeric("capAmount", { precision: 12, scale: 2 }),
  periodType: budgetPeriodTypeEnum("periodType").default("monthly"),
  allowedLocationIds: json("allowedLocationIds").$type<number[]>(),
  allowedResourceTypes: json("allowedResourceTypes").$type<string[]>(),
  approvalThreshold: numeric("approvalThreshold", { precision: 12, scale: 2 }),
  approverUserId: integer("approverUserId"),
  currentSpend: numeric("currentSpend", { precision: 12, scale: 2 }).default("0.00"),
  periodResetAt: bigint("periodResetAt", { mode: "number" }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type BudgetControl = typeof budgetControls.$inferSelect;
export type InsertBudgetControl = typeof budgetControls.$inferInsert;

// ─── Commit Contracts (Enterprise Agreements) ───────────────────────
export const commitContracts = pgTable("commit_contracts", {
  id: serial("id").primaryKey(),
  companyId: integer("companyId").notNull(),
  walletId: integer("walletId"),
  name: varchar("name", { length: 256 }).notNull(),
  totalCommitCredits: numeric("totalCommitCredits", { precision: 14, scale: 2 }).notNull(),
  totalCommitEur: numeric("totalCommitEur", { precision: 14, scale: 2 }),
  commitPeriodMonths: integer("commitPeriodMonths").notNull(),
  startDate: bigint("startDate", { mode: "number" }).notNull(),
  endDate: bigint("endDate", { mode: "number" }).notNull(),
  prepaidAmount: numeric("prepaidAmount", { precision: 14, scale: 2 }).default("0.00"),
  drawdownUsed: numeric("drawdownUsed", { precision: 14, scale: 2 }).default("0.00"),
  monthlyAllocation: numeric("monthlyAllocation", { precision: 12, scale: 2 }),
  rampedCommitments: json("rampedCommitments"),
  discountPercent: numeric("discountPercent", { precision: 5, scale: 2 }).default("0.00"),
  trueUpEnabled: boolean("trueUpEnabled").default(false),
  trueUpDate: bigint("trueUpDate", { mode: "number" }),
  earlyRenewalBonus: numeric("earlyRenewalBonus", { precision: 10, scale: 2 }),
  commitStatus: commitStatusEnum("commitStatus").default("draft").notNull(),
  notes: text("notes"),
  commitStripeSubId: varchar("commitStripeSubId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type CommitContract = typeof commitContracts.$inferSelect;
export type InsertCommitContract = typeof commitContracts.$inferInsert;

// ─── Credit Bonuses (Gamification & Loyalty) ────────────────────────
export const creditBonuses = pgTable("credit_bonuses", {
  id: serial("id").primaryKey(),
  bonusType: bonusTypeEnum("bonusType").notNull(),
  walletId: integer("walletId"),
  userId: integer("userId"),
  companyId: integer("companyId"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  referrerUserId: integer("referrerUserId"),
  referredCompanyId: integer("referredCompanyId"),
  sourceContractId: integer("sourceContractId"),
  sourceBundleId: integer("sourceBundleId"),
  bonusExpiresAt: bigint("bonusExpiresAt", { mode: "number" }),
  isApplied: boolean("isApplied").default(false),
  appliedAt: timestamp("appliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CreditBonus = typeof creditBonuses.$inferSelect;
export type InsertCreditBonus = typeof creditBonuses.$inferInsert;

// ─── Wallet Transactions ────────────────────────────────────────────
export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  walletId: integer("walletId").notNull(),
  bundleId: integer("bundleId"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  creditsAdded: numeric("creditsAdded", { precision: 12, scale: 2 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // topup, spend, refund
  stripeSessionId: varchar("stripeSessionId", { length: 128 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 128 }),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, completed, failed, refunded
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactions.$inferInsert;

// ─── Website Visitors ───────────────────────────────────────────────
export const websiteVisitors = pgTable("website_visitors", {
  id: serial("id").primaryKey(),
  ip: varchar("ip", { length: 45 }).notNull(),
  companyName: varchar("companyName", { length: 256 }),
  companyDomain: varchar("companyDomain", { length: 256 }),
  city: varchar("city", { length: 128 }),
  country: varchar("country", { length: 64 }),
  pageUrl: text("pageUrl").notNull(),
  referrer: text("referrer"),
  userAgent: text("userAgent"),
  leadId: integer("leadId"),
  visitedAt: bigint("visitedAt", { mode: "number" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type WebsiteVisitor = typeof websiteVisitors.$inferSelect;
export type InsertWebsiteVisitor = typeof websiteVisitors.$inferInsert;

// ─── Email Campaign Sends ───────────────────────────────────────────
export const emailCampaignSends = pgTable("email_campaign_sends", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaignId").notNull(),
  leadId: integer("leadId").notNull(),
  email: varchar("email", { length: 256 }).notNull(),
  status: varchar("status", { length: 20 }).default("queued").notNull(),
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  bouncedAt: timestamp("bouncedAt"),
  bounceReason: varchar("bounceReason", { length: 512 }),
  resendMessageId: varchar("resendMessageId", { length: 256 }),
  clickCount: integer("clickCount").default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type EmailCampaignSend = typeof emailCampaignSends.$inferSelect;
export type InsertEmailCampaignSend = typeof emailCampaignSends.$inferInsert;


// ─── Escalation Rules ───────────────────────────────────────────────
export const escalationRules = pgTable("escalation_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  priority: varchar("priority", { length: 32 }).default("normal"),
  category: varchar("category", { length: 64 }),
  escalateAfterMinutes: integer("escalateAfterMinutes").notNull().default(60),
  triggerType: varchar("triggerType", { length: 64 }).notNull().default("no_response"),
  escalationLevel: integer("escalationLevel").notNull().default(1),
  escalateToRole: varchar("escalateToRole", { length: 32 }).default("host"),
  escalateToUserId: integer("escalateToUserId"),
  notifyEmail: boolean("notifyEmail").default(true),
  notifyInApp: boolean("notifyInApp").default(true),
  autoReassign: boolean("autoReassign").default(false),
  autoPriorityBump: boolean("autoPriorityBump").default(false),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});
export type EscalationRule = typeof escalationRules.$inferSelect;

// ─── Escalation Log ────────────────────────────────────────────────
export const escalationLog = pgTable("escalation_log", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticketId").notNull(),
  ruleId: integer("ruleId"),
  escalationLevel: integer("escalationLevel").notNull().default(1),
  previousAssignee: integer("previousAssignee"),
  newAssignee: integer("newAssignee"),
  previousPriority: varchar("previousPriority", { length: 32 }),
  newPriority: varchar("newPriority", { length: 32 }),
  reason: text("reason"),
  slaBreach: boolean("slaBreach").default(false),
  status: varchar("status", { length: 32 }).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EscalationLogEntry = typeof escalationLog.$inferSelect;


// ─── System Audit Log ──────────────────────────────────────────────
export const auditActionEnum = pgEnum("audit_action", [
  "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "EXPORT", "VIEW", "SETTINGS_CHANGE",
]);
export const auditSeverityEnum = pgEnum("audit_severity", ["low", "medium", "high"]);

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: integer("userId"),
  userName: text("userName"),
  userEmail: text("userEmail"),
  action: auditActionEnum("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entityId"),
  details: text("details"),
  severity: auditSeverityEnum("severity").default("low").notNull(),
  ipAddress: text("ipAddress"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
});
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type InsertAuditLogEntry = typeof auditLog.$inferInsert;


// ─── Energy Readings ──────────────────────────────────────────────
export const energySourceEnum = pgEnum("energy_source", ["grid", "solar", "wind", "battery"]);
export const energyMeterTypeEnum = pgEnum("energy_meter_type", ["electricity", "gas", "water", "heating"]);

export const energyReadings = pgTable("energy_readings", {
  id: serial("id").primaryKey(),
  locationId: integer("locationId").notNull(),
  floor: varchar("floor", { length: 16 }),
  meterType: energyMeterTypeEnum("meterType").default("electricity").notNull(),
  source: energySourceEnum("source").default("grid"),
  value: numeric("value", { precision: 12, scale: 2 }).notNull(), // kWh, m3, etc.
  unit: varchar("unit", { length: 16 }).default("kWh"),
  cost: numeric("cost", { precision: 10, scale: 2 }), // EUR
  co2Kg: numeric("co2Kg", { precision: 10, scale: 2 }), // kg CO2
  recordedAt: bigint("recordedAt", { mode: "number" }).notNull(), // UTC ms
  periodStart: bigint("periodStart", { mode: "number" }), // period start UTC ms
  periodEnd: bigint("periodEnd", { mode: "number" }), // period end UTC ms
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EnergyReading = typeof energyReadings.$inferSelect;
export type InsertEnergyReading = typeof energyReadings.$inferInsert;
