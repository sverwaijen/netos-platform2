import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { walletTransactions, wallets, creditBundles, creditLedger, users } from "../../drizzle/schema";
import { ENV } from "../_core/env";

// Initialize Stripe client if secret key is available
const stripe = ENV.STRIPE_SECRET_KEY
  ? require("stripe").default(ENV.STRIPE_SECRET_KEY)
  : null;

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

  // Get transaction history for the user
  getTransactionHistory: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.userId, ctx.user.id))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(input?.limit ?? 50);
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

  // Create a Stripe checkout session
  createCheckoutSession: protectedProcedure
    .input(z.object({
      bundleId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!stripe) throw new Error("Stripe is not configured");

      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Get the credit bundle
      const bundles = await db
        .select()
        .from(creditBundles)
        .where(eq(creditBundles.id, input.bundleId));

      if (bundles.length === 0) {
        throw new Error("Credit bundle not found");
      }

      const bundle = bundles[0];

      // Ensure user has a personal wallet
      const userWallets = await db
        .select()
        .from(wallets)
        .where(and(eq(wallets.ownerId, ctx.user.id), eq(wallets.type, "personal")));

      let walletId = userWallets[0]?.id;
      if (!walletId) {
        // Create a personal wallet if it doesn't exist
        const [result] = await db
          .insert(wallets)
          .values({
            type: "personal",
            ownerId: ctx.user.id,
            balance: "0",
          });
        walletId = result.insertId;
      }

      // Get user details for checkout
      const userRecords = await db.select().from(users).where(eq(users.id, ctx.user.id));
      const user = userRecords[0];

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

      const transactionId = txResult.insertId;

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: bundle.name,
                description: `${bundle.creditsPerMonth} credits`,
              },
              unit_amount: Math.round(parseFloat(bundle.priceEur) * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${ENV.CLIENT_URL}/wallet?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${ENV.CLIENT_URL}/wallet?cancelled=true`,
        customer_email: user?.email,
        client_reference_id: transactionId.toString(),
        metadata: {
          walletId,
          bundleId: input.bundleId,
          transactionId,
          userId: ctx.user.id,
        },
      });

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

  // Handle Stripe webhook for completed checkout sessions
  handleCheckoutCompleted: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ input }) => {
      if (!stripe) throw new Error("Stripe is not configured");

      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const session = await stripe.checkout.sessions.retrieve(input.sessionId);

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

      return { success: true };
    }),
});
