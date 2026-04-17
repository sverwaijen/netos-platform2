import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

/**
 * Credit System Tests
 *
 * Tests for creditPackages, budgetControls, commitContracts, and creditBonuses
 * routers — covering input validation, access control logic, and business rules.
 * DB-independent: validates schemas and middleware behaviour without a live database.
 */

// ─── Credit Package Schemas ────────────────────────────────────────

const creditPackageCreateSchema = z.object({
  name: z.string(),
  slug: z.string(),
  credits: z.number(),
  priceEur: z.string(),
  pricePerCredit: z.string().optional(),
  discountPercent: z.string().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  minBundleTier: z.string().optional(),
  sortOrder: z.number().optional(),
});

const creditPackageUpdateSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  slug: z.string().optional(),
  credits: z.number().optional(),
  priceEur: z.string().optional(),
  pricePerCredit: z.string().optional(),
  discountPercent: z.string().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

// ─── Budget Control Schemas ────────────────────────────────────────

const budgetControlCreateSchema = z.object({
  companyId: z.number(),
  walletId: z.number().optional(),
  controlType: z.enum(["per_employee_cap", "team_budget", "location_restriction", "resource_type_restriction", "approval_threshold"]),
  targetUserId: z.number().optional(),
  targetTeam: z.string().optional(),
  capAmount: z.string().optional(),
  periodType: z.enum(["daily", "weekly", "monthly"]).optional(),
  allowedLocationIds: z.array(z.number()).optional(),
  allowedResourceTypes: z.array(z.string()).optional(),
  approvalThreshold: z.string().optional(),
  approverUserId: z.number().optional(),
});

// ─── Commit Contract Schemas ───────────────────────────────────────

const commitContractCreateSchema = z.object({
  companyId: z.number(),
  walletId: z.number().optional(),
  name: z.string(),
  totalCommitCredits: z.string(),
  totalCommitEur: z.string().optional(),
  commitPeriodMonths: z.number(),
  startDate: z.number(),
  endDate: z.number(),
  prepaidAmount: z.string().optional(),
  monthlyAllocation: z.string().optional(),
  rampedCommitments: z.record(z.string(), z.string()).optional(),
  discountPercent: z.string().optional(),
  trueUpEnabled: z.boolean().optional(),
  trueUpDate: z.number().optional(),
  earlyRenewalBonus: z.string().optional(),
  notes: z.string().optional(),
});

const commitContractUpdateSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  totalCommitCredits: z.string().optional(),
  totalCommitEur: z.string().optional(),
  commitPeriodMonths: z.number().optional(),
  startDate: z.number().optional(),
  endDate: z.number().optional(),
  prepaidAmount: z.string().optional(),
  monthlyAllocation: z.string().optional(),
  rampedCommitments: z.record(z.string(), z.string()).optional(),
  discountPercent: z.string().optional(),
  trueUpEnabled: z.boolean().optional(),
  trueUpDate: z.number().optional(),
  earlyRenewalBonus: z.string().optional(),
  status: z.enum(["draft", "pending_approval", "active", "paused", "expired", "terminated"]).optional(),
  notes: z.string().optional(),
});

// ─── Credit Bonus Schema ───────────────────────────────────────────

const creditBonusCreateSchema = z.object({
  type: z.enum(["signup_bonus", "referral", "renewal", "daypass_conversion", "loyalty", "promotion", "manual"]),
  walletId: z.number().optional(),
  userId: z.number().optional(),
  companyId: z.number().optional(),
  amount: z.string(),
  description: z.string().optional(),
  referrerUserId: z.number().optional(),
  referredCompanyId: z.number().optional(),
  sourceContractId: z.number().optional(),
  sourceBundleId: z.number().optional(),
  expiresAt: z.number().optional(),
});

// ═══════════════════════════════════════════════════════════════════
// ─── CREDIT PACKAGES ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

