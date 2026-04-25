import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getDb } from "./db";
import { companies, companyBranding, companyBrandingScraped } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// Mock the scraper
vi.mock("./scraper", () => ({
  scrapeWebsiteBranding: vi.fn(() =>
    Promise.resolve({
      logoUrl: "https://example.com/logo.png",
      faviconUrl: "https://example.com/favicon.ico",
      colors: ["#627653", "#111111", "#b8a472"],
      images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
      fonts: ["Montserrat", "Inter"],
      title: "Test Company",
      description: "A test company website",
    })
  ),
}));

describe("Signing/Branding Auto-Scrape", () => {
  let db: any;
  let testCompanyId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("DB unavailable");

    // Create a test company
    const [company] = await db.insert(companies).values({
      name: `Test-Co-${nanoid(6)}`,
      slug: `test-co-${nanoid(6)}`,
      displayName: "Test Company",
      industry: "Technology",
      website: "https://example.com",
      email: "test@example.com",
    }).returning();
    testCompanyId = company.id;
  });

  it("should create branding record from scraped data", async () => {
    // Create branding record
    const [branding] = await db.insert(companyBranding).values({
      companyId: testCompanyId,
      logoUrl: "https://example.com/logo.png",
      primaryColor: "#627653",
      secondaryColor: "#111111",
      accentColor: "#b8a472",
      fontFamily: "Montserrat",
    }).returning();

    const [retrieved] = await db.select().from(companyBranding)
      .where(eq(companyBranding.id, branding.id)).limit(1);

    expect(retrieved).not.toBeNull();
    expect(retrieved.primaryColor).toBe("#627653");
  });

  it("should create scraped data record", async () => {
    const [scraped] = await db.insert(companyBrandingScraped).values({
      companyId: testCompanyId,
      websiteUrl: "https://example.com",
      status: "completed",
      scrapedLogoUrl: "https://example.com/logo.png",
      scrapedFaviconUrl: "https://example.com/favicon.ico",
      scrapedColors: ["#627653", "#111111", "#b8a472"],
      scrapedImages: ["https://example.com/image1.jpg"],
      scrapedFonts: ["Montserrat"],
      scrapedTitle: "Test Company",
      scrapedDescription: "A test company",
      lastScrapedAt: new Date(),
    }).returning();

    const [retrieved] = await db.select().from(companyBrandingScraped)
      .where(eq(companyBrandingScraped.id, scraped.id)).limit(1);

    expect(retrieved).not.toBeNull();
    expect(retrieved.status).toBe("completed");
    expect(retrieved.scrapedColors).toHaveLength(3);
  });

  it("should track scrape status transition", async () => {
    const [scraped] = await db.insert(companyBrandingScraped).values({
      companyId: testCompanyId,
      websiteUrl: "https://example.com",
      status: "scraping",
    }).returning();

    // Update to completed
    await db.update(companyBrandingScraped).set({
      status: "completed",
      scrapedLogoUrl: "https://example.com/logo.png",
      scrapedColors: ["#627653"],
      lastScrapedAt: new Date(),
    }).where(eq(companyBrandingScraped.id, scraped.id));

    const [retrieved] = await db.select().from(companyBrandingScraped)
      .where(eq(companyBrandingScraped.id, scraped.id)).limit(1);

    expect(retrieved.status).toBe("completed");
    expect(retrieved.lastScrapedAt).not.toBeNull();
  });

  it("should store multiple scrape attempts", async () => {
    // Create first scrape
    await db.insert(companyBrandingScraped).values({
      companyId: testCompanyId,
      websiteUrl: "https://example.com",
      status: "completed",
      scrapedColors: ["#627653", "#111111"],
      lastScrapedAt: new Date(Date.now() - 86400000), // 1 day ago
    });

    // Create second scrape
    await db.insert(companyBrandingScraped).values({
      companyId: testCompanyId,
      websiteUrl: "https://example.com",
      status: "completed",
      scrapedColors: ["#627653", "#111111", "#b8a472"],
      lastScrapedAt: new Date(),
    });

    const scrapes = await db.select().from(companyBrandingScraped)
      .where(eq(companyBrandingScraped.companyId, testCompanyId));

    expect(scrapes.length).toBeGreaterThanOrEqual(2);
  });

  it("should get live preview data", async () => {
    // Ensure branding and scraped data exist
    const existing = await db.select().from(companyBranding)
      .where(eq(companyBranding.companyId, testCompanyId)).limit(1);

    if (existing.length === 0) {
      await db.insert(companyBranding).values({
        companyId: testCompanyId,
        logoUrl: "https://example.com/logo.png",
        primaryColor: "#627653",
        secondaryColor: "#111111",
        accentColor: "#b8a472",
        fontFamily: "Montserrat",
      });
    }

    // Get company data
    const [company] = await db.select().from(companies)
      .where(eq(companies.id, testCompanyId)).limit(1);

    expect(company).not.toBeNull();
    expect(company.name).toBeTruthy();
  });

  it("should handle failed scrape status", async () => {
    const [scraped] = await db.insert(companyBrandingScraped).values({
      companyId: testCompanyId,
      websiteUrl: "https://example.com",
      status: "scraping",
    }).returning();

    // Mark as failed
    await db.update(companyBrandingScraped).set({
      status: "failed",
    }).where(eq(companyBrandingScraped.id, scraped.id));

    const [retrieved] = await db.select().from(companyBrandingScraped)
      .where(eq(companyBrandingScraped.id, scraped.id)).limit(1);

    expect(retrieved.status).toBe("failed");
  });

  afterAll(async () => {
    // Cleanup
    if (db && testCompanyId) {
      await db.delete(companyBranding).where(eq(companyBranding.companyId, testCompanyId));
      await db.delete(companyBrandingScraped).where(eq(companyBrandingScraped.companyId, testCompanyId));
      await db.delete(companies).where(eq(companies.id, testCompanyId));
    }
  });
});
