import { describe, expect, it } from "vitest";
import { ROLES, ROLE_PERMISSIONS, ROLE_HIERARCHY, ROLE_LABELS, hasPermission, outranks } from "@shared/roles";

describe("Company Owner Role", () => {
  it("should include 'company_owner' in ROLES array", () => {
    expect(ROLES).toContain("company_owner");
  });

  it("should have hierarchy level 70 (between host 80 and teamadmin 60)", () => {
    expect(ROLE_HIERARCHY.company_owner).toBe(70);
    expect(ROLE_HIERARCHY.company_owner).toBeLessThan(ROLE_HIERARCHY.host);
    expect(ROLE_HIERARCHY.company_owner).toBeGreaterThan(ROLE_HIERARCHY.teamadmin);
  });

  it("should have appropriate display label 'Company Owner'", () => {
    expect(ROLE_LABELS.company_owner).toBe("Company Owner");
  });

  it("should have dashboard.view permission", () => {
    expect(hasPermission("company_owner", "dashboard.view")).toBe(true);
  });

  it("should have location permissions", () => {
    expect(hasPermission("company_owner", "locations.view")).toBe(true);
    expect(hasPermission("company_owner", "resources.view")).toBe(true);
  });

  it("should have bookings full CRUD permissions", () => {
    expect(hasPermission("company_owner", "bookings.view")).toBe(true);
    expect(hasPermission("company_owner", "bookings.create")).toBe(true);
    expect(hasPermission("company_owner", "bookings.manage")).toBe(true);
  });

  it("should have wallet full permissions", () => {
    expect(hasPermission("company_owner", "wallet.view")).toBe(true);
    expect(hasPermission("company_owner", "wallet.manage")).toBe(true);
  });

  it("should have bundles full permissions", () => {
    expect(hasPermission("company_owner", "bundles.view")).toBe(true);
    expect(hasPermission("company_owner", "bundles.manage")).toBe(true);
  });

  it("should have companies view and manage permissions", () => {
    expect(hasPermission("company_owner", "companies.view")).toBe(true);
    expect(hasPermission("company_owner", "companies.manage")).toBe(true);
  });

  it("should have members view and manage permissions", () => {
    expect(hasPermission("company_owner", "members.view")).toBe(true);
    expect(hasPermission("company_owner", "members.manage")).toBe(true);
  });

  it("should have visitors full permissions", () => {
    expect(hasPermission("company_owner", "visitors.view")).toBe(true);
    expect(hasPermission("company_owner", "visitors.manage")).toBe(true);
  });

  it("should have invites full permissions", () => {
    expect(hasPermission("company_owner", "invites.view")).toBe(true);
    expect(hasPermission("company_owner", "invites.manage")).toBe(true);
  });

  it("should have parking.view permission", () => {
    expect(hasPermission("company_owner", "parking.view")).toBe(true);
  });

  it("should have notifications.view permission", () => {
    expect(hasPermission("company_owner", "notifications.view")).toBe(true);
  });

  it("should have settings.view permission", () => {
    expect(hasPermission("company_owner", "settings.view")).toBe(true);
  });

  it("should have credits full permissions", () => {
    expect(hasPermission("company_owner", "credits.view")).toBe(true);
    expect(hasPermission("company_owner", "credits.manage")).toBe(true);
    expect(hasPermission("company_owner", "credits.purchase")).toBe(true);
  });

  it("should have budget_controls full permissions", () => {
    expect(hasPermission("company_owner", "budget_controls.view")).toBe(true);
    expect(hasPermission("company_owner", "budget_controls.manage")).toBe(true);
  });

  it("should have commit_contracts full permissions", () => {
    expect(hasPermission("company_owner", "commit_contracts.view")).toBe(true);
    expect(hasPermission("company_owner", "commit_contracts.manage")).toBe(true);
  });

  it("should have company.billing.manage permission", () => {
    expect(hasPermission("company_owner", "company.billing.manage")).toBe(true);
  });

  it("should have company.settings.manage permission", () => {
    expect(hasPermission("company_owner", "company.settings.manage")).toBe(true);
  });

  it("should not have location manage permission", () => {
    expect(hasPermission("company_owner", "locations.manage")).toBe(false);
  });

  it("should not have resource manage permission", () => {
    expect(hasPermission("company_owner", "resources.manage")).toBe(false);
  });

  it("should not have parking manage permission", () => {
    expect(hasPermission("company_owner", "parking.manage")).toBe(false);
  });

  it("should not have CRM permissions", () => {
    expect(hasPermission("company_owner", "crm.view")).toBe(false);
    expect(hasPermission("company_owner", "crm.manage")).toBe(false);
  });

  it("should not have operations permissions", () => {
    expect(hasPermission("company_owner", "operations.view")).toBe(false);
    expect(hasPermission("company_owner", "operations.manage")).toBe(false);
  });

  it("should not have roles management permissions", () => {
    expect(hasPermission("company_owner", "roles.view")).toBe(false);
    expect(hasPermission("company_owner", "roles.manage")).toBe(false);
  });

  it("should not have settings manage permission", () => {
    expect(hasPermission("company_owner", "settings.manage")).toBe(false);
  });

  it("should outrank teamadmin role", () => {
    expect(outranks("company_owner", "teamadmin")).toBe(true);
  });

  it("should not outrank host role", () => {
    expect(outranks("company_owner", "host")).toBe(false);
  });

  it("should be outranked by host", () => {
    expect(outranks("host", "company_owner")).toBe(true);
  });

  it("should outrank all other roles except host and administrator", () => {
    expect(outranks("company_owner", "member")).toBe(true);
    expect(outranks("company_owner", "guest")).toBe(true);
  });

  it("should have all defined permissions in ROLE_PERMISSIONS", () => {
    const ownerPerm = ROLE_PERMISSIONS.company_owner;
    expect(ownerPerm).toBeDefined();
    expect(Array.isArray(ownerPerm)).toBe(true);
    expect(ownerPerm.length).toBeGreaterThan(0);
  });
});
