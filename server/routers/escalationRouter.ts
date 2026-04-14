import { z } from "zod";
import { eq, and, desc, lte, isNull, ne, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  escalationRules, escalationLog, tickets, ticketSlaPolicies, users,
} from "../../drizzle/schema";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "administrator" && ctx.user.role !== "host") {
    throw new Error("Forbidden: admin or host role required");
  }
  return next({ ctx });
});

// ─── Escalation Rules Router ────────────────────────────────────────
export const escalationRulesRouter = router({
  // List all escalation rules
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(escalationRules).orderBy(escalationRules.escalationLevel);
  }),

  // Get single rule
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(escalationRules).where(eq(escalationRules.id, input.id));
      return rows[0] ?? null;
    }),

  // Create escalation rule
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
      category: z.string().optional(),
      escalateAfterMinutes: z.number().min(1),
      triggerType: z.enum(["no_response", "no_resolution", "sla_breach", "priority_change"]),
      escalationLevel: z.number().min(1).max(3),
      escalateToRole: z.enum(["administrator", "host", "teamadmin", "member", "guest"]).optional(),
      escalateToUserId: z.number().optional(),
      notifyEmail: z.boolean().optional(),
      notifyInApp: z.boolean().optional(),
      autoReassign: z.boolean().optional(),
      autoPriorityBump: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const result = await db.insert(escalationRules).values({
        name: input.name,
        description: input.description,
        priority: input.priority,
        category: input.category,
        escalateAfterMinutes: input.escalateAfterMinutes,
        triggerType: input.triggerType,
        escalationLevel: input.escalationLevel,
        escalateToRole: input.escalateToRole ?? "host",
        escalateToUserId: input.escalateToUserId,
        notifyEmail: input.notifyEmail ?? true,
        notifyInApp: input.notifyInApp ?? true,
        autoReassign: input.autoReassign ?? false,
        autoPriorityBump: input.autoPriorityBump ?? false,
      });

      return { success: true, id: result.insertId };
    }),

  // Update escalation rule
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
      category: z.string().optional(),
      escalateAfterMinutes: z.number().min(1).optional(),
      triggerType: z.enum(["no_response", "no_resolution", "sla_breach", "priority_change"]).optional(),
      escalationLevel: z.number().min(1).max(3).optional(),
      escalateToRole: z.enum(["administrator", "host", "teamadmin", "member", "guest"]).optional(),
      escalateToUserId: z.number().nullable().optional(),
      notifyEmail: z.boolean().optional(),
      notifyInApp: z.boolean().optional(),
      autoReassign: z.boolean().optional(),
      autoPriorityBump: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const { id, ...updates } = input;
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined)
      );

      if (Object.keys(cleanUpdates).length === 0) {
        return { success: true };
      }

      await db.update(escalationRules).set(cleanUpdates).where(eq(escalationRules.id, id));
      return { success: true };
    }),

  // Delete escalation rule
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(escalationRules).set({ isActive: false }).where(eq(escalationRules.id, input.id));
      return { success: true };
    }),
});

