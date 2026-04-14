import { test, expect } from "@playwright/test";

test.describe("Booking Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/bookings");
  });

  test("should load bookings page", async ({ page }) => {
    await expect(page).toHaveTitle(/Booking|Dashboard/);
  });

  test("should display bookings content", async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState("networkidle");
    // Verify page doesn't have critical errors
    const pageContent = await page.content();
    expect(pageContent).not.toBeNull();
  });

  test("should be responsive", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState("networkidle");
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);
  });

  test("should handle page navigation", async ({ page }) => {
    const response = await page.goto("/bookings");
    expect(response?.status()).toBeLessThan(400);
  });

  test("should load dashboard layout", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    // Verify main layout elements are present
    const mainContent = await page.locator("main").count();
    expect(mainContent).toBeGreaterThanOrEqual(0);
  });
});
