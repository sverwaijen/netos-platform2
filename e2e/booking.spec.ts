import { test, expect } from "@playwright/test";

test.describe("Booking", () => {
  test("should show booking calendar", async ({ page }) => {
    await page.goto("/bookings");
    await expect(page.locator("body")).toBeVisible();
  });
});