// ─── Escalation Log Router ──────────────────────────────────────────
export const escalationLogRouter = router({
  // List escalation log entries (with optional filters)
  list: adminProcedure
    .input(z.object({
      ticketId: z.number().optional(),
      status: z.enum(["triggered", "acknowledged", "resolved", "expired"]).optional(),
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions: any[] = [];
      if (input?.ticketId) conditions.push(eq(escalationLog.ticketId, input.ticketId));
      if (input?.status) conditions.push(eq(escalationLog.status, input.status));

      const q = conditions.length > 0
        ? db.select().from(escalationLog).where(and(...conditions))
        : db.select().from(escalationLog);

      return q.orderBy(desc(escalationLog.createdAt)).limit(input?.limit ?? 50);
    }),

  // Acknowledge an escalation
  acknowledge: adminProcedure
    .input(z.object({
      id: z.number(),
      workaround: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      await db.update(escalationLog).set({
        status: "acknowledged",
        acknowledgedById: ctx.user.id,
        acknowledgedAt: Date.now(),
        workaround: input.workaround,
      }).where(eq(escalationLog.id, input.id));

      return { success: true };
    }),

  // Resolve an escalation
  resolve: adminProcedure
    .input(z.object({
      id: z.number(),
      workaround: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      await db.update(escalationLog).set({
        status: "resolved",
        workaround: input.workaround,
      }).where(eq(escalationLog.id, input.id));

      return { success: true };
    }),

  // Get escalation dashboard stats
  dashboard: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        activeEscalations: 0,
        triggeredToday: 0,
        acknowledgedToday: 0,
        resolvedToday: 0,
        avgAcknowledgeMinutes: 0,
        breachedSla: 0,
        byLevel: [],
      };
    }

    // Count active (triggered) escalations
    const activeResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(escalationLog)
      .where(eq(escalationLog.status, "triggered"));
    const activeEscalations = activeResult[0]?.count ?? 0;

    // Today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const triggeredTodayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(escalationLog)
      .where(
        and(
          sql`${escalationLog.createdAt} >= ${todayStart}`,
        )
      );
    const triggeredToday = triggeredTodayResult[0]?.count ?? 0;

    const acknowledgedTodayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(escalationLog)
      .where(
        and(
          eq(escalationLog.status, "acknowledged"),
          sql`${escalationLog.createdAt} >= ${todayStart}`,
        )
      );
    const acknowledgedToday = acknowledgedTodayResult[0]?.count ?? 0;

    const resolvedTodayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(escalationLog)
      .where(
        and(
          eq(escalationLog.status, "resolved"),
          sql`${escalationLog.createdAt} >= ${todayStart}`,
        )
      );
    const resolvedToday = resolvedTodayResult[0]?.count ?? 0;

    // SLA breaches
    const breachedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(escalationLog)
      .where(eq(escalationLog.slaBreach, true));
    const breachedSla = breachedResult[0]?.count ?? 0;

    // By level breakdown
    const byLevel = await db
      .select({
        level: escalationLog.escalationLevel,
        count: sql<number>`count(*)`,
      })
      .from(escalationLog)
      .where(eq(escalationLog.status, "triggered"))
      .groupBy(escalationLog.escalationLevel);

    return {
      activeEscalations,
      triggeredToday,
      acknowledgedToday,
      resolvedToday,
      avgAcknowledgeMinutes: 0, // Simplified — compute in production
      breachedSla,
      byLevel: byLevel.map((r) => ({ level: r.level, count: r.count })),
    };
  }),

  // Check and trigger pending escalations (called periodically)
  checkEscalations: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    // Get active escalation rules
    const rules = await db
      .select()
      .from(escalationRules)
      .where(eq(escalationRules.isActive, true));

    if (rules.length === 0) return { triggered: 0 };

    // Get open tickets that haven't been escalated yet at each level
    const openTickets = await db
      .select()
      .from(tickets)
      .where(
        and(
          ne(tickets.status, "solved"),
          ne(tickets.status, "closed"),
        )
      );

    let triggered = 0;
    const now = Date.now();

    for (const ticket of openTickets) {
      const ticketAge = now - new Date(ticket.createdAt).getTime();
      const ticketAgeMinutes = ticketAge / (1000 * 60);

      for (const rule of rules) {
        // Check if this rule matches the ticket
        if (rule.priority && rule.priority !== ticket.priority) continue;
        if (rule.category && rule.category !== ticket.category) continue;

        // Check timing condition
        let shouldEscalate = false;

        switch (rule.triggerType) {
          case "no_response":
            shouldEscalate = !ticket.firstResponseAt && ticketAgeMinutes >= rule.escalateAfterMinutes;
            break;
          case "no_resolution":
            shouldEscalate = !ticket.resolvedAt && ticketAgeMinutes >= rule.escalateAfterMinutes;
            break;
          case "sla_breach":
            shouldEscalate = !!ticket.slaDeadline && now > ticket.slaDeadline;
            break;
          case "priority_change":
            shouldEscalate = ticket.priority === "urgent";
            break;
        }

        if (!shouldEscalate) continue;

        // Check if this exact escalation was already triggered
        const existing = await db
          .select()
          .from(escalationLog)
          .where(
            and(
              eq(escalationLog.ticketId, ticket.id),
              eq(escalationLog.ruleId, rule.id),
              ne(escalationLog.status, "resolved"),
              ne(escalationLog.status, "expired"),
            )
          );

        if (existing.length > 0) continue; // Already escalated by this rule

        // Trigger the escalation
        const isSla = rule.triggerType === "sla_breach";

        await db.insert(escalationLog).values({
          ticketId: ticket.id,
          ruleId: rule.id,
          escalationLevel: rule.escalationLevel,
          previousAssigneeId: ticket.assignedToId,
          newAssigneeId: rule.escalateToUserId ?? ticket.assignedToId,
          previousPriority: ticket.priority,
          newPriority: rule.autoPriorityBump && ticket.priority !== "urgent" ? "urgent" : ticket.priority,
          reason: `${rule.name}: ${rule.triggerType.replace(/_/g, " ")} after ${rule.escalateAfterMinutes} minutes`,
          slaBreach: isSla,
          status: "triggered",
        });

        // Auto-reassign if configured
        if (rule.autoReassign && rule.escalateToUserId) {
          await db
            .update(tickets)
            .set({ assignedToId: rule.escalateToUserId })
            .where(eq(tickets.id, ticket.id));
        }

        // Auto priority bump if configured
        if (rule.autoPriorityBump && ticket.priority !== "urgent") {
          await db
            .update(tickets)
            .set({ priority: "urgent" })
            .where(eq(tickets.id, ticket.id));
        }

        triggered++;
      }
    }

    return { triggered };
  }),
});
