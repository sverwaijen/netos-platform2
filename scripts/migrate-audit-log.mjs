import pg from "pg";
import fs from "fs";

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL not set");
  process.exit(1);
}

const sql = fs.readFileSync("/tmp/audit-migration.sql", "utf8");
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log("Connected, running migration...");
await client.query(sql);
console.log("audit_log table created successfully");
await client.end();
