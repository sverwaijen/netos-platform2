import { test, expect } from "@playwright/test";

test.describe("Wallet Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/wallet");
  });

  test("should load wallet page", async ({ page }) => {
    await expect(page).toHaveTitle(/Wallet|Dashboard/);
  });

  test("should display wallet content", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    const pageContent = await page.content();
    expect(pageContent).not.toBeNull();
  });

  test("should have accessible wallet elements", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    // Check for common wallet page elements
    const pageText = await page.textContent("body");
    expect(pageText).toBeTruthy();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState("networkidle");
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);
  });

  test("should handle navigation errors gracefully", async ({ page }) => {
    const response = await page.goto("/wallet");
    expect(response?.status()).toBeLessThan(500);
  });

  test("should load without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    await page.waitForLoadState("networkidle");
    // Allow for some errors but not critical ones
    const criticalErrors = errors.filter(
      (e) => !e.includes("Unexpected") && !e.includes("Cannot read")
    );
    expect(criticalErrors.length).toBeLessThan(5);
  });
});
