import type { Express, Request, Response } from "express";
import { ENV } from "../_core/env";
import { createLogger } from "../_core/logger";
import { fulfillCheckoutSession } from "./walletPaymentRouter";

const logger = createLogger("StripeWebhook");

/**
 * Register the Stripe webhook endpoint on the Express app.
 *
 * This must be registered BEFORE the global JSON body parser because
 * Stripe webhook signature verification requires the raw request body.
 */
export function registerStripeWebhook(app: Express) {
  // Only register if Stripe is configured
  if (!ENV.STRIPE_SECRET_KEY) {
    logger.info("Stripe not configured — webhook route skipped");
    return;
  }

  const stripe = require("stripe").default(ENV.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
    maxNetworkRetries: 3,
  });

  app.post(
    "/api/stripe/webhook",
    // Use raw body parser for Stripe signature verification
    require("express").raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"];

      if (!sig) {
        logger.warn("Stripe webhook received without signature header");
        res.status(400).json({ error: "Missing stripe-signature header" });
        return;
      }

      let event;

      try {
        if (ENV.STRIPE_WEBHOOK_SECRET) {
          // Verify signature in production
          event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            ENV.STRIPE_WEBHOOK_SECRET
          );
        } else {
          // In development, parse without signature verification
          logger.warn("Stripe webhook secret not configured — skipping signature verification");
          event = JSON.parse(req.body.toString());
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        logger.error("Stripe webhook signature verification failed", { error: message });
        res.status(400).json({ error: `Webhook Error: ${message}` });
        return;
      }

      logger.info("Stripe webhook received", { type: event.type, id: event.id });

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object;
            if (session.payment_status === "paid") {
              const result = await fulfillCheckoutSession(session.id);
              logger.info("Checkout session fulfilled", {
                sessionId: session.id,
                alreadyProcessed: result.alreadyProcessed,
              });
            } else {
              logger.info("Checkout session completed but not yet paid", {
                sessionId: session.id,
                paymentStatus: session.payment_status,
              });
            }
            break;
          }

          case "checkout.session.async_payment_succeeded": {
            // For payment methods like iDEAL that may have async confirmation
            const session = event.data.object;
            const result = await fulfillCheckoutSession(session.id);
            logger.info("Async payment succeeded", {
              sessionId: session.id,
              alreadyProcessed: result.alreadyProcessed,
            });
            break;
          }

          case "checkout.session.async_payment_failed": {
            // Mark the transaction as failed
            const session = event.data.object;
            const transactionId = parseInt(session.client_reference_id || "0", 10);
            if (transactionId) {
              const { getDb } = require("../db");
              const { walletTransactions } = require("../../drizzle/schema");
              const { eq } = require("drizzle-orm");
              const db = await getDb();
              if (db) {
                await db
                  .update(walletTransactions)
                  .set({ status: "failed" })
                  .where(eq(walletTransactions.id, transactionId));
                logger.info("Async payment failed, transaction marked", { transactionId });
              }
            }
            break;
          }

          case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object;
            logger.warn("Payment intent failed", {
              paymentIntentId: paymentIntent.id,
              error: paymentIntent.last_payment_error?.message,
            });
            break;
          }

          default:
            logger.debug("Unhandled Stripe event type", { type: event.type });
        }

        res.json({ received: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        logger.error("Error processing Stripe webhook", {
          type: event.type,
          error: message,
        });
        // Return 200 to prevent Stripe from retrying — log for manual investigation
        res.json({ received: true, error: message });
      }
    }
  );

  logger.info("Stripe webhook route registered at /api/stripe/webhook");
}
