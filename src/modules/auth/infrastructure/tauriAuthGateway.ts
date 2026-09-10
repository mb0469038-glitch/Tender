import { http } from "../../../shared/kernel/http";
import type { Permission, RoleSummary, SessionInfo, UserSummary } from "../domain/entities";

/**
 * Authentication and RBAC gateway:
 * Exclusively uses PostgreSQL REST API endpoints (/api/auth/*).
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
    return http.post<RawSessionInfo>("/api/auth/login", { username, password }).then(toSessionInfo);
  },

  logout: () => {
    return http.post<void>("/api/auth/logout");
  },

  getCurrentSession: () => {
    return http.get<RawSessionInfo | null>("/api/auth/session").then((raw) => (raw ? toSessionInfo(raw) : null));
  },

  changePassword: (oldPassword: string, newPassword: string) => {
    return http.post<void>("/api/auth/change-password", { oldPassword, newPassword });
  },

  listUsers: () => {
    return http.get<RawUserSummary[]>("/api/auth/users").then((rows) => rows.map(toUserSummary));
  },

  createUser: (username: string, displayName: string, password: string, roleIds: string[]) => {
    return http.post<RawUserSummary>("/api/auth/users", { username, displayName, password, roleIds }).then(toUserSummary);
  },

  updateUser: (id: string, displayName: string) => {
    return http.put<RawUserSummary>(`/api/auth/users/${id}`, { displayName }).then(toUserSummary);
  },

  deactivateUser: (id: string) => {
    return http.post<void>(`/api/auth/users/${id}/deactivate`);
  },

  setUserRoles: (userId: string, roleIds: string[]) => {
    return http.put<RawUserSummary>(`/api/auth/users/${userId}/roles`, { roleIds }).then(toUserSummary);
  },

  listRoles: () => {
    return http.get<RawRoleSummary[]>("/api/auth/roles").then((rows) => rows.map(toRoleSummary));
  },

  createRole: (name: string, description: string) => {
    return http.post<RawRoleSummary>("/api/auth/roles", { name, description }).then(toRoleSummary);
  },

  updateRole: (id: string, name: string, description: string) => {
    return http.put<RawRoleSummary>(`/api/auth/roles/${id}`, { name, description }).then(toRoleSummary);
  },

  deleteRole: (id: string) => {
    return http.delete<void>(`/api/auth/roles/${id}`);
  },

  setRolePermissions: (roleId: string, permissionIds: string[]) => {
    return http.put<RawRoleSummary>(`/api/auth/roles/${roleId}/permissions`, { permissionIds }).then(toRoleSummary);
  },

  listPermissions: () => {
    return http.get<RawPermission[]>("/api/auth/permissions").then((rows) => rows.map(toPermission));
  },
};

