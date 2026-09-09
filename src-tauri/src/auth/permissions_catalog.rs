/// Fixed, code-defined permission catalog. Permissions are NOT admin-creatable —
/// only roles (which group permissions) and user-role assignments are dynamic.
///
/// Keep this list in sync with the TypeScript catalogs under
/// `src/modules/auth/domain/permissions.ts` and
/// `src/modules/workspace-legacy/domain/permissions.ts`. See docs/architecture/RBAC.md.
///
/// Tuple shape: (id, module, label, description)
pub const PERMISSION_CATALOG: &[(&str, &str, &str, &str)] = &[
    // --- auth module: administration of users/roles/permissions itself ---
    ("auth.admin.view", "auth", "View admin backoffice", "Can open the Users & Roles administration area."),
    ("auth.users.manage", "auth", "Manage users", "Can create, edit, deactivate users and assign roles to them."),
    ("auth.roles.manage", "auth", "Manage roles", "Can create, edit, delete roles and assign permissions to them."),

    // --- workspace-legacy module: today's existing screens ---
    ("workspace.projects.view", "workspace", "View projects", "Can open the Projects screen and browse projects."),
    ("workspace.projects.create", "workspace", "Create projects", "Can create new projects."),
    ("workspace.projects.delete", "workspace", "Delete projects", "Can delete existing projects."),
    ("workspace.canvas.edit", "workspace", "Edit project canvas", "Can draw/edit openings on a project canvas."),

    ("workspace.execution-projects.view", "workspace", "View projects under execution", "Can open the operational projects screen."),
    ("workspace.execution-projects.create", "workspace", "Create projects under execution", "Can add operational projects."),
    ("workspace.execution-projects.delete", "workspace", "Delete projects under execution", "Can delete operational projects."),

    ("workspace.database.view", "workspace", "View material database", "Can open the Database screen (price book, glass, costing & financials)."),
    ("workspace.materials.create", "workspace", "Create materials", "Can add new materials to the price book."),
    ("workspace.materials.edit", "workspace", "Edit materials", "Can edit existing material fields (cost, weight, shipping, etc.)."),
    ("workspace.materials.delete", "workspace", "Delete materials", "Can delete materials from the price book."),

    ("workspace.assemblies.view", "workspace", "View assemblies", "Can open the Assemblies screen."),
    ("workspace.assemblies.create", "workspace", "Create assemblies", "Can create new assemblies."),
    ("workspace.assemblies.delete", "workspace", "Delete assemblies", "Can delete existing assemblies."),

    ("workspace.costing.view", "workspace", "View costing & financials", "Can view markup rates, manpower costs, shipping costs."),
    ("workspace.costing.edit", "workspace", "Edit costing & financials", "Can edit markup rates, manpower costs, shipping costs."),

    ("workspace.excel.view", "workspace", "View Excel workspace", "Can open the standalone Excel workspace screen."),
];
