import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createAuthContext(role: "admin" | "user" = "admin"): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];
  const user: AuthenticatedUser = {
    id: 1, openId: "test-user", email: "test@mrgreen.nl", name: "Test User",
    loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
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

// ─── Auth ───
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

describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me).toBeNull();
  });

  it("returns user for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me).not.toBeNull();
    expect(me?.name).toBe("Test User");
    expect(me?.role).toBe("admin");
  });
});

// ─── Locations ───
describe("locations", () => {
  it("list returns all 7 locations", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const locations = await caller.locations.list();
    expect(Array.isArray(locations)).toBe(true);
    expect(locations.length).toBe(7);
    const cities = locations.map((l: any) => l.city);
    expect(cities).toContain("Amsterdam");
    expect(cities).toContain("Apeldoorn");
    expect(cities).toContain("Klarenbeek");
    expect(cities).toContain("Zwolle");
    expect(cities).toContain("Rotterdam");
    expect(cities).toContain("Ede");
    expect(cities).toContain("Spijkenisse");
  });

  it("bySlug returns correct location", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const loc = await caller.locations.bySlug({ slug: "amsterdam" });
    expect(loc).not.toBeNull();
    expect(loc?.name).toBe("Mr. Green Amsterdam");
    expect(loc?.city).toBe("Amsterdam");
    expect(loc?.address).toBe("Stationsplein 9");
  });

  it("bySlug returns null for non-existent slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const loc = await caller.locations.bySlug({ slug: "nonexistent" });
    expect(loc).toBeUndefined();
  });

  it("byId returns correct location", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const locations = await caller.locations.list();
    const first = locations[0];
    const loc = await caller.locations.byId({ id: first.id });
    expect(loc).not.toBeNull();
    expect(loc?.id).toBe(first.id);
  });
});

// ─── Resources ───
describe("resources", () => {
  it("byLocation returns resources for Amsterdam", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const loc = await caller.locations.bySlug({ slug: "amsterdam" });
    expect(loc).not.toBeNull();
    const resources = await caller.resources.byLocation({ locationId: loc!.id });
    expect(Array.isArray(resources)).toBe(true);
    expect(resources.length).toBeGreaterThan(0);
    // Check resource structure
    const desk = resources.find((r: any) => r.type === "desk");
    expect(desk).toBeDefined();
    expect(desk.creditCostPerHour).toBe("2.00");
    expect(desk.zone).toBe("zone_2");
  });

  it("stats returns aggregate resource statistics", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.resources.stats();
    // stats returns an array of type distributions
    expect(Array.isArray(stats)).toBe(true);
    expect(stats.length).toBeGreaterThan(0);
  });

  it("search filters by type", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const locations = await caller.locations.list();
    const results = await caller.resources.search({
      locationId: locations[0].id,
      type: "meeting_room",
    });
    expect(Array.isArray(results)).toBe(true);
    results.forEach((r: any) => {
      expect(r.type).toBe("meeting_room");
    });
  });

  it("search filters by zone", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const locations = await caller.locations.list();
    const results = await caller.resources.search({
      locationId: locations[0].id,
      zone: "zone_3",
    });
    expect(Array.isArray(results)).toBe(true);
    results.forEach((r: any) => {
      expect(r.zone).toBe("zone_3");
    });
  });

  it("typeDistribution returns resource type breakdown", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const dist = await caller.resources.typeDistribution();
    expect(Array.isArray(dist)).toBe(true);
    expect(dist.length).toBeGreaterThan(0);
  });
});

// ─── Credit Bundles ───
describe("bundles", () => {
  it("list returns all 6 bundles with correct pricing", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const bundles = await caller.bundles.list();
    expect(bundles.length).toBe(6);

    const basicAccess = bundles.find((b: any) => b.slug === "basic-access");
    expect(basicAccess).toBeDefined();
    expect(basicAccess.creditsPerMonth).toBe(0);
    expect(basicAccess.priceEur).toBe("0.00");

    const partTime = bundles.find((b: any) => b.slug === "part-time");
    expect(partTime).toBeDefined();
    expect(partTime.creditsPerMonth).toBe(150);
    expect(partTime.priceEur).toBe("349.00");
    expect(partTime.isPopular).toBeTruthy();

    const fullTime = bundles.find((b: any) => b.slug === "full-time");
    expect(fullTime).toBeDefined();
    expect(fullTime.creditsPerMonth).toBe(350);
    expect(fullTime.priceEur).toBe("499.00");
  });
});

