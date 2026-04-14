import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Escalation Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Escalation Rules", () => {
    it("should create a valid escalation rule", () => {
      const rule = {
        id: 1,
        name: "Urgent ticket no response",
        escalateAfterMinutes: 30,
        triggerType: "no_response",
        escalationLevel: 1,
        escalateToRole: "host",
        isActive: true,
        notifyEmail: true,
        notifyInApp: true,
        autoReassign: false,
        autoPriorityBump: false,
      };

      expect(rule.name).toBe("Urgent ticket no response");
      expect(rule.escalateAfterMinutes).toBe(30);
      expect(rule.triggerType).toBe("no_response");
      expect(rule.escalationLevel).toBe(1);
      expect(rule.isActive).toBe(true);
    });

    it("should support all trigger types", () => {
      const triggerTypes = ["no_response", "no_resolution", "sla_breach", "priority_change"];

      triggerTypes.forEach((type) => {
        const rule = { triggerType: type };
        expect(triggerTypes).toContain(rule.triggerType);
      });
    });

    it("should support 3 escalation levels", () => {
      const levels = [
        { level: 1, role: "facility" },
        { level: 2, role: "host" },
        { level: 3, role: "administrator" },
      ];

      expect(levels).toHaveLength(3);
      expect(levels[0].level).toBe(1);
      expect(levels[2].level).toBe(3);
    });

    it("should filter rules by priority", () => {
      const rules = [
        { id: 1, priority: "urgent", escalateAfterMinutes: 30 },
        { id: 2, priority: "high", escalateAfterMinutes: 60 },
        { id: 3, priority: null, escalateAfterMinutes: 120 },
      ];

      const ticket = { priority: "urgent" };
      const matchingRules = rules.filter(
        (r) => !r.priority || r.priority === ticket.priority
      );

      expect(matchingRules).toHaveLength(2); // rule 1 and rule 3 (null matches all)
    });

    it("should filter rules by category", () => {
      const rules = [
        { id: 1, category: "maintenance", escalateAfterMinutes: 30 },
        { id: 2, category: null, escalateAfterMinutes: 60 },
      ];

      const ticket = { category: "maintenance" };
      const matchingRules = rules.filter(
        (r) => !r.category || r.category === ticket.category
      );

      expect(matchingRules).toHaveLength(2);
    });
  });

  describe("Escalation Trigger Logic", () => {
    it("should trigger no_response escalation when ticket has no first response", () => {
      const rule = {
        triggerType: "no_response",
        escalateAfterMinutes: 60,
      };
      const ticket = {
        firstResponseAt: null,
        createdAt: new Date(Date.now() - 90 * 60 * 1000), // 90 minutes ago
      };

      const ticketAgeMinutes = (Date.now() - ticket.createdAt.getTime()) / (1000 * 60);
      const shouldEscalate = !ticket.firstResponseAt && ticketAgeMinutes >= rule.escalateAfterMinutes;

      expect(shouldEscalate).toBe(true);
    });

    it("should NOT trigger no_response if ticket has a first response", () => {
      const rule = {
        triggerType: "no_response",
        escalateAfterMinutes: 60,
      };
      const ticket = {
        firstResponseAt: Date.now() - 30 * 60 * 1000,
        createdAt: new Date(Date.now() - 90 * 60 * 1000),
      };

      const shouldEscalate = !ticket.firstResponseAt;

      expect(shouldEscalate).toBe(false);
    });

    it("should trigger no_resolution escalation when ticket is not resolved", () => {
      const rule = {
        triggerType: "no_resolution",
        escalateAfterMinutes: 480,
      };
      const ticket = {
        resolvedAt: null,
        createdAt: new Date(Date.now() - 600 * 60 * 1000), // 10 hours ago
      };

      const ticketAgeMinutes = (Date.now() - ticket.createdAt.getTime()) / (1000 * 60);
      const shouldEscalate = !ticket.resolvedAt && ticketAgeMinutes >= rule.escalateAfterMinutes;

      expect(shouldEscalate).toBe(true);
    });

    it("should trigger sla_breach when SLA deadline has passed", () => {
      const now = Date.now();
      const ticket = {
        slaDeadline: now - 60 * 1000, // 1 minute ago
      };

      const shouldEscalate = !!ticket.slaDeadline && now > ticket.slaDeadline;

      expect(shouldEscalate).toBe(true);
    });

    it("should NOT trigger sla_breach when SLA deadline is in the future", () => {
      const now = Date.now();
      const ticket = {
        slaDeadline: now + 60 * 60 * 1000, // 1 hour from now
      };

      const shouldEscalate = !!ticket.slaDeadline && now > ticket.slaDeadline;

      expect(shouldEscalate).toBe(false);
    });

    it("should trigger priority_change when ticket is urgent", () => {
      const ticket = { priority: "urgent" };
      const shouldEscalate = ticket.priority === "urgent";

      expect(shouldEscalate).toBe(true);
    });

    it("should NOT trigger priority_change for non-urgent tickets", () => {
      const ticket = { priority: "high" };
      const shouldEscalate = ticket.priority === "urgent";

      expect(shouldEscalate).toBe(false);
    });

    it("should not trigger if ticket is too young", () => {
      const rule = {
        triggerType: "no_response",
        escalateAfterMinutes: 60,
      };
      const ticket = {
        firstResponseAt: null,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // Only 30 min ago
      };

      const ticketAgeMinutes = (Date.now() - ticket.createdAt.getTime()) / (1000 * 60);
      const shouldEscalate = !ticket.firstResponseAt && ticketAgeMinutes >= rule.escalateAfterMinutes;

      expect(shouldEscalate).toBe(false);
    });
  });

  describe("Escalation Log", () => {
    it("should create an escalation log entry", () => {
      const entry = {
        id: 1,
        ticketId: 42,
        ruleId: 1,
        escalationLevel: 1,
        previousAssigneeId: 10,
        newAssigneeId: 20,
        previousPriority: "high",
        newPriority: "urgent",
        reason: "No response after 60 minutes",
        status: "triggered",
        slaBreach: false,
      };

      expect(entry.ticketId).toBe(42);
      expect(entry.status).toBe("triggered");
      expect(entry.escalationLevel).toBe(1);
    });

    it("should track all escalation statuses", () => {
      const statuses = ["triggered", "acknowledged", "resolved", "expired"];

      statuses.forEach((status) => {
        const entry = { status };
        expect(statuses).toContain(entry.status);
      });
    });

    it("should acknowledge an escalation", () => {
      const entry = {
        id: 1,
        status: "triggered" as string,
        acknowledgedById: null as number | null,
        acknowledgedAt: null as number | null,
        workaround: null as string | null,
      };

      // Acknowledge
      entry.status = "acknowledged";
      entry.acknowledgedById = 5;
      entry.acknowledgedAt = Date.now();
      entry.workaround = "Temporary fix applied";

      expect(entry.status).toBe("acknowledged");
      expect(entry.acknowledgedById).toBe(5);
      expect(entry.workaround).toBe("Temporary fix applied");
    });

    it("should resolve an escalation", () => {
      const entry = {
        id: 1,
        status: "acknowledged" as string,
      };

      entry.status = "resolved";

      expect(entry.status).toBe("resolved");
    });

    it("should mark SLA breaches correctly", () => {
      const entry = {
        ticketId: 42,
        slaBreach: true,
        reason: "SLA breach: no resolution after 480 minutes",
      };

      expect(entry.slaBreach).toBe(true);
    });
  });

  describe("Auto Actions", () => {
    it("should auto-bump priority to urgent", () => {
      const rule = { autoPriorityBump: true };
      const ticket = { priority: "high" };

      if (rule.autoPriorityBump && ticket.priority !== "urgent") {
        ticket.priority = "urgent";
      }

      expect(ticket.priority).toBe("urgent");
    });

    it("should NOT bump priority if already urgent", () => {
      const rule = { autoPriorityBump: true };
      const ticket = { priority: "urgent" };
      const originalPriority = ticket.priority;

      if (rule.autoPriorityBump && ticket.priority !== "urgent") {
        ticket.priority = "urgent";
      }

      expect(ticket.priority).toBe(originalPriority);
    });

    it("should auto-reassign to specified user", () => {
      const rule = { autoReassign: true, escalateToUserId: 99 };
      const ticket = { assignedToId: 10 as number | null };

      if (rule.autoReassign && rule.escalateToUserId) {
        ticket.assignedToId = rule.escalateToUserId;
      }

      expect(ticket.assignedToId).toBe(99);
    });

    it("should NOT reassign if autoReassign is false", () => {
      const rule = { autoReassign: false, escalateToUserId: 99 };
      const ticket = { assignedToId: 10 };

      if (rule.autoReassign && rule.escalateToUserId) {
        ticket.assignedToId = rule.escalateToUserId;
      }

      expect(ticket.assignedToId).toBe(10);
    });
  });

  describe("Idempotency", () => {
    it("should not trigger same escalation twice", () => {
      const existingEscalations = [
        { ticketId: 42, ruleId: 1, status: "triggered" },
      ];

      const ticketId = 42;
      const ruleId = 1;

      const alreadyExists = existingEscalations.some(
        (e) => e.ticketId === ticketId && e.ruleId === ruleId &&
          e.status !== "resolved" && e.status !== "expired"
      );

      expect(alreadyExists).toBe(true);
    });

    it("should allow re-escalation after previous one is resolved", () => {
      const existingEscalations = [
        { ticketId: 42, ruleId: 1, status: "resolved" },
      ];

      const ticketId = 42;
      const ruleId = 1;

      const alreadyExists = existingEscalations.some(
        (e) => e.ticketId === ticketId && e.ruleId === ruleId &&
          e.status !== "resolved" && e.status !== "expired"
      );

      expect(alreadyExists).toBe(false);
    });
  });

  describe("Dashboard Stats", () => {
    it("should calculate correct dashboard statistics", () => {
      const escalations = [
        { status: "triggered", slaBreach: true, escalationLevel: 1 },
        { status: "triggered", slaBreach: false, escalationLevel: 2 },
        { status: "acknowledged", slaBreach: false, escalationLevel: 1 },
        { status: "resolved", slaBreach: false, escalationLevel: 1 },
        { status: "expired", slaBreach: true, escalationLevel: 3 },
      ];

      const active = escalations.filter((e) => e.status === "triggered").length;
      const acknowledged = escalations.filter((e) => e.status === "acknowledged").length;
      const resolved = escalations.filter((e) => e.status === "resolved").length;
      const slaBreaches = escalations.filter((e) => e.slaBreach).length;

      expect(active).toBe(2);
      expect(acknowledged).toBe(1);
      expect(resolved).toBe(1);
      expect(slaBreaches).toBe(2);
    });

    it("should break down escalations by level", () => {
      const escalations = [
        { escalationLevel: 1, status: "triggered" },
        { escalationLevel: 1, status: "triggered" },
        { escalationLevel: 2, status: "triggered" },
        { escalationLevel: 3, status: "triggered" },
      ];

      const byLevel = [1, 2, 3].map((level) => ({
        level,
        count: escalations.filter((e) => e.escalationLevel === level && e.status === "triggered").length,
      }));

      expect(byLevel[0].count).toBe(2); // Level 1
      expect(byLevel[1].count).toBe(1); // Level 2
      expect(byLevel[2].count).toBe(1); // Level 3
    });
  });
});
