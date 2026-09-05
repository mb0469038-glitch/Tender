import { Fragment, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { adminService } from "../../application/adminService";
import type { Permission, RoleSummary } from "../../domain/entities";

export function RolesPage() {
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const reload = async () => {
    const [rolesResult, permissionsResult] = await Promise.all([adminService.listRoles(), adminService.listPermissions()]);
    if (rolesResult.ok) setRoles(rolesResult.value);
    else setError(rolesResult.error);
    if (permissionsResult.ok) setPermissions(permissionsResult.value);
  };

  useEffect(() => {
    reload();
  }, []);

  const createRole = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const result = await adminService.createRole(newName.trim(), newDescription.trim());
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNewName("");
    setNewDescription("");
    await reload();
  };

  const deleteRole = async (id: string) => {
    if (!confirm("Delete this role? This cannot be undone.")) return;
    setError(null);
    const result = await adminService.deleteRole(id);
    if (!result.ok) setError(result.error);
    await reload();
  };

  const togglePermission = async (role: RoleSummary, permissionId: string) => {
    if (role.isSystem) return;
    const nextIds = role.permissionIds.includes(permissionId)
      ? role.permissionIds.filter((id) => id !== permissionId)
      : [...role.permissionIds, permissionId];
    setError(null);
    const result = await adminService.setRolePermissions(role.id, nextIds);
    if (!result.ok) setError(result.error);
    await reload();
  };

  const groups = new Map<string, Permission[]>();
  permissions.forEach((permission) => {
    const list = groups.get(permission.module) ?? [];
    list.push(permission);
    groups.set(permission.module, list);
  });

  return (
    <div>
      <div className="admin-section-heading">
        <h2>Roles</h2>
      </div>
      {error && <div className="admin-inline-error">{error}</div>}

      <form className="admin-form" onSubmit={createRole}>
        <div className="auth-field">
          <label htmlFor="role-name">Role name</label>
          <input id="role-name" value={newName} onChange={(event) => setNewName(event.target.value)} required />
        </div>
        <div className="auth-field">
          <label htmlFor="role-description">Description</label>
          <input id="role-description" value={newDescription} onChange={(event) => setNewDescription(event.target.value)} />
        </div>
        <button className="admin-button" type="submit" disabled={!newName.trim()}>
          Add role
        </button>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Permissions</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <Fragment key={role.id}>
              <tr>
                <td>
                  {role.name} {role.isSystem && <span className="admin-pill">system</span>}
                </td>
                <td>{role.description}</td>
                <td>{role.permissionIds.length}</td>
                <td>
                  <button
                    type="button"
                    className="admin-button secondary"
                    onClick={() => setExpandedRoleId((current) => (current === role.id ? null : role.id))}
                  >
                    {expandedRoleId === role.id ? "Hide" : "Permissions"}
                  </button>{" "}
                  {!role.isSystem && (
                    <button type="button" className="admin-button danger" onClick={() => deleteRole(role.id)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
              {expandedRoleId === role.id && (
                <tr>
                  <td colSpan={4}>
                    {role.isSystem ? (
                      <p style={{ color: "#5d7377", fontSize: 12 }}>
                        The Administrator role always has every permission and cannot be edited.
                      </p>
                    ) : (
                      <div className="admin-permission-groups">
                        {[...groups.entries()].map(([module, items]) => (
                          <div key={module} className="admin-permission-group">
                            <h4>{module}</h4>
                            <div className="admin-permission-grid">
                              {items.map((permission) => (
                                <label key={permission.id} className="admin-permission-item">
                                  <input
                                    type="checkbox"
                                    checked={role.permissionIds.includes(permission.id)}
                                    onChange={() => togglePermission(role, permission.id)}
                                  />
                                  <div>
                                    <strong>{permission.label}</strong>
                                    <span>{permission.description}</span>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
