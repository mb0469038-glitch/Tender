import pg from "pg";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgres://postgres:postgres@db:5432/tenderstudio",
});

const ADMIN_ROLE_ID = "role-administrator";

export const PERMISSION_CATALOG = [
  { id: "auth.admin.view", module: "auth", label: "View admin backoffice", description: "Can open the Users & Roles administration area." },
  { id: "auth.users.manage", module: "auth", label: "Manage users", description: "Can create, edit, deactivate users and assign roles to them." },
  { id: "auth.roles.manage", module: "auth", label: "Manage roles", description: "Can create, edit, delete roles and assign permissions to them." },
  { id: "workspace.projects.view", module: "workspace", label: "View projects", description: "Can open the Projects screen and browse projects." },
  { id: "workspace.projects.create", module: "workspace", label: "Create projects", description: "Can create new projects." },
  { id: "workspace.projects.delete", module: "workspace", label: "Delete projects", description: "Can delete existing projects." },
  { id: "workspace.canvas.edit", module: "workspace", label: "Edit project canvas", description: "Can draw/edit openings on a project canvas." },
  { id: "workspace.execution-projects.view", module: "workspace", label: "View projects under execution", description: "Can open the operational projects screen." },
  { id: "workspace.execution-projects.create", module: "workspace", label: "Create projects under execution", description: "Can add operational projects." },
  { id: "workspace.execution-projects.delete", module: "workspace", label: "Delete projects under execution", description: "Can delete operational projects." },
  { id: "workspace.database.view", module: "workspace", label: "View material database", description: "Can open the Database screen (price book, glass, costing & financials)." },
  { id: "workspace.materials.create", module: "workspace", label: "Create materials", description: "Can add new materials to the price book." },
  { id: "workspace.materials.edit", module: "workspace", label: "Edit materials", description: "Can edit existing material fields (cost, weight, shipping, etc.)." },
  { id: "workspace.materials.delete", module: "workspace", label: "Delete materials", description: "Can delete materials from the price book." },
  { id: "workspace.assemblies.view", module: "workspace", label: "View assemblies", description: "Can open the Assemblies screen." },
  { id: "workspace.assemblies.create", module: "workspace", label: "Create assemblies", description: "Can create new assemblies." },
  { id: "workspace.assemblies.delete", module: "workspace", label: "Delete assemblies", description: "Can delete existing assemblies." },
  { id: "workspace.costing.view", module: "workspace", label: "View costing & financials", description: "Can view markup rates, manpower costs, shipping costs." },
  { id: "workspace.costing.edit", module: "workspace", label: "Edit costing & financials", description: "Can edit markup rates, manpower costs, shipping costs." },
  { id: "workspace.excel.view", module: "workspace", label: "View Excel workspace", description: "Can open the standalone Excel workspace screen." },
];

export async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id          TEXT PRIMARY KEY,
        module      TEXT NOT NULL,
        label       TEXT NOT NULL,
        description TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS roles (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT '',
        is_system   BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id       TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      );

      CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY,
        username      TEXT NOT NULL UNIQUE,
        display_name  TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        is_active     BOOLEAN NOT NULL DEFAULT TRUE,
        created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_roles (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, role_id)
      );

      CREATE TABLE IF NOT EXISTS workspace_snapshot (
        id         TEXT PRIMARY KEY,
        value      TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS workspace_save_history (
        id       SERIAL PRIMARY KEY,
        saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);

    // 2. Seed permissions
    for (const p of PERMISSION_CATALOG) {
      await client.query(
        `INSERT INTO permissions (id, module, label, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET module = EXCLUDED.module, label = EXCLUDED.label, description = EXCLUDED.description`,
        [p.id, p.module, p.label, p.description]
      );
    }

    // 3. Seed Admin Role
    await client.query(
      `INSERT INTO roles (id, name, description, is_system, created_at, updated_at)
       VALUES ($1, 'Administrator', 'Full system access to every module.', TRUE, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [ADMIN_ROLE_ID]
    );

    // 4. Attach all permissions to Admin Role
    for (const p of PERMISSION_CATALOG) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         VALUES ($1, $2)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [ADMIN_ROLE_ID, p.id]
      );
    }

    // 5. Seed default admin user if none exists
    const usersCountRes = await client.query("SELECT COUNT(*) FROM users");
    const count = parseInt(usersCountRes.rows[0].count, 10);
    if (count === 0) {
      const adminUserId = uuidv4();
      const passwordHash = await bcrypt.hash("admin123", 10);
      await client.query(
        `INSERT INTO users (id, username, display_name, password_hash, is_active, created_at, updated_at)
         VALUES ($1, 'admin', 'Administrator', $2, TRUE, NOW(), NOW())`,
        [adminUserId, passwordHash]
      );
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
        [adminUserId, ADMIN_ROLE_ID]
      );
      console.log("Initialized default Administrator user ('admin' / 'admin123').");
    }

    await client.query("COMMIT");
    console.log("PostgreSQL database migrations executed successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration error:", err);
    throw err;
  } finally {
    client.release();
  }
}
