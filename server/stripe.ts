import Stripe from "stripe";
import { ENV } from "./_core/env";

// ─── Stripe Client ───────────────────────────────────────────────────
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!ENV.stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(ENV.stripeSecretKey, { apiVersion: "2025-03-31.basil" as any });
  }
  return _stripe;
}

// ─── Products / Prices ───────────────────────────────────────────────
// We sync products from our credit_bundles table to Stripe on demand.
// Each bundle becomes a Stripe Product + recurring Price.

export interface BundleForStripe {
  id: number;
  name: string;
  slug: string;
  creditsPerMonth: number;
  priceEur: string;
  description?: string | null;
  features?: string[] | null;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
}

/**
 * Ensure a Stripe Product + Price exist for a given bundle.
 * Returns { stripeProductId, stripePriceId }.
 */
export async function ensureStripeProduct(bundle: BundleForStripe): Promise<{
  stripeProductId: string;
  stripePriceId: string;
}> {
  const stripe = getStripe();

  // If already synced, verify they still exist
  if (bundle.stripeProductId && bundle.stripePriceId) {
    try {
      await stripe.products.retrieve(bundle.stripeProductId);
      return { stripeProductId: bundle.stripeProductId, stripePriceId: bundle.stripePriceId };
    } catch {
      // Product deleted in Stripe, recreate
    }
  }

  // Create product
  const product = await stripe.products.create({
    name: bundle.name,
    description: bundle.description || `${bundle.creditsPerMonth} credits/month`,
    metadata: {
      bundle_id: bundle.id.toString(),
      slug: bundle.slug,
      credits_per_month: bundle.creditsPerMonth.toString(),
    },
  });

  // Create recurring price (monthly)
  const priceAmountCents = Math.round(parseFloat(bundle.priceEur) * 100);
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: priceAmountCents,
    currency: "eur",
    recurring: { interval: "month" },
    metadata: { bundle_id: bundle.id.toString() },
  });

  return { stripeProductId: product.id, stripePriceId: price.id };
}

// ─── Checkout Sessions ───────────────────────────────────────────────

export interface CreateCheckoutParams {
  userId: number;
  userEmail: string;
  userName: string;
  bundleId: number;
  stripePriceId: string;
  origin: string;
  stripeCustomerId?: string | null;
  mode: "subscription" | "payment";
}

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<string> {
  const stripe = getStripe();

  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    mode: params.mode,
    line_items: [{ price: params.stripePriceId, quantity: 1 }],
    success_url: `${params.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/payment/cancel`,
    client_reference_id: params.userId.toString(),
    customer_email: params.stripeCustomerId ? undefined : params.userEmail,
    customer: params.stripeCustomerId || undefined,
    allow_promotion_codes: true,
    metadata: {
      user_id: params.userId.toString(),
      bundle_id: params.bundleId.toString(),
      customer_email: params.userEmail,
      customer_name: params.userName,
    },
  };

  const session = await stripe.checkout.sessions.create(sessionConfig);
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

// ─── One-time credit top-up ──────────────────────────────────────────

export interface CreateTopupCheckoutParams {
  userId: number;
  userEmail: string;
  userName: string;
  credits: number;
  amountEur: number;
  origin: string;
  stripeCustomerId?: string | null;
}

export async function createTopupCheckoutSession(params: CreateTopupCheckoutParams): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "eur",
        unit_amount: Math.round(params.amountEur * 100),
        product_data: {
          name: `${params.credits} Credits Top-up`,
          description: `One-time purchase of ${params.credits} credits for The Green`,
        },
      },
      quantity: 1,
    }],
    success_url: `${params.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/payment/cancel`,
    client_reference_id: params.userId.toString(),
    customer_email: params.stripeCustomerId ? undefined : params.userEmail,
    customer: params.stripeCustomerId || undefined,
    allow_promotion_codes: true,
    metadata: {
      user_id: params.userId.toString(),
      type: "topup",
      credits: params.credits.toString(),
      customer_email: params.userEmail,
      customer_name: params.userName,
    },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

// ─── Webhook Verification ────────────────────────────────────────────

export function constructWebhookEvent(
  body: Buffer,
  signature: string,
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(body, signature, ENV.stripeWebhookSecret);
}

// ─── Customer Management ─────────────────────────────────────────────

export async function getOrCreateStripeCustomer(
  email: string,
  name: string,
  metadata: Record<string, string>,
): Promise<string> {
  const stripe = getStripe();

  // Search for existing customer
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) return existing.data[0].id;

  // Create new
  const customer = await stripe.customers.create({ email, name, metadata });
  return customer.id;
}

// ─── Subscription Management ─────────────────────────────────────────

export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return getStripe().subscriptions.retrieve(subscriptionId);
}

export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return getStripe().subscriptions.cancel(subscriptionId);
}

export async function getCustomerPortalUrl(customerId: string, returnUrl: string): Promise<string> {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}
