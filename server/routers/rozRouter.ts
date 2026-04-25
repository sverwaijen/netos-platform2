import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "administrator" && ctx.user.role !== "host") {
    throw new Error("Forbidden: admin access required");
  }
  return next({ ctx });
});

const ROZ_PERIOD_TYPES = ["month", "6_months", "1_year", "2_year", "3_year", "5_year", "10_year"] as const;
const ROZ_CONTRACT_STATUSES = ["draft", "pending_signature", "active", "notice_given", "expired", "terminated"] as const;
const ROZ_INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"] as const;

// Period months mapping
const PERIOD_MONTHS: Record<string, number> = {
  month: 1, "6_months": 6, "1_year": 12, "2_year": 24,
  "3_year": 36, "5_year": 60, "10_year": 120,
};

// ─── ROZ Pricing Tiers Router ───
export const rozPricingTiersRouter = router({
  list: protectedProcedure.input(z.object({
    resourceId: z.number().optional(),
    locationId: z.number().optional(),
    resourceTypeId: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getRozPricingTiers(input);
  }),

  byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getRozPricingTierById(input.id);
  }),

  create: adminProcedure.input(z.object({
    resourceId: z.number().optional(),
    resourceTypeId: z.number().optional(),
    locationId: z.number().optional(),
    name: z.string(),
    periodType: z.enum(ROZ_PERIOD_TYPES),
    creditCostPerMonth: z.string(),
    creditCostPerM2PerMonth: z.string().optional(),
    discountPercent: z.string().optional(),
    serviceChargePerMonth: z.string().optional(),
    depositMonths: z.number().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const periodMonths = PERIOD_MONTHS[input.periodType] ?? 1;
    const id = await db.createRozPricingTier({
      ...input,
      periodMonths,
    } as any);
    return { id };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    creditCostPerMonth: z.string().optional(),
    creditCostPerM2PerMonth: z.string().optional(),
    discountPercent: z.string().optional(),
    serviceChargePerMonth: z.string().optional(),
    depositMonths: z.number().optional(),
    sortOrder: z.number().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateRozPricingTier(id, data as any);
    return { success: true };
  }),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteRozPricingTier(input.id);
    return { success: true };
  }),
});

