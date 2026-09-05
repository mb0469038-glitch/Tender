import { type Result, err, ok } from "../../../shared/kernel/result";
import type { Permission, RoleSummary, UserSummary } from "../domain/entities";
import { tauriAuthGateway } from "../infrastructure/tauriAuthGateway";

const asError = (error: unknown) => (typeof error === "string" ? error : "Something went wrong. Please try again.");

const wrap = async <T>(action: () => Promise<T>): Promise<Result<T>> => {
  try {
    return ok(await action());
  } catch (error) {
    return err(asError(error));
  }
};

export const adminService = {
  listUsers: () => wrap<UserSummary[]>(() => tauriAuthGateway.listUsers()),
  createUser: (username: string, displayName: string, password: string, roleIds: string[]) =>
    wrap<UserSummary>(() => tauriAuthGateway.createUser(username, displayName, password, roleIds)),
  updateUser: (id: string, displayName: string) => wrap<UserSummary>(() => tauriAuthGateway.updateUser(id, displayName)),
  deactivateUser: (id: string) => wrap<void>(() => tauriAuthGateway.deactivateUser(id)),
  setUserRoles: (userId: string, roleIds: string[]) =>
    wrap<UserSummary>(() => tauriAuthGateway.setUserRoles(userId, roleIds)),

  listRoles: () => wrap<RoleSummary[]>(() => tauriAuthGateway.listRoles()),
  createRole: (name: string, description: string) => wrap<RoleSummary>(() => tauriAuthGateway.createRole(name, description)),
  updateRole: (id: string, name: string, description: string) =>
    wrap<RoleSummary>(() => tauriAuthGateway.updateRole(id, name, description)),
  deleteRole: (id: string) => wrap<void>(() => tauriAuthGateway.deleteRole(id)),
  setRolePermissions: (roleId: string, permissionIds: string[]) =>
    wrap<RoleSummary>(() => tauriAuthGateway.setRolePermissions(roleId, permissionIds)),

  listPermissions: () => wrap<Permission[]>(() => tauriAuthGateway.listPermissions()),
};
