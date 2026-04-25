import { z } from "zod";
import { eq, and, sql, ne } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { emailCampaignSends } from "../../drizzle/pg-schema";
import { send, buildCampaignEmail, isValidEmail } from "../integrations/emailService";
import { nanoid } from "nanoid";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "administrator" && ctx.user.role !== "host") throw new Error("Forbidden: admin access required");
  return next({ ctx });
});

// ─── Email Campaign Router ──────────────────────────────────────────
export const campaignRouter = router({
  // Send campaign email to a lead
  sendCampaign: adminProcedure
    .input(z.object({
      campaignId: z.number(),
      leadId: z.number(),
      leadName: z.string(),
      leadEmail: z.string().email(),
      companyName: z.string(),
      subject: z.string(),
      bodyTemplate: z.string(),
      baseUrl: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Validate email
      if (!isValidEmail(input.leadEmail)) {
        return { success: false, error: "Invalid email address" };
      }

      // Create send record
      const sendId = `send_${nanoid(12)}`;
      const [sendRecord] = await db.insert(emailCampaignSends).values({
        campaignId: input.campaignId,
        leadId: input.leadId,
        email: input.leadEmail,
        status: "queued",
        resendMessageId: sendId,
      }).returning();

      try {
        // Build email with tracking
        const emailOptions = await buildCampaignEmail({
          leadName: input.leadName,
          leadEmail: input.leadEmail,
          companyName: input.companyName,
          subject: input.subject,
          bodyTemplate: input.bodyTemplate,
          baseUrl: input.baseUrl,
          campaignId: input.campaignId,
          leadId: input.leadId,
          sendId,
        });

        // Send email
        const result = await send(emailOptions);

        if (result.success) {
          // Update status to sent
          await db.update(emailCampaignSends).set({
            status: "sent",
            sentAt: new Date(),
            resendMessageId: result.messageId || sendId,
          }).where(eq(emailCampaignSends.id, sendRecord.id));

          return { success: true, sendId: sendRecord.id };
        } else {
          // Mark as failed
          await db.update(emailCampaignSends).set({
            status: "bounced",
            notes: result.error,
          }).where(eq(emailCampaignSends.id, sendRecord.id));

          return { success: false, error: result.error };
        }
      } catch (error: unknown) {
        await db.update(emailCampaignSends).set({
          status: "bounced",
          notes: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        }).where(eq(emailCampaignSends.id, sendRecord.id));

        return { success: false, error: `Failed to send: ${error instanceof Error ? error.message : "Unknown error"}` };
      }
    }),

  // Get campaign statistics
  getCampaignStats: adminProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { totalSent: 0, totalOpened: 0, totalClicked: 0, totalBounced: 0, openRate: "0%", clickRate: "0%" };

      const [stats] = await db.select({
        totalSent: sql<number>`COUNT(CASE WHEN status IN ('sent', 'opened', 'clicked') THEN 1 END)`,
        totalOpened: sql<number>`COUNT(CASE WHEN status IN ('opened', 'clicked') THEN 1 END)`,
        totalClicked: sql<number>`COUNT(CASE WHEN status = 'clicked' THEN 1 END)`,
        totalBounced: sql<number>`COUNT(CASE WHEN status = 'bounced' THEN 1 END)`,
      }).from(emailCampaignSends).where(eq(emailCampaignSends.campaignId, input.campaignId));

      const totalSent = stats?.totalSent || 0;
      const totalOpened = stats?.totalOpened || 0;
      const totalClicked = stats?.totalClicked || 0;
      const totalBounced = stats?.totalBounced || 0;

      const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0";
      const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : "0";

      return {
        totalSent,
        totalOpened,
        totalClicked,
        totalBounced,
        openRate: `${openRate}%`,
        clickRate: `${clickRate}%`,
      };
    }),

  // Handle unsubscribe
  handleUnsubscribe: publicProcedure
    .input(z.object({ sendId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      await db.update(emailCampaignSends).set({
        status: "unsubscribed",
        updatedAt: new Date(),
      }).where(eq(emailCampaignSends.id, input.sendId));

      return { success: true };
    }),

  // Track email open (called by tracking pixel)
  trackEmailOpen: publicProcedure
    .input(z.object({ sendId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      // Parse sendId and find the record
      const [send] = await db.select().from(emailCampaignSends)
        .where(eq(emailCampaignSends.resendMessageId, input.sendId)).limit(1);

      if (send && send.status !== "bounced") {
        const newStatus = send.status === "clicked" ? "clicked" : "opened";
        await db.update(emailCampaignSends).set({
          status: newStatus,
          openedAt: send.openedAt || new Date(),
          updatedAt: new Date(),
        }).where(eq(emailCampaignSends.id, send.id));
      }

      return { success: true };
    }),

  // Track email click
  trackEmailClick: publicProcedure
    .input(z.object({ sendId: z.string(), url: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, redirectUrl: input.url };

      // Find the send record and update
      const [send] = await db.select().from(emailCampaignSends)
        .where(eq(emailCampaignSends.resendMessageId, input.sendId)).limit(1);

      if (send) {
        await db.update(emailCampaignSends).set({
          status: "clicked",
          clickedAt: send.clickedAt || new Date(),
          clickCount: (send.clickCount || 0) + 1,
          updatedAt: new Date(),
        }).where(eq(emailCampaignSends.id, send.id));
      }

      return { success: true, redirectUrl: input.url };
    }),

  // List sends by campaign
  listSends: adminProcedure
    .input(z.object({
      campaignId: z.number(),
      status: z.string().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(emailCampaignSends.campaignId, input.campaignId)];
      if (input.status) {
        conditions.push(eq(emailCampaignSends.status, input.status as any));
      }

      return db.select().from(emailCampaignSends)
        .where(and(...conditions))
        .limit(input.limit || 100);
    }),

  // Get send details
  getSendDetails: adminProcedure
    .input(z.object({ sendId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [send] = await db.select().from(emailCampaignSends)
        .where(eq(emailCampaignSends.id, input.sendId)).limit(1);

      return send || null;
    }),
});
