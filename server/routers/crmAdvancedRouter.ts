import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { invokeLLM } from "../_core/llm";
import { createLogger } from "../_core/logger";

const log = createLogger("CRM");

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "administrator" && ctx.user.role !== "host") throw new Error("Forbidden: admin access required");
  return next({ ctx });
});

// ─── CRM Triggers Router ───
export const crmTriggersRouter = router({
  list: protectedProcedure.input(z.object({
    isActive: z.boolean().optional(),
    eventType: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getCrmTriggers(input);
  }),

  byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getCrmTriggerById(input.id);
  }),

  create: adminProcedure.input(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    eventType: z.enum(["lead_created", "stage_change", "website_visit", "form_submit", "email_opened", "email_replied", "inactivity", "score_threshold", "tag_added", "manual"]),
    conditions: z.record(z.string(), z.any()).optional(),
    actions: z.array(z.object({
      type: z.enum(["ai_enrich", "ai_score", "ai_outreach", "assign_user", "change_stage", "add_tag", "send_email", "notify_owner", "create_task", "ai_analyze"]),
      config: z.record(z.string(), z.any()),
    })),
    isActive: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => {
    const id = await db.createCrmTrigger({ ...input, createdByUserId: ctx.user.id } as any);
    return { success: true, id };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    conditions: z.record(z.string(), z.any()).optional(),
    actions: z.array(z.object({
      type: z.enum(["ai_enrich", "ai_score", "ai_outreach", "assign_user", "change_stage", "add_tag", "send_email", "notify_owner", "create_task", "ai_analyze"]),
      config: z.record(z.string(), z.any()),
    })).optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateCrmTrigger(id, data as any);
    return { success: true };
  }),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteCrmTrigger(input.id);
    return { success: true };
  }),

  logs: protectedProcedure.input(z.object({
    triggerId: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getCrmTriggerLogs(input?.triggerId, input?.limit);
  }),

  // Execute a trigger manually
  execute: adminProcedure.input(z.object({
    triggerId: z.number(),
    leadId: z.number().optional(),
  })).mutation(async ({ input }) => {
    const trigger = await db.getCrmTriggerById(input.triggerId);
    if (!trigger) throw new Error("Trigger not found");

    const results: Array<{ type: string; status: string; result?: any; error?: string }> = [];

    for (const action of (trigger.actions || []) as any[]) {
      try {
        if (action.type === "ai_enrich" && input.leadId) {
          const lead = await db.getCrmLeadById(input.leadId);
          if (lead) {
            const enrichResult = await aiEnrichLead(lead);
            await db.updateCrmLead(input.leadId, enrichResult);
            results.push({ type: "ai_enrich", status: "success", result: enrichResult });
          }
        } else if (action.type === "ai_score" && input.leadId) {
          const lead = await db.getCrmLeadById(input.leadId);
          if (lead) {
            const score = calculateLeadScore(lead);
            await db.updateCrmLead(input.leadId, { score });
            results.push({ type: "ai_score", status: "success", result: { score } });
          }
        } else if (action.type === "ai_outreach" && input.leadId) {
          const lead = await db.getCrmLeadById(input.leadId);
          if (lead) {
            const outreach = await aiGenerateOutreach(lead);
            results.push({ type: "ai_outreach", status: "success", result: outreach });
          }
        } else if (action.type === "ai_analyze" && input.leadId) {
          const lead = await db.getCrmLeadById(input.leadId);
          if (lead) {
            const analysis = await aiAnalyzeLead(lead);
            results.push({ type: "ai_analyze", status: "success", result: analysis });
          }
        } else if (action.type === "change_stage" && input.leadId) {
          await db.updateCrmLead(input.leadId, { stage: action.config.stage });
          results.push({ type: "change_stage", status: "success" });
        } else if (action.type === "add_tag" && input.leadId) {
          const lead = await db.getCrmLeadById(input.leadId);
          if (lead) {
            const tags = [...(lead.tags || []), action.config.tag];
            await db.updateCrmLead(input.leadId, { tags });
            results.push({ type: "add_tag", status: "success" });
          }
        } else {
          results.push({ type: action.type, status: "skipped" });
        }
      } catch (e: any) {
        results.push({ type: action.type, status: "failed", error: e.message });
      }
    }

    await db.addCrmTriggerLog({
      triggerId: input.triggerId,
      leadId: input.leadId,
      eventData: { manual: true },
      actionsExecuted: results,
      status: results.every((r: any) => r.status === "success") ? "success" : results.some((r: any) => r.status === "success") ? "partial" : "failed",
    });

    return { success: true, results };
  }),
});

