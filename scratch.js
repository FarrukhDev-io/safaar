const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_OwTD0tky2vul@ep-billowing-term-atksj3t0.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require' });
async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'hotel_rooms';
  `);
  console.log(res.rows);
  await client.end();
}
run();
