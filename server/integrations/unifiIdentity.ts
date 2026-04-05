/**
 * UniFi Identity / UniFi Network Integration
 * 
 * Provides server-side WiFi provisioning for coworking members:
 * - Create WiFi user accounts
 * - Generate WiFi profiles for auto-connect
 * - Manage bandwidth and VLAN assignments
 * - Authorize/deauthorize devices
 * 
 * Requires:
 * - UNIFI_CONTROLLER_URL
 * - UNIFI_USERNAME
 * - UNIFI_PASSWORD
 * - UNIFI_SITE (default: 'default')
 */

interface UniFiConfig {
  controllerUrl: string;
  username: string;
  password: string;
  site: string;
}

let config: UniFiConfig | null = null;
let sessionCookie: string | null = null;
let sessionExpiresAt = 0;

export function initUniFi(cfg: UniFiConfig) {
  config = cfg;
  console.log("[UniFi] Initialized with controller:", cfg.controllerUrl);
}

async function authenticate(): Promise<string> {
  if (!config) throw new Error("UniFi not configured");
  if (sessionCookie && Date.now() < sessionExpiresAt) return sessionCookie;

  const res = await fetch(`${config.controllerUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: config.username,
      password: config.password,
    }),
  });

  if (!res.ok) throw new Error(`UniFi auth failed: ${res.status}`);
  
  const cookies = res.headers.get("set-cookie");
  if (cookies) {
    sessionCookie = cookies.split(";")[0];
    sessionExpiresAt = Date.now() + 3600000; // 1 hour
  }
  return sessionCookie || "";
}

async function unifiRequest(method: string, path: string, body?: unknown) {
  if (!config) throw new Error("UniFi not configured");
  const cookie = await authenticate();
  const url = `${config.controllerUrl}/api/s/${config.site}${path}`;
  
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookie,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`UniFi ${method} ${path} failed: ${res.status} ${err}`);
  }
  return res.json();
}

// ─── WiFi User Management ───

export async function createWiFiUser(user: {
  name: string;
  email: string;
  note?: string;
}) {
  const password = generateSecurePassword();
  const result = await unifiRequest("POST", "/rest/user", {
    name: user.name,
    email: user.email,
    x_password: password,
    note: user.note || `NET OS member: ${user.email}`,
    usergroup_id: "", // Default group
  });
  return { ...result, password };
}

export async function getWiFiUser(userId: string) {
  return unifiRequest("GET", `/rest/user/${userId}`);
}

export async function updateWiFiUser(userId: string, updates: {
  name?: string;
  bandwidth_up?: number; // Kbps
  bandwidth_down?: number; // Kbps
  vlan?: number;
  note?: string;
}) {
  return unifiRequest("PUT", `/rest/user/${userId}`, updates);
}

export async function deleteWiFiUser(userId: string) {
  return unifiRequest("DELETE", `/rest/user/${userId}`);
}

// ─── Device Management ───

export async function authorizeDevice(mac: string, minutes?: number) {
  return unifiRequest("POST", "/cmd/stamgr", {
    cmd: "authorize-guest",
    mac,
    minutes: minutes || 1440, // Default 24 hours
  });
}

export async function deauthorizeDevice(mac: string) {
  return unifiRequest("POST", "/cmd/stamgr", {
    cmd: "unauthorize-guest",
    mac,
  });
}

export async function listConnectedDevices() {
  return unifiRequest("GET", "/stat/sta");
}

// ─── WiFi Profile Generation ───

export interface WiFiProfile {
  ssid: string;
  password: string;
  security: "WPA2" | "WPA3" | "WPA2/WPA3";
  eapMethod?: "PEAP" | "TLS";
  identity?: string;
  hidden: boolean;
}

export async function generateWiFiProfile(userId: string, ssid: string): Promise<WiFiProfile> {
  const user = await getWiFiUser(userId);
  return {
    ssid,
    password: user.data?.[0]?.x_password || "",
    security: "WPA2/WPA3",
    hidden: false,
  };
}

// ─── Network Stats ───

export async function getNetworkHealth() {
  return unifiRequest("GET", "/stat/health");
}

export async function getClientCount() {
  const devices = await listConnectedDevices();
  return devices.data?.length || 0;
}

// ─── Helpers ───

function generateSecurePassword(length = 16): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