// ─── CRM Website Visitors Router ───
export const crmVisitorsRouter = router({
  list: protectedProcedure.input(z.object({
    status: z.string().optional(),
    isIdentified: z.boolean().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getCrmWebsiteVisitors(input, input?.limit);
  }),

  track: publicProcedure.input(z.object({
    sessionId: z.string(),
    page: z.string(),
    referrer: z.string().optional(),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
  })).mutation(async ({ input }) => {
    // In production this would use IP-to-company lookup (LeadInfo/Clearbit)
    await db.createCrmWebsiteVisitor({
      sessionId: input.sessionId,
      pagesViewed: [input.page],
      referrer: input.referrer,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
    } as any);
    return { success: true };
  }),

  analyze: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const visitors = await db.getCrmWebsiteVisitors();
    const visitor = visitors.find((v: any) => v.id === input.id);
    if (!visitor) throw new Error("Visitor not found");

    // AI deep analysis of visitor
    const analysis = await aiAnalyzeVisitor(visitor);

    // Check if visitor matches existing pipeline
    const leads = await db.getCrmLeads();
    const matchedLead = leads.find((l: any) =>
      (visitor.companyDomain && l.website?.includes(visitor.companyDomain)) ||
      (visitor.companyName && l.companyName.toLowerCase() === visitor.companyName.toLowerCase())
    );

    await db.updateCrmWebsiteVisitor(input.id, {
      enrichmentData: analysis,
      isIdentified: true,
      status: matchedLead ? "matched" : "identified",
      matchedLeadId: matchedLead?.id,
    } as any);

    return { success: true, analysis, matchedLead: matchedLead ? { id: matchedLead.id, companyName: matchedLead.companyName, stage: matchedLead.stage } : null };
  }),

  generateOutreach: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const visitors = await db.getCrmWebsiteVisitors();
    const visitor = visitors.find((v: any) => v.id === input.id);
    if (!visitor) throw new Error("Visitor not found");

    const outreach = await aiGenerateVisitorOutreach(visitor);
    await db.updateCrmWebsiteVisitor(input.id, { status: "outreach_sent" } as any);
    return { success: true, outreach };
  }),
});

// ─── Member Profiles Router ───
export const memberProfilesRouter = router({
  list: protectedProcedure.input(z.object({
    tier: z.string().optional(),
    search: z.string().optional(),
    isActive: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  }).optional()).query(async ({ input }) => {
    return db.getMemberProfiles(input);
  }),

  byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getMemberProfileById(input.id);
  }),

  stats: protectedProcedure.query(async () => {
    return db.getMemberStats();
  }),

  create: adminProcedure.input(z.object({
    displayName: z.string().min(1),
    email: z.string().optional(),
    phone: z.string().optional(),
    companyName: z.string().optional(),
    jobTitle: z.string().optional(),
    linkedIn: z.string().optional(),
    tier: z.enum(["prospect", "vergaderen", "gebaloteerd"]).optional(),
    locationPreference: z.string().optional(),
    creditBundleType: z.string().optional(),
    source: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createMemberProfile(input as any);
    return { success: true, id };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    displayName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    companyName: z.string().optional(),
    jobTitle: z.string().optional(),
    linkedIn: z.string().optional(),
    tier: z.enum(["prospect", "vergaderen", "gebaloteerd"]).optional(),
    locationPreference: z.string().optional(),
    creditBundleType: z.string().optional(),
    creditBalance: z.string().optional(),
    source: z.string().optional(),
    funnelStage: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    ballotSponsor: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateMemberProfile(id, data as any);
    return { success: true };
  }),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteMemberProfile(input.id);
    return { success: true };
  }),

  bulkUpdateTier: adminProcedure.input(z.object({
    ids: z.array(z.number()),
    tier: z.enum(["prospect", "vergaderen", "gebaloteerd"]),
  })).mutation(async ({ input }) => {
    for (const id of input.ids) {
      await db.updateMemberProfile(id, { tier: input.tier });
    }
    return { success: true, count: input.ids.length };
  }),
});