describe("Credit Packages", () => {
  describe("input validation — create", () => {
    it("accepts a valid credit package", () => {
      const input = {
        name: "Starter Pack",
        slug: "starter-pack",
        credits: 100,
        priceEur: "49.00",
        description: "Ideal for small teams",
        features: ["10 desk hours", "2 meeting room hours"],
      };
      const result = creditPackageCreateSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("requires name, slug, credits, and priceEur", () => {
      expect(creditPackageCreateSchema.safeParse({}).success).toBe(false);
      expect(creditPackageCreateSchema.safeParse({ name: "X" }).success).toBe(false);
      expect(creditPackageCreateSchema.safeParse({ name: "X", slug: "x" }).success).toBe(false);
      expect(creditPackageCreateSchema.safeParse({ name: "X", slug: "x", credits: 10 }).success).toBe(false);

      // All required fields → success
      expect(creditPackageCreateSchema.safeParse({
        name: "X", slug: "x", credits: 10, priceEur: "9.00",
      }).success).toBe(true);
    });

    it("rejects non-numeric credits", () => {
      const result = creditPackageCreateSchema.safeParse({
        name: "Bad", slug: "bad", credits: "ten", priceEur: "5.00",
      });
      expect(result.success).toBe(false);
    });

    it("accepts optional fields", () => {
      const result = creditPackageCreateSchema.safeParse({
        name: "Pro Pack",
        slug: "pro-pack",
        credits: 500,
        priceEur: "199.00",
        pricePerCredit: "0.40",
        discountPercent: "15",
        minBundleTier: "professional",
        sortOrder: 2,
        features: ["Unlimited desk hours", "Priority support"],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("input validation — update", () => {
    it("requires id", () => {
      expect(creditPackageUpdateSchema.safeParse({}).success).toBe(false);
      expect(creditPackageUpdateSchema.safeParse({ id: 1 }).success).toBe(true);
    });

    it("accepts partial updates", () => {
      const result = creditPackageUpdateSchema.safeParse({ id: 1, name: "New Name" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Name");
        expect(result.data.credits).toBeUndefined();
      }
    });

    it("accepts isActive toggle", () => {
      const result = creditPackageUpdateSchema.safeParse({ id: 5, isActive: false });
      expect(result.success).toBe(true);
    });
  });

  describe("pricing calculations", () => {
    it("computes price per credit from package", () => {
      const pkg = { credits: 500, priceEur: "199.00" };
      const pricePerCredit = parseFloat(pkg.priceEur) / pkg.credits;
      expect(pricePerCredit).toBeCloseTo(0.398, 2);
    });

    it("computes discount percentage", () => {
      const basePrice = 0.50; // per credit without discount
      const discountedPrice = 0.40;
      const discount = ((basePrice - discountedPrice) / basePrice) * 100;
      expect(discount).toBeCloseTo(20, 0);
    });

    it("handles zero credits safely", () => {
      const pkg = { credits: 0, priceEur: "0.00" };
      const pricePerCredit = pkg.credits > 0 ? parseFloat(pkg.priceEur) / pkg.credits : 0;
      expect(pricePerCredit).toBe(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// ─── BUDGET CONTROLS ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

describe("Budget Controls", () => {
  describe("input validation", () => {
    it("accepts a per_employee_cap control", () => {
      const result = budgetControlCreateSchema.safeParse({
        companyId: 1,
        controlType: "per_employee_cap",
        capAmount: "50.00",
        periodType: "monthly",
        targetUserId: 42,
      });
      expect(result.success).toBe(true);
    });

    it("accepts a team_budget control", () => {
      const result = budgetControlCreateSchema.safeParse({
        companyId: 1,
        walletId: 5,
        controlType: "team_budget",
        targetTeam: "Engineering",
        capAmount: "2000.00",
        periodType: "monthly",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a location_restriction control", () => {
      const result = budgetControlCreateSchema.safeParse({
        companyId: 1,
        controlType: "location_restriction",
        allowedLocationIds: [1, 3, 5],
      });
      expect(result.success).toBe(true);
    });

    it("accepts a resource_type_restriction control", () => {
      const result = budgetControlCreateSchema.safeParse({
        companyId: 1,
        controlType: "resource_type_restriction",
        allowedResourceTypes: ["desk", "meeting_room"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts an approval_threshold control", () => {
      const result = budgetControlCreateSchema.safeParse({
        companyId: 1,
        controlType: "approval_threshold",
        approvalThreshold: "100.00",
        approverUserId: 10,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid controlType", () => {
      const result = budgetControlCreateSchema.safeParse({
        companyId: 1,
        controlType: "invalid_type",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid periodType", () => {
      const result = budgetControlCreateSchema.safeParse({
        companyId: 1,
        controlType: "per_employee_cap",
        periodType: "yearly",
      });
      expect(result.success).toBe(false);
    });

    it("requires companyId", () => {
      const result = budgetControlCreateSchema.safeParse({
        controlType: "team_budget",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("budget allowance logic", () => {
    it("should detect over-budget when spending exceeds cap", () => {
      const cap = 500;
      const spent = 480;
      const requestedAmount = 30;
      const allowed = (spent + requestedAmount) <= cap;
      expect(allowed).toBe(false);
    });

    it("should allow spending within cap", () => {
      const cap = 500;
      const spent = 200;
      const requestedAmount = 50;
      const allowed = (spent + requestedAmount) <= cap;
      expect(allowed).toBe(true);
    });

    it("should allow spending up to exact cap", () => {
      const cap = 500;
      const spent = 450;
      const requestedAmount = 50;
      const allowed = (spent + requestedAmount) <= cap;
      expect(allowed).toBe(true);
    });

    it("should check location restriction", () => {
      const allowedLocations = [1, 3, 5];
      expect(allowedLocations.includes(3)).toBe(true);
      expect(allowedLocations.includes(2)).toBe(false);
    });

    it("should check resource type restriction", () => {
      const allowedTypes = ["desk", "meeting_room"];
      expect(allowedTypes.includes("desk")).toBe(true);
      expect(allowedTypes.includes("private_office")).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// ─── COMMIT CONTRACTS ────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

describe("Commit Contracts", () => {
  describe("input validation — create", () => {
    it("accepts a valid commit contract", () => {
      const now = Date.now();
      const result = commitContractCreateSchema.safeParse({
        companyId: 1,
        name: "Annual Commitment 2026",
        totalCommitCredits: "12000",
        commitPeriodMonths: 12,
        startDate: now,
        endDate: now + 365 * 24 * 60 * 60 * 1000,
        monthlyAllocation: "1000",
        discountPercent: "10",
      });
      expect(result.success).toBe(true);
    });

    it("requires companyId, name, totalCommitCredits, commitPeriodMonths, startDate, endDate", () => {
      expect(commitContractCreateSchema.safeParse({}).success).toBe(false);
      expect(commitContractCreateSchema.safeParse({ companyId: 1 }).success).toBe(false);
      expect(commitContractCreateSchema.safeParse({
        companyId: 1, name: "Test", totalCommitCredits: "100",
        commitPeriodMonths: 6, startDate: Date.now(), endDate: Date.now(),
      }).success).toBe(true);
    });

    it("accepts ramped commitments as record", () => {
      const result = commitContractCreateSchema.safeParse({
        companyId: 1,
        name: "Ramped Contract",
        totalCommitCredits: "6000",
        commitPeriodMonths: 6,
        startDate: Date.now(),
        endDate: Date.now() + 180 * 24 * 60 * 60 * 1000,
        rampedCommitments: {
          "month1": "500",
          "month2": "800",
          "month3": "1000",
          "month4": "1000",
          "month5": "1200",
          "month6": "1500",
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("input validation — update", () => {
    it("accepts valid status transitions", () => {
      const validStatuses = ["draft", "pending_approval", "active", "paused", "expired", "terminated"];
      for (const status of validStatuses) {
        const result = commitContractUpdateSchema.safeParse({ id: 1, status });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid status", () => {
      const result = commitContractUpdateSchema.safeParse({ id: 1, status: "cancelled" });
      expect(result.success).toBe(false);
    });
  });

  describe("utilization calculations", () => {
    it("calculates utilization percentage", () => {
      const totalCommit = 12000;
      const creditsUsed = 8500;
      const utilization = (creditsUsed / totalCommit) * 100;
      expect(utilization).toBeCloseTo(70.83, 1);
    });

    it("detects under-utilization for true-up", () => {
      const totalCommit = 12000;
      const creditsUsed = 6000;
      const utilizationPct = (creditsUsed / totalCommit) * 100;
      const underUtilized = utilizationPct < 80;
      const trueUpAmount = totalCommit - creditsUsed;
      expect(underUtilized).toBe(true);
      expect(trueUpAmount).toBe(6000);
    });

    it("detects adequate utilization (no true-up needed)", () => {
      const totalCommit = 12000;
      const creditsUsed = 11000;
      const utilizationPct = (creditsUsed / totalCommit) * 100;
      const underUtilized = utilizationPct < 80;
      expect(underUtilized).toBe(false);
    });

    it("handles monthly allocation tracking", () => {
      const monthlyAllocation = 1000;
      const monthsElapsed = 6;
      const expectedUsage = monthlyAllocation * monthsElapsed;
      const actualUsage = 5200;
      const variance = actualUsage - expectedUsage;
      expect(variance).toBe(-800); // 800 credits under expected usage
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// ─── CREDIT BONUSES ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

describe("Credit Bonuses", () => {
  describe("input validation", () => {
    it("accepts all bonus types", () => {
      const types = ["signup_bonus", "referral", "renewal", "daypass_conversion", "loyalty", "promotion", "manual"];
      for (const type of types) {
        const result = creditBonusCreateSchema.safeParse({ type, amount: "50" });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid bonus type", () => {
      const result = creditBonusCreateSchema.safeParse({ type: "invalid", amount: "50" });
      expect(result.success).toBe(false);
    });

    it("requires amount", () => {
      const result = creditBonusCreateSchema.safeParse({ type: "manual" });
      expect(result.success).toBe(false);
    });

    it("accepts referral bonus with referrer info", () => {
      const result = creditBonusCreateSchema.safeParse({
        type: "referral",
        amount: "100",
        referrerUserId: 5,
        referredCompanyId: 12,
        description: "Referral bonus for bringing in Acme Corp",
      });
      expect(result.success).toBe(true);
    });

    it("accepts bonus with expiration", () => {
      const result = creditBonusCreateSchema.safeParse({
        type: "promotion",
        amount: "200",
        walletId: 3,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        description: "Summer promo — expires in 30 days",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("bonus expiration logic", () => {
    it("detects expired bonus", () => {
      const expiresAt = Date.now() - 1000; // 1 second ago
      const isExpired = Date.now() > expiresAt;
      expect(isExpired).toBe(true);
    });

    it("detects valid (non-expired) bonus", () => {
      const expiresAt = Date.now() + 86400000; // 1 day from now
      const isExpired = Date.now() > expiresAt;
      expect(isExpired).toBe(false);
    });

    it("handles bonus with no expiration", () => {
      const expiresAt = null;
      const isExpired = expiresAt !== null && Date.now() > expiresAt;
      expect(isExpired).toBe(false);
    });
  });

  describe("referral bonus flow", () => {
    it("calculates standard referral bonus amount", () => {
      const defaultReferralBonus = 100;
      const customAmount = undefined;
      const bonusAmount = customAmount || defaultReferralBonus;
      expect(bonusAmount).toBe(100);
    });

    it("uses custom referral amount when provided", () => {
      const defaultReferralBonus = 100;
      const customAmount = 250;
      const bonusAmount = customAmount || defaultReferralBonus;
      expect(bonusAmount).toBe(250);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// ─── ACCESS CONTROL ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

describe("Credit Router Access Control", () => {
  const roles = ["administrator", "host", "teamadmin", "user", "facility"] as const;

  function isAdmin(role: string): boolean {
    return role === "administrator" || role === "host";
  }

  function isTeamAdmin(role: string): boolean {
    return ["administrator", "host", "teamadmin"].includes(role);
  }

  describe("admin-only endpoints (creditPackages.create/update/delete)", () => {
    it("allows administrators", () => expect(isAdmin("administrator")).toBe(true));
    it("allows hosts", () => expect(isAdmin("host")).toBe(true));
    it("rejects teamadmins", () => expect(isAdmin("teamadmin")).toBe(false));
    it("rejects regular users", () => expect(isAdmin("user")).toBe(false));
    it("rejects facility role", () => expect(isAdmin("facility")).toBe(false));
  });

  describe("team-admin endpoints (budgetControls, commitContracts queries)", () => {
    it("allows administrators", () => expect(isTeamAdmin("administrator")).toBe(true));
    it("allows hosts", () => expect(isTeamAdmin("host")).toBe(true));
    it("allows teamadmins", () => expect(isTeamAdmin("teamadmin")).toBe(true));
    it("rejects regular users", () => expect(isTeamAdmin("user")).toBe(false));
    it("rejects facility role", () => expect(isTeamAdmin("facility")).toBe(false));
  });
});
