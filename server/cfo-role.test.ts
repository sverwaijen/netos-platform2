import { describe, it, expect } from "vitest";
import {
  ROLES,
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  ROLE_HIERARCHY,
  hasPermission,
  hasAllPermissions,
  outranks,
} from "../shared/roles";

describe("RBAC – CFO role (Issue #43)", () => {
  it("includes cfo in ROLES array", () => {
    expect(ROLES).toContain("cfo");
  });

  it("has cfo in ROLE_LABELS", () => {
    expect(ROLE_LABELS.cfo).toBe("CFO");
  });

  it("places cfo at hierarchy level 90 (between administrator 100 and host 80)", () => {
    expect(ROLE_HIERARCHY.cfo).toBe(90);
    expect(ROLE_HIERARCHY.administrator).toBeGreaterThan(ROLE_HIERARCHY.cfo);
    expect(ROLE_HIERARCHY.cfo).toBeGreaterThan(ROLE_HIERARCHY.host);
  });

  it("cfo has finance.view and finance.reports permissions", () => {
    expect(hasPermission("cfo", "finance.view")).toBe(true);
    expect(hasPermission("cfo", "finance.reports")).toBe(true);
  });

  it("cfo has invoices.view and invoices.manage permissions", () => {
    expect(hasAllPermissions("cfo", ["invoices.view", "invoices.manage"])).toBe(true);
  });

  it("cfo has full credit and budget access", () => {
    expect(hasAllPermissions("cfo", [
      "credits.view", "credits.manage",
      "budget_controls.view", "budget_controls.manage",
      "commit_contracts.view", "commit_contracts.manage",
    ])).toBe(true);
  });

  it("cfo has wallet management", () => {
    expect(hasAllPermissions("cfo", ["wallet.view", "wallet.manage"])).toBe(true);
  });

  it("cfo cannot manage locations, operations, signage, CRM, or devices", () => {
    expect(hasPermission("cfo", "locations.manage")).toBe(false);
    expect(hasPermission("cfo", "operations.manage")).toBe(false);
    expect(hasPermission("cfo", "signage.manage")).toBe(false);
    expect(hasPermission("cfo", "crm.manage")).toBe(false);
    expect(hasPermission("cfo", "devices.manage")).toBe(false);
  });

  it("cfo cannot manage roles or settings", () => {
    expect(hasPermission("cfo", "roles.manage")).toBe(false);
    expect(hasPermission("cfo", "settings.manage")).toBe(false);
  });

  it("administrator outranks cfo", () => {
    expect(outranks("administrator", "cfo")).toBe(true);
  });

  it("cfo outranks host", () => {
    expect(outranks("cfo", "host")).toBe(true);
  });

  it("host does not have finance-specific permissions", () => {
    expect(hasPermission("host", "finance.view")).toBe(false);
    expect(hasPermission("host", "finance.reports")).toBe(false);
  });

  it("every role in ROLES has matching entries in ROLE_PERMISSIONS, ROLE_LABELS, ROLE_HIERARCHY", () => {
    for (const role of ROLES) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
      expect(ROLE_LABELS[role]).toBeDefined();
      expect(ROLE_HIERARCHY[role]).toBeDefined();
    }
  });
});
