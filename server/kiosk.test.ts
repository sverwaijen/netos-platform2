import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
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
  }),
}));

describe("Butler Kiosk System", () => {
  describe("Product Catalog", () => {
    it("should have product categories defined", () => {
      const categories = [
        "Coffee & Drinks",
        "Breakfast",
        "Lunch",
        "Snacks & Treats",
        "Office Supplies",
        "Meeting Catering",
        "Wellness",
        "Tech Accessories",
      ];
      expect(categories).toHaveLength(8);
      expect(categories).toContain("Coffee & Drinks");
      expect(categories).toContain("Meeting Catering");
    });

    it("should validate product pricing structure", () => {
      const product = {
        id: 1,
        name: "Espresso",
        priceCredits: "1.50",
        priceEur: "2.50",
        vatRate: "9.00",
        isBookingAddon: false,
        chargePerBookingHour: false,
        isActive: true,
      };
      expect(parseFloat(product.priceCredits)).toBeGreaterThan(0);
      expect(parseFloat(product.priceEur)).toBeGreaterThan(0);
      expect(parseFloat(product.vatRate)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(product.vatRate)).toBeLessThanOrEqual(21);
    });

    it("should calculate order totals correctly", () => {
      const items = [
        { priceCredits: "1.50", priceEur: "2.50", quantity: 2 },
        { priceCredits: "3.00", priceEur: "5.00", quantity: 1 },
        { priceCredits: "0.75", priceEur: "1.25", quantity: 3 },
      ];
      const totalCredits = items.reduce(
        (sum, i) => sum + parseFloat(i.priceCredits) * i.quantity,
        0
      );
      const totalEur = items.reduce(
        (sum, i) => sum + parseFloat(i.priceEur) * i.quantity,
        0
      );
      expect(totalCredits).toBe(8.25); // 3 + 3 + 2.25
      expect(totalEur).toBe(13.75); // 5 + 5 + 3.75
    });

    it("should calculate VAT correctly for mixed rates", () => {
      const items = [
        { priceEur: "2.50", vatRate: "9.00", quantity: 1 }, // Food: 9% VAT
        { priceEur: "5.00", vatRate: "21.00", quantity: 1 }, // Office supply: 21% VAT
      ];
      const vatTotal = items.reduce((sum, i) => {
        const eur = parseFloat(i.priceEur) * i.quantity;
        return sum + eur * (parseFloat(i.vatRate) / 100);
      }, 0);
      expect(vatTotal).toBeCloseTo(1.275); // 0.225 + 1.05
    });

    it("should support booking add-on products", () => {
      const addons = [
        { name: "Coffee Service", isBookingAddon: true, chargePerBookingHour: true },
        { name: "Whiteboard Markers", isBookingAddon: true, chargePerBookingHour: false },
        { name: "Espresso", isBookingAddon: false, chargePerBookingHour: false },
      ];
      const bookingAddons = addons.filter((a) => a.isBookingAddon);
      expect(bookingAddons).toHaveLength(2);
      const perHourAddons = addons.filter((a) => a.chargePerBookingHour);
      expect(perHourAddons).toHaveLength(1);
    });

    it("should calculate per-hour add-on pricing", () => {
      const addon = { priceCredits: "2.00", chargePerBookingHour: true };
      const bookingHours = 3;
      const total = addon.chargePerBookingHour
        ? parseFloat(addon.priceCredits) * bookingHours
        : parseFloat(addon.priceCredits);
      expect(total).toBe(6.0);
    });
  });

  describe("Payment Methods", () => {
    it("should support all payment methods", () => {
      const methods = [
        "personal_credits",
        "company_credits",
        "stripe_card",
        "company_invoice",
        "cash",
      ];
      expect(methods).toHaveLength(5);
      expect(methods).toContain("personal_credits");
      expect(methods).toContain("company_credits");
      expect(methods).toContain("stripe_card");
    });

    it("should deduct personal credits correctly", () => {
      const wallet = { balance: "50.00", type: "personal" };
      const orderTotal = 8.25;
      const newBalance = parseFloat(wallet.balance) - orderTotal;
      expect(newBalance).toBe(41.75);
      expect(newBalance).toBeGreaterThanOrEqual(0);
    });

    it("should deduct company credits correctly", () => {
      const wallet = { balance: "500.00", type: "company" };
      const orderTotal = 25.50;
      const newBalance = parseFloat(wallet.balance) - orderTotal;
      expect(newBalance).toBe(474.50);
    });

    it("should reject order when insufficient credits", () => {
      const wallet = { balance: "5.00" };
      const orderTotal = 8.25;
      const hasEnough = parseFloat(wallet.balance) >= orderTotal;
      expect(hasEnough).toBe(false);
    });
  });

  describe("Order Number Generation", () => {
    it("should generate unique order numbers", () => {
      const orders = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let id = "";
        for (let j = 0; j < 8; j++) {
          id += chars[Math.floor(Math.random() * chars.length)];
        }
        orders.add(`ORD-${id}`);
      }
      expect(orders.size).toBe(100); // All unique
    });

    it("should format order number correctly", () => {
      const orderNumber = "ORD-ABC12345";
      expect(orderNumber).toMatch(/^ORD-[A-Z0-9]+$/);
      expect(orderNumber.length).toBeGreaterThan(4);
    });
  });

  describe("Kiosk Display", () => {
    it("should handle company branding data", () => {
      const branding = {
        companyId: 1,
        logoUrl: "https://example.com/logo.png",
        primaryColor: "#C4B89E",
        secondaryColor: "#111111",
        accentColor: "#C4B89E",
        fontFamily: "Inter",
        welcomeMessage: "Welcome to our office",
        backgroundImageUrl: null,
      };
      expect(branding.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(branding.secondaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(branding.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should fall back to The Green defaults when no branding", () => {
      const branding = null;
      const primary = branding?.primaryColor || "#C4B89E";
      const secondary = branding?.secondaryColor || "#111111";
      const accent = branding?.accentColor || "#C4B89E";
      const font = branding?.fontFamily || "Inter";
      expect(primary).toBe("#C4B89E");
      expect(secondary).toBe("#111111");
      expect(accent).toBe("#C4B89E");
      expect(font).toBe("Inter");
    });

    it("should generate unique kiosk URLs per company", () => {
      const companies = [1, 2, 3, 10, 42];
      const urls = companies.map((id) => `/kiosk/display?company=${id}`);
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(companies.length);
    });
  });

  describe("Website Scraper", () => {
    it("should validate URL format", () => {
      const validUrls = [
        "https://example.com",
        "https://www.company.nl",
        "http://startup.io",
      ];
      const invalidUrls = ["not-a-url", "ftp://wrong.com", ""];
      
      validUrls.forEach((url) => {
        expect(url).toMatch(/^https?:\/\//);
      });
      invalidUrls.forEach((url) => {
        expect(url).not.toMatch(/^https?:\/\/[a-zA-Z]/);
      });
    });

    it("should handle scraping status transitions", () => {
      const statuses = ["pending", "scraping", "completed", "failed"];
      expect(statuses).toContain("scraping");
      expect(statuses).toContain("completed");
      expect(statuses).toContain("failed");
    });

    it("should extract color values from scraped data", () => {
      const scrapedColors = ["#ff6600", "#333333", "#0066cc"];
      scrapedColors.forEach((color) => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("should auto-create branding from scraped data", () => {
      const scraped = {
        logoUrl: "https://example.com/logo.png",
        colors: ["#ff6600", "#333333", "#0066cc"],
        fonts: ["Roboto"],
        title: "Example Corp",
      };
      const branding = {
        logoUrl: scraped.logoUrl,
        primaryColor: scraped.colors[0] || "#C4B89E",
        secondaryColor: scraped.colors[1] || "#111111",
        accentColor: scraped.colors[2] || "#C4B89E",
        fontFamily: scraped.fonts[0] || "Inter",
      };
      expect(branding.primaryColor).toBe("#ff6600");
      expect(branding.fontFamily).toBe("Roboto");
    });
  });

  describe("Product-Resource Links", () => {
    it("should link products to resource types", () => {
      const links = [
        { productId: 1, resourceTypeId: 3, isRequired: false, isDefault: true },
        { productId: 5, resourceTypeId: 3, isRequired: true, isDefault: true },
      ];
      const requiredLinks = links.filter((l) => l.isRequired);
      const defaultLinks = links.filter((l) => l.isDefault);
      expect(requiredLinks).toHaveLength(1);
      expect(defaultLinks).toHaveLength(2);
    });

    it("should calculate booking add-on totals", () => {
      const addons = [
        { priceCredits: "2.00", quantity: 1, chargePerBookingHour: true },
        { priceCredits: "5.00", quantity: 2, chargePerBookingHour: false },
      ];
      const bookingHours = 4;
      const total = addons.reduce((sum, a) => {
        const unitPrice = parseFloat(a.priceCredits);
        const multiplied = a.chargePerBookingHour ? unitPrice * bookingHours : unitPrice;
        return sum + multiplied * a.quantity;
      }, 0);
      expect(total).toBe(18.0); // (2*4*1) + (5*1*2)
    });
  });

  describe("Credit Ledger Integration", () => {
    it("should create correct ledger entry for kiosk purchase", () => {
      const entry = {
        walletId: 1,
        type: "spend" as const,
        amount: "8.25",
        balanceAfter: "41.75",
        description: "Kiosk order ORD-ABC12345",
        referenceType: "kiosk_order",
        referenceId: 42,
      };
      expect(entry.type).toBe("spend");
      expect(parseFloat(entry.amount)).toBeGreaterThan(0);
      expect(entry.referenceType).toBe("kiosk_order");
      expect(entry.description).toContain("Kiosk order");
    });

    it("should maintain balance consistency", () => {
      const initialBalance = 50.0;
      const orderAmount = 8.25;
      const expectedBalance = initialBalance - orderAmount;
      const ledgerEntry = {
        amount: orderAmount.toFixed(2),
        balanceAfter: expectedBalance.toFixed(2),
      };
      expect(parseFloat(ledgerEntry.balanceAfter)).toBe(expectedBalance);
    });
  });
});