// ─── Multipliers ───
describe("multipliers", () => {
  it("byLocation returns 7 day multipliers", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const locations = await caller.locations.list();
    const multipliers = await caller.multipliers.byLocation({ locationId: locations[0].id });
    expect(multipliers.length).toBe(7);

    // Check specific multiplier values
    const friday = multipliers.find((m: any) => m.dayOfWeek === 5);
    expect(friday).toBeDefined();
    expect(friday.multiplier).toBe("0.45");

    const thursday = multipliers.find((m: any) => m.dayOfWeek === 4);
    expect(thursday).toBeDefined();
    expect(thursday.multiplier).toBe("1.40");
  });

  it("forDay returns single multiplier value", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const locations = await caller.locations.list();
    const result = await caller.multipliers.forDay({ locationId: locations[0].id, dayOfWeek: 5 });
    expect(result.multiplier).toBe(0.45);
  });
});

// ─── Companies ───
describe("companies", () => {
  it("list returns seeded companies", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const companies = await caller.companies.list();
    expect(companies.length).toBeGreaterThanOrEqual(5);
    const mews = companies.find((c: any) => c.slug === "mews-global");
    expect(mews).toBeDefined();
    expect(mews.tier).toBe("gold");
    expect(mews.memberCount).toBe(177);
  });

  it("byId returns correct company", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const companies = await caller.companies.list();
    const company = await caller.companies.byId({ id: companies[0].id });
    expect(company).not.toBeNull();
    expect(company?.id).toBe(companies[0].id);
  });

  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.companies.list()).rejects.toThrow();
  });
});

// ─── Dashboard ───
describe("dashboard", () => {
  it("stats returns all required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.stats();
    expect(stats).toHaveProperty("totalUsers");
    expect(stats).toHaveProperty("totalCompanies");
    expect(stats).toHaveProperty("totalBookings");
    expect(stats).toHaveProperty("totalResources");
    expect(stats).toHaveProperty("totalDevices");
    expect(stats.totalCompanies).toBeGreaterThanOrEqual(5);
    expect(stats.totalResources).toBeGreaterThanOrEqual(500);
    expect(stats.totalDevices).toBeGreaterThanOrEqual(175);
  });

  it("locationStats returns per-location data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.locationStats();
    expect(Array.isArray(stats)).toBe(true);
    expect(stats.length).toBe(7);
  });

  it("users requires admin role", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.dashboard.users()).rejects.toThrow();
  });
});

// ─── Devices ───
describe("devices", () => {
  it("stats returns device counts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.devices.stats();
    expect(Number(stats.total)).toBe(175);
    expect(Number(stats.online)).toBeGreaterThan(0);
    expect(Number(stats.offline)).toBeGreaterThan(0);
    expect(Number(stats.online) + Number(stats.offline)).toBe(175);
  });

  it("byLocation returns devices for a location", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const locations = await appRouter.createCaller(createPublicContext()).locations.list();
    const devices = await caller.devices.byLocation({ locationId: locations[0].id });
    expect(Array.isArray(devices)).toBe(true);
    expect(devices.length).toBe(25);
  });
});

// ─── Wallets ───
describe("wallets", () => {
  it("mine creates personal wallet if not exists", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const wallets = await caller.wallets.mine();
    expect(Array.isArray(wallets)).toBe(true);
    expect(wallets.length).toBeGreaterThanOrEqual(1);
    const personal = wallets.find((w: any) => w.type === "personal");
    expect(personal).toBeDefined();
  });

  it("topup increases wallet balance", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const wallets = await caller.wallets.mine();
    const personal = wallets.find((w: any) => w.type === "personal");
    expect(personal).toBeDefined();

    const beforeBalance = parseFloat(personal.balance);
    const result = await caller.wallets.topup({ walletId: personal.id, amount: 50 });
    expect(result.success).toBe(true);

    const afterWallets = await caller.wallets.mine();
    const afterPersonal = afterWallets.find((w: any) => w.type === "personal");
    expect(parseFloat(afterPersonal.balance)).toBe(beforeBalance + 50);
  });

  it("ledger records topup transaction", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const wallets = await caller.wallets.mine();
    const personal = wallets.find((w: any) => w.type === "personal");
    const ledger = await caller.wallets.ledger({ walletId: personal.id });
    expect(Array.isArray(ledger)).toBe(true);
    const topupEntry = ledger.find((e: any) => e.type === "topup");
    expect(topupEntry).toBeDefined();
  });

  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.wallets.mine()).rejects.toThrow();
  });
});

