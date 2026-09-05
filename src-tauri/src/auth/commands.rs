use crate::auth::models::{CurrentSession, Permission, RoleSummary, SessionInfo, UserSummary};
use crate::auth::password::{hash_password, verify_password};
use crate::db::DatabasePath;
use rusqlite::{params, Connection, OptionalExtension};
use std::sync::Mutex;
use uuid::Uuid;

#[derive(Default)]
pub struct SessionState(pub Mutex<Option<CurrentSession>>);

fn open(database: &DatabasePath) -> Result<Connection, String> {
    Connection::open(&database.0).map_err(|error| error.to_string())
}

fn role_ids_for_user(connection: &Connection, user_id: &str) -> Result<Vec<String>, String> {
    let mut statement = connection
        .prepare("SELECT role_id FROM user_roles WHERE user_id = ?1")
        .map_err(|error| error.to_string())?;
    let rows = statement
        .query_map(params![user_id], |row| row.get(0))
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|error| error.to_string())?;
    Ok(rows)
}

fn permission_ids_for_roles(connection: &Connection, role_ids: &[String]) -> Result<Vec<String>, String> {
    if role_ids.is_empty() {
        return Ok(Vec::new());
    }
    let placeholders = role_ids.iter().map(|_| "?").collect::<Vec<_>>().join(", ");
    let sql = format!(
        "SELECT DISTINCT permission_id FROM role_permissions WHERE role_id IN ({placeholders})"
    );
    let mut statement = connection.prepare(&sql).map_err(|error| error.to_string())?;
    let params_refs: Vec<&dyn rusqlite::ToSql> = role_ids.iter().map(|id| id as &dyn rusqlite::ToSql).collect();
    let rows = statement
        .query_map(params_refs.as_slice(), |row| row.get(0))
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|error| error.to_string())?;
    Ok(rows)
}

fn permission_ids_for_role(connection: &Connection, role_id: &str) -> Result<Vec<String>, String> {
    let mut statement = connection
        .prepare("SELECT permission_id FROM role_permissions WHERE role_id = ?1")
        .map_err(|error| error.to_string())?;
    let rows = statement
        .query_map(params![role_id], |row| row.get(0))
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|error| error.to_string())?;
    Ok(rows)
}

fn require_permission(session: &tauri::State<'_, SessionState>, permission_id: &str) -> Result<CurrentSession, String> {
    let guard = session.0.lock().map_err(|_| "Session state is poisoned.".to_string())?;
    match guard.as_ref() {
        Some(current) if current.has_permission(permission_id) => Ok(current.clone()),
        Some(_) => Err("You do not have permission to perform this action.".to_string()),
        None => Err("Not logged in.".to_string()),
    }
}

#[tauri::command]
pub fn login(
    username: String,
    password: String,
    database: tauri::State<'_, DatabasePath>,
    session: tauri::State<'_, SessionState>,
) -> Result<SessionInfo, String> {
    let connection = open(&database)?;
    let row: Option<(String, String, String, bool)> = connection
        .query_row(
            "SELECT id, display_name, password_hash, is_active FROM users WHERE username = ?1",
            params![username],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get::<_, i64>(3)? != 0)),
        )
        .optional()
        .map_err(|error| error.to_string())?;

    let (user_id, display_name, password_hash, is_active) =
        row.ok_or_else(|| "Invalid username or password.".to_string())?;

    if !is_active {
        return Err("This account has been deactivated.".to_string());
    }
    if !verify_password(&password_hash, &password)? {
        return Err("Invalid username or password.".to_string());
    }

    let role_ids = role_ids_for_user(&connection, &user_id)?;
    let permissions = permission_ids_for_roles(&connection, &role_ids)?;

    let current = CurrentSession {
        user_id,
        username,
        display_name,
        role_ids,
        permissions,
    };
    let info = current.to_info();
    *session.0.lock().map_err(|_| "Session state is poisoned.".to_string())? = Some(current);
    Ok(info)
}

