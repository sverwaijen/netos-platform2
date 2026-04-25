import { test, expect } from "@playwright/test";

test.describe("Wallet", () => {
  test("should show wallet page", async ({ page }) => {
    await page.goto("/wallet");
    await expect(page.locator("body")).toBeVisible();
  });
});
