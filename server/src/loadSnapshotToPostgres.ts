import fs from "fs";
import { pool } from "./db.js";

async function main() {
  console.log("Reading snapshot.json...");
  const raw = fs.readFileSync("./snapshot.json", "utf-8");
  console.log(`Loaded ${raw.length} characters.`);

  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO workspace_snapshot (id, value, updated_at)
       VALUES ('current', $1, NOW())
       ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [raw]
    );
    console.log("SUCCESS: Migrated old SQLite workspace into PostgreSQL!");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
