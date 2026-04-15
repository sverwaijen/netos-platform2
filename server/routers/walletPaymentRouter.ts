import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { walletTransactions, wallets, creditBundles, creditLedger, users } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { createLogger } from "../_core/logger";

const logger = createLogger("WalletPayment");

// Initialize Stripe client if secret key is available
const stripe = ENV.STRIPE_SECRET_KEY
  ? require("stripe").default(ENV.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      maxNetworkRetries: 3,
    })
  : null;

// ─── Helper: Get or create Stripe Customer ──────────────────────────
async function getOrCreateStripeCustomer(
  userId: number,
  email: string | null,
  name: string | null,
  walletId: number
): Promise<string> {
  if (!stripe) throw new Error("Stripe is not configured");

  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  // Check if wallet already has a Stripe customer ID
  const walletResults = await db
    .select()
    .from(wallets)
    .where(eq(wallets.id, walletId));

  if (walletResults.length > 0 && walletResults[0].stripeCustomerId) {
    // Verify customer still exists in Stripe
    try {
      const existing = await stripe.customers.retrieve(walletResults[0].stripeCustomerId);
      if (!existing.deleted) {
        return walletResults[0].stripeCustomerId;
      }
    } catch {
      // Customer not found in Stripe, create a new one
    }
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email: email || undefined,
    name: name || undefined,
    metadata: {
      skynetUserId: userId.toString(),
      walletId: walletId.toString(),
    },
  });

  // Store Stripe customer ID on the wallet
  await db
    .update(wallets)
    .set({ stripeCustomerId: customer.id })
    .where(eq(wallets.id, walletId));

  return customer.id;
}

// ─── Helper: Fulfill checkout (shared between webhook and polling) ──
async function fulfillCheckoutSession(sessionId: string): Promise<{ success: boolean; alreadyProcessed?: boolean }> {
  if (!stripe) throw new Error("Stripe is not configured");

  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    throw new Error("Payment not completed");
  }

  const transactionId = parseInt(session.client_reference_id || "0", 10);
  if (!transactionId) throw new Error("Invalid transaction ID");

  // Get the transaction
  const txResults = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.id, transactionId));

  if (txResults.length === 0) {
    throw new Error("Transaction not found");
  }

  const transaction = txResults[0];

  // Idempotency check: skip if already completed
  if (transaction.status === "completed") {
    return { success: true, alreadyProcessed: true };
  }

  // Update transaction status to completed
  await db
    .update(walletTransactions)
    .set({
      status: "completed",
      stripePaymentIntentId: session.payment_intent,
    })
    .where(eq(walletTransactions.id, transactionId));

  // Get the wallet
  const walletResults = await db
    .select()
    .from(wallets)
    .where(eq(wallets.id, transaction.walletId));

  if (walletResults.length === 0) {
    throw new Error("Wallet not found");
  }

  const wallet = walletResults[0];

  // Update wallet balance
  const newBalance = (parseFloat(wallet.balance) + parseFloat(transaction.creditsAdded)).toFixed(2);
  await db
    .update(wallets)
    .set({ balance: newBalance })
    .where(eq(wallets.id, transaction.walletId));

  // Add ledger entry for the credit top-up
  await db.insert(creditLedger).values({
    walletId: transaction.walletId,
    type: "topup",
    amount: transaction.creditsAdded,
    balanceAfter: newBalance,
    description: transaction.description || `Stripe checkout: ${transaction.id}`,
    referenceType: "stripe_session",
    referenceId: transactionId,
    source: "topup",
    createdAt: new Date(),
  });

  return { success: true, alreadyProcessed: false };
}