// ─── Re-engagement Funnel Router ───
export const reengagementRouter = router({
  list: protectedProcedure.input(z.object({
    stage: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getReengagementEntries(input);
  }),

  stats: protectedProcedure.query(async () => {
    return db.getReengagementStats();
  }),

  create: adminProcedure.input(z.object({
    contactName: z.string().min(1),
    contactEmail: z.string().optional(),
    companyName: z.string().optional(),
    previousRelationship: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createReengagementEntry(input as any);
    return { success: true, id };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    stage: z.enum(["identified", "invited", "opened", "applied", "interview", "accepted", "declined"]).optional(),
    personalMessage: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    const updateData: any = { ...data };
    if (data.stage === "invited") updateData.inviteSentAt = new Date();
    if (data.stage === "opened") updateData.inviteOpenedAt = new Date();
    if (data.stage === "applied") updateData.applicationDate = new Date();
    await db.updateReengagementEntry(id, updateData);
    return { success: true };
  }),

  generateInvite: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const entries = await db.getReengagementEntries();
    const entry = entries.find((e: any) => e.id === input.id);
    if (!entry) throw new Error("Entry not found");

    const invite = await aiGenerateReengagementInvite(entry);
    await db.updateReengagementEntry(input.id, { aiGeneratedInvite: invite });
    return { success: true, invite };
  }),
});

