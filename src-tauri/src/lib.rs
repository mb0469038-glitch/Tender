mod auth;
mod db;

use auth::commands::{
    change_password, create_role, create_user, deactivate_user, delete_role, get_current_session,
    list_permissions, list_roles, list_users, login, logout, set_role_permissions, set_user_roles,
    update_role, update_user, SessionState,
};
use db::DatabasePath;
use rusqlite::{params, Connection, OptionalExtension};
use tauri::Manager;

#[tauri::command]
fn load_workspace(database: tauri::State<'_, DatabasePath>) -> Result<Option<String>, String> {
    let connection = Connection::open(&database.0).map_err(|error| error.to_string())?;
    connection
        .query_row(
            "SELECT value FROM workspace_snapshot WHERE id = 'current'",
            [],
            |row| row.get(0),
        )
        .optional()
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn save_workspace(snapshot: String, database: tauri::State<'_, DatabasePath>) -> Result<(), String> {
    let connection = Connection::open(&database.0).map_err(|error| error.to_string())?;
    connection
        .execute(
            "INSERT INTO workspace_snapshot (id, value, updated_at) VALUES ('current', ?1, datetime('now'))
             ON CONFLICT(id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
            params![snapshot],
        )
        .map_err(|error| error.to_string())?;
    connection
        .execute(
            "INSERT INTO workspace_save_history (saved_at) VALUES (strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime'))",
            [],
        )
        .map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
fn recent_workspace_saves(database: tauri::State<'_, DatabasePath>) -> Result<Vec<String>, String> {
    let connection = Connection::open(&database.0).map_err(|error| error.to_string())?;
    let mut statement = connection
        .prepare("SELECT saved_at FROM workspace_save_history ORDER BY id DESC LIMIT 5")
        .map_err(|error| error.to_string())?;
    let saves = statement
        .query_map([], |row| row.get(0))
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|error| error.to_string())?;
    Ok(saves)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data = app.path().app_data_dir().map_err(|error| error.to_string())?;
            std::fs::create_dir_all(&app_data).map_err(|error| error.to_string())?;
            let database_path = app_data.join("tender-studio.sqlite");
            let connection = Connection::open(&database_path).map_err(|error| error.to_string())?;
            connection.execute_batch(
                "CREATE TABLE IF NOT EXISTS workspace_snapshot (
                    id TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS workspace_save_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    saved_at TEXT NOT NULL
                );",
            ).map_err(|error| error.to_string())?;
            db::migrations::run_auth_migrations(&connection).map_err(|error| error.to_string())?;
            app.manage(DatabasePath(database_path));
            app.manage(SessionState::default());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_workspace,
            save_workspace,
            recent_workspace_saves,
            login,
            logout,
            get_current_session,
            change_password,
            list_users,
            create_user,
            update_user,
            deactivate_user,
            set_user_roles,
            list_roles,
            create_role,
            update_role,
            delete_role,
            set_role_permissions,
            list_permissions,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
