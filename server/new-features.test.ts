import { describe, it, expect } from "vitest";

// Test Invoice PDF generation module
describe("Invoice PDF generation", () => {
  it("generateInvoicePdf exports a function that takes an invoiceId", async () => {
    const mod = await import("./invoicePdf");
    expect(typeof mod.generateInvoicePdf).toBe("function");
    expect(mod.generateInvoicePdf.length).toBe(1);
  });

  it("generateInvoicePdf throws for non-existent invoice", async () => {
    const { generateInvoicePdf } = await import("./invoicePdf");
    await expect(generateInvoicePdf(999999)).rejects.toThrow();
  });
});

// Test Audit Logger
describe("Audit Logger", () => {
  it("logAudit exports a function", async () => {
    const mod = await import("./auditLogger");
    expect(typeof mod.logAudit).toBe("function");
  });

  it("queryAuditLogs exports a function", async () => {
    const mod = await import("./auditLogger");
    expect(typeof mod.queryAuditLogs).toBe("function");
  });

  it("logAudit can write an audit entry without throwing", async () => {
    const { logAudit } = await import("./auditLogger");
    // logAudit returns void, just verify it doesn't throw
    await expect(logAudit({
      action: "test_action",
      entity: "test",
      entityId: "0",
      details: { test: true },
      severity: "info",
    })).resolves.not.toThrow();
  });

  it("queryAuditLogs returns an array", async () => {
    const { queryAuditLogs } = await import("./auditLogger");
    const result = await queryAuditLogs({ limit: 5 });
    expect(Array.isArray(result.logs)).toBe(true);
    expect(typeof result.total).toBe("number");
  });
});

// Test Energy readings schema
describe("Energy readings schema", () => {
  it("energyReadings table is exported from pg-schema", async () => {
    const schema = await import("../drizzle/pg-schema");
    expect(schema.energyReadings).toBeDefined();
    expect(schema.energySourceEnum).toBeDefined();
    expect(schema.energyMeterTypeEnum).toBeDefined();
  });
});

// Test Audit log schema
describe("Audit log schema", () => {
  it("auditLog table is exported from pg-schema", async () => {
    const schema = await import("../drizzle/pg-schema");
    expect(schema.auditLog).toBeDefined();
  });
});

// Test energy data exists in database
describe("Energy data seeding", () => {
  it("energy_readings table has data", async () => {
    const { getDb } = await import("./db");
    const dbConn = await getDb();
    if (!dbConn) return;
    const schema = await import("../drizzle/pg-schema");
    const { count } = await import("drizzle-orm");
    const result = await (dbConn as any).select({ cnt: count() }).from(schema.energyReadings);
    expect(Number(result[0]?.cnt)).toBeGreaterThan(0);
  });
});
