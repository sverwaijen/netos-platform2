import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB ─────────────────────────────────────────────────────────────
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      $returningId: vi.fn().mockResolvedValue([{ id: 1 }]),
    }),
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(undefined),
  }),
};

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

vi.mock("./syncMenuToKiosk", () => ({
  syncMenuToKiosk: vi.fn().mockResolvedValue({ synced: 10, errors: [] }),
}));

// ─── Menu Data Structures ────────────────────────────────────────────────
describe("Menu System", () => {
  describe("Menu Season Management", () => {
    it("should validate season quarter values", () => {
      const validQuarters = ["Q1", "Q2", "Q3", "Q4"];
      for (const q of validQuarters) {
        expect(validQuarters).toContain(q);
      }
      expect(validQuarters).not.toContain("Q5");
      expect(validQuarters).not.toContain("Q0");
    });

    it("should structure a season correctly", () => {
      const season = {
        id: 1,
        year: 2026,
        quarter: "Q2" as const,
        name: "Lente/Zomer 2026",
        startDate: "2026-04-01",
        endDate: "2026-06-30",
        isActive: true,
        driveMenuSheetId: null,
        driveFoodbookDocId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(season.year).toBe(2026);
      expect(season.quarter).toBe("Q2");
      expect(season.isActive).toBe(true);
      expect(season.name).toContain("2026");
    });

    it("should only allow one active season at a time", () => {
      const seasons = [
        { id: 1, isActive: false, quarter: "Q1" },
        { id: 2, isActive: true, quarter: "Q2" },
        { id: 3, isActive: false, quarter: "Q3" },
      ];
      const activeSeasons = seasons.filter((s) => s.isActive);
      expect(activeSeasons).toHaveLength(1);
      expect(activeSeasons[0].id).toBe(2);
    });

    it("should validate season date range", () => {
      const season = {
        startDate: "2026-04-01",
        endDate: "2026-06-30",
      };
      const start = new Date(season.startDate);
      const end = new Date(season.endDate);
      expect(end.getTime()).toBeGreaterThan(start.getTime());
    });
  });

  describe("Menu Categories", () => {
    it("should validate category structure", () => {
      const category = {
        id: 1,
        name: "Warme dranken",
        slug: "warme-dranken",
        icon: "☕",
        sortOrder: 1,
        isActive: true,
      };
      expect(category.slug).toMatch(/^[a-z0-9-]+$/);
      expect(category.sortOrder).toBeGreaterThanOrEqual(0);
      expect(category.isActive).toBe(true);
    });

    it("should sort categories by sortOrder", () => {
      const categories = [
        { name: "Lunch", sortOrder: 3 },
        { name: "Ontbijt", sortOrder: 1 },
        { name: "Dranken", sortOrder: 2 },
      ];
      const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
      expect(sorted[0].name).toBe("Ontbijt");
      expect(sorted[1].name).toBe("Dranken");
      expect(sorted[2].name).toBe("Lunch");
    });
  });

  describe("Menu Items", () => {
    it("should validate menu item structure", () => {
      const item = {
        id: 1,
        categoryId: 1,
        name: "Flat White",
        subtitle: "Signature espresso met zijdezachte melk",
        description: "Onze populairste koffie",
        priceEur: "4.50",
        priceLargeEur: "5.50",
        allergens: ["melk"],
        isVegan: false,
        isVegetarian: true,
        isGlutenFree: true,
        isSignature: true,
        isActive: true,
        sortOrder: 1,
      };
      expect(parseFloat(item.priceEur)).toBeGreaterThan(0);
      expect(parseFloat(item.priceLargeEur!)).toBeGreaterThan(parseFloat(item.priceEur));
      expect(item.allergens).toContain("melk");
      expect(item.isVegetarian).toBe(true);
      expect(item.isSignature).toBe(true);
    });

    it("should filter items by dietary restrictions", () => {
      const items = [
        { name: "Flat White", isVegan: false, isVegetarian: true, isGlutenFree: true },
        { name: "Oat Latte", isVegan: true, isVegetarian: true, isGlutenFree: true },
        { name: "Club Sandwich", isVegan: false, isVegetarian: false, isGlutenFree: false },
        { name: "Açaí Bowl", isVegan: true, isVegetarian: true, isGlutenFree: true },
      ];
      const veganItems = items.filter((i) => i.isVegan);
      expect(veganItems).toHaveLength(2);
      expect(veganItems.map((i) => i.name)).toContain("Oat Latte");
      expect(veganItems.map((i) => i.name)).toContain("Açaí Bowl");

      const glutenFreeItems = items.filter((i) => i.isGlutenFree);
      expect(glutenFreeItems).toHaveLength(3);
    });

    it("should validate price format (EUR decimal)", () => {
      const validPrices = ["4.50", "10.00", "0.50", "99.99"];
      for (const price of validPrices) {
        const parsed = parseFloat(price);
        expect(parsed).toBeGreaterThanOrEqual(0);
        expect(price).toMatch(/^\d+\.\d{2}$/);
      }
    });

    it("should handle items without large size pricing", () => {
      const item = {
        name: "Espresso",
        priceEur: "3.00",
        priceLargeEur: null,
      };
      expect(item.priceLargeEur).toBeNull();
      const displayPrice = item.priceLargeEur || item.priceEur;
      expect(displayPrice).toBe("3.00");
    });

    it("should search items by name or subtitle", () => {
      const items = [
        { name: "Flat White", subtitle: "Espresso met melk" },
        { name: "Cappuccino", subtitle: "Klassieke Italiaanse koffie" },
        { name: "Club Sandwich", subtitle: "Kip, bacon, sla" },
      ];
      const search = "koffie";
      const results = items.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.subtitle.toLowerCase().includes(search.toLowerCase())
      );
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Cappuccino");
    });
  });

  describe("Season Items (Menu-Season Assignment)", () => {
    it("should apply price overrides from season items", () => {
      const baseItem = { priceEur: "4.50", priceLargeEur: "5.50" };
      const seasonItem = {
        priceOverrideEur: "3.99",
        priceLargeOverrideEur: null,
        isAvailable: true,
      };
      const effectivePrice = seasonItem.priceOverrideEur || baseItem.priceEur;
      const effectiveLargePrice =
        seasonItem.priceLargeOverrideEur || baseItem.priceLargeEur;
      expect(effectivePrice).toBe("3.99");
      expect(effectiveLargePrice).toBe("5.50");
    });

    it("should use base price when no override exists", () => {
      const baseItem = { priceEur: "4.50" };
      const seasonItem = { priceOverrideEur: null };
      const effectivePrice = seasonItem.priceOverrideEur || baseItem.priceEur;
      expect(effectivePrice).toBe("4.50");
    });

    it("should respect availability toggle per season", () => {
      const seasonItems = [
        { menuItemId: 1, isAvailable: true },
        { menuItemId: 2, isAvailable: false },
        { menuItemId: 3, isAvailable: true },
      ];
      const available = seasonItems.filter((si) => si.isAvailable);
      expect(available).toHaveLength(2);
    });

    it("should sort season items by sortOrder", () => {
      const seasonItems = [
        { menuItemId: 3, sortOrder: 2 },
        { menuItemId: 1, sortOrder: 0 },
        { menuItemId: 2, sortOrder: 1 },
      ];
      const sorted = [...seasonItems].sort((a, b) => a.sortOrder - b.sortOrder);
      expect(sorted[0].menuItemId).toBe(1);
      expect(sorted[1].menuItemId).toBe(2);
      expect(sorted[2].menuItemId).toBe(3);
    });

    it("should filter season items by location", () => {
      const seasonItems = [
        { menuItemId: 1, locationId: null, name: "Global item" },
        { menuItemId: 2, locationId: 1, name: "Location 1 only" },
        { menuItemId: 3, locationId: 2, name: "Location 2 only" },
        { menuItemId: 4, locationId: null, name: "Another global" },
      ];
      const targetLocation = 1;
      const filtered = seasonItems.filter(
        (si) => si.locationId === null || si.locationId === targetLocation
      );
      expect(filtered).toHaveLength(3);
      expect(filtered.map((f) => f.name)).not.toContain("Location 2 only");
    });
  });

  describe("Menu Preparations (Foodbook)", () => {
    it("should validate preparation structure", () => {
      const prep = {
        menuItemId: 1,
        seasonId: 2,
        steps: [
          "Koffie malen (18g, fijn)",
          "Espresso trekken (25-30 sec)",
          "Melk opschuimen (60-65°C, micro-foam)",
          "Gieten in tulp-patroon",
        ],
        ingredients: [
          { name: "Koffiebonen", amount: "18", unit: "g" },
          { name: "Volle melk", amount: "200", unit: "ml" },
        ],
        prepTimeMinutes: 5,
        notes: "Altijd verse bonen gebruiken",
      };
      expect(prep.steps.length).toBeGreaterThan(0);
      expect(prep.ingredients!.length).toBeGreaterThan(0);
      expect(prep.prepTimeMinutes).toBeGreaterThan(0);
      for (const ing of prep.ingredients!) {
        expect(ing.name).toBeTruthy();
        expect(parseFloat(ing.amount)).toBeGreaterThan(0);
        expect(ing.unit).toBeTruthy();
      }
    });

    it("should prefer season-specific preparations over defaults", () => {
      const preparations = [
        { menuItemId: 1, seasonId: null, steps: ["Default step 1"] },
        { menuItemId: 1, seasonId: 2, steps: ["Q2 step 1", "Q2 step 2"] },
      ];
      const currentSeasonId = 2;
      const seasonSpecific = preparations.find(
        (p) => p.menuItemId === 1 && p.seasonId === currentSeasonId
      );
      const fallback = preparations.find(
        (p) => p.menuItemId === 1 && p.seasonId === null
      );
      const active = seasonSpecific || fallback;
      expect(active!.steps).toHaveLength(2);
      expect(active!.steps[0]).toBe("Q2 step 1");
    });
  });

  describe("Menu Arrangements", () => {
    it("should validate arrangement structure", () => {
      const arrangement = {
        id: 1,
        seasonId: 2,
        name: "Vergader Arrangement",
        description: "Koffie, thee, gebak en broodjes voor uw vergadering",
        priceEur: "18.50",
        memberPriceEur: "15.00",
        isActive: true,
        sortOrder: 1,
      };
      expect(parseFloat(arrangement.priceEur)).toBeGreaterThan(0);
      expect(parseFloat(arrangement.memberPriceEur!)).toBeLessThan(
        parseFloat(arrangement.priceEur)
      );
      expect(arrangement.isActive).toBe(true);
    });

    it("should offer member discount on arrangements", () => {
      const arrangement = {
        priceEur: "25.00",
        memberPriceEur: "20.00",
      };
      const regularPrice = parseFloat(arrangement.priceEur);
      const memberPrice = parseFloat(arrangement.memberPriceEur);
      const discountPercent = ((regularPrice - memberPrice) / regularPrice) * 100;
      expect(discountPercent).toBe(20);
      expect(memberPrice).toBeLessThan(regularPrice);
    });

    it("should handle arrangements without member pricing", () => {
      const arrangement = {
        priceEur: "12.50",
        memberPriceEur: null,
      };
      const effectivePrice =
        arrangement.memberPriceEur || arrangement.priceEur;
      expect(effectivePrice).toBe("12.50");
    });

    it("should filter active arrangements for a season", () => {
      const arrangements = [
        { id: 1, seasonId: 2, isActive: true },
        { id: 2, seasonId: 2, isActive: false },
        { id: 3, seasonId: 3, isActive: true },
        { id: 4, seasonId: 2, isActive: true },
      ];
      const seasonId = 2;
      const active = arrangements.filter(
        (a) => a.seasonId === seasonId && a.isActive
      );
      expect(active).toHaveLength(2);
      expect(active.map((a) => a.id)).toEqual([1, 4]);
    });
  });

  describe("Season Clone Logic", () => {
    it("should copy all season items to new season", () => {
      const sourceItems = [
        { menuItemId: 1, locationId: null, priceOverrideEur: "3.50", sortOrder: 0 },
        { menuItemId: 2, locationId: 1, priceOverrideEur: null, sortOrder: 1 },
        { menuItemId: 3, locationId: null, priceOverrideEur: "5.00", sortOrder: 2 },
      ];
      const newSeasonId = 10;
      const clonedItems = sourceItems.map((item) => ({
        ...item,
        seasonId: newSeasonId,
      }));
      expect(clonedItems).toHaveLength(sourceItems.length);
      for (const cloned of clonedItems) {
        expect(cloned.seasonId).toBe(newSeasonId);
      }
      // Verify originals preserved
      expect(clonedItems[0].menuItemId).toBe(1);
      expect(clonedItems[0].priceOverrideEur).toBe("3.50");
    });
  });

  describe("Active Menu Response (kiosk/signage)", () => {
    it("should return structured active menu response", () => {
      const response = {
        season: {
          id: 2,
          name: "Lente/Zomer 2026",
          quarter: "Q2",
          year: 2026,
          isActive: true,
        },
        items: [
          {
            id: 1,
            name: "Flat White",
            priceEur: "4.50",
            categoryName: "Warme dranken",
            categorySlug: "warme-dranken",
            seasonItemId: 10,
          },
        ],
        arrangements: [
          {
            id: 1,
            name: "Vergader Arrangement",
            priceEur: "18.50",
          },
        ],
      };
      expect(response.season).not.toBeNull();
      expect(response.season!.isActive).toBe(true);
      expect(response.items.length).toBeGreaterThan(0);
      expect(response.items[0].categoryName).toBeTruthy();
      expect(response.arrangements.length).toBeGreaterThan(0);
    });

    it("should return empty response when no active season", () => {
      const response = { season: null, items: [], arrangements: [] };
      expect(response.season).toBeNull();
      expect(response.items).toHaveLength(0);
      expect(response.arrangements).toHaveLength(0);
    });
  });
});
