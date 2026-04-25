import { describe, expect, it } from "vitest";
import { getDb, getDriver } from "./db";

describe("Supabase PostgreSQL dual-driver", () => {
  it("connects to Supabase PG when SUPABASE_DB_URL is set", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    expect(getDriver()).toBe("pg");
  });

  it("can execute a basic SELECT 1 query", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    if (!db) return;

    const { sql } = await import("drizzle-orm");
    const result = await db.execute(sql`SELECT 1 as test_val`);
    // PG returns rows array
    expect(result).toBeDefined();
  });

  it("can query the users table (empty or with data)", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    if (!db) return;

    const { sql } = await import("drizzle-orm");
    const result = await db.execute(sql`SELECT COUNT(*) as cnt FROM users`);
    expect(result).toBeDefined();
    // Should return a count (0 or more)
    const rows = Array.isArray(result) ? result : result.rows ?? [];
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it("can query the locations table", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    if (!db) return;

    const { sql } = await import("drizzle-orm");
    const result = await db.execute(sql`SELECT COUNT(*) as cnt FROM locations`);
    expect(result).toBeDefined();
  });
});
