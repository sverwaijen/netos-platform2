import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import {
  ensureStripeProduct,
  createCheckoutSession,
  createTopupCheckoutSession,
  getCustomerPortalUrl,
  cancelSubscription,
  getSubscription,
  getStripe,
  type BundleForStripe,
} from "../stripe";

export const stripeRouter = router({
  /**
   * Create a Stripe Checkout session for a bundle subscription
   */
  createSubscription: protectedProcedure
    .input(z.object({
      bundleId: z.number(),
      origin: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get the bundle
      const bundles = await db.getAllBundles();
      const bundle = bundles.find((b: any) => b.id === input.bundleId) as BundleForStripe | undefined;
      if (!bundle) throw new Error("Bundle not found");
      if (parseFloat(bundle.priceEur) === 0) throw new Error("Free bundles don't require payment");

      // Ensure Stripe product + price exist
      const { stripeProductId, stripePriceId } = await ensureStripeProduct(bundle);

      // Persist Stripe IDs back to the bundle if they were just created
      if (!bundle.stripeProductId || !bundle.stripePriceId) {
        await db.updateBundleStripeIds(bundle.id, stripeProductId, stripePriceId);
      }

      // Get or find existing Stripe customer for this user's wallet
      const wallets = await db.getWalletsByUserId(ctx.user.id);
      const personalWallet = wallets.find((w: any) => w.type === "personal");
      const existingCustomerId = personalWallet?.stripeCustomerId || null;

      // Create checkout session
      const checkoutUrl = await createCheckoutSession({
        userId: ctx.user.id,
        userEmail: ctx.user.email || "",
        userName: ctx.user.name || "",
        bundleId: bundle.id,
        stripePriceId,
        origin: input.origin,
        stripeCustomerId: existingCustomerId,
        mode: "subscription",
      });

      return { checkoutUrl };
    }),

  /**
   * Create a Stripe Checkout session for a one-time credit top-up
   */
  createTopup: protectedProcedure
    .input(z.object({
      credits: z.number().min(10),
      amountEur: z.number().min(0.50),
      origin: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const wallets = await db.getWalletsByUserId(ctx.user.id);
      const personalWallet = wallets.find((w: any) => w.type === "personal");
      const existingCustomerId = personalWallet?.stripeCustomerId || null;

      const checkoutUrl = await createTopupCheckoutSession({
        userId: ctx.user.id,
        userEmail: ctx.user.email || "",
        userName: ctx.user.name || "",
        credits: input.credits,
        amountEur: input.amountEur,
        origin: input.origin,
        stripeCustomerId: existingCustomerId,
      });

      return { checkoutUrl };
    }),

  /**
   * Get the Stripe Customer Portal URL for managing subscriptions
   */
  customerPortal: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const wallets = await db.getWalletsByUserId(ctx.user.id);
      const personalWallet = wallets.find((w: any) => w.type === "personal");
      if (!personalWallet?.stripeCustomerId) {
        throw new Error("No Stripe customer found. Please subscribe to a plan first.");
      }

      const portalUrl = await getCustomerPortalUrl(
        personalWallet.stripeCustomerId,
        `${input.origin}/credits`,
      );
      return { portalUrl };
    }),

  /**
   * Get current subscription status
   */
  subscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const wallets = await db.getWalletsByUserId(ctx.user.id);
    const personalWallet = wallets.find((w: any) => w.type === "personal");

    if (!personalWallet?.stripeSubscriptionId) {
      return { active: false, subscription: null, bundle: null };
    }

    try {
      const subscription = await getSubscription(personalWallet.stripeSubscriptionId);
      const bundles = await db.getAllBundles();
      const bundle = personalWallet.bundleId
        ? bundles.find((b: any) => b.id === personalWallet.bundleId)
        : null;

      return {
        active: subscription.status === "active" || subscription.status === "trialing",
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: (subscription as any).current_period_end
            ? new Date((subscription as any).current_period_end * 1000).toISOString()
            : null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
        bundle: bundle ? { id: bundle.id, name: bundle.name, creditsPerMonth: bundle.creditsPerMonth } : null,
      };
    } catch {
      return { active: false, subscription: null, bundle: null };
    }
  }),

  /**
   * Cancel current subscription
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const wallets = await db.getWalletsByUserId(ctx.user.id);
    const personalWallet = wallets.find((w: any) => w.type === "personal");

    if (!personalWallet?.stripeSubscriptionId) {
      throw new Error("No active subscription found");
    }

    await cancelSubscription(personalWallet.stripeSubscriptionId);
    return { success: true };
  }),

  /**
   * Get recent payments for the current user (from Stripe API)
   */
  payments: protectedProcedure.query(async ({ ctx }) => {
    const wallets = await db.getWalletsByUserId(ctx.user.id);
    const personalWallet = wallets.find((w: any) => w.type === "personal");

    if (!personalWallet?.stripeCustomerId) {
      return [];
    }

    try {
      const stripe = getStripe();
      const charges = await stripe.charges.list({
        customer: personalWallet.stripeCustomerId,
        limit: 20,
      });

      return charges.data.map((charge) => ({
        id: charge.id,
        amount: charge.amount / 100,
        currency: charge.currency,
        status: charge.status,
        description: charge.description,
        created: new Date(charge.created * 1000).toISOString(),
        receiptUrl: charge.receipt_url,
      }));
    } catch {
      return [];
    }
  }),
});
