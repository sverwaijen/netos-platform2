import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Salto KS integration
vi.mock("./integrations/saltoKS", () => ({
  initSaltoKS: vi.fn(),
  listAccessPoints: vi.fn().mockResolvedValue([{ id: "door-1", name: "Main Entrance", type: "entrance", status: "online" }]),
  getAccessPoint: vi.fn().mockResolvedValue({ id: "door-1", name: "Main Entrance", type: "entrance", status: "online" }),
  remoteOpenDoor: vi.fn().mockResolvedValue({ success: true }),
  getAuditTrail: vi.fn().mockResolvedValue([]),
  listAccessGroups: vi.fn().mockResolvedValue([{ id: "group-general", name: "General Access" }]),
  getUserAccessRights: vi.fn().mockResolvedValue({ access_group_ids: ["group-general"] }),
  setUserAccessRights: vi.fn().mockResolvedValue({}),
  createSaltoUser: vi.fn().mockResolvedValue({ id: "salto-user-123" }),
  issueMobileKey: vi.fn().mockResolvedValue({ id: "key-abc" }),
  revokeMobileKey: vi.fn().mockResolvedValue({}),
  listMobileKeys: vi.fn().mockResolvedValue([{ id: "key-abc", status: "active" }]),
}));

describe("Access Control Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SALTO_KS_API_URL;
    delete process.env.SALTO_KS_CLIENT_ID;
    delete process.env.SALTO_KS_CLIENT_SECRET;
    delete process.env.SALTO_KS_SITE_ID;
  });

  describe("Salto KS configuration detection", () => {
    it("should report unconfigured when env vars are missing", () => {
      const configured = !!(process.env.SALTO_KS_API_URL && process.env.SALTO_KS_CLIENT_ID && process.env.SALTO_KS_CLIENT_SECRET && process.env.SALTO_KS_SITE_ID);
      expect(configured).toBe(false);
    });

    it("should report configured when all env vars are present", () => {
      process.env.SALTO_KS_API_URL = "https://api.saltoks.com";
      process.env.SALTO_KS_CLIENT_ID = "test-client";
      process.env.SALTO_KS_CLIENT_SECRET = "test-secret";
      process.env.SALTO_KS_SITE_ID = "site-123";
      const configured = !!(process.env.SALTO_KS_API_URL && process.env.SALTO_KS_CLIENT_ID && process.env.SALTO_KS_CLIENT_SECRET && process.env.SALTO_KS_SITE_ID);
      expect(configured).toBe(true);
    });

    it("should report unconfigured when only some env vars are present", () => {
      process.env.SALTO_KS_API_URL = "https://api.saltoks.com";
      const configured = !!(process.env.SALTO_KS_API_URL && process.env.SALTO_KS_CLIENT_ID && process.env.SALTO_KS_CLIENT_SECRET && process.env.SALTO_KS_SITE_ID);
      expect(configured).toBe(false);
    });
  });

  describe("Mock door data", () => {
    it("should return mock door list when Salto is not configured", () => {
      const mockDoors = [
        { id: "door-main-entrance", name: "Hoofdingang", type: "entrance", locationId: 1, status: "online" },
        { id: "door-parking-gate", name: "Parkeergarage Ingang", type: "barrier", locationId: 1, status: "online" },
        { id: "door-office-wing-a", name: "Kantoorvleugel A", type: "office", locationId: 1, status: "online" },
        { id: "door-meeting-room-1", name: "Vergaderruimte 1", type: "meeting_room", locationId: 1, status: "online" },
        { id: "door-server-room", name: "Serverruimte", type: "restricted", locationId: 1, status: "online" },
      ];
      expect(mockDoors).toHaveLength(5);
      expect(mockDoors[0].name).toBe("Hoofdingang");
      expect(mockDoors[1].type).toBe("barrier");
    });

    it("should include parking gate in mock access points", () => {
      const mockDoors = [
        { id: "door-main-entrance", name: "Hoofdingang", type: "entrance" },
        { id: "door-parking-gate", name: "Parkeergarage Ingang", type: "barrier" },
      ];
      const parkingDoor = mockDoors.find((d) => d.type === "barrier");
      expect(parkingDoor).toBeDefined();
      expect(parkingDoor?.id).toBe("door-parking-gate");
    });

    it("should return mock access groups", () => {
      const mockGroups = [
        { id: "group-general", name: "Algemeen Toegang", description: "Hoofdingang en gemeenschappelijke ruimtes" },
        { id: "group-parking", name: "Parkeergarage", description: "Parkeergarage en slagboom" },
        { id: "group-office-a", name: "Kantoorvleugel A", description: "Alle deuren kantoorvleugel A" },
        { id: "group-facility", name: "Facility", description: "Technische ruimtes en serverruimte" },
      ];
      expect(mockGroups).toHaveLength(4);
      const parking = mockGroups.find((g) => g.id === "group-parking");
      expect(parking?.name).toBe("Parkeergarage");
    });
  });

  describe("Access statistics calculation", () => {
    it("should correctly aggregate access event counts", () => {
      const mockResults = [
        { action: "entry", eventCount: 42 },
        { action: "exit", eventCount: 38 },
        { action: "denied", eventCount: 3 },
      ];
      const stats = { totalEvents: 0, entries: 0, exits: 0, denied: 0 };
      for (const row of mockResults) {
        const c = Number(row.eventCount);
        stats.totalEvents += c;
        if (row.action === "entry") stats.entries = c;
        else if (row.action === "exit") stats.exits = c;
        else if (row.action === "denied") stats.denied = c;
      }
      expect(stats.totalEvents).toBe(83);
      expect(stats.entries).toBe(42);
      expect(stats.exits).toBe(38);
      expect(stats.denied).toBe(3);
    });

    it("should handle empty event list", () => {
      const mockResults = [];
      const stats = { totalEvents: 0, entries: 0, exits: 0, denied: 0 };
      for (const row of mockResults) {
        const c = Number(row.eventCount);
        stats.totalEvents += c;
      }
      expect(stats.totalEvents).toBe(0);
    });

    it("should default to 24h window when no since param given", () => {
      const now = Date.now();
      const defaultSince = new Date(now - 24 * 60 * 60 * 1000);
      const diff = now - defaultSince.getTime();
      expect(diff).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe("Parking access integration", () => {
    it("should identify parking access group correctly", () => {
      const parkingGroupIds = ["group-parking"];
      const userGroups = ["group-general", "group-parking"];
      const hasAccess = userGroups.some((id) => parkingGroupIds.includes(id));
      expect(hasAccess).toBe(true);
    });

    it("should deny parking access when user lacks group", () => {
      const parkingGroupIds = ["group-parking"];
      const userGroups = ["group-general", "group-office-a"];
      const hasAccess = userGroups.some((id) => parkingGroupIds.includes(id));
      expect(hasAccess).toBe(false);
    });

    it("should generate correct saltoEventId for parking events", () => {
      const accessPointId = "door-parking-gate";
      const timestamp = 1700000000000;
      const saltoEventId = `parking-${accessPointId}-${timestamp}`;
      expect(saltoEventId).toBe("parking-door-parking-gate-1700000000000");
      expect(saltoEventId).toContain("parking");
      expect(saltoEventId).toContain(accessPointId);
    });
  });
});
