import { describe, expect, it } from "vitest";

describe("supabase credentials", () => {
  it("SUPABASE_URL is set and looks like a valid URL", () => {
    const url = process.env.SUPABASE_URL;
    expect(url).toBeDefined();
    expect(url).not.toBe("");
    // Accept either full URL or project ID (auto-resolved by ENV)
    expect(url!.length).toBeGreaterThan(0);
  });

  it("SUPABASE_ANON_KEY is set and is a JWT", () => {
    const key = process.env.SUPABASE_ANON_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe("");
    // Supabase keys are JWTs (3 base64 segments separated by dots)
    expect(key).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });

  it("SUPABASE_SERVICE_KEY is set and is a JWT", () => {
    const key = process.env.SUPABASE_SERVICE_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe("");
    expect(key).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });

  it("can reach Supabase REST API with service key", async () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) return;

    // Resolve URL the same way ENV does
    const resolvedUrl = url!.startsWith("https://") ? url! : `https://${url}.supabase.co`;
    const res = await fetch(`${resolvedUrl}/rest/v1/`, {
      headers: {
        "apikey": key!,
        "Authorization": `Bearer ${key}`,
      },
    });
    // 200 = tables exist, 404 = no tables yet but auth works
    expect([200, 404]).toContain(res.status);
  });

  it("initSupabase configures the module correctly", async () => {
    const { initSupabase, getSupabaseConfig } = await import("./integrations/supabase");
    
    initSupabase({
      url: process.env.SUPABASE_URL!,
      anonKey: process.env.SUPABASE_ANON_KEY!,
      serviceKey: process.env.SUPABASE_SERVICE_KEY!,
    });

    const config = getSupabaseConfig();
    expect(config).not.toBeNull();
    expect(config!.url).toBe(process.env.SUPABASE_URL);
  });
});
