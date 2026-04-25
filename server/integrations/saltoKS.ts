/**
 * Salto KS Connect API Integration
 * 
 * Provides server-side access to Salto KS for:
 * - Creating/managing users in Salto KS
 * - Issuing and revoking mobile keys
 * - Listing access points (doors/locks)
 * - Remote door opening
 * 
 * Requires:
 * - SALTO_KS_API_URL
 * - SALTO_KS_CLIENT_ID
 * - SALTO_KS_CLIENT_SECRET
 * - SALTO_KS_SITE_ID
 */

import { createLogger } from "../_core/logger";
const log = createLogger("SaltoKS");

interface SaltoKSConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  siteId: string;
}

let config: SaltoKSConfig | null = null;
let accessToken: string | null = null;
let tokenExpiresAt = 0;

export function initSaltoKS(cfg: SaltoKSConfig) {
  config = cfg;
  log.info("Initialized", { siteId: cfg.siteId });
}

async function getAccessToken(): Promise<string> {
  if (!config) throw new Error("Salto KS not configured");
  if (accessToken && Date.now() < tokenExpiresAt) return accessToken;

  const res = await fetch(`${config.apiUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!res.ok) throw new Error(`Salto KS auth failed: ${res.status}`);
  const data = await res.json();
  accessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken!;
}

async function saltoRequest(method: string, path: string, body?: unknown) {
  if (!config) throw new Error("Salto KS not configured");
  const token = await getAccessToken();
  const res = await fetch(`${config.apiUrl}/sites/${config.siteId}${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Salto KS ${method} ${path} failed: ${res.status} ${err}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─── User Management ───

export async function createSaltoUser(user: {
  externalId: string;
  firstName: string;
  lastName: string;
  email: string;
}) {
  return saltoRequest("POST", "/users", {
    external_id: user.externalId,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
  });
}

export async function getSaltoUser(userId: string) {
  return saltoRequest("GET", `/users/${userId}`);
}

export async function deleteSaltoUser(userId: string) {
  return saltoRequest("DELETE", `/users/${userId}`);
}

// ─── Mobile Keys ───

export async function issueMobileKey(userId: string, accessGroupId?: string) {
  return saltoRequest("POST", `/users/${userId}/mobile-keys`, {
    access_group_id: accessGroupId,
  });
}

export async function revokeMobileKey(userId: string, keyId: string) {
  return saltoRequest("DELETE", `/users/${userId}/mobile-keys/${keyId}`);
}

export async function listMobileKeys(userId: string) {
  return saltoRequest("GET", `/users/${userId}/mobile-keys`);
}

// ─── Access Points ───

export async function listAccessPoints() {
  return saltoRequest("GET", "/access-points");
}

export async function getAccessPoint(accessPointId: string) {
  return saltoRequest("GET", `/access-points/${accessPointId}`);
}

export async function remoteOpenDoor(accessPointId: string) {
  return saltoRequest("POST", `/access-points/${accessPointId}/online-openings`, {});
}

// ─── Access Rights ───

export async function getUserAccessRights(userId: string) {
  return saltoRequest("GET", `/users/${userId}/access-rights`);
}

export async function setUserAccessRights(userId: string, accessGroupIds: string[]) {
  return saltoRequest("PUT", `/users/${userId}/access-rights`, {
    access_group_ids: accessGroupIds,
  });
}

// ─── Access Groups ───

export async function listAccessGroups() {
  return saltoRequest("GET", "/access-groups");
}

// ─── Audit Trail ───

export async function getAuditTrail(params?: { userId?: string; accessPointId?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.userId) query.set("user_id", params.userId);
  if (params?.accessPointId) query.set("access_point_id", params.accessPointId);
  if (params?.limit) query.set("limit", String(params.limit));
  return saltoRequest("GET", `/audit-trail?${query}`);
}