#[tauri::command]
pub fn logout(session: tauri::State<'_, SessionState>) -> Result<(), String> {
    *session.0.lock().map_err(|_| "Session state is poisoned.".to_string())? = None;
    Ok(())
}

#[tauri::command]
pub fn get_current_session(session: tauri::State<'_, SessionState>) -> Result<Option<SessionInfo>, String> {
    let guard = session.0.lock().map_err(|_| "Session state is poisoned.".to_string())?;
    Ok(guard.as_ref().map(CurrentSession::to_info))
}

#[tauri::command]
pub fn change_password(
    old_password: String,
    new_password: String,
    database: tauri::State<'_, DatabasePath>,
    session: tauri::State<'_, SessionState>,
) -> Result<(), String> {
    let user_id = {
        let guard = session.0.lock().map_err(|_| "Session state is poisoned.".to_string())?;
        guard.as_ref().ok_or_else(|| "Not logged in.".to_string())?.user_id.clone()
    };
    if new_password.trim().len() < 4 {
        return Err("New password must be at least 4 characters.".to_string());
    }
    let connection = open(&database)?;
    let current_hash: String = connection
        .query_row("SELECT password_hash FROM users WHERE id = ?1", params![user_id], |row| row.get(0))
        .map_err(|error| error.to_string())?;
    if !verify_password(&current_hash, &old_password)? {
        return Err("Current password is incorrect.".to_string());
    }
    let new_hash = hash_password(&new_password)?;
    connection
        .execute(
            "UPDATE users SET password_hash = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![new_hash, user_id],
        )
        .map_err(|error| error.to_string())?;
    Ok(())
}

fn load_user_summary(connection: &Connection, user_id: &str) -> Result<UserSummary, String> {
    let (username, display_name, is_active): (String, String, bool) = connection
        .query_row(
            "SELECT username, display_name, is_active FROM users WHERE id = ?1",
            params![user_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get::<_, i64>(2)? != 0)),
        )
        .map_err(|error| error.to_string())?;
    let role_ids = role_ids_for_user(connection, user_id)?;
    Ok(UserSummary { id: user_id.to_string(), username, display_name, is_active, role_ids })
}

#[tauri::command]
pub fn list_users(
    database: tauri::State<'_, DatabasePath>,
    session: tauri::State<'_, SessionState>,
) -> Result<Vec<UserSummary>, String> {
    require_permission(&session, "auth.users.manage")?;
    let connection = open(&database)?;
    let mut statement = connection.prepare("SELECT id FROM users ORDER BY username ASC").map_err(|error| error.to_string())?;
    let ids = statement
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|error| error.to_string())?;
    ids.iter().map(|id| load_user_summary(&connection, id)).collect()
}

#[tauri::command]
pub fn create_user(
    username: String,
    display_name: String,
    password: String,
    role_ids: Vec<String>,
    database: tauri::State<'_, DatabasePath>,
    session: tauri::State<'_, SessionState>,
) -> Result<UserSummary, String> {
    require_permission(&session, "auth.users.manage")?;
    let username = username.trim().to_string();
    if username.is_empty() {
        return Err("Username is required.".to_string());
    }
    if password.trim().len() < 4 {
        return Err("Password must be at least 4 characters.".to_string());
    }
    let mut connection = open(&database)?;
    let existing: Option<String> = connection
        .query_row("SELECT id FROM users WHERE username = ?1", params![username], |row| row.get(0))
        .optional()
        .map_err(|error| error.to_string())?;
    if existing.is_some() {
        return Err("A user with this username already exists.".to_string());
    }
    let user_id = Uuid::new_v4().to_string();
    let password_hash = hash_password(&password)?;
    let transaction = connection.transaction().map_err(|error| error.to_string())?;
    transaction
        .execute(
            "INSERT INTO users (id, username, display_name, password_hash, is_active, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, 1, datetime('now'), datetime('now'))",
            params![user_id, username, display_name.trim(), password_hash],
        )
        .map_err(|error| error.to_string())?;
    for role_id in &role_ids {
        transaction
            .execute("INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?1, ?2)", params![user_id, role_id])
            .map_err(|error| error.to_string())?;
    }
    transaction.commit().map_err(|error| error.to_string())?;
    load_user_summary(&connection, &user_id)
}

