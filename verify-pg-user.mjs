import pg from 'pg';

let url = process.env.SUPABASE_DB_URL;
const m = url.match(/db\.([a-z0-9]+)\.supabase\.co/);
if (m) {
  url = url.replace('db.' + m[1] + '.supabase.co', 'aws-1-eu-central-1.pooler.supabase.com');
  url = url.replace(/\/postgres\b/, '/postgres.' + m[1]);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

// Check users table
const users = await client.query('SELECT id, "openId", name, email, role, "lastSignedIn", "createdAt" FROM users ORDER BY id');
console.log('=== Users in Supabase PG ===');
console.log(`Total: ${users.rows.length}`);
for (const u of users.rows) {
  console.log(`  ID: ${u.id}, openId: ${u.openId?.substring(0, 20)}..., name: ${u.name}, email: ${u.email}, role: ${u.role}, lastSignedIn: ${u.lastSignedIn}`);
}

// Check if the logged-in user's data matches what we see in the dashboard
const sam = users.rows.find(u => u.email === 'sam@green-dna.nl');
if (sam) {
  console.log('\n=== Logged-in user (sam@green-dna.nl) ===');
  console.log(JSON.stringify(sam, null, 2));
  
  // Check wallet
  const wallet = await client.query('SELECT * FROM wallets WHERE "userId" = $1', [sam.id]);
  console.log('\n=== Wallet ===');
  console.log(JSON.stringify(wallet.rows, null, 2));
  
  // Check bookings
  const bookings = await client.query('SELECT id, "resourceId", "locationId", status, "creditsCost", "startTime", "endTime" FROM bookings WHERE "userId" = $1', [sam.id]);
  console.log('\n=== Bookings ===');
  console.log(JSON.stringify(bookings.rows, null, 2));
} else {
  console.log('\nWARNING: User sam@green-dna.nl not found in PG users table!');
}

await client.end();