// ─── ROZ Contracts Router ───
export const rozContractsRouter = router({
  list: protectedProcedure.input(z.object({
    status: z.string().optional(),
    resourceId: z.number().optional(),
    companyId: z.number().optional(),
    userId: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getRozContracts(input);
  }),

  byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getRozContractById(input.id);
  }),

  create: adminProcedure.input(z.object({
    resourceId: z.number(),
    locationId: z.number(),
    userId: z.number().optional(),
    companyId: z.number().optional(),
    walletId: z.number().optional(),
    pricingTierId: z.number().optional(),
    periodType: z.enum(ROZ_PERIOD_TYPES),
    startDate: z.number(),
    monthlyRentCredits: z.string(),
    monthlyServiceCharge: z.string().optional(),
    depositAmount: z.string().optional(),
    indexationMethod: z.string().optional(),
    indexationPct: z.string().optional(),
    noticePeriodMonths: z.number().optional(),
    rozTemplateVersion: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const periodMonths = PERIOD_MONTHS[input.periodType] ?? 1;
    const endDate = input.startDate + (periodMonths * 30.44 * 24 * 60 * 60 * 1000); // approx months to ms
    const contractNumber = `ROZ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const id = await db.createRozContract({
      ...input,
      contractNumber,
      endDate: Math.round(endDate),
      status: "draft",
    } as any);
    return { id, contractNumber };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    status: z.enum(ROZ_CONTRACT_STATUSES).optional(),
    monthlyRentCredits: z.string().optional(),
    monthlyServiceCharge: z.string().optional(),
    depositPaid: z.boolean().optional(),
    noticeGivenDate: z.number().optional(),
    rozDocumentUrl: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateRozContract(id, data as any);
    return { success: true };
  }),

  // Activate a contract (send ROZ agreement, deduct deposit)
  activate: adminProcedure.input(z.object({
    contractId: z.number(),
  })).mutation(async ({ input }) => {
    const contract = await db.getRozContractById(input.contractId);
    if (!contract) throw new Error("Contract not found");
    if (contract.status !== "draft" && contract.status !== "pending_signature") {
      throw new Error("Contract must be in draft or pending_signature status");
    }

    // Deduct deposit from wallet if applicable
    if (contract.walletId && parseFloat(contract.depositAmount || "0") > 0 && !contract.depositPaid) {
      const wallet = await db.getWalletById(contract.walletId);
      if (wallet) {
        const depositAmount = parseFloat(contract.depositAmount || "0");
        const currentBalance = parseFloat(wallet.balance);
        if (currentBalance < depositAmount) {
          throw new Error(`Insufficient credits for deposit. Need ${depositAmount}, have ${currentBalance}`);
        }
        const newBalance = (currentBalance - depositAmount).toFixed(2);
        await db.updateWalletBalance(contract.walletId, newBalance);
        await db.addLedgerEntry({
          walletId: contract.walletId,
          type: "spend",
          amount: (-depositAmount).toFixed(2),
          balanceAfter: newBalance,
          description: `ROZ Deposit: Contract ${contract.contractNumber}`,
          referenceType: "roz_contract",
          referenceId: contract.id,
        });
        await db.updateRozContract(contract.id, { depositPaid: true });
      }
    }

    await db.updateRozContract(contract.id, { status: "active" } as any);
    return { success: true };
  }),

  stats: protectedProcedure.query(async () => {
    return db.getRozStats();
  }),
});

// ─── ROZ Invoices Router ───
export const rozInvoicesRouter = router({
  list: protectedProcedure.input(z.object({
    contractId: z.number().optional(),
    status: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getRozInvoices(input);
  }),

  byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getRozInvoiceById(input.id);
  }),

  // Generate monthly invoice for a contract
  generate: adminProcedure.input(z.object({
    contractId: z.number(),
    periodStart: z.number(),
    periodEnd: z.number(),
  })).mutation(async ({ input }) => {
    const contract = await db.getRozContractById(input.contractId);
    if (!contract) throw new Error("Contract not found");
    if (contract.status !== "active") throw new Error("Contract must be active to generate invoices");

    const rentCredits = parseFloat(contract.monthlyRentCredits);
    const serviceCharge = parseFloat(contract.monthlyServiceCharge || "0");
    const totalCredits = rentCredits + serviceCharge;

    const invoiceNumber = `INV-ROZ-${Date.now().toString(36).toUpperCase()}`;
    const dueDate = input.periodStart + (14 * 24 * 60 * 60 * 1000); // 14 days payment term

    const id = await db.createRozInvoice({
      contractId: input.contractId,
      invoiceNumber,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      rentCredits: rentCredits.toFixed(2),
      serviceChargeCredits: serviceCharge.toFixed(2),
      totalCredits: totalCredits.toFixed(2),
      walletId: contract.walletId,
      dueDate,
      status: "draft",
    } as any);

    return { id, invoiceNumber, totalCredits };
  }),

  // Pay invoice (deduct from wallet)
  pay: protectedProcedure.input(z.object({
    invoiceId: z.number(),
    walletId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const invoice = await db.getRozInvoiceById(input.invoiceId);
    if (!invoice) throw new Error("Invoice not found");
    if (invoice.status === "paid") throw new Error("Invoice already paid");

    const walletId = input.walletId || invoice.walletId;
    if (!walletId) throw new Error("No wallet specified");

    const wallet = await db.getWalletById(walletId);
    if (!wallet) throw new Error("Wallet not found");

    const totalCredits = parseFloat(invoice.totalCredits);
    const currentBalance = parseFloat(wallet.balance);
    if (currentBalance < totalCredits) {
      throw new Error(`Insufficient credits. Need ${totalCredits}, have ${currentBalance}`);
    }

    const newBalance = (currentBalance - totalCredits).toFixed(2);
    await db.updateWalletBalance(walletId, newBalance);

    const ledgerEntry = await db.addLedgerEntry({
      walletId,
      type: "spend",
      amount: (-totalCredits).toFixed(2),
      balanceAfter: newBalance,
      description: `ROZ Invoice: ${invoice.invoiceNumber}`,
      referenceType: "roz_invoice",
      referenceId: invoice.id,
    });

    await db.updateRozInvoice(invoice.id, {
      status: "paid",
      paidDate: Date.now(),
      walletId,
    } as any);

    return { success: true, newBalance };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    status: z.enum(ROZ_INVOICE_STATUSES).optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateRozInvoice(id, data as any);
    return { success: true };
  }),
});

// ─── ROZ Resource Settings Router ───
export const rozResourceSettingsRouter = router({
  update: adminProcedure.input(z.object({
    resourceId: z.number(),
    areaM2: z.string().optional(),
    isRozEligible: z.boolean().optional(),
    rozContractType: z.string().optional(),
    rozServiceChargeModel: z.string().optional(),
    rozVatRate: z.string().optional(),
    rozIndexation: z.string().optional(),
    rozIndexationPct: z.string().optional(),
    rozTenantProtection: z.boolean().optional(),
    rozMinLeaseTerm: z.number().optional(),
    rozNoticePeriodMonths: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { resourceId, ...data } = input;
    await db.updateResourceRozSettings(resourceId, data);
    return { success: true };
  }),

  // Get ROZ-eligible resources
  eligible: protectedProcedure.input(z.object({
    locationId: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const allResources = input?.locationId
      ? await db.getResourcesByLocation(input.locationId)
      : await db.searchResources({});
    return allResources.filter((r: any) => r.isRozEligible);
  }),
});
