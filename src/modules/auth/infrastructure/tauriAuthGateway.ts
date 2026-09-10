import { invoke } from "@tauri-apps/api/core";
import { isTauri, http } from "../../../shared/kernel/http";
import type { Permission, RoleSummary, SessionInfo, UserSummary } from "../domain/entities";

/**
 * The only file in the app allowed to handle auth/RBAC I/O.
 * Dual-mode:
 * - In Tauri desktop: invokes local Rust commands.
 * - In Web browser / Docker: calls server REST API endpoints.
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
  login: (username: string, password: string) => {
    if (isTauri()) {
      return invoke<RawSessionInfo>("login", { username, password }).then(toSessionInfo);
    }
    return http.post<RawSessionInfo>("/api/auth/login", { username, password }).then(toSessionInfo);
  },

  logout: () => {
    if (isTauri()) {
      return invoke<void>("logout");
    }
    return http.post<void>("/api/auth/logout");
  },

  getCurrentSession: () => {
    if (isTauri()) {
      return invoke<RawSessionInfo | null>("get_current_session").then((raw) => (raw ? toSessionInfo(raw) : null));
    }
    return http.get<RawSessionInfo | null>("/api/auth/session").then((raw) => (raw ? toSessionInfo(raw) : null));
  },

  changePassword: (oldPassword: string, newPassword: string) => {
    if (isTauri()) {
      return invoke<void>("change_password", { oldPassword, newPassword });
    }
    return http.post<void>("/api/auth/change-password", { oldPassword, newPassword });
  },

  listUsers: () => {
    if (isTauri()) {
      return invoke<RawUserSummary[]>("list_users").then((rows) => rows.map(toUserSummary));
    }
    return http.get<RawUserSummary[]>("/api/auth/users").then((rows) => rows.map(toUserSummary));
  },

  createUser: (username: string, displayName: string, password: string, roleIds: string[]) => {
    if (isTauri()) {
      return invoke<RawUserSummary>("create_user", { username, displayName, password, roleIds }).then(toUserSummary);
    }
    return http.post<RawUserSummary>("/api/auth/users", { username, displayName, password, roleIds }).then(toUserSummary);
  },

  updateUser: (id: string, displayName: string) => {
    if (isTauri()) {
      return invoke<RawUserSummary>("update_user", { id, displayName }).then(toUserSummary);
    }
    return http.put<RawUserSummary>(`/api/auth/users/${id}`, { displayName }).then(toUserSummary);
  },

  deactivateUser: (id: string) => {
    if (isTauri()) {
      return invoke<void>("deactivate_user", { id });
    }
    return http.post<void>(`/api/auth/users/${id}/deactivate`);
  },

  setUserRoles: (userId: string, roleIds: string[]) => {
    if (isTauri()) {
      return invoke<RawUserSummary>("set_user_roles", { userId, roleIds }).then(toUserSummary);
    }
    return http.put<RawUserSummary>(`/api/auth/users/${userId}/roles`, { roleIds }).then(toUserSummary);
  },

  listRoles: () => {
    if (isTauri()) {
      return invoke<RawRoleSummary[]>("list_roles").then((rows) => rows.map(toRoleSummary));
    }
    return http.get<RawRoleSummary[]>("/api/auth/roles").then((rows) => rows.map(toRoleSummary));
  },

  createRole: (name: string, description: string) => {
    if (isTauri()) {
      return invoke<RawRoleSummary>("create_role", { name, description }).then(toRoleSummary);
    }
    return http.post<RawRoleSummary>("/api/auth/roles", { name, description }).then(toRoleSummary);
  },

  updateRole: (id: string, name: string, description: string) => {
    if (isTauri()) {
      return invoke<RawRoleSummary>("update_role", { id, name, description }).then(toRoleSummary);
    }
    return http.put<RawRoleSummary>(`/api/auth/roles/${id}`, { name, description }).then(toRoleSummary);
  },

  deleteRole: (id: string) => {
    if (isTauri()) {
      return invoke<void>("delete_role", { id });
    }
    return http.delete<void>(`/api/auth/roles/${id}`);
  },

  setRolePermissions: (roleId: string, permissionIds: string[]) => {
    if (isTauri()) {
      return invoke<RawRoleSummary>("set_role_permissions", { roleId, permissionIds }).then(toRoleSummary);
    }
    return http.put<RawRoleSummary>(`/api/auth/roles/${roleId}/permissions`, { permissionIds }).then(toRoleSummary);
  },

  listPermissions: () => {
    if (isTauri()) {
      return invoke<RawPermission[]>("list_permissions").then((rows) => rows.map(toPermission));
    }
    return http.get<RawPermission[]>("/api/auth/permissions").then((rows) => rows.map(toPermission));
  },
};

