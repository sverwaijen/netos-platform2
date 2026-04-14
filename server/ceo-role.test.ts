import { describe, expect, it } from "vitest";
import { ROLES, ROLE_PERMISSIONS, ROLE_HIERARCHY, ROLE_LABELS, hasPermission, outranks } from "@shared/roles";

describe("CEO Role", () => {
  it("should include 'ceo' in ROLES array", () => {
    expect(ROLES).toContain("ceo");
  });

  it("should have hierarchy level 95 (between administrator 100 and host 80)", () => {
    expect(ROLE_HIERARCHY.ceo).toBe(95);
    expect(ROLE_HIERARCHY.ceo).toBeLessThan(ROLE_HIERARCHY.administrator);
    expect(ROLE_HIERARCHY.ceo).toBeGreaterThan(ROLE_HIERARCHY.host);
  });

  it("should have appropriate display label", () => {
    expect(ROLE_LABELS.ceo).toBe("CEO/Executive");
  });

  it("should have dashboard.view permission", () => {
    expect(hasPermission("ceo", "dashboard.view")).toBe(true);
  });

  it("should have all finance-related view permissions", () => {
    expect(hasPermission("ceo", "wallet.view")).toBe(true);
    expect(hasPermission("ceo", "wallet.manage")).toBe(true);
    expect(hasPermission("ceo", "bundles.view")).toBe(true);
    expect(hasPermission("ceo", "bundles.manage")).toBe(true);
    expect(hasPermission("ceo", "credits.view")).toBe(true);
    expect(hasPermission("ceo", "credits.manage")).toBe(true);
    expect(hasPermission("ceo", "budget_controls.view")).toBe(true);
    expect(hasPermission("ceo", "budget_controls.manage")).toBe(true);
  });

  it("should have companies.view permission", () => {
    expect(hasPermission("ceo", "companies.view")).toBe(true);
  });

  it("should have members.view permission", () => {
    expect(hasPermission("ceo", "members.view")).toBe(true);
  });

  it("should have locations.view permission", () => {
    expect(hasPermission("ceo", "locations.view")).toBe(true);
  });

  it("should have resources.view permission", () => {
    expect(hasPermission("ceo", "resources.view")).toBe(true);
  });

  it("should have bookings.view permission", () => {
    expect(hasPermission("ceo", "bookings.view")).toBe(true);
  });

  it("should have parking.view permission", () => {
    expect(hasPermission("ceo", "parking.view")).toBe(true);
  });

  it("should have notifications.view permission", () => {
    expect(hasPermission("ceo", "notifications.view")).toBe(true);
  });

  it("should have executive.view and executive.reports permissions", () => {
    expect(hasPermission("ceo", "executive.view")).toBe(true);
    expect(hasPermission("ceo", "executive.reports")).toBe(true);
  });

  it("should not have manage permissions for locations, resources, or companies", () => {
    expect(hasPermission("ceo", "locations.manage")).toBe(false);
    expect(hasPermission("ceo", "resources.manage")).toBe(false);
    expect(hasPermission("ceo", "companies.manage")).toBe(false);
  });

  it("should not have members.manage permission", () => {
    expect(hasPermission("ceo", "members.manage")).toBe(false);
  });

  it("should not have roles management permissions", () => {
    expect(hasPermission("ceo", "roles.view")).toBe(false);
    expect(hasPermission("ceo", "roles.manage")).toBe(false);
  });

  it("should outrank host role", () => {
    expect(outranks("ceo", "host")).toBe(true);
  });

  it("should not outrank administrator role", () => {
    expect(outranks("ceo", "administrator")).toBe(false);
  });

  it("should be outranked by administrator", () => {
    expect(outranks("administrator", "ceo")).toBe(true);
  });

  it("should outrank all other roles except administrator", () => {
    expect(outranks("ceo", "teamadmin")).toBe(true);
    expect(outranks("ceo", "member")).toBe(true);
    expect(outranks("ceo", "guest")).toBe(true);
  });

  it("should have all defined permissions in ROLE_PERMISSIONS", () => {
    const ceoPerm = ROLE_PERMISSIONS.ceo;
    expect(ceoPerm).toBeDefined();
    expect(Array.isArray(ceoPerm)).toBe(true);
    expect(ceoPerm.length).toBeGreaterThan(0);
  });
});
