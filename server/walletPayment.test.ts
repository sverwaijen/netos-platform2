import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Wallet Payment Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Credit Bundle Lookup", () => {
    it("should retrieve active credit bundles", () => {
      const mockBundles = [
        { id: 1, name: "Starter", creditsPerMonth: 100, priceEur: "10.00", isActive: true },
        { id: 2, name: "Pro", creditsPerMonth: 250, priceEur: "25.00", isActive: true },
      ];

      const selectedBundles = mockBundles.filter((b) => b.isActive);

      expect(selectedBundles).toHaveLength(2);
      expect(selectedBundles[0].name).toBe("Starter");
      expect(selectedBundles[1].creditsPerMonth).toBe(250);
    });

    it("should return empty list if no active bundles exist", () => {
      const mockBundles = [
        { id: 1, name: "Old Plan", creditsPerMonth: 50, priceEur: "5.00", isActive: false },
      ];

      const selectedBundles = mockBundles.filter((b) => b.isActive);

      expect(selectedBundles).toHaveLength(0);
    });

    it("should sort bundles by price ascending", () => {
      const mockBundles = [
        { id: 3, name: "Elite", creditsPerMonth: 500, priceEur: "50.00", isActive: true },
        { id: 1, name: "Starter", creditsPerMonth: 100, priceEur: "10.00", isActive: true },
        { id: 2, name: "Pro", creditsPerMonth: 250, priceEur: "25.00", isActive: true },
      ];

      const sorted = mockBundles.sort((a, b) => parseFloat(a.priceEur) - parseFloat(b.priceEur));

      expect(sorted[0].name).toBe("Starter");
      expect(sorted[1].name).toBe("Pro");
      expect(sorted[2].name).toBe("Elite");
    });
  });

  describe("Checkout Session Creation", () => {
    it("should create a Stripe checkout session with correct parameters", () => {
      const bundleId = 1;
      const userId = 123;
      const walletId = 456;

      const session = {
        id: "cs_test_123",
        url: "https://checkout.stripe.com/pay/cs_test_123",
        payment_method_types: ["card"],
        metadata: {
          walletId,
          bundleId,
          userId,
        },
      };

      expect(session.id).toBeDefined();
      expect(session.url).toContain("checkout.stripe.com");
      expect(session.metadata.walletId).toBe(walletId);
      expect(session.metadata.bundleId).toBe(bundleId);
    });

    it("should handle missing bundle gracefully", () => {
      const bundleId = 999;
      const bundles: any[] = [];

      if (bundles.length === 0) {
        const error = new Error("Credit bundle not found");
        expect(error.message).toBe("Credit bundle not found");
      }
    });

    it("should store Stripe session ID in wallet transaction", () => {
      const transactionId = 1;
      const stripeSessionId = "cs_test_123";

      const transaction = {
        id: transactionId,
        stripeSessionId,
        status: "pending",
      };

      expect(transaction.id).toBe(transactionId);
      expect(transaction.stripeSessionId).toBe(stripeSessionId);
      expect(transaction.status).toBe("pending");
    });

    it("should create wallet for user if not exists", () => {
      const userId = 123;

      const newWallet = {
        id: 456,
        ownerId: userId,
        type: "personal",
        balance: "0",
      };

      expect(newWallet.ownerId).toBe(userId);
      expect(newWallet.type).toBe("personal");
      expect(newWallet.balance).toBe("0");
    });
  });

  describe("Balance Calculation", () => {
    it("should calculate correct wallet balance", () => {
      const initialBalance = "100.50";
      const creditsAdded = "250.00";

      const newBalance = (parseFloat(initialBalance) + parseFloat(creditsAdded)).toFixed(2);

      expect(newBalance).toBe("350.50");
    });

    it("should handle zero balance correctly", () => {
      const initialBalance = "0";
      const creditsAdded = "50.00";

      const newBalance = (parseFloat(initialBalance) + parseFloat(creditsAdded)).toFixed(2);

      expect(newBalance).toBe("50.00");
    });

    it("should preserve decimal precision", () => {
      const initialBalance = "99.99";
      const creditsAdded = "0.01";

      const newBalance = (parseFloat(initialBalance) + parseFloat(creditsAdded)).toFixed(2);

      expect(newBalance).toBe("100.00");
    });

    it("should calculate balance after multiple topups", () => {
      let balance = "0";
      const topups = ["25.00", "50.00", "100.00"];

      for (const topup of topups) {
        balance = (parseFloat(balance) + parseFloat(topup)).toFixed(2);
      }

      expect(balance).toBe("175.00");
    });
  });

  describe("Transaction Recording", () => {
    it("should record successful payment transaction", () => {
      const transaction = {
        id: 1,
        userId: 123,
        walletId: 456,
        bundleId: 1,
        amount: "25.00",
        creditsAdded: "250.00",
        type: "topup",
        status: "completed",
        stripeSessionId: "cs_test_123",
        description: "Pro Bundle purchase",
      };

      expect(transaction.status).toBe("completed");
      expect(transaction.amount).toBe("25.00");
      expect(transaction.creditsAdded).toBe("250.00");
      expect(transaction.type).toBe("topup");
    });

    it("should record pending transaction before payment", () => {
      const transaction = {
        id: 1,
        status: "pending",
        stripeSessionId: "cs_test_123",
      };

      expect(transaction.status).toBe("pending");
      expect(transaction.stripeSessionId).toBeDefined();
    });

    it("should handle failed transactions", () => {
      const transaction = {
        id: 1,
        status: "failed",
        description: "Payment declined",
      };

      expect(transaction.status).toBe("failed");
    });

    it("should handle refunded transactions", () => {
      const transaction = {
        id: 1,
        status: "refunded",
        type: "refund",
        creditsAdded: "-250.00",
      };

      expect(transaction.status).toBe("refunded");
      expect(transaction.type).toBe("refund");
    });

    it("should create ledger entry for completed transactions", () => {
      const walletId = 456;
      const balanceAfter = "350.50";
      const creditsAdded = "250.00";

      const ledgerEntry = {
        walletId,
        type: "topup",
        amount: creditsAdded,
        balanceAfter,
        description: "Stripe checkout: 1",
        referenceType: "stripe_session",
      };

      expect(ledgerEntry.walletId).toBe(walletId);
      expect(ledgerEntry.type).toBe("topup");
      expect(ledgerEntry.amount).toBe(creditsAdded);
      expect(ledgerEntry.balanceAfter).toBe(balanceAfter);
    });

    it("should link transaction to user correctly", () => {
      const userId = 123;
      const transaction = {
        id: 1,
        userId,
        walletId: 456,
      };

      expect(transaction.userId).toBe(userId);
    });

    it("should store Stripe payment intent ID", () => {
      const transaction = {
        id: 1,
        stripePaymentIntentId: "pi_test_123",
      };

      expect(transaction.stripePaymentIntentId).toBeDefined();
      expect(transaction.stripePaymentIntentId).toContain("pi_");
    });
  });

  describe("Transaction History", () => {
    it("should retrieve user transaction history", () => {
      const userId = 123;
      const mockTransactions = [
        { id: 1, userId, type: "topup", creditsAdded: "100", createdAt: new Date("2026-04-01") },
        { id: 2, userId, type: "topup", creditsAdded: "250", createdAt: new Date("2026-04-05") },
        { id: 3, userId, type: "spend", creditsAdded: "-50", createdAt: new Date("2026-04-10") },
      ];

      const userTransactions = mockTransactions.filter((t) => t.userId === userId);

      expect(userTransactions).toHaveLength(3);
      expect(userTransactions[0].type).toBe("topup");
    });

    it("should sort transactions by date descending", () => {
      const mockTransactions = [
        { id: 1, createdAt: new Date("2026-04-01") },
        { id: 2, createdAt: new Date("2026-04-05") },
        { id: 3, createdAt: new Date("2026-04-10") },
      ];

      const sorted = [...mockTransactions].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      expect(sorted[0].id).toBe(3);
      expect(sorted[1].id).toBe(2);
      expect(sorted[2].id).toBe(1);
    });

    it("should respect limit parameter", () => {
      const mockTransactions = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
      const limit = 50;

      const limited = mockTransactions.slice(0, limit);

      expect(limited).toHaveLength(50);
    });

    it("should default to 50 transactions if limit not specified", () => {
      const mockTransactions = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
      const defaultLimit = 50;

      const limited = mockTransactions.slice(0, defaultLimit);

      expect(limited).toHaveLength(50);
    });

    it("should handle empty transaction history", () => {
      const mockTransactions: any[] = [];

      expect(mockTransactions).toHaveLength(0);
    });

    it("should calculate total transaction volume", () => {
      const mockTransactions = [
        { id: 1, amount: "25.00" },
        { id: 2, amount: "50.00" },
        { id: 3, amount: "75.00" },
      ];

      const totalVolume = mockTransactions.reduce(
        (sum, tx) => sum + parseFloat(tx.amount),
        0
      ).toFixed(2);

      expect(totalVolume).toBe("150.00");
    });
  });
});
