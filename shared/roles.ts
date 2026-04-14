/**
 * SKYNET Platform – Role-Based Access Control (RBAC)
 *
 * Roles:
 *   administrator – Full platform access, can manage roles, settings, billing
 *   cfo           – Chief Financial Officer, full financial visibility, reports, invoicing
 *   host          – Building owner / boss, full operational access, cannot manage platform settings
 *   teamadmin     – Team/company admin, manages own team members and bookings
 *   member        – Regular coworking member
 *   guest         – Visitor / limited access
 */

// ── Role definitions ────────────────────────────────────────────────
export const ROLES = ["administrator", "cfo", "host", "teamadmin", "member", "guest"] as const;
export type UserRole = (typeof ROLES)[number];

// ── Permission keys ─────────────────────────────────────────────────
export const PERMISSIONS = [
  // Dashboard
  "dashboard.view",
  // Locations & Resources
  "locations.view",
  "locations.manage",
  "resources.view",
  "resources.manage",
  // Bookings
  "bookings.view",
  "bookings.create",
  "bookings.manage",
  // Wallet & Bundles
  "wallet.view",
  "wallet.manage",
  "bundles.view",
  "bundles.manage",
  // Companies
  "companies.view",
  "companies.manage",
  // Members
  "members.view",
  "members.manage",
  // Visitors
  "visitors.view",
  "visitors.manage",
  // Invites
  "invites.view",
  "invites.manage",
  // CRM
  "crm.view",
  "crm.manage",
  // Operations
  "operations.view",
  "operations.manage",
  // Parking
  "parking.view",
  "parking.manage",
  // Room Control
  "roomcontrol.view",
  "roomcontrol.manage",
  // Signage
  "signage.view",
  "signage.manage",
  // Devices & IoT
  "devices.view",
  "devices.manage",
  // Butler / Kiosk
  "butler.view",
  "butler.manage",
  // Menu
  "menu.view",
  "menu.manage",
  // Notifications
  "notifications.view",
  "notifications.manage",
  // Settings
  "settings.view",
  "settings.manage",
  // User Roles (manage other users' roles)
  "roles.view",
  "roles.manage",
  // Re-engagement
  "reengagement.view",
  "reengagement.manage",
  // Credit System
  "credits.view",
  "credits.manage",
  "credits.purchase",
  "budget_controls.view",
  "budget_controls.manage",
  "commit_contracts.view",
  "commit_contracts.manage",
  // Finance (CFO-level)
  "finance.view",
  "finance.reports",
  "invoices.view",
  "invoices.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// ── Role → Permission matrix ────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  administrator: [...PERMISSIONS], // Full access

  cfo: [
    "dashboard.view",
    "locations.view",
    "resources.view",
    "bookings.view",
    "wallet.view", "wallet.manage",
    "bundles.view", "bundles.manage",
    "companies.view",
    "members.view",
    "parking.view",
    "notifications.view",
    "settings.view",
    "credits.view", "credits.manage",
    "budget_controls.view", "budget_controls.manage",
    "commit_contracts.view", "commit_contracts.manage",
    "finance.view", "finance.reports",
    "invoices.view", "invoices.manage",
  ],

  host: [
    "dashboard.view",
    "locations.view", "locations.manage",
    "resources.view", "resources.manage",
    "bookings.view", "bookings.create", "bookings.manage",
    "wallet.view", "wallet.manage",
    "bundles.view", "bundles.manage",
    "companies.view", "companies.manage",
    "members.view", "members.manage",
    "visitors.view", "visitors.manage",
    "invites.view", "invites.manage",
    "crm.view", "crm.manage",
    "operations.view", "operations.manage",
    "parking.view", "parking.manage",
    "roomcontrol.view", "roomcontrol.manage",
    "signage.view", "signage.manage",
    "devices.view", "devices.manage",
    "butler.view", "butler.manage",
    "menu.view", "menu.manage",
    "notifications.view", "notifications.manage",
    "settings.view",
    "roles.view",
    "reengagement.view", "reengagement.manage",
    "credits.view", "credits.manage", "credits.purchase",
    "budget_controls.view", "budget_controls.manage",
    "commit_contracts.view", "commit_contracts.manage",
  ],

  teamadmin: [
    "dashboard.view",
    "locations.view",
    "resources.view",
    "bookings.view", "bookings.create", "bookings.manage",
    "wallet.view",
    "bundles.view",
    "companies.view",
    "members.view", "members.manage",
    "visitors.view", "visitors.manage",
    "invites.view", "invites.manage",
    "parking.view",
    "notifications.view",
    "settings.view",
    "credits.view", "credits.purchase",
    "budget_controls.view", "budget_controls.manage",
  ],

  member: [
    "dashboard.view",
    "locations.view",
    "resources.view",
    "bookings.view", "bookings.create",
    "wallet.view",
    "bundles.view",
    "visitors.view", "visitors.manage",
    "parking.view",
    "notifications.view",
    "settings.view",
    "credits.view", "credits.purchase",
  ],

  guest: [
    "locations.view",
    "resources.view",
    "bookings.view",
    "parking.view",
  ],
};

// ── Helper functions ────────────────────────────────────────────────

/** Check if a role has a specific permission */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Check if a role has ALL of the given permissions */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/** Check if a role has ANY of the given permissions */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/** Get all permissions for a role */
export function getPermissions(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/** Map old role names to new role names (migration helper) */
export function migrateRole(oldRole: string): UserRole {
  switch (oldRole) {
    case "admin":
      return "administrator";
    case "user":
      return "member";
    case "guest":
      return "guest";
    default:
      return "guest";
  }
}

/** Role display labels */
export const ROLE_LABELS: Record<UserRole, string> = {
  administrator: "Administrator",
  cfo: "CFO",
  host: "Host (Boss)",
  teamadmin: "Team Admin",
  member: "Member",
  guest: "Guest",
};

/** Role hierarchy level (higher = more powerful) */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  administrator: 100,
  cfo: 90,
  host: 80,
  teamadmin: 60,
  member: 40,
  guest: 10,
};

/** Check if roleA outranks roleB */
export function outranks(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
}
