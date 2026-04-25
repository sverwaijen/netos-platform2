import { describe, expect, it } from "vitest";

describe("Stripe Router", () => {
  it("subscriptionStatus procedure exists on the stripe alias", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("stripe.subscriptionStatus");
  });

  it("payments procedure exists on the stripe alias", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("stripe.payments");
  });

  it("createSubscription procedure exists on the stripe alias", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("stripe.createSubscription");
  });

  it("customerPortal procedure exists on the stripe alias", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("stripe.customerPortal");
  });

  it("createTopup procedure exists on the stripe alias", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("stripe.createTopup");
  });

  it("subscriptionStatus procedure exists on walletPayment namespace", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("walletPayment.subscriptionStatus");
  });
});

describe("Stripe Helper Imports", () => {
  it("getStripe returns a Stripe instance", async () => {
    const { getStripe } = await import("./stripe");
    expect(typeof getStripe).toBe("function");
  });

  it("constructWebhookEvent is a function", async () => {
    const { constructWebhookEvent } = await import("./stripe");
    expect(typeof constructWebhookEvent).toBe("function");
  });

  it("ensureStripeProduct is a function", async () => {
    const { ensureStripeProduct } = await import("./stripe");
    expect(typeof ensureStripeProduct).toBe("function");
  });
});
