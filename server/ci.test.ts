import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("CI Configuration", () => {
  it("should have CI workflow file", () => {
    const workflowPath = join(process.cwd(), ".github/workflows/ci.yml");
    expect(() => {
      readFileSync(workflowPath, "utf-8");
    }).not.toThrow();
  });

  it("should have valid CI workflow content", () => {
    const workflowPath = join(process.cwd(), ".github/workflows/ci.yml");
    const content = readFileSync(workflowPath, "utf-8");
    expect(content).toContain("name: CI");
    expect(content).toContain("pnpm install");
    expect(content).toContain("pnpm run check");
    expect(content).toContain("pnpm vitest run");
    expect(content).toContain("pnpm run build");
  });

  it("should have E2E test directory", () => {
    const e2ePath = join(process.cwd(), "e2e");
    const readdirSync = require("fs").readdirSync;
    expect(() => {
      readdirSync(e2ePath);
    }).not.toThrow();
  });

  it("should have Playwright config", () => {
    const playwrightPath = join(process.cwd(), "e2e/playwright.config.ts");
    expect(() => {
      readFileSync(playwrightPath, "utf-8");
    }).not.toThrow();
  });

  it("should have E2E test specs", () => {
    const testFiles = [
      "e2e/login.spec.ts",
      "e2e/booking.spec.ts",
      "e2e/wallet.spec.ts",
    ];

    testFiles.forEach((testFile) => {
      const path = join(process.cwd(), testFile);
      expect(() => {
        readFileSync(path, "utf-8");
      }).not.toThrow();
    });
  });

  it("should have package.json test:e2e script", () => {
    const packagePath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
    expect(packageJson.scripts).toHaveProperty("test:e2e");
    expect(packageJson.scripts.test:e2e).toBe("playwright test");
  });

  it("should have Playwright dependency", () => {
    const packagePath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
    expect(packageJson.devDependencies).toHaveProperty("@playwright/test");
  });
});
