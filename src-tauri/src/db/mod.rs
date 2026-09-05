use std::path::PathBuf;

pub mod migrations;

/// Shared handle to the single app SQLite file. Reused by both the pre-existing
/// workspace persistence commands and the new auth/RBAC commands.
pub struct DatabasePath(pub PathBuf);