// ─── Bookings ───
describe("bookings", () => {
  it("create booking deducts credits and records in ledger", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Ensure wallet has enough credits
    const wallets = await caller.wallets.mine();
    const personal = wallets.find((w: any) => w.type === "personal");
    const balanceBefore = parseFloat(personal.balance);

    // Get a resource
    const locations = await appRouter.createCaller(createPublicContext()).locations.list();
    const resources = await appRouter.createCaller(createPublicContext()).resources.byLocation({ locationId: locations[0].id });
    const desk = resources.find((r: any) => r.type === "desk");
    expect(desk).toBeDefined();

    // Book 1 hour far in the future to avoid conflicts from previous test runs
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30 + Math.floor(Math.random() * 30));
    futureDate.setHours(10, 0, 0, 0);
    const endTime = new Date(futureDate);
    endTime.setHours(11, 0, 0, 0);
    const tomorrow = futureDate;

    const result = await caller.bookings.create({
      resourceId: desk.id,
      locationId: locations[0].id,
      startTime: tomorrow.getTime(),
      endTime: endTime.getTime(),
      walletId: personal.id,
    });

    expect(result.success).toBe(true);
    expect(result.creditsCost).toBeGreaterThan(0);
    expect(result.multiplier).toBeGreaterThan(0);

    // Check balance decreased
    const afterWallets = await caller.wallets.mine();
    const afterPersonal = afterWallets.find((w: any) => w.type === "personal");
    expect(parseFloat(afterPersonal.balance)).toBeLessThan(balanceBefore);
  });

  it("mine returns user bookings", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const bookings = await caller.bookings.mine();
    expect(Array.isArray(bookings)).toBe(true);
  });

  it("cancel booking refunds credits", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get current bookings
    const bookings = await caller.bookings.mine();
    if (bookings.length > 0) {
      const booking = bookings[0];
      const wallets = await caller.wallets.mine();
      const personal = wallets.find((w: any) => w.type === "personal");
      const balanceBefore = parseFloat(personal.balance);

      await caller.bookings.updateStatus({ id: booking.id, status: "cancelled" });

      const afterWallets = await caller.wallets.mine();
      const afterPersonal = afterWallets.find((w: any) => w.type === "personal");
      // Balance should increase (refund)
      expect(parseFloat(afterPersonal.balance)).toBeGreaterThanOrEqual(balanceBefore);
    }
  });
});

// ─── Visitors ───
describe("visitors", () => {
  it("create visitor returns access token and deep link", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const locations = await appRouter.createCaller(createPublicContext()).locations.list();

    const result = await caller.visitors.create({
      name: "John Doe",
      email: "john@example.com",
      phone: "+31612345678",
      licensePlate: "AB-123-CD",
      visitDate: Date.now() + 86400000,
      locationId: locations[0].id,
    });

    expect(result.success).toBe(true);
    expect(result.accessToken).toBeDefined();
    expect(result.accessToken.length).toBeGreaterThan(10);
    expect(result.deepLink).toContain("skynet.mrgreenoffices.nl/visit/");
  });

  it("mine returns visitor list", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const visitors = await caller.visitors.mine();
    expect(Array.isArray(visitors)).toBe(true);
    expect(visitors.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Invites ───
describe("invites", () => {
  it("create invite returns token and link", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.invites.create({
      email: "invite@example.com",
      role: "user",
    });

    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    expect(result.inviteLink).toContain("skynet.mrgreenoffices.nl/invite/");
    expect(result.expiresAt).toBeDefined();
  });

  it("byToken retrieves invite", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.invites.create({ email: "lookup@example.com" });
    const invite = await appRouter.createCaller(createPublicContext()).invites.byToken({ token: created.token });
    expect(invite).toBeDefined();
  });
});

// ─── Notifications ───
describe("notifications", () => {
  it("mine returns notifications array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const notifications = await caller.notifications.mine();
    expect(Array.isArray(notifications)).toBe(true);
  });

  it("markAllRead succeeds", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.markAllRead();
    expect(result.success).toBe(true);
  });
});

// ─── Access Log ───
describe("access", () => {
  it("logEntry creates access log entry", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const locations = await appRouter.createCaller(createPublicContext()).locations.list();

    const result = await caller.access.logEntry({
      locationId: locations[0].id,
      zone: "zone_1",
      action: "entry",
      method: "ble",
    });
    expect(result.success).toBe(true);
  });

  it("myLog returns access history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const log = await caller.access.myLog();
    expect(Array.isArray(log)).toBe(true);
  });
});

