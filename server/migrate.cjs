const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  console.log('Reading snapshot...');
  const raw = fs.readFileSync('/app/snapshot.json', 'utf8');
  console.log('Snapshot read, size: ' + raw.length + ' bytes');
  await pool.query(
    "INSERT INTO workspace_snapshot (id, value, updated_at) VALUES ('current', $1, NOW()) ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
    [raw]
  );
  console.log('MIGRATION_SUCCESSFUL_INTO_POSTGRES');
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
