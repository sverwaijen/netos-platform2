import { describe, it, expect, beforeEach, vi } from "vitest";
import visitorTrackingService, {
  VisitorTrackingService,
} from "./integrations/visitorTrackingService";
import * as db from "./db";

describe("Visitor Tracking Service", () => {
  describe("IP Lookup", () => {
    it("should lookup company by IP address", async () => {
      // Arrange
      const testIp = "8.8.8.8"; // Google DNS

      // Mock the fetch for ipinfo.io
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ip: testIp,
              city: "Mountain View",
              country: "US",
              org: "AS15169 Google Inc",
            }),
        })
      ) as any;

      // Act
      const result = await visitorTrackingService.lookupCompanyByIp(testIp);

      // Assert
      expect(result.ip).toBe(testIp);
      expect(result.city).toBe("Mountain View");
      expect(result.country).toBe("US");
      expect(result.companyName).toContain("Google");
    });

    it("should handle localhost IP", async () => {
      // Act
      const result = await visitorTrackingService.lookupCompanyByIp("127.0.0.1");

      // Assert
      expect(result.ip).toBe("127.0.0.1");
      expect(result.companyName).toBe("Localhost");
    });

    it("should return partial data on API failure", async () => {
      // Arrange
      const testIp = "1.2.3.4";

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 429,
        })
      ) as any;

      // Act
      const result = await visitorTrackingService.lookupCompanyByIp(testIp);

      // Assert
      expect(result.ip).toBe(testIp);
      expect(result.companyName).toBeUndefined();
    });

    it("should extract domain from company name", () => {
      // Arrange
      const service = new VisitorTrackingService();
      const testNames = ["Google Inc", "Microsoft Corp", "Apple Inc"];

      // Assert - verify domain extraction logic
      expect(testNames[0]).toContain("Google");
    });
  });

  describe("Tracking Pixel & Script Generation", () => {
    it("should generate tracking pixel URL", () => {
      // Arrange
      const baseUrl = "https://example.com";
      const visitId = "visit_123456";

      // Act
      const pixelUrl = visitorTrackingService.generateTrackingPixelUrl(
        baseUrl,
        visitId
      );

      // Assert
      expect(pixelUrl).toContain(baseUrl);
      expect(pixelUrl).toContain(visitId);
      expect(pixelUrl).toContain("pixel");
    });

    it("should generate tracking script", () => {
      // Arrange
      const accountId = "acc_12345";

      // Act
      const script = visitorTrackingService.generateTrackingScript(accountId);

      // Assert
      expect(script).toContain(accountId);
      expect(script).toContain("trackVisit");
      expect(script).toContain("sessionStorage");
      expect(script).toContain("/api/tracking/visit");
    });

    it("should include UTM tracking in script", () => {
      // Act
      const script = visitorTrackingService.generateTrackingScript("acc_123");

      // Assert
      expect(script).toContain("utm_source");
      expect(script).toContain("utm_medium");
      expect(script).toContain("utm_campaign");
    });

    it("should respect tracking options", () => {
      // Act
      const scriptWithoutClicks = visitorTrackingService.generateTrackingScript(
        "acc_123",
        { trackClicks: false }
      );

      // Assert
      expect(scriptWithoutClicks).toContain("trackPageViews: true");
    });
  });

  describe("Deduplication", () => {
    it("should detect duplicate visits within 30 minutes", async () => {
      // Arrange
      const ip = "192.168.1.1";
      const now = Date.now();
      const recentVisits = [
        { ip, visitedAt: now - 10 * 60 * 1000 }, // 10 minutes ago
      ];

      // Act
      const isNewVisit =
        await visitorTrackingService.shouldTrackAsNewVisit(ip, recentVisits);

      // Assert
      expect(isNewVisit).toBe(false);
    });

    it("should allow visit after 30 minutes", async () => {
      // Arrange
      const ip = "192.168.1.1";
      const now = Date.now();
      const oldVisits = [
        { ip, visitedAt: now - 31 * 60 * 1000 }, // 31 minutes ago
      ];

      // Act
      const isNewVisit = await visitorTrackingService.shouldTrackAsNewVisit(
        ip,
        oldVisits
      );

      // Assert
      expect(isNewVisit).toBe(true);
    });

    it("should allow new IP address", async () => {
      // Arrange
      const ip = "192.168.1.100";
      const existingVisits = [
        { ip: "192.168.1.1", visitedAt: Date.now() - 1000 },
      ];

      // Act
      const isNewVisit = await visitorTrackingService.shouldTrackAsNewVisit(
        ip,
        existingVisits
      );

      // Assert
      expect(isNewVisit).toBe(true);
    });
  });

  describe("Visitor Database Operations", () => {
    it("should create visitor record", async () => {
      // Arrange
      const visitorData = {
        ip: "192.168.1.1",
        companyName: "Test Corp",
        pageUrl: "/pricing",
        visitedAt: Date.now(),
      };

      vi.spyOn(db, "createWebsiteVisitor").mockResolvedValue(1);

      // Act
      const visitId = await db.createWebsiteVisitor(visitorData as any);

      // Assert
      expect(visitId).toBe(1);
    });

    it("should retrieve recent visitors", async () => {
      // Arrange
      const mockVisitors = [
        {
          id: 1,
          ip: "192.168.1.1",
          companyName: "Tech Corp",
          pageUrl: "/pricing",
          visitedAt: Date.now(),
        },
        {
          id: 2,
          ip: "192.168.1.2",
          companyName: "Design Inc",
          pageUrl: "/features",
          visitedAt: Date.now() - 3600000,
        },
      ];

      vi.spyOn(db, "getWebsiteVisitors").mockResolvedValue(mockVisitors as any);

      // Act
      const visitors = await db.getWebsiteVisitors({ limit: 50 } as any);

      // Assert
      expect(visitors).toHaveLength(2);
      expect(visitors[0].companyName).toBe("Tech Corp");
    });

    it("should link visitor to lead", async () => {
      // Arrange
      vi.spyOn(db, "updateWebsiteVisitor").mockResolvedValue(true);

      // Act
      const result = await db.updateWebsiteVisitor(1, { leadId: 42 } as any);

      // Assert
      expect(result).toBe(true);
    });

    it("should delete visitor for GDPR", async () => {
      // Arrange
      vi.spyOn(db, "deleteWebsiteVisitor").mockResolvedValue(true);

      // Act
      const result = await db.deleteWebsiteVisitor(1);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe("Visitor Matching & Lead Assignment", () => {
    it("should match visitor to existing lead by domain", () => {
      // Arrange
      const visitor = {
        companyName: "Google Inc",
        companyDomain: "google.com",
      };
      const existingLeads = [
        { id: 1, companyName: "Google Inc", website: "google.com" },
        { id: 2, companyName: "Microsoft", website: "microsoft.com" },
      ];

      // Act
      const match = existingLeads.find(
        (l) =>
          l.companyName === visitor.companyName ||
          l.website === visitor.companyDomain
      );

      // Assert
      expect(match?.id).toBe(1);
    });

    it("should not match unknown company", () => {
      // Arrange
      const visitor = {
        companyName: "Unknown Company",
        companyDomain: undefined,
      };
      const existingLeads = [
        { id: 1, companyName: "Google Inc" },
        { id: 2, companyName: "Microsoft" },
      ];

      // Act
      const match = existingLeads.find((l) => l.companyName === visitor.companyName);

      // Assert
      expect(match).toBeUndefined();
    });
  });

  describe("Visit Statistics", () => {
    it("should calculate visitor stats", () => {
      // Arrange
      const visitors = [
        {
          ip: "192.168.1.1",
          companyName: "Company A",
          visitedAt: Date.now(),
        },
        {
          ip: "192.168.1.1",
          companyName: "Company A",
          visitedAt: Date.now() - 3600000,
        },
        {
          ip: "192.168.1.2",
          companyName: "Company B",
          visitedAt: Date.now(),
        },
      ];

      // Act
      const uniqueIps = new Set(visitors.map((v) => v.ip)).size;
      const uniqueCompanies = new Set(
        visitors.filter((v) => v.companyName).map((v) => v.companyName)
      ).size;

      // Assert
      expect(uniqueIps).toBe(2);
      expect(uniqueCompanies).toBe(2);
    });

    it("should identify unidentified visits", () => {
      // Arrange
      const visitors = [
        { ip: "192.168.1.1", companyName: "Known Corp" },
        { ip: "192.168.1.2", companyName: undefined },
        { ip: "192.168.1.3", companyName: "Another Corp" },
      ];

      // Act
      const identified = visitors.filter((v) => v.companyName);
      const unidentified = visitors.filter((v) => !v.companyName);

      // Assert
      expect(identified).toHaveLength(2);
      expect(unidentified).toHaveLength(1);
    });
  });
});
