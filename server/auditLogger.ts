import { getDb } from "./db";
import { auditLog } from "../drizzle/pg-schema";
import { desc, eq, and, gte, lte, like, sql, or } from "drizzle-orm";

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT" | "VIEW" | "SETTINGS_CHANGE";
type AuditSeverity = "low" | "medium" | "high";

interface LogAuditParams {
  userId?: number | null;
  userName?: string | null;
  userEmail?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  severity?: AuditSeverity;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await (db as any).insert(auditLog).values({
      userId: params.userId ?? null,
      userName: params.userName ?? null,
      userEmail: params.userEmail ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      details: params.details ?? null,
      severity: params.severity ?? "low",
      ipAddress: params.ipAddress ?? null,
      metadata: params.metadata ?? null,
    });
  } catch (err) {
    // Never let audit logging crash the main operation
    console.error("[AuditLogger] Failed to log:", err);
  }
}

interface QueryAuditParams {
  search?: string;
  action?: AuditAction;
  severity?: AuditSeverity;
  userId?: number;
  entity?: string;
  fromDate?: string; // ISO date
  toDate?: string; // ISO date
  limit?: number;
  offset?: number;
}

export async function queryAuditLogs(params: QueryAuditParams) {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };

  const conditions = [];

  if (params.action) {
    conditions.push(eq(auditLog.action, params.action));
  }
  if (params.severity) {
    conditions.push(eq(auditLog.severity, params.severity));
  }
  if (params.userId) {
    conditions.push(eq(auditLog.userId, params.userId));
  }
  if (params.entity) {
    conditions.push(eq(auditLog.entity, params.entity));
  }
  if (params.fromDate) {
    conditions.push(gte(auditLog.timestamp, new Date(params.fromDate)));
  }
  if (params.toDate) {
    conditions.push(lte(auditLog.timestamp, new Date(params.toDate)));
  }
  if (params.search) {
    const s = `%${params.search}%`;
    conditions.push(
      or(
        like(auditLog.userName, s),
        like(auditLog.userEmail, s),
        like(auditLog.details, s),
        like(auditLog.entity, s),
      )!
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = params.limit || 50;
  const offset = params.offset || 0;

  const [logs, countResult] = await Promise.all([
    (db as any)
      .select()
      .from(auditLog)
      .where(where)
      .orderBy(desc(auditLog.timestamp))
      .limit(limit)
      .offset(offset),
    (db as any)
      .select({ count: sql<number>`count(*)` })
      .from(auditLog)
      .where(where),
  ]);

  return {
    logs,
    total: Number(countResult?.[0]?.count || 0),
  };
}