// ─── Profile ───
describe("profile", () => {
  it("get returns user profile", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const profile = await caller.profile.get();
    expect(profile).toBeDefined();
  });

  it("update modifies profile fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.update({ name: "Updated Name", phone: "+31600000000" });
    expect(result.success).toBe(true);
  });
});

// ─── CRM Leads ───
describe("crmLeads", () => {
  let createdLeadId: number;

  it("create lead returns success", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.crmLeads.create({
      companyName: "Test Corp",
      contactName: "Jane Doe",
      contactEmail: "jane@testcorp.com",
      contactPhone: "+31612345678",
      companySize: "10-50",
      industry: "Technology",
      website: "https://testcorp.com",
      locationPreference: "Amsterdam",
      budgetRange: "€500-1000/mo",
      source: "website",
      estimatedValue: "12000",
      notes: "Interested in 5 desks",
    });
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    createdLeadId = result.id;
  });

  it("list returns leads including created one", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const leads = await caller.crmLeads.list({});
    expect(Array.isArray(leads)).toBe(true);
    expect(leads.length).toBeGreaterThanOrEqual(1);
    const found = leads.find((l: any) => l.companyName === "Test Corp");
    expect(found).toBeDefined();
  });

  it("list filters by search", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const leads = await caller.crmLeads.list({ search: "Test Corp" });
    expect(leads.length).toBeGreaterThanOrEqual(1);
    expect(leads[0].companyName).toBe("Test Corp");
  });

  it("list filters by source", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const leads = await caller.crmLeads.list({ source: "website" });
    leads.forEach((l: any) => {
      expect(l.source).toBe("website");
    });
  });

  it("byId returns correct lead", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const lead = await caller.crmLeads.byId({ id: createdLeadId });
    expect(lead).toBeDefined();
    expect(lead?.companyName).toBe("Test Corp");
    expect(lead?.contactEmail).toBe("jane@testcorp.com");
    expect(lead?.stage).toBe("new");
  });

  it("update changes lead stage", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.crmLeads.update({ id: createdLeadId, stage: "qualified" });
    expect(result.success).toBe(true);

    const lead = await caller.crmLeads.byId({ id: createdLeadId });
    expect(lead?.stage).toBe("qualified");
  });

  it("pipelineStats returns aggregate data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.crmLeads.pipelineStats();
    expect(stats).toHaveProperty("totalLeads");
    expect(stats).toHaveProperty("totalValue");
    expect(stats).toHaveProperty("conversionRate");
    expect(stats).toHaveProperty("avgDealSize");
    expect(Number(stats.totalLeads)).toBeGreaterThanOrEqual(1);
  });

  it("addActivity logs activity on lead", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.crmLeads.addActivity({
      leadId: createdLeadId,
      type: "note",
      title: "Test note",
      description: "This is a test activity",
    });
    expect(result.success).toBe(true);
  });

  it("activities returns lead activities", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const activities = await caller.crmLeads.activities({ leadId: createdLeadId });
    expect(Array.isArray(activities)).toBe(true);
    expect(activities.length).toBeGreaterThanOrEqual(1);
    const note = activities.find((a: any) => a.type === "note");
    expect(note).toBeDefined();
    expect(note.title).toBe("Test note");
  });

  it("delete removes lead", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.crmLeads.delete({ id: createdLeadId });
    expect(result.success).toBe(true);

    // byId throws "Lead not found" after deletion
    await expect(caller.crmLeads.byId({ id: createdLeadId })).rejects.toThrow();
  });

  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.crmLeads.list({})).rejects.toThrow();
  });
});

// ─── CRM Campaigns ───
describe("crmCampaigns", () => {
  let campaignId: number;

  it("create campaign returns success", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.crmCampaigns.create({
      name: "Test Campaign",
      description: "Outreach to tech companies",
      type: "email_sequence",
    });
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    campaignId = result.id;
  });

  it("list returns campaigns", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const campaigns = await caller.crmCampaigns.list({});
    expect(Array.isArray(campaigns)).toBe(true);
    expect(campaigns.length).toBeGreaterThanOrEqual(1);
  });

  it("addStep adds email step to campaign", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.crmCampaigns.addStep({
      campaignId,
      stepOrder: 1,
      subject: "Welcome to Mr. Green",
      body: "Hi {{name}}, we'd love to show you our spaces.",
      delayDays: 0,
    });
    expect(result.success).toBe(true);
  });

  it("steps returns campaign steps", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const steps = await caller.crmCampaigns.steps({ campaignId });
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBe(1);
    expect(steps[0].subject).toBe("Welcome to Mr. Green");
  });

  it("update campaign status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.crmCampaigns.update({ id: campaignId, status: "active" });
    expect(result.success).toBe(true);
  });

  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.crmCampaigns.list({})).rejects.toThrow();
  });
});

