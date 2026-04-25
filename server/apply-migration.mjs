import pg from "pg";
const { Client } = pg;

let pgUrl = process.env.SUPABASE_DB_URL;
const directMatch = pgUrl.match(/postgresql:\/\/postgres:([^@]+)@db\.([a-z0-9]+)\.supabase\.co:(\d+)\/(.+)/);
if (directMatch) {
  const [, password, projectRef, , dbName] = directMatch;
  pgUrl = `postgresql://postgres.${projectRef}:${password}@aws-1-eu-central-1.pooler.supabase.com:5432/${dbName}`;
  console.log("Using session pooler URL");
}

const c = new Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
await c.connect();

// Add qrToken to users
await c.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "qrToken" varchar(128)');
console.log("qrToken column added to users");

// Create escalation_rules
await c.query(`CREATE TABLE IF NOT EXISTS escalation_rules (
  id serial PRIMARY KEY,
  name varchar(256) NOT NULL,
  description text,
  priority varchar(32) DEFAULT 'normal',
  category varchar(64),
  "escalateAfterMinutes" integer NOT NULL DEFAULT 60,
  "triggerType" varchar(64) NOT NULL DEFAULT 'no_response',
  "escalationLevel" integer NOT NULL DEFAULT 1,
  "escalateToRole" varchar(32) DEFAULT 'host',
  "escalateToUserId" integer,
  "notifyEmail" boolean DEFAULT true,
  "notifyInApp" boolean DEFAULT true,
  "autoReassign" boolean DEFAULT false,
  "autoPriorityBump" boolean DEFAULT false,
  "isActive" boolean DEFAULT true,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now()
)`);
console.log("escalation_rules table created");

// Create escalation_log
await c.query(`CREATE TABLE IF NOT EXISTS escalation_log (
  id serial PRIMARY KEY,
  "ticketId" integer NOT NULL,
  "ruleId" integer,
  "escalationLevel" integer NOT NULL DEFAULT 1,
  "previousAssignee" integer,
  "newAssignee" integer,
  "previousPriority" varchar(32),
  "newPriority" varchar(32),
  reason text,
  "slaBreach" boolean DEFAULT false,
  status varchar(32) DEFAULT 'pending',
  "createdAt" timestamp DEFAULT now() NOT NULL
)`);
console.log("escalation_log table created");

await c.end();
console.log("Migration complete!");