// ─── Wallet Payment Router ──────────────────────────────────────────
export const walletPaymentRouter = router({
  // Get current wallet balance for the authenticated user
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    const userWallets = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.ownerId, ctx.user.id), eq(wallets.type, "personal")));

    if (userWallets.length === 0) {
      return { balance: "0", walletId: null };
    }

    return {
      balance: userWallets[0].balance,
      walletId: userWallets[0].id,
    };
  }),

  // Get transaction history for the user with detailed payment info
  getTransactionHistory: protectedProcedure
    .input(z.object({
      limit: z.number().optional(),
      type: z.enum(["topup", "spend", "refund"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(walletTransactions.userId, ctx.user.id)];
      if (input?.type) {
        conditions.push(eq(walletTransactions.type, input.type));
      }

      return db
        .select()
        .from(walletTransactions)
        .where(and(...conditions))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(input?.limit ?? 50);
    }),

  // Get payment history (completed payments only, for wallet page)
  getPaymentHistory: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(walletTransactions)
        .where(
          and(
            eq(walletTransactions.userId, ctx.user.id),
            eq(walletTransactions.type, "topup"),
          )
        )
        .orderBy(desc(walletTransactions.createdAt))
        .limit(input?.limit ?? 20);
    }),

  // Get available credit bundles
  getBundles: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(creditBundles)
      .where(eq(creditBundles.isActive, true))
      .orderBy(creditBundles.priceEur);
  }),

  // Create a Stripe checkout session with iDEAL support
  createCheckoutSession: protectedProcedure
    .input(z.object({
      bundleId: z.number(),
      paymentMethod: z.enum(["card", "ideal"]).optional().default("card"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!stripe) throw new Error("Stripe is not configured");

      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Get the credit bundle
      const bundleResults = await db
        .select()
        .from(creditBundles)
        .where(eq(creditBundles.id, input.bundleId));

      if (bundleResults.length === 0) {
        throw new Error("Credit bundle not found");
      }

      const bundle = bundleResults[0];

      // Ensure user has a personal wallet
      const userWallets = await db
        .select()
        .from(wallets)
        .where(and(eq(wallets.ownerId, ctx.user.id), eq(wallets.type, "personal")));

      let walletId = userWallets[0]?.id;
      if (!walletId) {
        // Create a personal wallet if it doesn't exist
        const result = await db
          .insert(wallets)
          .values({
            type: "personal",
            ownerId: ctx.user.id,
            balance: "0",
          });
        walletId = (result as any).insertId;
      }

      // Get user details
      const userRecords = await db.select().from(users).where(eq(users.id, ctx.user.id));
      const user = userRecords[0];

      // Get or create Stripe customer
      const stripeCustomerId = await getOrCreateStripeCustomer(
        ctx.user.id,
        user?.email ?? null,
        user?.name ?? null,
        walletId
      );

      // Create a pending wallet transaction record
      const [txResult] = await db.insert(walletTransactions).values({
        userId: ctx.user.id,
        walletId,
        bundleId: input.bundleId,
        amount: bundle.priceEur,
        creditsAdded: bundle.creditsPerMonth.toString(),
        type: "topup",
        description: `Purchased ${bundle.name}`,
        status: "pending",
      });

      const transactionId = (txResult as any).insertId;

      // Configure payment method types based on user selection
      // iDEAL is the dominant payment method in the Netherlands
      const paymentMethodTypes: string[] = input.paymentMethod === "ideal"
        ? ["ideal"]
        : ["card", "ideal"];

      // Create Stripe checkout session with customer linking
      const sessionConfig: Record<string, unknown> = {
        payment_method_types: paymentMethodTypes,
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: bundle.name,
                description: `${bundle.creditsPerMonth} credits — Skynet Platform`,
              },
              unit_amount: Math.round(parseFloat(bundle.priceEur) * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer: stripeCustomerId,
        success_url: `${ENV.CLIENT_URL}/wallet?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${ENV.CLIENT_URL}/wallet?cancelled=true`,
        client_reference_id: transactionId.toString(),
        metadata: {
          walletId: walletId.toString(),
          bundleId: input.bundleId.toString(),
          transactionId: transactionId.toString(),
          userId: ctx.user.id.toString(),
          platform: "skynet",
        },
        payment_intent_data: {
          metadata: {
            walletId: walletId.toString(),
            transactionId: transactionId.toString(),
          },
        },
        locale: "nl", // Dutch locale for NL market
      };

      const session = await stripe.checkout.sessions.create(sessionConfig);

      // Store the Stripe session ID in the transaction
      await db
        .update(walletTransactions)
        .set({ stripeSessionId: session.id })
        .where(eq(walletTransactions.id, transactionId));

      return {
        checkoutUrl: session.url,
        sessionId: session.id,
      };
    }),

  // Create a direct top-up checkout session (amount-based, not bundle-based)
  createTopUpSession: protectedProcedure
    .input(z.object({
      amountEur: z.number().min(5).max(1000),
      paymentMethod: z.enum(["card", "ideal"]).optional().default("card"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!stripe) throw new Error("Stripe is not configured");

      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Ensure user has a personal wallet
      const userWallets = await db
        .select()
        .from(wallets)
        .where(and(eq(wallets.ownerId, ctx.user.id), eq(wallets.type, "personal")));

      let walletId = userWallets[0]?.id;
      if (!walletId) {
        const result = await db
          .insert(wallets)
          .values({ type: "personal", ownerId: ctx.user.id, balance: "0" });
        walletId = (result as any).insertId;
      }

      const userRecords = await db.select().from(users).where(eq(users.id, ctx.user.id));
      const user = userRecords[0];

      const stripeCustomerId = await getOrCreateStripeCustomer(
        ctx.user.id,
        user?.email ?? null,
        user?.name ?? null,
        walletId
      );

      // 1 EUR = 1 credit for direct top-ups
      const credits = input.amountEur.toString();

      const txResult = await db.insert(walletTransactions).values({
        userId: ctx.user.id,
        walletId,
        amount: input.amountEur.toFixed(2),
        creditsAdded: credits,
        type: "topup",
        description: `Direct top-up: ${credits} credits`,
        status: "pending",
      });

      const transactionId = (txResult as any).insertId;

      const paymentMethodTypes: string[] = input.paymentMethod === "ideal"
        ? ["ideal"]
        : ["card", "ideal"];

      const session = await stripe.checkout.sessions.create({
        payment_method_types: paymentMethodTypes,
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: `Skynet Credits Top-Up`,
                description: `${credits} credits`,
              },
              unit_amount: Math.round(input.amountEur * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer: stripeCustomerId,
        success_url: `${ENV.CLIENT_URL}/wallet?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${ENV.CLIENT_URL}/wallet?cancelled=true`,
        client_reference_id: transactionId.toString(),
        metadata: {
          walletId: walletId.toString(),
          transactionId: transactionId.toString(),
          userId: ctx.user.id.toString(),
          platform: "skynet",
        },
        locale: "nl",
      });

      await db
        .update(walletTransactions)
        .set({ stripeSessionId: session.id })
        .where(eq(walletTransactions.id, transactionId));

      return {
        checkoutUrl: session.url,
        sessionId: session.id,
      };
    }),

  // Get checkout session status
  getCheckoutStatus: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      if (!stripe) throw new Error("Stripe is not configured");

      const session = await stripe.checkout.sessions.retrieve(input.sessionId);

      return {
        status: session.payment_status,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
        currency: session.currency,
      };
    }),

  // Handle completed checkout (called from success page or webhook)
  handleCheckoutCompleted: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return fulfillCheckoutSession(input.sessionId);
    }),

  // Mark a failed transaction
  markTransactionFailed: protectedProcedure
    .input(z.object({ transactionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Only allow users to mark their own pending transactions as failed
      await db
        .update(walletTransactions)
        .set({ status: "failed" })
        .where(
          and(
            eq(walletTransactions.id, input.transactionId),
            eq(walletTransactions.userId, ctx.user.id),
            eq(walletTransactions.status, "pending"),
          )
        );

      return { success: true };
    }),

  // Check Stripe configuration status (for UI)
  getStripeStatus: publicProcedure.query(async () => {
    return {
      configured: !!stripe,
      supportedMethods: stripe ? ["card", "ideal"] : [],
      currency: "eur",
    };
  }),
});

// ─── Export fulfillment helper for webhook route ─────────────────────
export { fulfillCheckoutSession };
