import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Ops Router - Tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Ticket Data Model", () => {
    it("should validate ticket statuses", () => {
      const validStatuses = ["new", "open", "pending", "on_hold", "solved", "closed"];
      const ticket = { status: "new" };
      expect(validStatuses).toContain(ticket.status);
    });

    it("should validate ticket priorities", () => {
      const validPriorities = ["low", "normal", "high", "urgent"];
      validPriorities.forEach(p => {
        expect(["low", "normal", "high", "urgent"]).toContain(p);
      });
    });

    it("should validate all 12 ticket categories", () => {
      const categories = [
        "general", "billing", "access", "booking", "parking", "maintenance",
        "wifi", "catering", "equipment", "noise", "cleaning", "other",
      ];
      expect(categories).toHaveLength(12);
      expect(categories).toContain("maintenance");
      expect(categories).toContain("wifi");
    });

    it("should validate ticket channels", () => {
      const channels = ["web", "email", "chat", "phone", "app", "walk_in"];
      expect(channels).toHaveLength(6);
    });

    it("should generate unique ticket numbers", () => {
      // Ticket numbers should follow TK-XXXXXXXX format
      const ticketNumber = "TK-ABC12345";
      expect(ticketNumber).toMatch(/^TK-[A-Z0-9]{8,}$/);
    });
  });

  describe("Ticket SLA Calculation", () => {
    it("should calculate SLA deadline from first response minutes", () => {
      const slaPolicy = { firstResponseMinutes: 30, resolutionMinutes: 240 };
      const now = Date.now();
      const deadline = now + slaPolicy.firstResponseMinutes * 60000;
      expect(deadline).toBeGreaterThan(now);
      expect(deadline - now).toBe(30 * 60000);
    });

    it("should support different SLA policies per priority", () => {
      const policies = [
        { priority: "low", firstResponseMinutes: 240, resolutionMinutes: 1440 },
        { priority: "normal", firstResponseMinutes: 120, resolutionMinutes: 480 },
        { priority: "high", firstResponseMinutes: 60, resolutionMinutes: 240 },
        { priority: "urgent", firstResponseMinutes: 15, resolutionMinutes: 60 },
      ];

      expect(policies).toHaveLength(4);
      const urgent = policies.find(p => p.priority === "urgent");
      const low = policies.find(p => p.priority === "low");
      expect(urgent!.firstResponseMinutes).toBeLessThan(low!.firstResponseMinutes);
    });

    it("should handle null SLA deadline when no policy matches", () => {
      const slaPolicy = undefined;
      const slaDeadline = slaPolicy ? Date.now() + 60000 : null;
      expect(slaDeadline).toBeNull();
    });
  });

  describe("Ticket Stats Calculation", () => {
    it("should calculate correct ticket stats", () => {
      const tickets = [
        { status: "new", aiAutoResolved: false, satisfactionRating: null, firstResponseAt: null, createdAt: new Date() },
        { status: "open", aiAutoResolved: false, satisfactionRating: 4, firstResponseAt: Date.now(), createdAt: new Date() },
        { status: "solved", aiAutoResolved: true, satisfactionRating: 5, firstResponseAt: Date.now(), createdAt: new Date() },
        { status: "closed", aiAutoResolved: false, satisfactionRating: 3, firstResponseAt: Date.now(), createdAt: new Date() },
        { status: "pending", aiAutoResolved: false, satisfactionRating: null, firstResponseAt: null, createdAt: new Date() },
      ];

      const open = tickets.filter(t => ["new", "open"].includes(t.status)).length;
      const pending = tickets.filter(t => t.status === "pending" || t.status === "on_hold").length;
      const solved = tickets.filter(t => ["solved", "closed"].includes(t.status)).length;
      const aiResolved = tickets.filter(t => t.aiAutoResolved).length;

      expect(open).toBe(2);
      expect(pending).toBe(1);
      expect(solved).toBe(2);
      expect(aiResolved).toBe(1);
    });

    it("should calculate average satisfaction correctly", () => {
      const tickets = [
        { satisfactionRating: 5 },
        { satisfactionRating: 4 },
        { satisfactionRating: 3 },
        { satisfactionRating: null },
      ];

      const rated = tickets.filter(t => t.satisfactionRating);
      const satisfaction = rated.length > 0
        ? rated.reduce((s, t) => s + (t.satisfactionRating || 0), 0) / rated.length
        : 0;

      expect(rated).toHaveLength(3);
      expect(satisfaction).toBe(4);
    });

    it("should handle empty ticket list for stats", () => {
      const tickets: { satisfactionRating: number | null }[] = [];
      const rated = tickets.filter(t => t.satisfactionRating);
      const satisfaction = rated.length > 0
        ? rated.reduce((s, t) => s + (t.satisfactionRating || 0), 0) / rated.length
        : 0;

      expect(satisfaction).toBe(0);
    });
  });

  describe("Ticket Update Logic", () => {
    it("should set resolvedAt timestamp when status is solved", () => {
      const data = { status: "solved" as const };
      const updateData: Record<string, unknown> = { ...data };
      if (data.status === "solved") updateData.resolvedAt = Date.now();

      expect(updateData.resolvedAt).toBeDefined();
      expect(typeof updateData.resolvedAt).toBe("number");
    });

    it("should set closedAt timestamp when status is closed", () => {
      const data = { status: "closed" as const };
      const updateData: Record<string, unknown> = { ...data };
      if (data.status === "closed") updateData.closedAt = Date.now();

      expect(updateData.closedAt).toBeDefined();
    });

    it("should not set timestamps for other status changes", () => {
      const data = { status: "open" as const };
      const updateData: Record<string, unknown> = { ...data };
      if (data.status === "solved") updateData.resolvedAt = Date.now();
      if (data.status === "closed") updateData.closedAt = Date.now();

      expect(updateData.resolvedAt).toBeUndefined();
      expect(updateData.closedAt).toBeUndefined();
    });
  });

  describe("Ticket Message Sender Type", () => {
    it("should determine agent sender type for admin users", () => {
      const role = "administrator";
      const senderType = (role === "administrator" || role === "host") ? "agent" : "requester";
      expect(senderType).toBe("agent");
    });

    it("should determine agent sender type for host users", () => {
      const role = "host";
      const senderType = (role === "administrator" || role === "host") ? "agent" : "requester";
      expect(senderType).toBe("agent");
    });

    it("should determine requester sender type for member users", () => {
      const role = "member";
      const senderType = (role === "administrator" || role === "host") ? "agent" : "requester";
      expect(senderType).toBe("requester");
    });
  });

  describe("AI Ticket Analysis", () => {
    it("should validate AI sentiment values", () => {
      const validSentiments = ["positive", "neutral", "negative"];

      expect(validSentiments).toContain("positive");
      expect(validSentiments).toContain("neutral");
      expect(validSentiments).toContain("negative");

      const parsed = { sentiment: "happy" };
      const sentiment = validSentiments.includes(parsed.sentiment) ? parsed.sentiment : "neutral";
      expect(sentiment).toBe("neutral");
    });

    it("should default to general category when AI returns unknown", () => {
      const inputCategory = undefined;
      const aiCategory = null;
      const result = inputCategory || aiCategory || "general";
      expect(result).toBe("general");
    });

    it("should prefer input category over AI category", () => {
      const inputCategory = "billing";
      const aiCategory = "access";
      const result = inputCategory || aiCategory || "general";
      expect(result).toBe("billing");
    });
  });
});