#[tauri::command]
pub fn update_user(
    id: String,
    display_name: String,
    database: tauri::State<'_, DatabasePath>,
    session: tauri::State<'_, SessionState>,
) -> Result<UserSummary, String> {
    require_permission(&session, "auth.users.manage")?;
    let connection = open(&database)?;
    connection
        .execute(
            "UPDATE users SET display_name = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![display_name.trim(), id],
        )
        .map_err(|error| error.to_string())?;
    load_user_summary(&connection, &id)
}

#[tauri::command]
pub fn deactivate_user(
    id: String,
    database: tauri::State<'_, DatabasePath>,
    session: tauri::State<'_, SessionState>,
) -> Result<(), String> {
    let acting = require_permission(&session, "auth.users.manage")?;
    if acting.user_id == id {
        return Err("You cannot deactivate your own account.".to_string());
    }
    let connection = open(&database)?;
    connection
        .execute("UPDATE users SET is_active = 0, updated_at = datetime('now') WHERE id = ?1", params![id])
        .map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn set_user_roles(
    user_id: String,
    role_ids: Vec<String>,
    database: tauri::State<'_, DatabasePath>,
    session: tauri::State<'_, SessionState>,
) -> Result<UserSummary, String> {
    require_permission(&session, "auth.users.manage")?;
    let mut connection = open(&database)?;
    let transaction = connection.transaction().map_err(|error| error.to_string())?;
    transaction.execute("DELETE FROM user_roles WHERE user_id = ?1", params![user_id]).map_err(|error| error.to_string())?;
    for role_id in &role_ids {
        transaction
            .execute("INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?1, ?2)", params![user_id, role_id])
            .map_err(|error| error.to_string())?;
    }
    transaction.commit().map_err(|error| error.to_string())?;
    load_user_summary(&connection, &user_id)
}

fn load_role_summary(connection: &Connection, role_id: &str) -> Result<RoleSummary, String> {
    let (name, description, is_system): (String, String, bool) = connection
        .query_row(
            "SELECT name, description, is_system FROM roles WHERE id = ?1",
            params![role_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get::<_, i64>(2)? != 0)),
        )
        .map_err(|error| error.to_string())?;
    let permission_ids = permission_ids_for_role(connection, role_id)?;
    Ok(RoleSummary { id: role_id.to_string(), name, description, is_system, permission_ids })
}

#[tauri::command]
pub fn list_roles(
    database: tauri::State<'_, DatabasePath>,
    session: tauri::State<'_, SessionState>,
) -> Result<Vec<RoleSummary>, String> {
    require_permission(&session, "auth.roles.manage")?;
    let connection = open(&database)?;
    let mut statement = connection.prepare("SELECT id FROM roles ORDER BY name ASC").map_err(|error| error.to_string())?;
    let ids = statement
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|error| error.to_string())?;
    ids.iter().map(|id| load_role_summary(&connection, id)).collect()
}

#[tauri::command]
pub fn create_role(
    name: String,
    description: String,
    database: tauri::State<'_, DatabasePath>,
    session: tauri::State<'_, SessionState>,
) -> Result<RoleSummary, String> {
    require_permission(&session, "auth.roles.manage")?;
    let name = name.trim().to_string();
    if name.is_empty() {
        return Err("Role name is required.".to_string());
    }
    let connection = open(&database)?;
    let existing: Option<String> = connection
        .query_row("SELECT id FROM roles WHERE name = ?1", params![name], |row| row.get(0))
        .optional()
        .map_err(|error| error.to_string())?;
    if existing.is_some() {
        return Err("A role with this name already exists.".to_string());
    }
    let role_id = Uuid::new_v4().to_string();
    connection
        .execute(
            "INSERT INTO roles (id, name, description, is_system, created_at, updated_at)
             VALUES (?1, ?2, ?3, 0, datetime('now'), datetime('now'))",
            params![role_id, name, description.trim()],
        )
        .map_err(|error| error.to_string())?;
    load_role_summary(&connection, &role_id)
}

