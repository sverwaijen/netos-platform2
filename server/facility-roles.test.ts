import { describe, expect, it } from "vitest";
import { ROLES, ROLE_PERMISSIONS, ROLE_HIERARCHY, ROLE_LABELS, hasPermission, outranks } from "@shared/roles";

describe("Facility Role", () => {
  it("should include 'facility' in ROLES array", () => {
    expect(ROLES).toContain("facility");
  });

  it("should have hierarchy level 35 (between member 40 and guest 10)", () => {
    expect(ROLE_HIERARCHY.facility).toBe(35);
    expect(ROLE_HIERARCHY.facility).toBeLessThan(ROLE_HIERARCHY.member);
    expect(ROLE_HIERARCHY.facility).toBeGreaterThan(ROLE_HIERARCHY.guest);
  });

  it("should have appropriate display label 'Facilitymedewerker'", () => {
    expect(ROLE_LABELS.facility).toBe("Facilitymedewerker");
  });

  it("should have core permissions", () => {
    expect(hasPermission("facility", "dashboard.view")).toBe(true);
    expect(hasPermission("facility", "operations.view")).toBe(true);
    expect(hasPermission("facility", "operations.manage")).toBe(true);
    expect(hasPermission("facility", "parking.view")).toBe(true);
    expect(hasPermission("facility", "notifications.view")).toBe(true);
    expect(hasPermission("facility", "settings.view")).toBe(true);
  });

  it("should have cleaning permissions", () => {
    expect(hasPermission("facility", "cleaning.view")).toBe(true);
    expect(hasPermission("facility", "cleaning.manage")).toBe(true);
  });

  it("should have maintenance permissions", () => {
    expect(hasPermission("facility", "maintenance.view")).toBe(true);
    expect(hasPermission("facility", "maintenance.manage")).toBe(true);
  });

  it("should not have members management permission", () => {
    expect(hasPermission("facility", "members.manage")).toBe(false);
  });

  it("should not have bookings management permission", () => {
    expect(hasPermission("facility", "bookings.manage")).toBe(false);
  });

  it("should outrank guest role", () => {
    expect(outranks("facility", "guest")).toBe(true);
  });

  it("should not outrank member or higher roles", () => {
    expect(outranks("facility", "member")).toBe(false);
    expect(outranks("facility", "teamadmin")).toBe(false);
    expect(outranks("facility", "host")).toBe(false);
    expect(outranks("facility", "administrator")).toBe(false);
  });

  it("should be outranked by member", () => {
    expect(outranks("member", "facility")).toBe(true);
  });

  it("should have all defined permissions in ROLE_PERMISSIONS", () => {
    const facilityPerm = ROLE_PERMISSIONS.facility;
    expect(facilityPerm).toBeDefined();
    expect(Array.isArray(facilityPerm)).toBe(true);
    expect(facilityPerm.length).toBeGreaterThan(0);
  });
});

describe("Cleaner Role", () => {
  it("should include 'cleaner' in ROLES array", () => {
    expect(ROLES).toContain("cleaner");
  });

  it("should have hierarchy level 25 (between facility 35 and guest 10)", () => {
    expect(ROLE_HIERARCHY.cleaner).toBe(25);
    expect(ROLE_HIERARCHY.cleaner).toBeLessThan(ROLE_HIERARCHY.facility);
    expect(ROLE_HIERARCHY.cleaner).toBeGreaterThan(ROLE_HIERARCHY.guest);
  });

  it("should have appropriate display label 'Schoonmaakster'", () => {
    expect(ROLE_LABELS.cleaner).toBe("Schoonmaakster");
  });

  it("should have core permissions", () => {
    expect(hasPermission("cleaner", "dashboard.view")).toBe(true);
    expect(hasPermission("cleaner", "operations.view")).toBe(true);
    expect(hasPermission("cleaner", "notifications.view")).toBe(true);
  });

  it("should have cleaning view and manage permissions", () => {
    expect(hasPermission("cleaner", "cleaning.view")).toBe(true);
    expect(hasPermission("cleaner", "cleaning.manage")).toBe(true);
  });

  it("should not have maintenance permissions", () => {
    expect(hasPermission("cleaner", "maintenance.view")).toBe(false);
    expect(hasPermission("cleaner", "maintenance.manage")).toBe(false);
  });

  it("should not have operations manage permission", () => {
    expect(hasPermission("cleaner", "operations.manage")).toBe(false);
  });

  it("should not have parking view permission", () => {
    expect(hasPermission("cleaner", "parking.view")).toBe(false);
  });

  it("should not have settings view permission", () => {
    expect(hasPermission("cleaner", "settings.view")).toBe(false);
  });

  it("should be the lowest privilege role above guest", () => {
    expect(outranks("cleaner", "guest")).toBe(true);
    expect(outranks("facility", "cleaner")).toBe(true);
    expect(outranks("member", "cleaner")).toBe(true);
  });

  it("should have all defined permissions in ROLE_PERMISSIONS", () => {
    const cleanerPerm = ROLE_PERMISSIONS.cleaner;
    expect(cleanerPerm).toBeDefined();
    expect(Array.isArray(cleanerPerm)).toBe(true);
    expect(cleanerPerm.length).toBeGreaterThan(0);
  });
});

describe("Facility vs Cleaner Roles", () => {
  it("facility should have all cleaner permissions plus more", () => {
    const cleanerPerms = ROLE_PERMISSIONS.cleaner;
    const facilityPerms = ROLE_PERMISSIONS.facility;

    cleanerPerms.forEach((perm) => {
      expect(facilityPerms).toContain(perm);
    });
  });

  it("facility should have maintenance permissions that cleaner doesn't", () => {
    expect(ROLE_PERMISSIONS.facility).toContain("maintenance.view");
    expect(ROLE_PERMISSIONS.facility).toContain("maintenance.manage");
    expect(ROLE_PERMISSIONS.cleaner).not.toContain("maintenance.view");
    expect(ROLE_PERMISSIONS.cleaner).not.toContain("maintenance.manage");
  });

  it("facility should have operations.manage that cleaner doesn't", () => {
    expect(ROLE_PERMISSIONS.facility).toContain("operations.manage");
    expect(ROLE_PERMISSIONS.cleaner).not.toContain("operations.manage");
  });
});
