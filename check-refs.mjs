import pg from 'pg';
const url = 'postgresql://postgres.zttkuvrbfbekawwyakjy:gyxjeG-wahgic-jibdu7@aws-1-eu-central-1.pooler.supabase.com:5432/postgres';
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();

  // Wallet columns
  const wc = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='wallets' ORDER BY ordinal_position");
  console.log('WALLET_COLS:', wc.rows.map(r => r.column_name).join(', '));
  const wallets = await client.query('SELECT * FROM wallets ORDER BY id');
  console.log('WALLETS:', JSON.stringify(wallets.rows));

  // Resources sample
  const res = await client.query(`SELECT r.id, r.name, r."locationId", rt.name as type FROM resources r JOIN resource_types rt ON r."typeId" = rt.id WHERE rt.name IN ('Private Office', 'Meeting Room', 'Flex Desk') ORDER BY r."locationId" LIMIT 20`);
  console.log('RESOURCES:', JSON.stringify(res.rows));

  // Parking spots sample
  const spots = await client.query('SELECT id, "zoneId", "spotNumber" FROM parking_spots ORDER BY id LIMIT 10');
  console.log('SPOTS:', JSON.stringify(spots.rows));

  // Booking columns
  const bc = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='bookings' ORDER BY ordinal_position");
  console.log('BOOKING_COLS:', JSON.stringify(bc.rows));

  // Ticket columns
  const tc = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='tickets' ORDER BY ordinal_position");
  console.log('TICKET_COLS:', JSON.stringify(tc.rows));

  // Notification columns
  const nc = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='notifications' ORDER BY ordinal_position");
  console.log('NOTIFICATION_COLS:', JSON.stringify(nc.rows));

  // Resource type IDs
  const rt = await client.query('SELECT id, name FROM resource_types ORDER BY id');
  console.log('RESOURCE_TYPES:', JSON.stringify(rt.rows));

  await client.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