#[tauri::command]
pub fn update_role(
    id: String,
    name: String,
    description: String,
    database: tauri::State<'_, DatabasePath>,
    session: tauri::State<'_, SessionState>,
) -> Result<RoleSummary, String> {
    require_permission(&session, "auth.roles.manage")?;
    let connection = open(&database)?;
    let is_system: bool = connection
        .query_row("SELECT is_system FROM roles WHERE id = ?1", params![id], |row| row.get::<_, i64>(0))
        .map_err(|error| error.to_string())?
        != 0;
    if is_system {
        return Err("The built-in Administrator role cannot be renamed.".to_string());
    }
    connection
        .execute(
            "UPDATE roles SET name = ?1, description = ?2, updated_at = datetime('now') WHERE id = ?3",
            params![name.trim(), description.trim(), id],
        )
        .map_err(|error| error.to_string())?;
    load_role_summary(&connection, &id)
}

#[tauri::command]
pub fn delete_role(
    id: String,
    database: tauri::State<'_, DatabasePath>,
    session: tauri::State<'_, SessionState>,
) -> Result<(), String> {
    require_permission(&session, "auth.roles.manage")?;
    let connection = open(&database)?;
    let is_system: bool = connection
        .query_row("SELECT is_system FROM roles WHERE id = ?1", params![id], |row| row.get::<_, i64>(0))
        .map_err(|error| error.to_string())?
        != 0;
    if is_system {
        return Err("The built-in Administrator role cannot be deleted.".to_string());
    }
    let assigned_count: i64 = connection
        .query_row("SELECT COUNT(*) FROM user_roles WHERE role_id = ?1", params![id], |row| row.get(0))
        .map_err(|error| error.to_string())?;
    if assigned_count > 0 {
        return Err("This role is still assigned to one or more users. Unassign it first.".to_string());
    }
    connection.execute("DELETE FROM roles WHERE id = ?1", params![id]).map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn set_role_permissions(
    role_id: String,
    permission_ids: Vec<String>,
    database: tauri::State<'_, DatabasePath>,
    session: tauri::State<'_, SessionState>,
) -> Result<RoleSummary, String> {
    require_permission(&session, "auth.roles.manage")?;
    let mut connection = open(&database)?;
    let is_system: bool = connection
        .query_row("SELECT is_system FROM roles WHERE id = ?1", params![role_id], |row| row.get::<_, i64>(0))
        .map_err(|error| error.to_string())?
        != 0;
    if is_system {
        return Err("The built-in Administrator role always has every permission.".to_string());
    }
    let transaction = connection.transaction().map_err(|error| error.to_string())?;
    transaction.execute("DELETE FROM role_permissions WHERE role_id = ?1", params![role_id]).map_err(|error| error.to_string())?;
    for permission_id in &permission_ids {
        transaction
            .execute(
                "INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?1, ?2)",
                params![role_id, permission_id],
            )
            .map_err(|error| error.to_string())?;
    }
    transaction.commit().map_err(|error| error.to_string())?;
    load_role_summary(&connection, &role_id)
}

#[tauri::command]
pub fn list_permissions(
    database: tauri::State<'_, DatabasePath>,
    session: tauri::State<'_, SessionState>,
) -> Result<Vec<Permission>, String> {
    require_permission(&session, "auth.admin.view")?;
    let connection = open(&database)?;
    let mut statement = connection
        .prepare("SELECT id, module, label, description FROM permissions ORDER BY module ASC, id ASC")
        .map_err(|error| error.to_string())?;
    let rows = statement
        .query_map([], |row| {
            Ok(Permission {
                id: row.get(0)?,
                module: row.get(1)?,
                label: row.get(2)?,
                description: row.get(3)?,
            })
        })
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<Permission>, _>>()
        .map_err(|error| error.to_string())?;
    Ok(rows)
}
