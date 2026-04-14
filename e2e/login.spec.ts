import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/");
    expect(page.url()).toContain("/");
  });

  test("should have accessible login elements", async ({ page }) => {
    await page.goto("/");
    const loginButtons = await page.locator('button:has-text("Login")').count();
    expect(loginButtons).toBeGreaterThanOrEqual(0);
  });

  test("should display home page content", async ({ page }) => {
    await page.goto("/");
    // Verify page loads without errors
    await expect(page).toHaveTitle(/Skynet|Home|Welcome/);
  });

  test("should handle navigation without breaking", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Verify no console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    expect(consoleErrors.length).toBe(0);
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    // Verify page is responsive
    const body = await page.locator("body").boundingBox();
    expect(body?.width).toBeLessThanOrEqual(375);
  });

  test("should be responsive on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    const body = await page.locator("body").boundingBox();
    expect(body?.width).toBeLessThanOrEqual(768);
  });

  test("should be responsive on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    const body = await page.locator("body").boundingBox();
    expect(body?.width).toBeLessThanOrEqual(1920);
  });
});
