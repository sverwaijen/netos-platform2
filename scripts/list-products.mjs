import pg from 'pg';
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

const res = await client.query(`
  SELECT p.id, p.name, p."imageUrl", p."categoryId", c.name as category_name
  FROM products p
  LEFT JOIN product_categories c ON p."categoryId" = c.id
  WHERE p."isActive" = true
  ORDER BY c.name, p."sortOrder", p.name
`);

console.log(`Total active products: ${res.rows.length}`);
console.log(`\nProducts WITH images: ${res.rows.filter(r => r.imageUrl && r.imageUrl.trim()).length}`);
console.log(`Products WITHOUT images: ${res.rows.filter(r => !r.imageUrl || !r.imageUrl.trim()).length}`);

console.log("\n--- Products WITHOUT images ---");
res.rows.filter(r => !r.imageUrl || !r.imageUrl.trim()).forEach(r => {
  console.log(`  [${r.id}] ${r.category_name} > ${r.name}`);
});

console.log("\n--- Products WITH images ---");
res.rows.filter(r => r.imageUrl && r.imageUrl.trim()).forEach(r => {
  console.log(`  [${r.id}] ${r.category_name} > ${r.name} -> ${r.imageUrl.substring(0, 80)}...`);
});

await client.end();