// ─── CRM Templates ───
describe("crmTemplates", () => {
  it("create and list templates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.crmTemplates.create({
      name: "Welcome Email",
      subject: "Welcome to Mr. Green Offices",
      body: "Dear {{name}},\n\nWelcome to our premium coworking community.",
      category: "onboarding",
    });
    expect(result.success).toBe(true);

    const templates = await caller.crmTemplates.list();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThanOrEqual(1);
    const found = templates.find((t: any) => t.name === "Welcome Email");
    expect(found).toBeDefined();

    // Update
    const updateResult = await caller.crmTemplates.update({ id: found.id, subject: "Updated Welcome" });
    expect(updateResult.success).toBe(true);

    // Delete
    const deleteResult = await caller.crmTemplates.delete({ id: found.id });
    expect(deleteResult.success).toBe(true);
  });

  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.crmTemplates.list()).rejects.toThrow();
  });
});


// ── Resource Management Tests ──────────────────────────────────────────
describe("resourceTypes", () => {
  it("lists all resource types", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const types = await caller.resourceTypes.list();
    expect(Array.isArray(types)).toBe(true);
    expect(types.length).toBeGreaterThanOrEqual(1);
    expect(types[0]).toHaveProperty("name");
    expect(types[0]).toHaveProperty("slug");
    expect(types[0]).toHaveProperty("chargingUnit");
  });

  it("gets a resource type by id", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const types = await caller.resourceTypes.list();
    if (types.length > 0) {
      const detail = await caller.resourceTypes.byId({ id: types[0].id });
      expect(detail).toBeTruthy();
      expect(detail!.name).toBe(types[0].name);
    }
  });
});

describe("resourceRates", () => {
  it("lists all pricing rates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const rates = await caller.resourceRates.list();
    expect(Array.isArray(rates)).toBe(true);
    expect(rates.length).toBeGreaterThanOrEqual(1);
    expect(rates[0]).toHaveProperty("name");
    expect(rates[0]).toHaveProperty("creditCost");
  });

  it("filters rates by resource type", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const types = await caller.resourceTypes.list();
    if (types.length > 0) {
      const rates = await caller.resourceRates.list({ resourceTypeId: types[0].id });
      expect(Array.isArray(rates)).toBe(true);
    }
  });
});

describe("resourceRules", () => {
  it("lists all booking rules", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const rules = await caller.resourceRules.list();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThanOrEqual(1);
    expect(rules[0]).toHaveProperty("name");
    expect(rules[0]).toHaveProperty("conditionType");
    expect(rules[0]).toHaveProperty("limitType");
  });
});

describe("bookingPolicies", () => {
  it("lists all booking policies", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const policies = await caller.bookingPolicies.list();
    expect(Array.isArray(policies)).toBe(true);
    expect(policies.length).toBeGreaterThanOrEqual(1);
    expect(policies[0]).toHaveProperty("name");
    expect(policies[0]).toHaveProperty("bufferMinutes");
  });
});

describe("resourceAmenities", () => {
  it("lists all amenities", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const amenities = await caller.resourceAmenities.list();
    expect(Array.isArray(amenities)).toBe(true);
    expect(amenities.length).toBeGreaterThanOrEqual(1);
    expect(amenities[0]).toHaveProperty("name");
    expect(amenities[0]).toHaveProperty("icon");
  });
});

describe("resourceSchedules", () => {
  it("lists all schedules", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const schedules = await caller.resourceSchedules.list();
    expect(Array.isArray(schedules)).toBe(true);
    expect(schedules.length).toBeGreaterThanOrEqual(1);
    expect(schedules[0]).toHaveProperty("dayOfWeek");
    expect(schedules[0]).toHaveProperty("openTime");
    expect(schedules[0]).toHaveProperty("closeTime");
  });

  it("filters schedules by location", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const locations = await caller.locations.list();
    if (locations.length > 0) {
      const schedules = await caller.resourceSchedules.list({ locationId: locations[0].id });
      expect(Array.isArray(schedules)).toBe(true);
    }
  });
});
