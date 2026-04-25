import pg from "pg";
const url = process.env.SUPABASE_DB_URL || "";
const m = url.match(/postgresql:\/\/postgres:([^@]+)@db\.([a-z0-9]+)\.supabase\.co:(\d+)\/(.+)/);
const poolerUrl = m ? `postgresql://postgres.${m[2]}:${m[1]}@aws-1-eu-central-1.pooler.supabase.com:5432/${m[4]}` : url;
const client = new pg.Client(poolerUrl);
await client.connect();

// Check varchar lengths
const r1 = await client.query(`SELECT column_name, character_maximum_length FROM information_schema.columns WHERE table_name='parking_zones' AND column_name='type'`);
console.log("parking_zones.type:", r1.rows[0]);

// Check all check constraints for failing tables
const tables = ["parking_zones", "ticket_sla_policies", "ops_agenda", "crm_triggers"];
for (const t of tables) {
  const r = await client.query(`SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid=$1::regclass AND contype='c'`, [t]);
  console.log(`\n=== ${t} constraints ===`);
  r.rows.forEach(row => console.log(`  ${row.conname}: ${row.def}`));
}

// Fix: alter parking_zones.type to varchar(50)
await client.query(`ALTER TABLE parking_zones ALTER COLUMN type TYPE varchar(50)`);
console.log("\n✓ Fixed parking_zones.type to varchar(50)");

// Fix: drop and recreate check constraints with additional values
// ticket_sla_policies - add 'critical'
await client.query(`ALTER TABLE ticket_sla_policies DROP CONSTRAINT IF EXISTS "ticket_sla_policies_priority_check"`);
await client.query(`ALTER TABLE ticket_sla_policies ADD CONSTRAINT "ticket_sla_policies_priority_check" CHECK (priority IN ('critical','high','normal','low','urgent'))`);
console.log("✓ Fixed ticket_sla_policies priority constraint");

// ops_agenda - add 'pending', 'onboarding', 'critical'
await client.query(`ALTER TABLE ops_agenda DROP CONSTRAINT IF EXISTS "ops_agenda_status_check"`);
await client.query(`ALTER TABLE ops_agenda ADD CONSTRAINT "ops_agenda_status_check" CHECK (status IN ('scheduled','in_progress','completed','cancelled','pending','overdue'))`);
console.log("✓ Fixed ops_agenda status constraint");

await client.query(`ALTER TABLE ops_agenda DROP CONSTRAINT IF EXISTS "ops_agenda_type_check"`);
await client.query(`ALTER TABLE ops_agenda ADD CONSTRAINT "ops_agenda_type_check" CHECK (type IN ('maintenance','inspection','event','meeting','task','onboarding','cleaning','delivery'))`);
console.log("✓ Fixed ops_agenda type constraint");

await client.query(`ALTER TABLE ops_agenda DROP CONSTRAINT IF EXISTS "ops_agenda_priority_check"`);
await client.query(`ALTER TABLE ops_agenda ADD CONSTRAINT "ops_agenda_priority_check" CHECK (priority IN ('low','normal','high','urgent','critical'))`);
console.log("✓ Fixed ops_agenda priority constraint");

// crm_triggers - add more event types
await client.query(`ALTER TABLE crm_triggers DROP CONSTRAINT IF EXISTS "crm_triggers_eventType_check"`);
await client.query(`ALTER TABLE crm_triggers ADD CONSTRAINT "crm_triggers_eventType_check" CHECK ("eventType" IN ('lead_created','stage_changed','lead_inactive','lead_updated','note_added','email_sent','task_completed'))`);
console.log("✓ Fixed crm_triggers eventType constraint");

await client.end();
console.log("\n✓ All constraints fixed");
