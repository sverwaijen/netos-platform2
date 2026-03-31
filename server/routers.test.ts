import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAuthContext(): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@mrgreen.nl",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("locations.list", () => {
  it("returns an array of locations", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const locations = await caller.locations.list();
    expect(Array.isArray(locations)).toBe(true);
    expect(locations.length).toBeGreaterThanOrEqual(7);
    expect(locations[0]).toHaveProperty("name");
    expect(locations[0]).toHaveProperty("slug");
    expect(locations[0]).toHaveProperty("city");
  });
});

describe("bundles.list", () => {
  it("returns credit bundles", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const bundles = await caller.bundles.list();
    expect(Array.isArray(bundles)).toBe(true);
    expect(bundles.length).toBeGreaterThanOrEqual(6);
    expect(bundles[0]).toHaveProperty("name");
    expect(bundles[0]).toHaveProperty("creditsPerMonth");
    expect(bundles[0]).toHaveProperty("priceEur");
  });
});

describe("resources.byLocation", () => {
  it("returns resources for a location", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const locations = await caller.locations.list();
    if (locations.length > 0) {
      const resources = await caller.resources.byLocation({ locationId: locations[0].id });
      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBeGreaterThan(0);
      expect(resources[0]).toHaveProperty("type");
      expect(resources[0]).toHaveProperty("zone");
      expect(resources[0]).toHaveProperty("creditCostPerHour");
    }
  });
});

describe("multipliers.byLocation", () => {
  it("returns day multipliers for a location", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const locations = await caller.locations.list();
    if (locations.length > 0) {
      const multipliers = await caller.multipliers.byLocation({ locationId: locations[0].id });
      expect(Array.isArray(multipliers)).toBe(true);
      expect(multipliers.length).toBe(7);
    }
  });
});

describe("dashboard.stats", () => {
  it("returns dashboard statistics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.stats();
    expect(stats).toHaveProperty("totalUsers");
    expect(stats).toHaveProperty("totalCompanies");
    expect(stats).toHaveProperty("totalResources");
    expect(stats).toHaveProperty("totalDevices");
  });
});

describe("companies.list", () => {
  it("returns companies for authenticated users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const companies = await caller.companies.list();
    expect(Array.isArray(companies)).toBe(true);
    expect(companies.length).toBeGreaterThanOrEqual(5);
    expect(companies[0]).toHaveProperty("name");
    expect(companies[0]).toHaveProperty("tier");
  });
});

describe("devices.stats", () => {
  it("returns device statistics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.devices.stats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("online");
    expect(stats).toHaveProperty("offline");
  });
});
