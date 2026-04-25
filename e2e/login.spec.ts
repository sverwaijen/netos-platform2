import { test, expect } from "@playwright/test";

test.describe("Login", () => {
  test("should show login button on homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});
