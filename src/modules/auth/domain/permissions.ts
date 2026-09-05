/**
 * Fixed permission keys owned by the auth module. Must stay in sync with
 * src-tauri/src/auth/permissions_catalog.rs — see docs/architecture/RBAC.md.
 */
export const AUTH_PERMISSIONS = {
  VIEW_ADMIN: "auth.admin.view",
  MANAGE_USERS: "auth.users.manage",
  MANAGE_ROLES: "auth.roles.manage",
} as const;

export const AUTH_PERMISSIONS_LIST = Object.values(AUTH_PERMISSIONS);
