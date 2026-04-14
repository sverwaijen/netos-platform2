/**
 * SKYNET PLATFORM — Feature Registry & Heartbeat System
 *
 * Centraal register van alle modules. Bepaalt:
 * - Welke modules actief zijn (feature flags)
 * - Status per module (demo / beta / production)
 * - Wie mag testen per rol
 * - Heartbeat tracking per module
 *
 * Na elke sprint: update de status en stakeholders kunnen per module feedback geven.
 */

// ─── Rollen ──────────────────────────────────────────────────────────
export type UserRole =
  | "administrator"   // Volledige toegang, beheert platform
  | "host"            // Receptionist / community host
  | "teamadmin"       // Boss / bedrijfsleider van een huurder
  | "member"          // Reguliere gebruiker / huurder
  | "guest"           // Bezoeker
  | "facility"        // Facility manager (gebouwbeheer)
  | "developer";      // Developer / agent die test

// ─── Module Status ───────────────────────────────────────────────────
export type ModuleStatus =
  | "demo"        // Alleen UI, geen werkende backend
  | "beta"        // Werkend maar nog niet getest door stakeholders
  | "production"  // Getest, goedgekeurd, live
  | "disabled";   // Uitgezet

// ─── Feature Definitie ──────────────────────────────────────────────
export interface FeatureModule {
  id: string;
  name: string;
  description: string;
  status: ModuleStatus;
  enabled: boolean;
  /** Welke rollen mogen deze module zien en testen */
  visibleTo: UserRole[];
  /** Welke rollen mogen feedback geven op deze module */
  canReview: UserRole[];
  /** Router/page paths die bij deze module horen */
  routes: string[];
  /** Laatst bijgewerkte sprint */
  lastSprintUpdate: string;
  /** Bekende issues of ontbrekende features */
  knownIssues: string[];
  /** Vereiste integraties die nog missen */
  missingIntegrations: string[];
}

