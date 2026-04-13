/**
import { createLogger } from "../_core/logger";

const log = createLogger("Supabase");
 * Supabase Integration Module for NET OS Platform
 * 
 * This module provides a bridge between the NET OS Platform and Supabase,
 * enabling realtime sync, external database access, and Supabase Auth integration.
 * 
 * Configuration:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_ANON_KEY: Public anon key for client-side access
 * - SUPABASE_SERVICE_KEY: Service role key for server-side operations
 * 
 * Features:
 * - Realtime event broadcasting (parking, tickets, presence)
 * - External data sync (push NET OS data to Supabase for mobile app)
 * - Supabase Auth bridge (link Supabase users to NET OS users)
 */

interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey: string;
}

let config: SupabaseConfig | null = null;

export function initSupabase(cfg: SupabaseConfig) {
  config = cfg;
  log.info("Initialized", { url: ENV.supabaseUrl });
}

export function getSupabaseConfig(): SupabaseConfig | null {
  return config;
}

/**
 * Push data to Supabase via REST API (no SDK dependency)
 * Uses the PostgREST API built into every Supabase project
 */
export async function supabaseInsert(table: string, data: Record<string, unknown>[]) {
  if (!config) throw new Error("Supabase not configured");
  const res = await fetch(`${config.url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": config.serviceKey,
      "Authorization": `Bearer ${config.serviceKey}`,
      "Prefer": "return=representation",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase insert failed: ${res.status} ${err}`);
  }
  return res.json();
}

export async function supabaseUpsert(table: string, data: Record<string, unknown>[], onConflict: string) {
  if (!config) throw new Error("Supabase not configured");
  const res = await fetch(`${config.url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": config.serviceKey,
      "Authorization": `Bearer ${config.serviceKey}`,
      "Prefer": "return=representation,resolution=merge-duplicates",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upsert failed: ${res.status} ${err}`);
  }
  return res.json();
}

export async function supabaseSelect(table: string, query?: string) {
  if (!config) throw new Error("Supabase not configured");
  const url = query ? `${config.url}/rest/v1/${table}?${query}` : `${config.url}/rest/v1/${table}`;
  const res = await fetch(url, {
    headers: {
      "apikey": config.serviceKey,
      "Authorization": `Bearer ${config.serviceKey}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase select failed: ${res.status}`);
  return res.json();
}

/**
 * Broadcast a realtime event via Supabase Realtime
 * Useful for pushing live updates to the mobile app
 */
export async function supabaseBroadcast(channel: string, event: string, payload: Record<string, unknown>) {
  if (!config) {
    log.warn("Not configured, skipping broadcast");
    return;
  }
  try {
    // Use Supabase Realtime REST API
    const res = await fetch(`${config.url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.serviceKey,
        "Authorization": `Bearer ${config.serviceKey}`,
      },
      body: JSON.stringify({
        messages: [{
          topic: channel,
          event,
          payload,
        }],
      }),
    });
    if (!res.ok) log.warn("Broadcast failed:", res.status);
  } catch (e) {
    log.warn("Broadcast error:", e);
  }
}

/**
 * Sync NET OS user to Supabase users table
 * Creates a mirror record for mobile app access
 */
export async function syncUserToSupabase(user: {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: string;
}) {
  if (!config) return;
  try {
    await supabaseUpsert("skynet_users", [{
      skynet_id: user.id,
      open_id: user.openId,
      name: user.name,
      email: user.email,
      avatar_url: user.avatarUrl,
      role: user.role,
      synced_at: new Date().toISOString(),
    }], "skynet_id");
  } catch (e) {
    log.warn("User sync failed:", e);
  }
}

/**
 * Sync parking event to Supabase for mobile app realtime updates
 */
export async function syncParkingEvent(event: {
  type: "session_start" | "session_end" | "reservation" | "spot_update";
  zoneId: number;
  spotId?: number;
  userId?: number;
  licensePlate?: string;
  data?: Record<string, unknown>;
}) {
  if (!config) return;
  await supabaseBroadcast("parking", event.type, event);
}

/**
 * Sync ticket event for realtime notifications
 */
export async function syncTicketEvent(event: {
  type: "created" | "updated" | "message" | "resolved";
  ticketId: number;
  ticketNumber: string;
  userId?: number;
  data?: Record<string, unknown>;
}) {
  if (!config) return;
  await supabaseBroadcast("tickets", event.type, event);
}

/**
 * Generate Supabase SQL schema for mirror tables
 * Run this in Supabase SQL editor to set up the mirror tables
 */
export function getSupabaseMigrationSQL(): string {
  return `
-- NET OS Platform Mirror Tables for Supabase
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS skynet_users (
  id BIGSERIAL PRIMARY KEY,
  skynet_id INTEGER UNIQUE NOT NULL,
  open_id TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  salto_key_id TEXT,
  unifi_identity_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skynet_parking_sessions (
  id BIGSERIAL PRIMARY KEY,
  skynet_id INTEGER UNIQUE,
  zone_id INTEGER NOT NULL,
  spot_id INTEGER,
  user_id INTEGER REFERENCES skynet_users(skynet_id),
  license_plate TEXT,
  entry_time BIGINT NOT NULL,
  exit_time BIGINT,
  status TEXT DEFAULT 'active',
  amount_eur DECIMAL(10,2),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skynet_tickets (
  id BIGSERIAL PRIMARY KEY,
  skynet_id INTEGER UNIQUE,
  ticket_number TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'normal',
  requester_id INTEGER REFERENCES skynet_users(skynet_id),
  ai_auto_resolved BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skynet_access_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES skynet_users(skynet_id),
  token_type TEXT NOT NULL, -- 'salto', 'unifi', 'parking'
  token_value TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE skynet_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE skynet_parking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skynet_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE skynet_access_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only see their own data
CREATE POLICY "Users can view own profile" ON skynet_users FOR SELECT USING (auth.uid()::text = open_id);
CREATE POLICY "Users can view own parking" ON skynet_parking_sessions FOR SELECT USING (user_id IN (SELECT skynet_id FROM skynet_users WHERE open_id = auth.uid()::text));
CREATE POLICY "Users can view own tickets" ON skynet_tickets FOR SELECT USING (requester_id IN (SELECT skynet_id FROM skynet_users WHERE open_id = auth.uid()::text));
CREATE POLICY "Users can view own tokens" ON skynet_access_tokens FOR SELECT USING (user_id IN (SELECT skynet_id FROM skynet_users WHERE open_id = auth.uid()::text));

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE skynet_parking_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE skynet_tickets;
`;
}