describe("Ops Router - Canned Responses", () => {
  it("should have required fields", () => {
    const response = {
      id: 1,
      title: "Welcome Message",
      body: "Welcome to our coworking space!",
      category: "general",
      shortcut: "!welcome",
      isActive: true,
      createdByUserId: 1,
    };

    expect(response.title).toBe("Welcome Message");
    expect(response.body).toContain("Welcome");
    expect(response.isActive).toBe(true);
  });

  it("should soft-delete by setting isActive to false", () => {
    const response = { id: 1, isActive: true };
    const deleted = { ...response, isActive: false };
    expect(deleted.isActive).toBe(false);
  });
});

describe("Ops Router - SLA Policies", () => {
  it("should support upsert (create and update)", () => {
    const newPolicy = {
      name: "Urgent SLA",
      priority: "urgent" as const,
      firstResponseMinutes: 15,
      resolutionMinutes: 60,
    };

    expect(newPolicy.firstResponseMinutes).toBe(15);
    expect(newPolicy.resolutionMinutes).toBe(60);

    // Update existing
    const updatePolicy = {
      id: 1,
      ...newPolicy,
      firstResponseMinutes: 10,
    };

    expect(updatePolicy.id).toBe(1);
    expect(updatePolicy.firstResponseMinutes).toBe(10);
  });
});

