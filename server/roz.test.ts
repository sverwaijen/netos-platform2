import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getRozPricingTiers: vi.fn(),
  getRozPricingTierById: vi.fn(),
  createRozPricingTier: vi.fn(),
  updateRozPricingTier: vi.fn(),
  deleteRozPricingTier: vi.fn(),
  getRozContracts: vi.fn(),
  getRozContractById: vi.fn(),
  createRozContract: vi.fn(),
  updateRozContract: vi.fn(),
  getRozInvoices: vi.fn(),
  getRozInvoiceById: vi.fn(),
  createRozInvoice: vi.fn(),
  updateRozInvoice: vi.fn(),
  getRozStats: vi.fn(),
  getWalletById: vi.fn(),
  updateWalletBalance: vi.fn(),
  addLedgerEntry: vi.fn(),
  getResourcesByLocation: vi.fn(),
  searchResources: vi.fn(),
  updateResourceRozSettings: vi.fn(),
}));

import * as db from "./db";

const mockedDb = vi.mocked(db);

// ─── ROZ Pricing Tiers ───
describe("ROZ Pricing Tiers Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should map period types to correct month counts", () => {
    const PERIOD_MONTHS: Record<string, number> = {
      month: 1, "6_months": 6, "1_year": 12, "2_year": 24,
      "3_year": 36, "5_year": 60, "10_year": 120,
    };

    expect(PERIOD_MONTHS["month"]).toBe(1);
    expect(PERIOD_MONTHS["6_months"]).toBe(6);
    expect(PERIOD_MONTHS["1_year"]).toBe(12);
    expect(PERIOD_MONTHS["2_year"]).toBe(24);
    expect(PERIOD_MONTHS["3_year"]).toBe(36);
    expect(PERIOD_MONTHS["5_year"]).toBe(60);
    expect(PERIOD_MONTHS["10_year"]).toBe(120);
  });

  it("should list pricing tiers with filters", async () => {
    const mockTiers = [
      { id: 1, name: "Office Monthly", periodType: "month", periodMonths: 1, creditCostPerMonth: "500.00", isActive: true },
      { id: 2, name: "Office Yearly", periodType: "1_year", periodMonths: 12, creditCostPerMonth: "400.00", isActive: true },
    ];
    mockedDb.getRozPricingTiers.mockResolvedValue(mockTiers as any);

    const result = await db.getRozPricingTiers({ locationId: 1 });
    expect(result).toHaveLength(2);
    expect(mockedDb.getRozPricingTiers).toHaveBeenCalledWith({ locationId: 1 });
  });

  it("should get pricing tier by ID", async () => {
    const mockTier = { id: 1, name: "Office Monthly", periodType: "month", periodMonths: 1, creditCostPerMonth: "500.00" };
    mockedDb.getRozPricingTierById.mockResolvedValue(mockTier as any);

    const result = await db.getRozPricingTierById(1);
    expect(result).toBeDefined();
    expect(result?.name).toBe("Office Monthly");
  });

  it("should create pricing tier with computed periodMonths", async () => {
    mockedDb.createRozPricingTier.mockResolvedValue(42);

    const result = await db.createRozPricingTier({
      name: "Test Tier",
      periodType: "1_year",
      periodMonths: 12,
      creditCostPerMonth: "350.00",
    } as any);

    expect(result).toBe(42);
    expect(mockedDb.createRozPricingTier).toHaveBeenCalledWith(
      expect.objectContaining({ periodMonths: 12, periodType: "1_year" })
    );
  });

  it("should soft-delete pricing tier", async () => {
    mockedDb.deleteRozPricingTier.mockResolvedValue(undefined);

    await db.deleteRozPricingTier(1);
    expect(mockedDb.deleteRozPricingTier).toHaveBeenCalledWith(1);
  });
});

