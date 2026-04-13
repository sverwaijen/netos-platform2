import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import {
  tickets, ticketMessages, ticketSlaPolicies, cannedResponses,
  opsAgenda, accessLog, users,
} from "../../drizzle/schema";
import { eq, and, desc, sql, gte, lte, ne, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createLogger } from "../_core/logger";

const log = createLogger("Ops");

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "administrator" && ctx.user.role !== "host") throw new Error("Forbidden");
  return next({ ctx });
});

// ─── Tickets Router (Zendesk-style) ───
export const ticketsRouter = router({
  list: protectedProcedure.input(z.object({
    status: z.string().optional(),
    priority: z.string().optional(),
    category: z.string().optional(),
    assignedToId: z.number().optional(),
    requesterId: z.number().optional(),
    search: z.string().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: any[] = [];
    if (input?.status && input.status !== "all") conditions.push(eq(tickets.status, input.status as any));
    if (input?.priority) conditions.push(eq(tickets.priority, input.priority as any));
    if (input?.category) conditions.push(eq(tickets.category, input.category as any));
    if (input?.assignedToId) conditions.push(eq(tickets.assignedToId, input.assignedToId));
    if (input?.requesterId) conditions.push(eq(tickets.requesterId, input.requesterId));
    if (input?.search) conditions.push(or(like(tickets.subject, `%${input.search}%`), like(tickets.ticketNumber, `%${input.search}%`)));
    // Non-admin users only see their own tickets
    if (ctx.user.role !== "administrator" && ctx.user.role !== "host") {
      conditions.push(eq(tickets.requesterId, ctx.user.id));
    }
    const q = conditions.length > 0
      ? db.select().from(tickets).where(and(...conditions))
      : db.select().from(tickets);
    return q.orderBy(desc(tickets.updatedAt)).limit(input?.limit || 100);
  }),

  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select().from(tickets).where(eq(tickets.id, input.id));
    return rows[0] ?? null;
  }),

  create: protectedProcedure.input(z.object({
    subject: z.string(),
    description: z.string().optional(),
    category: z.enum(["general", "billing", "access", "booking", "parking", "maintenance", "wifi", "catering", "equipment", "noise", "cleaning", "other"]).optional(),
    priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    locationId: z.number().optional(),
    resourceId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: false, ticketId: 0 };
    const ticketNumber = `TK-${nanoid(8).toUpperCase()}`;
    
    // AI auto-categorize and suggest response
    let aiSuggestion: string | null = null;
    let aiCategory: string | null = null;
    let aiSentiment: "positive" | "neutral" | "negative" | null = null;
    let aiAutoResolved = false;

    try {
      const aiResponse = await invokeLLM({
        messages: [
          { role: "system", content: `You are a coworking space support AI. Analyze this support ticket and respond with JSON:
{
  "category": "one of: general, billing, access, booking, parking, maintenance, wifi, catering, equipment, noise, cleaning, other",
  "sentiment": "positive, neutral, or negative",
  "suggestedResponse": "A helpful response to the member",
  "canAutoResolve": true/false (true only for simple FAQ-type questions),
  "priority": "low, normal, high, or urgent"
}` },
          { role: "user", content: `Subject: ${input.subject}\n\nDescription: ${input.description || "No description"}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ticket_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                category: { type: "string" },
                sentiment: { type: "string" },
                suggestedResponse: { type: "string" },
                canAutoResolve: { type: "boolean" },
                priority: { type: "string" },
              },
              required: ["category", "sentiment", "suggestedResponse", "canAutoResolve", "priority"],
              additionalProperties: false,
            },
          },
        },
      });
      const parsed = JSON.parse(String(aiResponse.choices[0].message.content || "{}"));
      aiSuggestion = parsed.suggestedResponse || null;
      aiCategory = parsed.category || null;
      aiSentiment = (["positive", "neutral", "negative"].includes(parsed.sentiment) ? parsed.sentiment : "neutral") as any;
      aiAutoResolved = parsed.canAutoResolve === true;
    } catch (e) {
      log.warn("AI ticket analysis failed", { error: String(e) });
    }

    // Calculate SLA deadline
    const slaPolicies = await db.select().from(ticketSlaPolicies).where(eq(ticketSlaPolicies.priority, input.priority || "normal"));
    const slaPolicy = slaPolicies[0];
    const slaDeadline = slaPolicy ? Date.now() + slaPolicy.firstResponseMinutes * 60000 : null;

    const result = await db.insert(tickets).values({
      ticketNumber,
      subject: input.subject,
      description: input.description,
      category: (input.category || aiCategory || "general") as any,
      priority: input.priority || "normal",
      channel: "web",
      requesterId: ctx.user.id,
      locationId: input.locationId,
      resourceId: input.resourceId,
      aiSuggestion,
      aiCategory,
      aiSentiment,
      aiAutoResolved,
      slaDeadline,
      status: aiAutoResolved ? "solved" : "new",
    });

    const ticketId = (result as any)[0]?.insertId;

    // If AI auto-resolved, add the AI response as a message
    if (aiAutoResolved && aiSuggestion && ticketId) {
      await db.insert(ticketMessages).values({
        ticketId,
        senderType: "ai",
        body: aiSuggestion,
        isInternal: false,
      });
    }

    return { success: true, ticketId, ticketNumber, aiAutoResolved };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["new", "open", "pending", "on_hold", "solved", "closed"]).optional(),
    priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    category: z.enum(["general", "billing", "access", "booking", "parking", "maintenance", "wifi", "catering", "equipment", "noise", "cleaning", "other"]).optional(),
    assignedToId: z.number().optional(),
    tags: z.array(z.string()).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const { id, ...data } = input;
    const updateData: any = { ...data };
    if (data.status === "solved") updateData.resolvedAt = Date.now();
    if (data.status === "closed") updateData.closedAt = Date.now();
    await db.update(tickets).set(updateData).where(eq(tickets.id, id));
    return { success: true };
  }),

  addMessage: protectedProcedure.input(z.object({
    ticketId: z.number(),
    body: z.string(),
    isInternal: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const senderType = (ctx.user.role === "administrator" || ctx.user.role === "host") ? "agent" : "requester";
    await db.insert(ticketMessages).values({
      ticketId: input.ticketId,
      senderId: ctx.user.id,
      senderType: senderType as any,
      body: input.body,
      isInternal: input.isInternal || false,
    });
    // Update ticket status
    if (senderType === "agent") {
      const ticket = await db.select().from(tickets).where(eq(tickets.id, input.ticketId));
      if (ticket[0] && !ticket[0].firstResponseAt) {
        await db.update(tickets).set({ firstResponseAt: Date.now(), status: "open" }).where(eq(tickets.id, input.ticketId));
      } else {
        await db.update(tickets).set({ status: "open" }).where(eq(tickets.id, input.ticketId));
      }
    } else {
      await db.update(tickets).set({ status: "open" }).where(eq(tickets.id, input.ticketId));
    }
    return { success: true };
  }),

  getMessages: protectedProcedure.input(z.object({ ticketId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(ticketMessages).where(eq(ticketMessages.ticketId, input.ticketId)).orderBy(ticketMessages.createdAt);
  }),

  rate: protectedProcedure.input(z.object({
    id: z.number(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.update(tickets).set({
      satisfactionRating: input.rating,
      satisfactionComment: input.comment,
    }).where(eq(tickets.id, input.id));
    return { success: true };
  }),

  stats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, open: 0, pending: 0, solved: 0, avgResponseMinutes: 0, satisfaction: 0, aiResolved: 0 };
    const all = await db.select().from(tickets);
    const open = all.filter(t => ["new", "open"].includes(t.status)).length;
    const pending = all.filter(t => t.status === "pending" || t.status === "on_hold").length;
    const solved = all.filter(t => ["solved", "closed"].includes(t.status)).length;
    const aiResolved = all.filter(t => t.aiAutoResolved).length;
    const rated = all.filter(t => t.satisfactionRating);
    const satisfaction = rated.length > 0 ? rated.reduce((s, t) => s + (t.satisfactionRating || 0), 0) / rated.length : 0;
    const responded = all.filter(t => t.firstResponseAt && t.createdAt);
    const avgResponseMinutes = responded.length > 0
      ? responded.reduce((s, t) => s + (Number(t.firstResponseAt) - new Date(t.createdAt).getTime()) / 60000, 0) / responded.length
      : 0;
    return { total: all.length, open, pending, solved, avgResponseMinutes: Math.round(avgResponseMinutes), satisfaction: Math.round(satisfaction * 10) / 10, aiResolved };
  }),

  aiSuggest: adminProcedure.input(z.object({ ticketId: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { suggestion: "" };
    const ticket = await db.select().from(tickets).where(eq(tickets.id, input.ticketId));
    if (!ticket[0]) return { suggestion: "" };
    const messages = await db.select().from(ticketMessages).where(eq(ticketMessages.ticketId, input.ticketId)).orderBy(ticketMessages.createdAt);
    
    const conversation = messages.map(m => `[${m.senderType}]: ${m.body}`).join("\n");
    
    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a helpful coworking space support agent. Suggest a professional, friendly response to this ticket. Be concise and actionable." },
          { role: "user", content: `Ticket: ${ticket[0].subject}\n\nConversation:\n${conversation}\n\nSuggest a response:` },
        ],
      });
      return { suggestion: String(response.choices[0].message.content || "") };
    } catch (e) {
      return { suggestion: "Unable to generate suggestion at this time." };
    }
  }),
});

// ─── Canned Responses Router ───
export const cannedResponsesRouter = router({
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(cannedResponses).where(eq(cannedResponses.isActive, true)).orderBy(cannedResponses.title);
  }),

  create: adminProcedure.input(z.object({
    title: z.string(),
    body: z.string(),
    category: z.string().optional(),
    shortcut: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.insert(cannedResponses).values({ ...input, createdByUserId: ctx.user.id });
    return { success: true };
  }),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.update(cannedResponses).set({ isActive: false }).where(eq(cannedResponses.id, input.id));
    return { success: true };
  }),
});

// ─── SLA Policies Router ───
export const slaRouter = router({
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(ticketSlaPolicies).orderBy(ticketSlaPolicies.priority);
  }),

  upsert: adminProcedure.input(z.object({
    id: z.number().optional(),
    name: z.string(),
    priority: z.enum(["low", "normal", "high", "urgent"]),
    firstResponseMinutes: z.number(),
    resolutionMinutes: z.number(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    if (input.id) {
      const { id, ...data } = input;
      await db.update(ticketSlaPolicies).set(data).where(eq(ticketSlaPolicies.id, id));
    } else {
      await db.insert(ticketSlaPolicies).values(input);
    }
    return { success: true };
  }),
});

// ─── Ops Agenda Router ───
export const opsAgendaRouter = router({
  list: protectedProcedure.input(z.object({
    locationId: z.number().optional(),
    startDate: z.number().optional(),
    endDate: z.number().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: any[] = [];
    if (input?.locationId) conditions.push(eq(opsAgenda.locationId, input.locationId));
    if (input?.type) conditions.push(eq(opsAgenda.type, input.type as any));
    if (input?.status) conditions.push(eq(opsAgenda.status, input.status as any));
    if (input?.startDate) conditions.push(gte(opsAgenda.startTime, input.startDate));
    if (input?.endDate) conditions.push(lte(opsAgenda.startTime, input.endDate));
    const q = conditions.length > 0
      ? db.select().from(opsAgenda).where(and(...conditions))
      : db.select().from(opsAgenda);
    return q.orderBy(opsAgenda.startTime).limit(200);
  }),

  create: adminProcedure.input(z.object({
    locationId: z.number(),
    title: z.string(),
    description: z.string().optional(),
    type: z.enum(["event", "maintenance", "cleaning", "delivery", "meeting", "inspection", "other"]).optional(),
    startTime: z.number(),
    endTime: z.number().optional(),
    assignedToId: z.number().optional(),
    priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.insert(opsAgenda).values(input);
    return { success: true };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
    assignedToId: z.number().optional(),
    priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const { id, ...data } = input;
    await db.update(opsAgenda).set(data).where(eq(opsAgenda.id, id));
    return { success: true };
  }),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.delete(opsAgenda).where(eq(opsAgenda.id, input.id));
    return { success: true };
  }),
});

// ─── Presence (Who is in) ───
export const presenceRouter = router({
  whoIsIn: protectedProcedure.input(z.object({
    locationId: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const conditions: any[] = [
      eq(accessLog.action, "entry"),
      gte(accessLog.createdAt, new Date(todayStart)),
    ];
    if (input?.locationId) conditions.push(eq(accessLog.locationId, input.locationId));
    
    const entries = await db.select().from(accessLog).where(and(...conditions)).orderBy(desc(accessLog.createdAt));
    
    // Get unique user IDs who entered today
    const userIdSet = new Set<number>();
    entries.filter(e => e.userId).forEach(e => userIdSet.add(e.userId!));
    const userIds = Array.from(userIdSet);
    if (userIds.length === 0) return [];
    
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u]));
    
    return userIds.map(id => {
      const user = userMap.get(id);
      const lastEntry = entries.find(e => e.userId === id);
      return {
        userId: id,
        name: user?.name || "Unknown",
        email: user?.email,
        avatarUrl: user?.avatarUrl,
        lastEntryAt: lastEntry?.createdAt,
        zone: lastEntry?.zone,
        locationId: lastEntry?.locationId,
      };
    });
  }),

  stats: protectedProcedure.input(z.object({ locationId: z.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { totalToday: 0, currentlyIn: 0, peakHour: 0, avgDailyVisitors: 0 };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const conditions: any[] = [gte(accessLog.createdAt, new Date(today.getTime()))];
    if (input?.locationId) conditions.push(eq(accessLog.locationId, input.locationId));
    
    const todayEntries = await db.select().from(accessLog).where(and(...conditions));
    const entries = todayEntries.filter(e => e.action === "entry");
    const exits = todayEntries.filter(e => e.action === "exit");
    
    const uniqueUserIds = entries.filter(e => e.userId).map(e => e.userId!);
    const seen = new Set<number>();
    uniqueUserIds.forEach(id => seen.add(id));
    const uniqueCount = seen.size;
    const currentlyIn = Math.max(0, entries.length - exits.length);
    
    return {
      totalToday: uniqueCount,
      currentlyIn,
      peakHour: 9,
      avgDailyVisitors: Math.round(uniqueCount * 1.2),
    };
  }),
});
