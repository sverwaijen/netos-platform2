import { describe, it, expect } from "vitest";
import {
  ROLES,
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  ROLE_HIERARCHY,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getPermissions,
  migrateRole,
  outranks,
} from "../shared/roles";

describe("RBAC – Tenant role (Issue #41)", () => {
  it("includes tenant in ROLES array", () => {
    expect(ROLES).toContain("tenant");
  });

  it("has tenant in ROLE_LABELS", () => {
    expect(ROLE_LABELS.tenant).toBe("Tenant (Klant)");
  });

  it("places tenant at hierarchy level 50 (between teamadmin 60 and member 40)", () => {
    expect(ROLE_HIERARCHY.tenant).toBe(50);
    expect(ROLE_HIERARCHY.teamadmin).toBeGreaterThan(ROLE_HIERARCHY.tenant);
    expect(ROLE_HIERARCHY.tenant).toBeGreaterThan(ROLE_HIERARCHY.member);
  });

  it("tenant has contracts.view permission", () => {
    expect(hasPermission("tenant", "contracts.view")).toBe(true);
  });

  it("tenant has invoices.view permission", () => {
    expect(hasPermission("tenant", "invoices.view")).toBe(true);
  });

  it("tenant has sla.view permission", () => {
    expect(hasPermission("tenant", "sla.view")).toBe(true);
  });

  it("tenant has company.billing.view permission", () => {
    expect(hasPermission("tenant", "company.billing.view")).toBe(true);
  });

  it("tenant can view and create bookings", () => {
    expect(hasAllPermissions("tenant", ["bookings.view", "bookings.create", "bookings.manage"])).toBe(true);
  });

  it("tenant can manage visitors and invites", () => {
    expect(hasAllPermissions("tenant", ["visitors.view", "visitors.manage", "invites.view", "invites.manage"])).toBe(true);
  });

  it("tenant cannot manage locations or resources", () => {
    expect(hasPermission("tenant", "locations.manage")).toBe(false);
    expect(hasPermission("tenant", "resources.manage")).toBe(false);
  });

  it("tenant cannot manage settings or roles", () => {
    expect(hasPermission("tenant", "settings.manage")).toBe(false);
    expect(hasPermission("tenant", "roles.manage")).toBe(false);
  });

  it("member does NOT have tenant-specific permissions", () => {
    expect(hasPermission("member", "contracts.view")).toBe(false);
    expect(hasPermission("member", "invoices.view")).toBe(false);
    expect(hasPermission("member", "sla.view")).toBe(false);
  });

  it("administrator has all new permissions", () => {
    expect(hasPermission("administrator", "contracts.view")).toBe(true);
    expect(hasPermission("administrator", "invoices.view")).toBe(true);
    expect(hasPermission("administrator", "sla.view")).toBe(true);
    expect(hasPermission("administrator", "company.billing.view")).toBe(true);
  });

  it("migrateRole maps 'klant' and 'tenant' to tenant role", () => {
    expect(migrateRole("tenant")).toBe("tenant");
    expect(migrateRole("klant")).toBe("tenant");
  });

  it("teamadmin outranks tenant", () => {
    expect(outranks("teamadmin", "tenant")).toBe(true);
  });

  it("tenant outranks member", () => {
    expect(outranks("tenant", "member")).toBe(true);
  });

  it("every role in ROLES has matching entries in ROLE_PERMISSIONS, ROLE_LABELS, ROLE_HIERARCHY", () => {
    for (const role of ROLES) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
      expect(ROLE_LABELS[role]).toBeDefined();
      expect(ROLE_HIERARCHY[role]).toBeDefined();
    }
  });
});