// ─── Feature Registry ────────────────────────────────────────────────
export const featureRegistry: FeatureModule[] = [
  // ── Core Platform ─────────────────────────────────────────────────
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Hoofddashboard met KPI's, bezetting en activiteit",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "host", "teamadmin", "facility", "developer"],
    canReview: ["administrator", "teamadmin", "facility"],
    routes: ["/dashboard", "/"],
    lastSprintUpdate: "sprint-1",
    knownIssues: [],
    missingIntegrations: [],
  },
  {
    id: "bookings",
    name: "Bookings",
    description: "Boekingssysteem voor werkplekken, vergaderruimtes en faciliteiten",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "host", "teamadmin", "member", "guest", "facility", "developer"],
    canReview: ["administrator", "teamadmin", "member"],
    routes: ["/bookings"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Tijdslots soms niet correct bij overlapping"],
    missingIntegrations: [],
  },
  {
    id: "wallet",
    name: "Wallet & Credits",
    description: "Dual wallet systeem met persoonlijke en bedrijfscredits",
    status: "demo",
    enabled: true,
    visibleTo: ["administrator", "teamadmin", "member", "developer"],
    canReview: ["administrator", "teamadmin", "member"],
    routes: ["/wallet"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Stripe checkout niet geïmplementeerd", "Opwaarderen is alleen UI"],
    missingIntegrations: ["Stripe Payment Gateway"],
  },
  {
    id: "locations",
    name: "Locaties",
    description: "7 Mr. Green locaties met plattegronden en resources",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "host", "facility", "developer"],
    canReview: ["administrator", "facility"],
    routes: ["/locations", "/locations/:slug"],
    lastSprintUpdate: "sprint-1",
    knownIssues: [],
    missingIntegrations: ["Google Maps live integratie"],
  },

  // ── Operations ────────────────────────────────────────────────────
  {
    id: "operations",
    name: "Operations Dashboard",
    description: "Zendesk-style ticketsysteem met AI-first handling en SLA tracking",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "host", "facility", "developer"],
    canReview: ["administrator", "host", "facility"],
    routes: ["/operations"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["AI ticket handling is mock"],
    missingIntegrations: ["Email notificaties", "WhatsApp integratie"],
  },
  {
    id: "room-control",
    name: "Room Control",
    description: "IoT sensor monitoring, HVAC/lighting controls en automatiseringsregels",
    status: "demo",
    enabled: true,
    visibleTo: ["administrator", "facility", "developer"],
    canReview: ["administrator", "facility"],
    routes: ["/room-control"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Sensor data is geseed, niet live"],
    missingIntegrations: ["IoT gateway", "HVAC API", "Philips Hue / DALI"],
  },

  // ── CRM & Marketing ──────────────────────────────────────────────
  {
    id: "crm-pipeline",
    name: "CRM Pipeline",
    description: "Kanban-style lead pipeline met AI scoring en enrichment",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "host", "developer"],
    canReview: ["administrator", "host"],
    routes: ["/crm/pipeline", "/crm/leads/:id"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["AI enrichment is mock data"],
    missingIntegrations: ["LinkedIn API", "KvK API"],
  },
  {
    id: "crm-campaigns",
    name: "CRM Campaigns",
    description: "Email campagnes met sequences en templates",
    status: "demo",
    enabled: true,
    visibleTo: ["administrator", "host", "developer"],
    canReview: ["administrator"],
    routes: ["/crm/campaigns", "/crm/templates"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Emails worden niet verstuurd"],
    missingIntegrations: ["SendGrid / Postmark", "SMTP"],
  },
  {
    id: "crm-visitors",
    name: "Visitor Detection",
    description: "LeadInfo-style website bezoeker detectie",
    status: "demo",
    enabled: true,
    visibleTo: ["administrator", "host", "developer"],
    canReview: ["administrator"],
    routes: ["/crm/visitors"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Volledig demo data"],
    missingIntegrations: ["LeadInfo API / IP tracking script"],
  },
  {
    id: "crm-reengagement",
    name: "Re-engagement Funnel",
    description: "Community transitie funnel voor leads",
    status: "demo",
    enabled: true,
    visibleTo: ["administrator", "developer"],
    canReview: ["administrator"],
    routes: ["/crm/reengagement"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Volledig demo"],
    missingIntegrations: ["Email automation"],
  },

  // ── Butler & Kiosk ────────────────────────────────────────────────
  {
    id: "butler-kiosk",
    name: "Butler Kiosk",
    description: "POS systeem met 45 producten, multi-payment, cart management",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "host", "member", "developer"],
    canReview: ["administrator", "host", "member"],
    routes: ["/kiosk", "/butler-admin"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["QR code scanning ontbreekt", "Booking add-ons niet geïntegreerd"],
    missingIntegrations: ["Stripe terminal", "QR scanner"],
  },
  {
    id: "kitchen-prep",
    name: "Kitchen Prep Display",
    description: "Keukenscherm voor bestellingen en bereidingen",
    status: "demo",
    enabled: true,
    visibleTo: ["administrator", "host", "developer"],
    canReview: ["administrator", "host"],
    routes: ["/kitchen"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Geen real-time order sync"],
    missingIntegrations: ["WebSocket order stream"],
  },
  {
    id: "menu",
    name: "Menu Management",
    description: "Seizoens-menukaart met categorieën, items en arrangementen",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "host", "developer"],
    canReview: ["administrator", "host"],
    routes: ["/menu"],
    lastSprintUpdate: "sprint-1",
    knownIssues: [],
    missingIntegrations: [],
  },

  // ── Parking ───────────────────────────────────────────────────────
  {
    id: "parking",
    name: "Smart Parking",
    description: "Parkeerplatform met zones, dynamic pricing, permits en sessions",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "facility", "teamadmin", "member", "developer"],
    canReview: ["administrator", "facility", "teamadmin"],
    routes: ["/parking"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Kentekenherkenning is mock"],
    missingIntegrations: ["ANPR camera API", "Parkeersensor hardware"],
  },

  // ── Signing & Signage ────────────────────────────────────────────
  {
    id: "signing",
    name: "Signing Display",
    description: "Digitale welkomstschermen per bedrijf met auto-branding",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "host", "teamadmin", "developer"],
    canReview: ["administrator", "host", "teamadmin"],
    routes: ["/signing"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Auto-scrape admin button ontbreekt", "Live preview mist"],
    missingIntegrations: [],
  },
  {
    id: "signage",
    name: "Digital Signage (SKYNET)",
    description: "Content management voor digitale schermen met playlists en heartbeat",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "host", "facility", "developer"],
    canReview: ["administrator", "facility"],
    routes: ["/signage", "/signage/display/:id"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Heartbeat interval is eenmalig, niet recurring"],
    missingIntegrations: [],
  },

  // ── Contracts ─────────────────────────────────────────────────────
  {
    id: "roz-contracts",
    name: "ROZ Contracten",
    description: "Huurovereenkomsten generator met PDF auto-fill en preview",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "teamadmin", "developer"],
    canReview: ["administrator", "teamadmin"],
    routes: ["/roz"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["PDF signing niet geïmplementeerd"],
    missingIntegrations: ["DocuSign / digitale handtekening"],
  },

  // ── Member App ────────────────────────────────────────────────────
  {
    id: "member-app",
    name: "Member PWA",
    description: "Progressive Web App met 7 pagina's: Home, Bookings, Wallet, Access, Parking, Support, Profile",
    status: "demo",
    enabled: true,
    visibleTo: ["administrator", "member", "developer"],
    canReview: ["administrator", "member"],
    routes: ["/app/*"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["WiFi provisioning is UI-only"],
    missingIntegrations: ["UniFi Identity API", "Push notifications"],
  },

  // ── User Management ───────────────────────────────────────────────
  {
    id: "user-management",
    name: "User & Role Management",
    description: "RBAC systeem met rollen, uitnodigingen en bedrijfsbeheer",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "developer"],
    canReview: ["administrator"],
    routes: ["/users", "/invites", "/companies"],
    lastSprintUpdate: "sprint-1",
    knownIssues: [],
    missingIntegrations: ["SSO / OAuth provider"],
  },
];

// ─── Helper Functions ────────────────────────────────────────────────

/** Haal alle modules op die zichtbaar zijn voor een bepaalde rol */
export function getModulesForRole(role: UserRole): FeatureModule[] {
  return featureRegistry.filter(
    (m) => m.enabled && m.visibleTo.includes(role)
  );
}

/** Haal modules op die een bepaalde rol mag reviewen */
export function getReviewableModules(role: UserRole): FeatureModule[] {
  return featureRegistry.filter(
    (m) => m.enabled && m.canReview.includes(role)
  );
}

/** Check of een module actief is */
export function isModuleEnabled(moduleId: string): boolean {
  const mod = featureRegistry.find((m) => m.id === moduleId);
  return mod?.enabled ?? false;
}

/** Haal alle modules op met een bepaalde status */
export function getModulesByStatus(status: ModuleStatus): FeatureModule[] {
  return featureRegistry.filter((m) => m.status === status);
}

/** Genereer een samenvatting voor sprint review */
export function getSprintSummary(): {
  total: number;
  demo: number;
  beta: number;
  production: number;
  disabled: number;
  allIssues: { module: string; issues: string[] }[];
  allMissingIntegrations: { module: string; integrations: string[] }[];
} {
  const modules = featureRegistry;
  return {
    total: modules.length,
    demo: modules.filter((m) => m.status === "demo").length,
    beta: modules.filter((m) => m.status === "beta").length,
    production: modules.filter((m) => m.status === "production").length,
    disabled: modules.filter((m) => m.status === "disabled").length,
    allIssues: modules
      .filter((m) => m.knownIssues.length > 0)
      .map((m) => ({ module: m.name, issues: m.knownIssues })),
    allMissingIntegrations: modules
      .filter((m) => m.missingIntegrations.length > 0)
      .map((m) => ({ module: m.name, integrations: m.missingIntegrations })),
  };
}
/**
 * NETOS PLATFORM — Feature Registry & Heartbeat System
 *
 * Centraal register van alle modules. Bepaalt:
 * - Welke modules actief zijn (feature flags)
 * - Status per module (demo / beta / production)
 * - Wie mag testen per rol
 * - Heartbeat tracking per module
 *
 * Na elke sprint: update de status en stakeholders kunnen per module feedback geven.
 */

// ─── Rollen ──────────────────────────────────────────────────────────
export type UserRole =
  | "administrator"   // Volledige toegang, beheert platform
  | "host"            // Receptionist / community host
  | "teamadmin"       // Boss / bedrijfsleider van een huurder
  | "member"          // Reguliere gebruiker / huurder
  | "guest"           // Bezoeker
  | "facility"        // Facility manager (gebouwbeheer)
  | "developer";      // Developer / agent die test

// ─── Module Status ───────────────────────────────────────────────────
export type ModuleStatus =
  | "demo"        // Alleen UI, geen werkende backend
  | "beta"        // Werkend maar nog niet getest door stakeholders
  | "production"  // Getest, goedgekeurd, live
  | "disabled";   // Uitgezet

// ─── Feature Definitie ──────────────────────────────────────────────
export interface FeatureModule {
  id: string;
  name: string;
  description: string;
  status: ModuleStatus;
  enabled: boolean;
  /** Welke rollen mogen deze module zien en testen */
  visibleTo: UserRole[];
  /** Welke rollen mogen feedback geven op deze module */
  canReview: UserRole[];
  /** Router/page paths die bij deze module horen */
  routes: string[];
  /** Laatst bijgewerkte sprint */
  lastSprintUpdate: string;
  /** Bekende issues of ontbrekende features */
  knownIssues: string[];
  /** Vereiste integraties die nog missen */
  missingIntegrations: string[];
}

// ─── Feature Registry ────────────────────────────────────────────────
export const featureRegistry: FeatureModule[] = [
  // ── Core Platform ─────────────────────────────────────────────────
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Hoofddashboard met KPI's, bezetting en activiteit",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "host", "teamadmin", "facility", "developer"],
    canReview: ["administrator", "teamadmin", "facility"],
    routes: ["/dashboard", "/"],
    lastSprintUpdate: "sprint-1",
    knownIssues: [],
    missingIntegrations: [],
  },
  {
    id: "bookings",
    name: "Bookings",
    description: "Boekingssysteem voor werkplekken, vergaderruimtes en faciliteiten",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "host", "teamadmin", "member", "guest", "facility", "developer"],
    canReview: ["administrator", "teamadmin", "member"],
    routes: ["/bookings"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Tijdslots soms niet correct bij overlapping"],
    missingIntegrations: ["Salto KS deur-integratie"],
  },
  {
    id: "wallet",
    name: "Wallet & Credits",
    description: "Dual wallet systeem met persoonlijke en bedrijfscredits",
    status: "demo",
    enabled: true,
    visibleTo: ["administrator", "teamadmin", "member", "developer"],
    canReview: ["administrator", "teamadmin", "member"],
    routes: ["/wallet"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Stripe checkout niet geïmplementeerd", "Opwaarderen is alleen UI"],
    missingIntegrations: ["Stripe Payment Gateway"],
  },
  {
    id: "locations",
    name: "Locaties",
    description: "7 Mr. Green locaties met plattegronden en resources",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "host", "facility", "developer"],
    canReview: ["administrator", "facility"],
    routes: ["/locations", "/locations/:slug"],
    lastSprintUpdate: "sprint-1",
    knownIssues: [],
    missingIntegrations: ["Google Maps live integratie"],
  },

  // ── Operations ────────────────────────────────────────────────────
  {
    id: "operations",
    name: "Operations Dashboard",
    description: "Zendesk-style ticketsysteem met AI-first handling en SLA tracking",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "host", "facility", "developer"],
    canReview: ["administrator", "host", "facility"],
    routes: ["/operations"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["AI ticket handling is mock"],
    missingIntegrations: ["Email notificaties", "WhatsApp integratie"],
  },
  {
    id: "room-control",
    name: "Room Control",
    description: "IoT sensor monitoring, HVAC/lighting controls en automatiseringsregels",
    status: "demo",
    enabled: true,
    visibleTo: ["administrator", "facility", "developer"],
    canReview: ["administrator", "facility"],
    routes: ["/room-control"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Sensor data is geseed, niet live"],
    missingIntegrations: ["IoT gateway", "HVAC API", "Philips Hue / DALI"],
  },

  // ── CRM & Marketing ──────────────────────────────────────────────
  {
    id: "crm-pipeline",
    name: "CRM Pipeline",
    description: "Kanban-style lead pipeline met AI scoring en enrichment",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "host", "developer"],
    canReview: ["administrator", "host"],
    routes: ["/crm/pipeline", "/crm/leads/:id"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["AI enrichment is mock data"],
    missingIntegrations: ["LinkedIn API", "KvK API"],
  },
  {
    id: "crm-campaigns",
    name: "CRM Campaigns",
    description: "Email campagnes met sequences en templates",
    status: "demo",
    enabled: true,
    visibleTo: ["administrator", "host", "developer"],
    canReview: ["administrator"],
    routes: ["/crm/campaigns", "/crm/templates"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Emails worden niet verstuurd"],
    missingIntegrations: ["SendGrid / Postmark", "SMTP"],
  },
  {
    id: "crm-visitors",
    name: "Visitor Detection",
    description: "LeadInfo-style website bezoeker detectie",
    status: "demo",
    enabled: true,
    visibleTo: ["administrator", "host", "developer"],
    canReview: ["administrator"],
    routes: ["/crm/visitors"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Volledig demo data"],
    missingIntegrations: ["LeadInfo API / IP tracking script"],
  },
  {
    id: "crm-reengagement",
    name: "Re-engagement Funnel",
    description: "Community transitie funnel voor leads",
    status: "demo",
    enabled: true,
    visibleTo: ["administrator", "developer"],
    canReview: ["administrator"],
    routes: ["/crm/reengagement"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Volledig demo"],
    missingIntegrations: ["Email automation"],
  },

  // ── Butler & Kiosk ────────────────────────────────────────────────
  {
    id: "butler-kiosk",
    name: "Butler Kiosk",
    description: "POS systeem met 45 producten, multi-payment, cart management",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "host", "member", "developer"],
    canReview: ["administrator", "host", "member"],
    routes: ["/kiosk", "/butler-admin"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["QR code scanning ontbreekt", "Booking add-ons niet geïntegreerd"],
    missingIntegrations: ["Stripe terminal", "QR scanner"],
  },
  {
    id: "kitchen-prep",
    name: "Kitchen Prep Display",
    description: "Keukenscherm voor bestellingen en bereidingen",
    status: "demo",
    enabled: true,
    visibleTo: ["administrator", "host", "developer"],
    canReview: ["administrator", "host"],
    routes: ["/kitchen"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Geen real-time order sync"],
    missingIntegrations: ["WebSocket order stream"],
  },
  {
    id: "menu",
    name: "Menu Management",
    description: "Seizoens-menukaart met categorieën, items en arrangementen",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "host", "developer"],
    canReview: ["administrator", "host"],
    routes: ["/menu"],
    lastSprintUpdate: "sprint-1",
    knownIssues: [],
    missingIntegrations: [],
  },

  // ── Parking ───────────────────────────────────────────────────────
  {
    id: "parking",
    name: "Smart Parking",
    description: "Parkeerplatform met zones, dynamic pricing, permits en sessions",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "facility", "teamadmin", "member", "developer"],
    canReview: ["administrator", "facility", "teamadmin"],
    routes: ["/parking"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Kentekenherkenning is mock"],
    missingIntegrations: ["ANPR camera API", "Parkeersensor hardware"],
  },

  // ── Signing & Signage ────────────────────────────────────────────
  {
    id: "signing",
    name: "Signing Display",
    description: "Digitale welkomstschermen per bedrijf met auto-branding",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "host", "teamadmin", "developer"],
    canReview: ["administrator", "host", "teamadmin"],
    routes: ["/signing"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Auto-scrape admin button ontbreekt", "Live preview mist"],
    missingIntegrations: [],
  },
  {
    id: "signage",
    name: "Digital Signage (SKYNET)",
    description: "Content management voor digitale schermen met playlists en heartbeat",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "host", "facility", "developer"],
    canReview: ["administrator", "facility"],
    routes: ["/signage", "/signage/display/:id"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Heartbeat interval is eenmalig, niet recurring"],
    missingIntegrations: [],
  },

  // ── Contracts ─────────────────────────────────────────────────────
  {
    id: "roz-contracts",
    name: "ROZ Contracten",
    description: "Huurovereenkomsten generator met PDF auto-fill en preview",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "teamadmin", "developer"],
    canReview: ["administrator", "teamadmin"],
    routes: ["/roz"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["PDF signing niet geïmplementeerd"],
    missingIntegrations: ["DocuSign / digitale handtekening"],
  },

  // ── Member App ────────────────────────────────────────────────────
  {
    id: "member-app",
    name: "Member PWA",
    description: "Progressive Web App met 7 pagina's: Home, Bookings, Wallet, Access, Parking, Support, Profile",
    status: "demo",
    enabled: true,
    visibleTo: ["administrator", "member", "developer"],
    canReview: ["administrator", "member"],
    routes: ["/app/*"],
    lastSprintUpdate: "sprint-1",
    knownIssues: ["Salto KS deur-opening niet werkend", "WiFi provisioning is UI-only"],
    missingIntegrations: ["Salto KS SDK", "UniFi Identity API", "Push notifications"],
  },

  // ── User Management ───────────────────────────────────────────────
  {
    id: "user-management",
    name: "User & Role Management",
    description: "RBAC systeem met rollen, uitnodigingen en bedrijfsbeheer",
    status: "beta",
    enabled: true,
    visibleTo: ["administrator", "developer"],
    canReview: ["administrator"],
    routes: ["/users", "/invites", "/companies"],
    lastSprintUpdate: "sprint-1",
    knownIssues: [],
    missingIntegrations: ["SSO / OAuth provider"],
  },
];

// ─── Helper Functions ────────────────────────────────────────────────

/** Haal alle modules op die zichtbaar zijn voor een bepaalde rol */
export function getModulesForRole(role: UserRole): FeatureModule[] {
  return featureRegistry.filter(
    (m) => m.enabled && m.visibleTo.includes(role)
  );
}

/** Haal modules op die een bepaalde rol mag reviewen */
export function getReviewableModules(role: UserRole): FeatureModule[] {
  return featureRegistry.filter(
    (m) => m.enabled && m.canReview.includes(role)
  );
}

/** Check of een module actief is */
export function isModuleEnabled(moduleId: string): boolean {
  const mod = featureRegistry.find((m) => m.id === moduleId);
  return mod?.enabled ?? false;
}

/** Haal alle modules op met een bepaalde status */
export function getModulesByStatus(status: ModuleStatus): FeatureModule[] {
  return featureRegistry.filter((m) => m.status === status);
}

/** Genereer een samenvatting voor sprint review */
export function getSprintSummary(): {
  total: number;
  demo: number;
  beta: number;
  production: number;
  disabled: number;
  allIssues: { module: string; issues: string[] }[];
  allMissingIntegrations: { module: string; integrations: string[] }[];
} {
  const modules = featureRegistry;
  return {
    total: modules.length,
    demo: modules.filter((m) => m.status === "demo").length,
    beta: modules.filter((m) => m.status === "beta").length,
    production: modules.filter((m) => m.status === "production").length,
    disabled: modules.filter((m) => m.status === "disabled").length,
    allIssues: modules
      .filter((m) => m.knownIssues.length > 0)
      .map((m) => ({ module: m.name, issues: m.knownIssues })),
    allMissingIntegrations: modules
      .filter((m) => m.missingIntegrations.length > 0)
      .map((m) => ({ module: m.name, integrations: m.missingIntegrations })),
  };
}