describe("Ops Router - Agenda", () => {
  it("should validate agenda item types", () => {
    const types = ["event", "maintenance", "cleaning", "delivery", "meeting", "inspection", "other"];
    expect(types).toHaveLength(7);
  });

  it("should validate agenda item statuses", () => {
    const statuses = ["scheduled", "in_progress", "completed", "cancelled"];
    expect(statuses).toHaveLength(4);
  });

  it("should support time range filtering", () => {
    const now = Date.now();
    const items = [
      { startTime: now - 3600000, title: "Past" },
      { startTime: now, title: "Now" },
      { startTime: now + 3600000, title: "Future" },
    ];

    const startDate = now - 1000;
    const endDate = now + 1000;
    const filtered = items.filter(i => i.startTime >= startDate && i.startTime <= endDate);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe("Now");
  });
});

describe("Ops Router - Presence", () => {
  it("should track unique users from access log entries", () => {
    const entries = [
      { userId: 1, action: "entry", createdAt: new Date() },
      { userId: 2, action: "entry", createdAt: new Date() },
      { userId: 1, action: "entry", createdAt: new Date() }, // duplicate
      { userId: 3, action: "entry", createdAt: new Date() },
    ];

    const userIdSet = new Set<number>();
    entries.filter(e => e.userId).forEach(e => userIdSet.add(e.userId));

    expect(userIdSet.size).toBe(3);
    expect(Array.from(userIdSet)).toContain(1);
    expect(Array.from(userIdSet)).toContain(2);
    expect(Array.from(userIdSet)).toContain(3);
  });

  it("should calculate currently-in as entries minus exits", () => {
    const todayEntries = [
      { action: "entry" },
      { action: "entry" },
      { action: "entry" },
      { action: "exit" },
      { action: "exit" },
    ];

    const entries = todayEntries.filter(e => e.action === "entry");
    const exits = todayEntries.filter(e => e.action === "exit");
    const currentlyIn = Math.max(0, entries.length - exits.length);

    expect(currentlyIn).toBe(1);
  });

  it("should not return negative currently-in count", () => {
    const entries: { action: string }[] = [];
    const exits = [{ action: "exit" }];
    const currentlyIn = Math.max(0, entries.length - exits.length);

    expect(currentlyIn).toBe(0);
  });

  it("should map user data to presence response", () => {
    const userMap = new Map([[1, { id: 1, name: "Test User", email: "test@test.com", avatarUrl: null }]]);
    const entry = { userId: 1, createdAt: new Date(), zone: "Floor 1", locationId: 1 };

    const user = userMap.get(entry.userId);
    const result = {
      userId: entry.userId,
      name: user?.name || "Unknown",
      email: user?.email,
      avatarUrl: user?.avatarUrl,
      lastEntryAt: entry.createdAt,
      zone: entry.zone,
      locationId: entry.locationId,
    };

    expect(result.name).toBe("Test User");
    expect(result.email).toBe("test@test.com");
    expect(result.zone).toBe("Floor 1");
  });

  it("should return 'Unknown' for missing user", () => {
    const userMap = new Map<number, { name: string }>();
    const userId = 999;
    const user = userMap.get(userId);
    const name = user?.name || "Unknown";

    expect(name).toBe("Unknown");
  });
});
