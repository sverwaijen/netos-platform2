import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb, getCrmWebsiteVisitors, createCrmWebsiteVisitor, updateCrmWebsiteVisitor } from "../db";
import { crmWebsiteVisitors, type CrmWebsiteVisitor, type InsertCrmWebsiteVisitor } from "../../drizzle/schema";
import visitorTrackingService from "../integrations/visitorTrackingService";
import { createLogger } from "../_core/logger";

const log = createLogger("VisitorTracking");

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "administrator" && ctx.user.role !== "host") {
    throw new Error("Forbidden: admin access required");
  }
  return next({ ctx });
});

export const visitorTrackingRouter = router({
  /**
   * Track a website visit (public endpoint, called from tracking script)
   */
  trackVisit: publicProcedure
    .input(
      z.object({
        ip: z.string(),
        page: z.string(),
        referrer: z.string().optional(),
        userAgent: z.string().optional(),
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Get IP from request if not provided
        const clientIp =
          input.ip ||
          (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")?.[0]?.trim() ||
          ctx.req?.socket?.remoteAddress ||
          "unknown";

        // Lookup company from IP
        const companyInfo = await visitorTrackingService.lookupCompanyByIp(clientIp);

        // Check for duplicate visit (same IP within 30 minutes)
        const recentVisitors = await getCrmWebsiteVisitors({ isIdentified: true }, 100);
        const isNewVisit = await visitorTrackingService.shouldTrackAsNewVisit(
          clientIp,
          recentVisitors.map(v => ({
            ip: v.ipAddress ?? "",
            visitedAt: v.lastVisitAt ? new Date(v.lastVisitAt).getTime() : 0,
          }))
        );

        if (!isNewVisit) {
          return { success: true, isDuplicate: true };
        }

        // Store visit in database
        const visitId = await createCrmWebsiteVisitor({
          sessionId: `visit_${Date.now()}_${clientIp.replace(/\./g, "_")}`,
          ipAddress: clientIp,
          companyName: companyInfo.companyName,
          companyDomain: companyInfo.companyDomain,
          city: companyInfo.city,
          country: companyInfo.country,
          pagesViewed: [input.page],
          referrer: input.referrer,
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          utmCampaign: input.utmCampaign,
          isIdentified: !!companyInfo.companyName,
        });

        return { success: true, visitId, isDuplicate: false };
      } catch (error) {
        log.error("Visitor tracking error", error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }),

  /**
   * Get recent visitors with company info, grouped by company
   */
  getRecentVisitors: adminProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        hoursBack: z.number().default(24),
        companyName: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const hoursInMs = input.hoursBack * 60 * 60 * 1000;
      const timeThreshold = Date.now() - hoursInMs;

      let visitors = await getCrmWebsiteVisitors(
        { isIdentified: true },
        input.limit
      );

      // Filter by company name if provided
      if (input.companyName) {
        const searchName = input.companyName.toLowerCase();
        visitors = visitors.filter(v =>
          v.companyName?.toLowerCase().includes(searchName)
        );
      }

      // Group by company and get stats
      const grouped = groupVisitorsByCompany(visitors);

      return grouped;
    }),

  /**
   * Get tracking script for embedding on website
   */
  getTrackingScript: adminProcedure.query(async ({ ctx }) => {
    // Generate account ID from user ID
    const accountId = `acc_${ctx.user.id}`;

    const script = visitorTrackingService.generateTrackingScript(accountId, {
      trackPageViews: true,
      trackClicks: true,
      trackFormSubmissions: true,
    });

    return {
      accountId,
      script,
      installationInstructions: `
Add this script to your website's HTML, ideally in the <head> or just before closing </body>:

${script}

The script will automatically:
1. Detect visitor company from IP address
2. Track page visits
3. Capture click patterns
4. Monitor form submissions
5. Track UTM parameters for campaign tracking
      `,
    };
  }),

  /**
   * Link a visitor (by IP) to a CRM lead
   */
  linkVisitorToLead: adminProcedure
    .input(
      z.object({
        visitorId: z.number(),
        leadId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await updateCrmWebsiteVisitor(input.visitorId, {
        matchedLeadId: input.leadId,
      });

      return { success: true };
    }),

  /**
   * Manually create a visitor entry
   */
  createVisitor: adminProcedure
    .input(
      z.object({
        ip: z.string(),
        companyName: z.string().optional(),
        companyDomain: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        pageUrl: z.string(),
        leadId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const visitId = await createCrmWebsiteVisitor({
        sessionId: `manual_${Date.now()}`,
        ipAddress: input.ip,
        companyName: input.companyName,
        companyDomain: input.companyDomain,
        city: input.city,
        country: input.country,
        pagesViewed: [input.pageUrl],
        matchedLeadId: input.leadId,
        isIdentified: !!input.companyName,
      });

      return { success: true, visitId };
    }),

  /**
   * Get visitor details
   */
  getVisitorById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const visitors = await getCrmWebsiteVisitors();
      return visitors.find(v => v.id === input.id);
    }),

  /**
   * Get visitor history for an IP
   */
  getVisitorHistory: adminProcedure
    .input(z.object({ ip: z.string(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const visitors = await getCrmWebsiteVisitors({}, 100);
      const ipVisitors = visitors.slice(0, input.limit);
      return ipVisitors;
    }),

  /**
   * Delete visitor (privacy/GDPR)
   */
  deleteVisitor: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db_instance = await getDb();
      if (db_instance) {
        await db_instance.delete(crmWebsiteVisitors).where(eq(crmWebsiteVisitors.id, input.id));
      }
      return { success: true };
    }),

  /**
   * Get visitor stats
   */
  getStats: adminProcedure
    .input(
      z.object({
        hoursBack: z.number().default(24),
      })
    )
    .query(async ({ input }) => {
      const hoursInMs = input.hoursBack * 60 * 60 * 1000;
      const timeThreshold = Date.now() - hoursInMs;

      const visitors = await getCrmWebsiteVisitors({}, 100);

      const uniqueCompanies = new Set(
        visitors.filter(v => v.companyName).map(v => v.companyName)
      ).size;

      const uniqueIps = new Set(visitors.map(v => v.ipAddress)).size;

      const withLeadMatches = visitors.filter(v => v.matchedLeadId).length;

      const identifiedCount = visitors.filter(v => v.companyName).length;

      return {
        totalVisits: visitors.length,
        uniqueIps,
        uniqueCompanies,
        matchedToLeads: withLeadMatches,
        conversions: {
          identified: identifiedCount,
          rate: visitors.length > 0
            ? ((identifiedCount / visitors.length) * 100).toFixed(1)
            : "0.0",
        },
      };
    }),
});

/**
 * Group visitors by company and aggregate stats
 */
function groupVisitorsByCompany(visitors: CrmWebsiteVisitor[]) {
  const grouped: Record<
    string,
    {
      company: string;
      domain?: string | null;
      city?: string | null;
      country?: string | null;
      visitCount: number;
      lastVisit: number;
      leadId?: number | null;
      pages: string[];
      ips: string[];
      visitors: CrmWebsiteVisitor[];
    }
  > = {};

  for (const visitor of visitors) {
    const key = visitor.companyName || visitor.ipAddress || "unknown";

    if (!grouped[key]) {
      grouped[key] = {
        company: visitor.companyName || `Unknown (${visitor.ipAddress})`,
        domain: visitor.companyDomain,
        city: visitor.city,
        country: visitor.country,
        visitCount: 0,
        lastVisit: 0,
        leadId: visitor.matchedLeadId,
        pages: [],
        ips: [],
        visitors: [],
      };
    }

    grouped[key].visitCount++;
    const visitTime = visitor.lastVisitAt ? new Date(visitor.lastVisitAt).getTime() : 0;
    grouped[key].lastVisit = Math.max(grouped[key].lastVisit, visitTime);

    // Collect pages from pagesViewed array
    if (visitor.pagesViewed) {
      for (const page of visitor.pagesViewed) {
        if (!grouped[key].pages.includes(page)) {
          grouped[key].pages.push(page);
        }
      }
    }

    if (visitor.ipAddress && !grouped[key].ips.includes(visitor.ipAddress)) {
      grouped[key].ips.push(visitor.ipAddress);
    }

    grouped[key].visitors.push(visitor);
  }

  return Object.values(grouped).sort((a, b) => b.visitCount - a.visitCount);
}
