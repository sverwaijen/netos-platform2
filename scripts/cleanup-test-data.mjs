import pg from "pg";
const { Client } = pg;

const rawUrl = process.env.SUPABASE_DB_URL;
// Rewrite: postgresql://postgres:PASS@db.PROJECT.supabase.co:5432/postgres
// To:      postgresql://postgres.PROJECT:PASS@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
const match = rawUrl.match(/postgresql:\/\/postgres:([^@]+)@db\.([^.]+)\.supabase\.co:5432\/(.*)/);
if (!match) { console.error('Cannot parse SUPABASE_DB_URL'); process.exit(1); }
const [, password, projectRef, dbName] = match;
const url = `postgresql://postgres.${projectRef}:${password}@aws-1-eu-central-1.pooler.supabase.com:5432/${dbName}`;

const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();

// Check references
const refs = await c.query(`SELECT COUNT(*) as cnt FROM kiosk_order_items WHERE "productId" IN (508,509,510,511,512,513,514)`);
console.log("Order items referencing test products:", refs.rows[0].cnt);

if (Number(refs.rows[0].cnt) > 0) {
  console.log("Deleting referencing order items first...");
  await c.query(`DELETE FROM kiosk_order_items WHERE "productId" IN (508,509,510,511,512,513,514)`);
}

// Delete test products
const delProducts = await c.query(`DELETE FROM products WHERE id IN (508,509,510,511,512,513,514) RETURNING id, name`);
console.log("Deleted products:", delProducts.rows);

// Delete test categories  
const delCats = await c.query(`DELETE FROM product_categories WHERE id IN (103,104,105,106,107,108,109) RETURNING id, name`);
console.log("Deleted categories:", delCats.rows);

await c.end();
console.log("Done!");
