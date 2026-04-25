import { describe, expect, it } from "vitest";
import pg from "pg";

function rewriteToPooler(url: string): string {
  const m = url.match(/postgresql:\/\/postgres:([^@]+)@db\.([a-z0-9]+)\.supabase\.co:(\d+)\/(.+)/);
  if (m) {
    const [, password, projectRef, , dbName] = m;
    return `postgresql://postgres.${projectRef}:${password}@aws-1-eu-central-1.pooler.supabase.com:5432/${dbName}`;
  }
  return url;
}

describe("Supabase PostgreSQL Connection", () => {
  it("should connect to Supabase PostgreSQL via shared pooler", async () => {
    const rawUrl = process.env.SUPABASE_DB_URL;
    expect(rawUrl).toBeDefined();
    expect(rawUrl).toContain("supabase");
    const dbUrl = rewriteToPooler(rawUrl!);

    const client = new pg.Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    const result = await client.query("SELECT 1 as test");
    expect(result.rows[0].test).toBe(1);
    await client.end();
  }, 15000);
});
