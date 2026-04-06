import mysql from "mysql2/promise";
import fs from "fs";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const sql = fs.readFileSync("drizzle/0008_slow_molly_hayes.sql", "utf-8");
const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);

for (const stmt of statements) {
  try {
    await conn.execute(stmt);
    console.log("OK:", stmt.substring(0, 60) + "...");
  } catch (e) {
    if (e.code === "ER_TABLE_EXISTS_ERROR") {
      console.log("SKIP (exists):", stmt.substring(0, 60) + "...");
    } else {
      console.error("ERR:", e.message);
    }
  }
}

await conn.end();
console.log("Migration complete");
