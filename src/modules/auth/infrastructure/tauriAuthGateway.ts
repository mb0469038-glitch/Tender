import { invoke } from "@tauri-apps/api/core";
import type { Permission, RoleSummary, SessionInfo, UserSummary } from "../domain/entities";

/**
 * The only file in the app allowed to call `invoke(...)` for auth/RBAC
 * concerns. Rust's serde emits struct fields as declared (snake_case); this
 * gateway is the single place that maps those raw shapes to the app's
 * camelCase domain entities, so the rest of the app never sees snake_case.
 */

type RawPermission = { id: string; module: string; label: string; description: string };
type RawRoleSummary = { id: string; name: string; description: string; is_system: boolean; permission_ids: string[] };
type RawUserSummary = { id: string; username: string; display_name: string; is_active: boolean; role_ids: string[] };
type RawSessionInfo = {
  user_id: string;
  username: string;
  display_name: string;
  role_ids: string[];
  permissions: string[];
};

const toPermission = (raw: RawPermission): Permission => ({
  id: raw.id,
  module: raw.module,
  label: raw.label,
  description: raw.description,
});

const toRoleSummary = (raw: RawRoleSummary): RoleSummary => ({
  id: raw.id,
  name: raw.name,
  description: raw.description,
  isSystem: raw.is_system,
  permissionIds: raw.permission_ids,
});

const toUserSummary = (raw: RawUserSummary): UserSummary => ({
  id: raw.id,
  username: raw.username,
  displayName: raw.display_name,
  isActive: raw.is_active,
  roleIds: raw.role_ids,
});

const toSessionInfo = (raw: RawSessionInfo): SessionInfo => ({
  userId: raw.user_id,
  username: raw.username,
  displayName: raw.display_name,
  roleIds: raw.role_ids,
  permissions: raw.permissions,
});

export const tauriAuthGateway = {
  login: (username: string, password: string) =>
    invoke<RawSessionInfo>("login", { username, password }).then(toSessionInfo),

  logout: () => invoke<void>("logout"),

  getCurrentSession: () =>
    invoke<RawSessionInfo | null>("get_current_session").then((raw) => (raw ? toSessionInfo(raw) : null)),

  changePassword: (oldPassword: string, newPassword: string) =>
    invoke<void>("change_password", { oldPassword, newPassword }),

  listUsers: () => invoke<RawUserSummary[]>("list_users").then((rows) => rows.map(toUserSummary)),

  createUser: (username: string, displayName: string, password: string, roleIds: string[]) =>
    invoke<RawUserSummary>("create_user", { username, displayName, password, roleIds }).then(toUserSummary),

  updateUser: (id: string, displayName: string) =>
    invoke<RawUserSummary>("update_user", { id, displayName }).then(toUserSummary),

  deactivateUser: (id: string) => invoke<void>("deactivate_user", { id }),

  setUserRoles: (userId: string, roleIds: string[]) =>
    invoke<RawUserSummary>("set_user_roles", { userId, roleIds }).then(toUserSummary),

  listRoles: () => invoke<RawRoleSummary[]>("list_roles").then((rows) => rows.map(toRoleSummary)),

  createRole: (name: string, description: string) =>
    invoke<RawRoleSummary>("create_role", { name, description }).then(toRoleSummary),

  updateRole: (id: string, name: string, description: string) =>
    invoke<RawRoleSummary>("update_role", { id, name, description }).then(toRoleSummary),

  deleteRole: (id: string) => invoke<void>("delete_role", { id }),

  setRolePermissions: (roleId: string, permissionIds: string[]) =>
    invoke<RawRoleSummary>("set_role_permissions", { roleId, permissionIds }).then(toRoleSummary),

  listPermissions: () => invoke<RawPermission[]>("list_permissions").then((rows) => rows.map(toPermission)),
};