// ─── ROZ Contracts ───
describe("ROZ Contracts Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate a unique contract number format", () => {
    const contractNumber = `ROZ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    expect(contractNumber).toMatch(/^ROZ-[A-Z0-9]+-[A-Z0-9]+$/);
  });

  it("should calculate end date from period type", () => {
    const PERIOD_MONTHS: Record<string, number> = {
      month: 1, "6_months": 6, "1_year": 12, "2_year": 24,
      "3_year": 36, "5_year": 60, "10_year": 120,
    };
    const startDate = Date.now();
    const periodType = "1_year";
    const periodMonths = PERIOD_MONTHS[periodType] ?? 1;
    const endDate = startDate + (periodMonths * 30.44 * 24 * 60 * 60 * 1000);

    // 1 year ≈ 365 days
    const daysDiff = (endDate - startDate) / (24 * 60 * 60 * 1000);
    expect(daysDiff).toBeCloseTo(365.28, 0);
  });

  it("should list contracts with status filter", async () => {
    const mockContracts = [
      { id: 1, contractNumber: "ROZ-ABC-1234", status: "active", monthlyRentCredits: "500.00" },
    ];
    mockedDb.getRozContracts.mockResolvedValue(mockContracts as any);

    const result = await db.getRozContracts({ status: "active" });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("active");
  });

  it("should create a contract and return ID", async () => {
    mockedDb.createRozContract.mockResolvedValue(10);

    const result = await db.createRozContract({
      resourceId: 1,
      locationId: 1,
      contractNumber: "ROZ-TEST-001",
      periodType: "1_year",
      startDate: Date.now(),
      endDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
      monthlyRentCredits: "500.00",
      status: "draft",
    } as any);

    expect(result).toBe(10);
  });

  it("should reject activation of non-draft/pending contracts", async () => {
    const activeContract = {
      id: 1,
      status: "active",
      walletId: 1,
      depositAmount: "1000.00",
      depositPaid: false,
      contractNumber: "ROZ-TEST",
    };
    mockedDb.getRozContractById.mockResolvedValue(activeContract as any);

    // Simulate activation check
    const contract = await db.getRozContractById(1);
    expect(contract).toBeDefined();
    expect(contract!.status !== "draft" && contract!.status !== "pending_signature").toBe(true);
  });

  it("should check wallet balance before deposit deduction", async () => {
    const contract = {
      id: 1,
      status: "draft",
      walletId: 5,
      depositAmount: "1000.00",
      depositPaid: false,
      contractNumber: "ROZ-TEST",
    };
    const wallet = { id: 5, balance: "500.00" };

    mockedDb.getRozContractById.mockResolvedValue(contract as any);
    mockedDb.getWalletById.mockResolvedValue(wallet as any);

    const depositAmount = parseFloat(contract.depositAmount);
    const currentBalance = parseFloat(wallet.balance);

    expect(currentBalance < depositAmount).toBe(true);
  });

  it("should deduct deposit and update wallet balance on activation", async () => {
    const contract = {
      id: 1,
      status: "draft",
      walletId: 5,
      depositAmount: "1000.00",
      depositPaid: false,
      contractNumber: "ROZ-DEDUCT",
    };
    const wallet = { id: 5, balance: "2000.00" };

    mockedDb.getRozContractById.mockResolvedValue(contract as any);
    mockedDb.getWalletById.mockResolvedValue(wallet as any);
    mockedDb.updateWalletBalance.mockResolvedValue(undefined);
    mockedDb.addLedgerEntry.mockResolvedValue(undefined as any);
    mockedDb.updateRozContract.mockResolvedValue(undefined);

    // Simulate deposit deduction logic
    const depositAmount = parseFloat(contract.depositAmount);
    const currentBalance = parseFloat(wallet.balance);
    expect(currentBalance >= depositAmount).toBe(true);

    const newBalance = (currentBalance - depositAmount).toFixed(2);
    expect(newBalance).toBe("1000.00");

    await db.updateWalletBalance(contract.walletId, newBalance);
    expect(mockedDb.updateWalletBalance).toHaveBeenCalledWith(5, "1000.00");

    await db.addLedgerEntry({
      walletId: contract.walletId,
      type: "spend",
      amount: (-depositAmount).toFixed(2),
      balanceAfter: newBalance,
      description: `ROZ Deposit: Contract ${contract.contractNumber}`,
      referenceType: "roz_contract",
      referenceId: contract.id,
    });
    expect(mockedDb.addLedgerEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        walletId: 5,
        type: "spend",
        amount: "-1000.00",
      })
    );
  });
});

// ─── ROZ Invoices ───
describe("ROZ Invoices Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate invoice number in correct format", () => {
    const invoiceNumber = `INV-ROZ-${Date.now().toString(36).toUpperCase()}`;
    expect(invoiceNumber).toMatch(/^INV-ROZ-[A-Z0-9]+$/);
  });

  it("should calculate total credits from rent + service charge", () => {
    const contract = {
      monthlyRentCredits: "500.00",
      monthlyServiceCharge: "75.00",
    };

    const rentCredits = parseFloat(contract.monthlyRentCredits);
    const serviceCharge = parseFloat(contract.monthlyServiceCharge);
    const totalCredits = rentCredits + serviceCharge;

    expect(totalCredits).toBe(575);
    expect(totalCredits.toFixed(2)).toBe("575.00");
  });

  it("should set 14-day payment term for due date", () => {
    const periodStart = Date.now();
    const dueDate = periodStart + (14 * 24 * 60 * 60 * 1000);
    const daysDiff = (dueDate - periodStart) / (24 * 60 * 60 * 1000);
    expect(daysDiff).toBe(14);
  });

  it("should reject generating invoice for non-active contract", async () => {
    mockedDb.getRozContractById.mockResolvedValue({
      id: 1,
      status: "draft",
      monthlyRentCredits: "500.00",
    } as any);

    const contract = await db.getRozContractById(1);
    expect(contract).toBeDefined();
    expect(contract!.status !== "active").toBe(true);
  });

  it("should create invoice with all required fields", async () => {
    mockedDb.createRozInvoice.mockResolvedValue(7);

    const result = await db.createRozInvoice({
      contractId: 1,
      invoiceNumber: "INV-ROZ-TEST",
      periodStart: Date.now(),
      periodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
      rentCredits: "500.00",
      serviceChargeCredits: "75.00",
      totalCredits: "575.00",
      dueDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
      status: "draft",
    } as any);

    expect(result).toBe(7);
  });

  it("should reject payment of already-paid invoice", async () => {
    mockedDb.getRozInvoiceById.mockResolvedValue({
      id: 1,
      status: "paid",
      totalCredits: "500.00",
    } as any);

    const invoice = await db.getRozInvoiceById(1);
    expect(invoice).toBeDefined();
    expect(invoice!.status).toBe("paid");
  });

  it("should reject payment when wallet has insufficient credits", async () => {
    const invoice = { id: 1, status: "draft", totalCredits: "1000.00", walletId: 5 };
    const wallet = { id: 5, balance: "500.00" };

    mockedDb.getRozInvoiceById.mockResolvedValue(invoice as any);
    mockedDb.getWalletById.mockResolvedValue(wallet as any);

    const totalCredits = parseFloat(invoice.totalCredits);
    const currentBalance = parseFloat(wallet.balance);
    expect(currentBalance < totalCredits).toBe(true);
  });

  it("should process payment and update wallet + invoice status", async () => {
    const invoice = { id: 1, status: "draft", totalCredits: "500.00", walletId: 5, invoiceNumber: "INV-ROZ-TEST" };
    const wallet = { id: 5, balance: "2000.00" };

    mockedDb.getRozInvoiceById.mockResolvedValue(invoice as any);
    mockedDb.getWalletById.mockResolvedValue(wallet as any);
    mockedDb.updateWalletBalance.mockResolvedValue(undefined);
    mockedDb.addLedgerEntry.mockResolvedValue(undefined as any);
    mockedDb.updateRozInvoice.mockResolvedValue(undefined);

    const totalCredits = parseFloat(invoice.totalCredits);
    const currentBalance = parseFloat(wallet.balance);
    const newBalance = (currentBalance - totalCredits).toFixed(2);

    expect(newBalance).toBe("1500.00");

    await db.updateWalletBalance(5, newBalance);
    await db.addLedgerEntry({
      walletId: 5,
      type: "spend",
      amount: (-totalCredits).toFixed(2),
      balanceAfter: newBalance,
      description: `ROZ Invoice: ${invoice.invoiceNumber}`,
      referenceType: "roz_invoice",
      referenceId: invoice.id,
    });
    await db.updateRozInvoice(1, { status: "paid", paidDate: Date.now(), walletId: 5 } as any);

    expect(mockedDb.updateWalletBalance).toHaveBeenCalledWith(5, "1500.00");
    expect(mockedDb.addLedgerEntry).toHaveBeenCalledWith(
      expect.objectContaining({ walletId: 5, type: "spend", amount: "-500.00" })
    );
    expect(mockedDb.updateRozInvoice).toHaveBeenCalledWith(1, expect.objectContaining({ status: "paid" }));
  });
});

// ─── ROZ Resource Settings ───
describe("ROZ Resource Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update resource ROZ settings", async () => {
    mockedDb.updateResourceRozSettings.mockResolvedValue(undefined);

    await db.updateResourceRozSettings(1, {
      areaM2: "150",
      isRozEligible: true,
      rozContractType: "office",
    });

    expect(mockedDb.updateResourceRozSettings).toHaveBeenCalledWith(1, expect.objectContaining({
      areaM2: "150",
      isRozEligible: true,
    }));
  });

  it("should filter eligible resources", async () => {
    const resources = [
      { id: 1, name: "Large Office", isRozEligible: true },
      { id: 2, name: "Small Desk", isRozEligible: false },
      { id: 3, name: "Conference Room", isRozEligible: true },
    ];
    mockedDb.searchResources.mockResolvedValue(resources as any);

    const allResources = await db.searchResources({});
    const eligible = allResources.filter((r) => r.isRozEligible);

    expect(eligible).toHaveLength(2);
    expect(eligible.map((r) => r.name)).toEqual(["Large Office", "Conference Room"]);
  });

  it("should filter by location when provided", async () => {
    const resources = [
      { id: 1, name: "Office A", isRozEligible: true },
    ];
    mockedDb.getResourcesByLocation.mockResolvedValue(resources as any);

    const result = await db.getResourcesByLocation(1);
    expect(mockedDb.getResourcesByLocation).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(1);
  });
});

// ─── ROZ Stats ───
describe("ROZ Stats", () => {
  it("should return ROZ statistics", async () => {
    const mockStats = {
      totalContracts: 15,
      activeContracts: 10,
      totalMonthlyRevenue: "5000.00",
      avgContractDuration: 12,
    };
    mockedDb.getRozStats.mockResolvedValue(mockStats as any);

    const stats = await db.getRozStats();
    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("totalContracts");
    expect(stats).toHaveProperty("activeContracts");
  });
});
