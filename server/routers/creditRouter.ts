import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "administrator" && ctx.user.role !== "host") {
    throw new Error("Forbidden: admin access required");
  }
  return next({ ctx });
});

const teamAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["administrator", "host", "teamadmin"].includes(ctx.user.role)) {
    throw new Error("Forbidden: team admin access required");
  }
  return next({ ctx });
});

// ─── Credit Packages Router ─────────────────────────────────────────
export const creditPackagesRouter = router({
  list: publicProcedure.query(async () => {
    return db.getCreditPackages();
  }),

  byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getCreditPackageById(input.id);
  }),

  bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    return db.getCreditPackageBySlug(input.slug);
  }),

  create: adminProcedure.input(z.object({
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
  })).mutation(async ({ input }) => {
    await db.createCreditPackage(input as any);
    return { success: true };
  }),

  update: adminProcedure.input(z.object({
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
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateCreditPackage(id, data as any);
    return { success: true };
  }),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteCreditPackage(input.id);
    return { success: true };
  }),

  purchase: protectedProcedure.input(z.object({
    packageId: z.number(),
    walletId: z.number(),
  })).mutation(async ({ input }) => {
    const result = await db.purchasePackage(input.walletId, input.packageId);
    return { success: true, ...result };
  }),
});

// ─── Budget Controls Router ─────────────────────────────────────────
export const budgetControlsRouter = router({
  byCompany: teamAdminProcedure.input(z.object({ companyId: z.number() })).query(async ({ input }) => {
    return db.getBudgetControlsByCompany(input.companyId);
  }),

  byWallet: teamAdminProcedure.input(z.object({ walletId: z.number() })).query(async ({ input }) => {
    return db.getBudgetControlsByWallet(input.walletId);
  }),

  create: teamAdminProcedure.input(z.object({
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
  })).mutation(async ({ input }) => {
    await db.createBudgetControl(input as any);
    return { success: true };
  }),

  update: teamAdminProcedure.input(z.object({
    id: z.number(),
    controlType: z.enum(["per_employee_cap", "team_budget", "location_restriction", "resource_type_restriction", "approval_threshold"]).optional(),
    targetUserId: z.number().optional(),
    targetTeam: z.string().optional(),
    capAmount: z.string().optional(),
    periodType: z.enum(["daily", "weekly", "monthly"]).optional(),
    allowedLocationIds: z.array(z.number()).optional(),
    allowedResourceTypes: z.array(z.string()).optional(),
    approvalThreshold: z.string().optional(),
    approverUserId: z.number().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateBudgetControl(id, data as any);
    return { success: true };
  }),

  delete: teamAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteBudgetControl(input.id);
    return { success: true };
  }),

  checkAllowance: protectedProcedure.input(z.object({
    walletId: z.number(),
    userId: z.number(),
    amount: z.number(),
    resourceType: z.string().optional(),
    locationId: z.number().optional(),
  })).query(async ({ input }) => {
    return db.checkBudgetAllowance(input.walletId, input.userId, input.amount, input.resourceType, input.locationId);
  }),
});

// ─── Commit Contracts Router ────────────────────────────────────────
export const commitContractsRouter = router({
  byCompany: teamAdminProcedure.input(z.object({ companyId: z.number() })).query(async ({ input }) => {
    return db.getCommitContractsByCompany(input.companyId);
  }),

  byId: teamAdminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getCommitContractById(input.id);
  }),

  create: adminProcedure.input(z.object({
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
  })).mutation(async ({ input }) => {
    await db.createCommitContract(input as any);
    return { success: true };
  }),

  update: adminProcedure.input(z.object({
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
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateCommitContract(id, data as any);
    return { success: true };
  }),

  utilization: teamAdminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getCommitContractUtilization(input.id);
  }),

  trueUp: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.checkCommitTrueUp(input.id);
  }),
});

// ─── Credit Bonuses Router ──────────────────────────────────────────
export const creditBonusesRouter = router({
  byWallet: protectedProcedure.input(z.object({ walletId: z.number() })).query(async ({ input }) => {
    return db.getCreditBonusesByWallet(input.walletId);
  }),

  pending: protectedProcedure.input(z.object({ walletId: z.number() })).query(async ({ input }) => {
    return db.getPendingBonuses(input.walletId);
  }),

  create: adminProcedure.input(z.object({
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
  })).mutation(async ({ input }) => {
    await db.createCreditBonus(input as any);
    return { success: true };
  }),

  apply: protectedProcedure.input(z.object({ bonusId: z.number() })).mutation(async ({ input }) => {
    const result = await db.applyBonus(input.bonusId);
    return { success: true, ...result };
  }),

  createReferral: protectedProcedure.input(z.object({
    referredCompanyId: z.number(),
    amount: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    await db.createReferralBonus(ctx.user.id, input.referredCompanyId, input.amount);
    return { success: true };
  }),
});

// ─── Credit Admin Stats Router ──────────────────────────────────────
export const creditAdminRouter = router({
  stats: adminProcedure.query(async () => {
    return db.getCreditSystemStats();
  }),

  enhancedLedgerSummary: protectedProcedure.input(z.object({ walletId: z.number() })).query(async ({ input }) => {
    return db.getEnhancedLedgerSummary(input.walletId);
  }),
});
