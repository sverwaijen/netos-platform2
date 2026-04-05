import mysql from 'mysql2/promise';
import fs from 'fs';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const conn = await mysql.createConnection(url);

const sql = fs.readFileSync('./drizzle/0007_glorious_sharon_ventura.sql', 'utf8');
const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

for (const stmt of statements) {
  try {
    await conn.execute(stmt);
    const match = stmt.match(/CREATE TABLE `(\w+)`/);
    console.log(`✓ Created: ${match ? match[1] : 'unknown'}`);
  } catch (e) {
    if (e.code === 'ER_TABLE_EXISTS_ERROR') {
      const match = stmt.match(/CREATE TABLE `(\w+)`/);
      console.log(`⊘ Already exists: ${match ? match[1] : 'unknown'}`);
    } else {
      console.error('Error:', e.message);
    }
  }
}

await conn.end();
console.log('Migration complete!');
