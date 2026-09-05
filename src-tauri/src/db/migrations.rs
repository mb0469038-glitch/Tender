use crate::auth::password::hash_password;
use crate::auth::permissions_catalog::PERMISSION_CATALOG;
use rusqlite::{params, Connection};
use uuid::Uuid;

const ADMIN_ROLE_ID: &str = "role-administrator";

/// Additive-only migration for the RBAC schema. Safe to run on every app start:
/// - table creation uses `CREATE TABLE IF NOT EXISTS`
/// - permission/role seeding uses `INSERT OR IGNORE`
/// - the default admin user is created only when the `users` table is empty
///
/// This never touches the pre-existing `workspace_snapshot` / `workspace_save_history`
/// tables or data.
pub fn run_auth_migrations(connection: &Connection) -> Result<(), String> {
    connection
        .execute_batch(
            "CREATE TABLE IF NOT EXISTS permissions (
                id          TEXT PRIMARY KEY,
                module      TEXT NOT NULL,
                label       TEXT NOT NULL,
                description TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS roles (
                id          TEXT PRIMARY KEY,
                name        TEXT NOT NULL UNIQUE,
                description TEXT NOT NULL DEFAULT '',
                is_system   INTEGER NOT NULL DEFAULT 0,
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL
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
                is_active     INTEGER NOT NULL DEFAULT 1,
                created_at    TEXT NOT NULL,
                updated_at    TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS user_roles (
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, role_id)
            );",
        )
        .map_err(|error| error.to_string())?;

    for (id, module, label, description) in PERMISSION_CATALOG {
        connection
            .execute(
                "INSERT OR IGNORE INTO permissions (id, module, label, description) VALUES (?1, ?2, ?3, ?4)",
                params![id, module, label, description],
            )
            .map_err(|error| error.to_string())?;
    }

    connection
        .execute(
            "INSERT OR IGNORE INTO roles (id, name, description, is_system, created_at, updated_at)
             VALUES (?1, 'Administrator', 'Full system access to every module.', 1, datetime('now'), datetime('now'))",
            params![ADMIN_ROLE_ID],
        )
        .map_err(|error| error.to_string())?;

    for (id, _, _, _) in PERMISSION_CATALOG {
        connection
            .execute(
                "INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?1, ?2)",
                params![ADMIN_ROLE_ID, id],
            )
            .map_err(|error| error.to_string())?;
    }

    let user_count: i64 = connection
        .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
        .map_err(|error| error.to_string())?;

    if user_count == 0 {
        let admin_user_id = Uuid::new_v4().to_string();
        let default_password_hash = hash_password("admin123")?;
        connection
            .execute(
                "INSERT INTO users (id, username, display_name, password_hash, is_active, created_at, updated_at)
                 VALUES (?1, 'admin', 'Administrator', ?2, 1, datetime('now'), datetime('now'))",
                params![admin_user_id, default_password_hash],
            )
            .map_err(|error| error.to_string())?;
        connection
            .execute(
                "INSERT INTO user_roles (user_id, role_id) VALUES (?1, ?2)",
                params![admin_user_id, ADMIN_ROLE_ID],
            )
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}
