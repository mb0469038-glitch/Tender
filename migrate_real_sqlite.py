import sqlite3
import json
import subprocess

print("Connecting to /tmp/real.sqlite...")
conn = sqlite3.connect("/tmp/real.sqlite")
cur = conn.cursor()

cur.execute("SELECT id, length(value), updated_at FROM workspace_snapshot;")
rows = cur.fetchall()
print("Workspace snapshot rows in SQLite:", rows)

cur.execute("SELECT value FROM workspace_snapshot WHERE id = 'current';")
row = cur.fetchone()
if not row:
    print("ERROR: No current snapshot in /tmp/real.sqlite!")
    exit(1)

raw_snapshot = row[0]
print(f"Loaded snapshot string of length: {len(raw_snapshot)} characters ({len(raw_snapshot) / 1024 / 1024:.2f} MB)")

data = json.loads(raw_snapshot)
materials = data.get("materials", [])
assemblies = data.get("assemblies", [])
projects = data.get("projects", [])
databases = data.get("componentDatabases", [])
company_databases = data.get("companyDatabases", [])

print("\n--- SNAPSHOT CONTENT SUMMARY ---")
print(f"Materials count: {len(materials)}")
print(f"Assemblies count: {len(assemblies)}")
print(f"Projects count: {len(projects)}")
print(f"Databases count: {len(databases)}")
print(f"Company Databases count: {len(company_databases)}")

db_distribution = {}
for m in materials:
    db = m.get("databaseId", "undefined")
    db_distribution[db] = db_distribution.get(db, 0) + 1
print("Materials by databaseId:", db_distribution)

glass_materials = [m for m in materials if m.get("databaseId") == "glass"]
print(f"\nGlass materials ({len(glass_materials)} items):")
for g in glass_materials[:5]:
    print(f" - {g.get('code')}: {g.get('name')} (cost: {g.get('cost')}, unit: {g.get('unit')})")

# Save to /opt/tenderstudio/server/snapshot.json
with open("/opt/tenderstudio/server/snapshot.json", "w") as f:
    f.write(raw_snapshot)
print("Updated /opt/tenderstudio/server/snapshot.json on disk.")

# Now load into PostgreSQL inside docker container
print("Writing snapshot directly to PostgreSQL tender-postgres container...")
# We use node or psql via stdin to avoid command line length limits
p = subprocess.Popen(
    ["docker", "exec", "-i", "tender-backend", "node", "-e", """
const fs = require('fs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tenderpass123@postgres:5432/tenderstudio' });
let raw = '';
process.stdin.on('data', chunk => raw += chunk);
process.stdin.on('end', async () => {
    try {
        console.log('Inserting into PostgreSQL, size:', raw.length);
        await pool.query(
            "INSERT INTO workspace_snapshot (id, value, updated_at) VALUES ('current', $1, NOW()) ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
            [raw]
        );
        console.log('SUCCESS: Snapshot inserted into PostgreSQL!');
        process.exit(0);
    } catch(err) {
        console.error('PostgreSQL error:', err);
        process.exit(1);
    }
});
"""],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)
stdout, stderr = p.communicate(input=raw_snapshot)
print("Docker backend output:", stdout)
if stderr:
    print("Docker backend stderr:", stderr)

print("\nMigration script complete!")
