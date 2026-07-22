require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL });
async function run() {
  const res = await pool.query("SELECT * FROM users WHERE group_id = '8c0468fd-7c1e-488b-9797-6db6fcd2a110'");
  console.log(res.rows);
  const mem = await pool.query("SELECT * FROM memberships WHERE group_id = '8c0468fd-7c1e-488b-9797-6db6fcd2a110'");
  console.log(mem.rows);
  process.exit(0);
}
run();
