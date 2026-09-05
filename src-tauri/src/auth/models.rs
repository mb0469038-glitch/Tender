use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Permission {
    pub id: String,
    pub module: String,
    pub label: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoleSummary {
    pub id: String,
    pub name: String,
    pub description: String,
    pub is_system: bool,
    pub permission_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSummary {
    pub id: String,
    pub username: String,
    pub display_name: String,
    pub is_active: bool,
    pub role_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    pub user_id: String,
    pub username: String,
    pub display_name: String,
    pub role_ids: Vec<String>,
    pub permissions: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct CurrentSession {
    pub user_id: String,
    pub username: String,
    pub display_name: String,
    pub role_ids: Vec<String>,
    pub permissions: Vec<String>,
}

impl CurrentSession {
    pub fn to_info(&self) -> SessionInfo {
        SessionInfo {
            user_id: self.user_id.clone(),
            username: self.username.clone(),
            display_name: self.display_name.clone(),
            role_ids: self.role_ids.clone(),
            permissions: self.permissions.clone(),
        }
    }

    pub fn has_permission(&self, permission_id: &str) -> bool {
        self.permissions.iter().any(|permission| permission == permission_id)
    }
}