// ─── AI Helper Functions ───
async function aiEnrichLead(lead: any) {
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a B2B lead enrichment AI. Given a company name and any available info, return a JSON object with enriched data. Be realistic and use Dutch/European context. Return ONLY valid JSON." },
        { role: "user", content: `Enrich this lead:\nCompany: ${lead.companyName}\nContact: ${lead.contactName || "unknown"}\nWebsite: ${lead.website || "unknown"}\nIndustry: ${lead.industry || "unknown"}\n\nReturn JSON with: { "industry": "...", "companySize": "...", "estimatedValue": "...", "contactEmail": "...", "website": "...", "notes": "AI enrichment summary" }` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "lead_enrichment",
          strict: true,
          schema: {
            type: "object",
            properties: {
              industry: { type: "string" },
              companySize: { type: "string" },
              estimatedValue: { type: "string" },
              contactEmail: { type: "string" },
              website: { type: "string" },
              notes: { type: "string" },
            },
            required: ["industry", "companySize", "estimatedValue", "contactEmail", "website", "notes"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices?.[0]?.message?.content;
    if (content) return JSON.parse(content as string);
  } catch (e) {
    log.error("AI enrich failed:", e);
  }
  return {};
}

function calculateLeadScore(lead: any): number {
  let score = 0;
  if (lead.contactEmail) score += 15;
  if (lead.contactPhone) score += 10;
  if (lead.companySize) {
    const size = parseInt(lead.companySize) || 0;
    if (size >= 50) score += 25;
    else if (size >= 20) score += 20;
    else if (size >= 5) score += 15;
    else score += 5;
  }
  if (lead.estimatedValue) {
    const val = parseFloat(lead.estimatedValue);
    if (val >= 50000) score += 25;
    else if (val >= 10000) score += 20;
    else if (val >= 5000) score += 15;
    else score += 5;
  }
  if (lead.website) score += 5;
  if (lead.locationPreference) score += 10;
  if (lead.industry) score += 5;
  return Math.min(100, score);
}

async function aiGenerateOutreach(lead: any) {
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a personalized outreach specialist for Mr. Green, an exclusive coworking community in the Netherlands. Write a short, personal, compelling outreach email in Dutch. Be warm but professional. The community is 'besloten' (exclusive, by invitation only)." },
        { role: "user", content: `Write a personalized outreach email for:\nBedrijf: ${lead.companyName}\nContact: ${lead.contactName || "de directie"}\nIndustrie: ${lead.industry || "onbekend"}\nGrootte: ${lead.companySize || "onbekend"}\nLocatie voorkeur: ${lead.locationPreference || "Amsterdam"}\n\nReturn JSON: { "subject": "...", "body": "...", "followUpSuggestion": "..." }` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "outreach_email",
          strict: true,
          schema: {
            type: "object",
            properties: {
              subject: { type: "string" },
              body: { type: "string" },
              followUpSuggestion: { type: "string" },
            },
            required: ["subject", "body", "followUpSuggestion"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices?.[0]?.message?.content;
    if (content) return JSON.parse(content as string);
  } catch (e) {
    log.error("AI outreach failed:", e);
  }
  return { subject: "Uitnodiging Mr. Green", body: "Kon geen gepersonaliseerd bericht genereren.", followUpSuggestion: "Bel na 3 dagen op." };
}

async function aiAnalyzeLead(lead: any) {
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a B2B sales analyst for Mr. Green coworking. Analyze the lead and provide strategic insights. Return JSON." },
        { role: "user", content: `Analyze this lead:\nBedrijf: ${lead.companyName}\nContact: ${lead.contactName}\nIndustrie: ${lead.industry}\nGrootte: ${lead.companySize}\nWaarde: €${lead.estimatedValue}\nBron: ${lead.source}\nScore: ${lead.score}\n\nReturn JSON: { "strengths": ["..."], "risks": ["..."], "recommendedApproach": "...", "estimatedCloseTime": "...", "suggestedNextStep": "..." }` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "lead_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              strengths: { type: "array", items: { type: "string" } },
              risks: { type: "array", items: { type: "string" } },
              recommendedApproach: { type: "string" },
              estimatedCloseTime: { type: "string" },
              suggestedNextStep: { type: "string" },
            },
            required: ["strengths", "risks", "recommendedApproach", "estimatedCloseTime", "suggestedNextStep"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices?.[0]?.message?.content;
    if (content) return JSON.parse(content as string);
  } catch (e) {
    log.error("AI analyze failed:", e);
  }
  return { strengths: [], risks: [], recommendedApproach: "Neem contact op", estimatedCloseTime: "Onbekend", suggestedNextStep: "Bel op" };
}

async function aiAnalyzeVisitor(visitor: any) {
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a website visitor intelligence analyst for Mr. Green coworking. Analyze the visitor data and identify the company. Return JSON with company details." },
        { role: "user", content: `Analyze this website visitor:\nIP City: ${visitor.city || "unknown"}\nCompany hint: ${visitor.companyName || "unknown"}\nDomain: ${visitor.companyDomain || "unknown"}\nPages: ${JSON.stringify(visitor.pagesViewed || [])}\nVisits: ${visitor.totalVisits}\nReferrer: ${visitor.referrer || "direct"}\n\nReturn JSON: { "companyName": "...", "industry": "...", "companySize": "...", "revenue": "...", "intent": "high/medium/low", "interestAreas": ["..."], "recommendedAction": "..." }` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "visitor_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              companyName: { type: "string" },
              industry: { type: "string" },
              companySize: { type: "string" },
              revenue: { type: "string" },
              intent: { type: "string" },
              interestAreas: { type: "array", items: { type: "string" } },
              recommendedAction: { type: "string" },
            },
            required: ["companyName", "industry", "companySize", "revenue", "intent", "interestAreas", "recommendedAction"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices?.[0]?.message?.content;
    if (content) return JSON.parse(content as string);
  } catch (e) {
    log.error("AI visitor analyze failed:", e);
  }
  return { companyName: "Onbekend", industry: "Onbekend", companySize: "Onbekend", revenue: "Onbekend", intent: "medium", interestAreas: [], recommendedAction: "Monitor" };
}

async function aiGenerateVisitorOutreach(visitor: any) {
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a personalized outreach specialist for Mr. Green coworking. Write a very personal, warm email in Dutch based on what pages the visitor viewed. The community is exclusive and by invitation only." },
        { role: "user", content: `Write outreach for website visitor:\nBedrijf: ${visitor.companyName || "Onbekend"}\nIndustrie: ${visitor.companyIndustry || "Onbekend"}\nBekeken pagina's: ${JSON.stringify(visitor.pagesViewed || [])}\nAantal bezoeken: ${visitor.totalVisits}\nStad: ${visitor.city || "Onbekend"}\n\nReturn JSON: { "subject": "...", "body": "...", "channel": "email/linkedin/phone" }` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "visitor_outreach",
          strict: true,
          schema: {
            type: "object",
            properties: {
              subject: { type: "string" },
              body: { type: "string" },
              channel: { type: "string" },
            },
            required: ["subject", "body", "channel"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices?.[0]?.message?.content;
    if (content) return JSON.parse(content as string);
  } catch (e) {
    log.error("AI visitor outreach failed:", e);
  }
  return { subject: "Welkom bij Mr. Green", body: "Kon geen gepersonaliseerd bericht genereren.", channel: "email" };
}

async function aiGenerateReengagementInvite(entry: any) {
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are writing exclusive re-engagement invitations for Mr. Green, a 'besloten community' (closed community) in the Netherlands. The doors are closing but we want to give this person a key. Write in Dutch, warm and personal. Make them feel special." },
        { role: "user", content: `Write a re-engagement invite for:\nNaam: ${entry.contactName}\nBedrijf: ${entry.companyName || "Onbekend"}\nEerdere relatie: ${entry.previousRelationship || "Onbekend"}\n\nWrite a compelling, personal invitation that makes them feel like they're getting exclusive access to something special. Return the full email text as a string.` },
      ],
    });
    const content = response.choices?.[0]?.message?.content;
    return (typeof content === "string" ? content : "") || "Kon geen uitnodiging genereren.";
  } catch (e) {
    log.error("AI re-engagement invite failed:", e);
    return "Kon geen uitnodiging genereren.";
  }
}
