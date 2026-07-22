require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL });
async function run() {
  const res = await pool.query("SELECT * FROM group_settings");
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
}
run();
