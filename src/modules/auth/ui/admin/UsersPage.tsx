import { Fragment, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { adminService } from "../../application/adminService";
import type { RoleSummary, UserSummary } from "../../domain/entities";
import { useSession } from "../SessionContext";

export function UsersPage() {
  const { user: currentUser } = useSession();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRoleIds, setNewRoleIds] = useState<string[]>([]);

  const reload = async () => {
    const [usersResult, rolesResult] = await Promise.all([adminService.listUsers(), adminService.listRoles()]);
    if (usersResult.ok) setUsers(usersResult.value);
    else setError(usersResult.error);
    if (rolesResult.ok) setRoles(rolesResult.value);
  };

  useEffect(() => {
    reload();
  }, []);

  const createUser = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const result = await adminService.createUser(newUsername.trim(), newDisplayName.trim(), newPassword, newRoleIds);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNewUsername("");
    setNewDisplayName("");
    setNewPassword("");
    setNewRoleIds([]);
    await reload();
  };

  const deactivateUser = async (id: string) => {
    if (!confirm("Deactivate this user? They will no longer be able to sign in.")) return;
    setError(null);
    const result = await adminService.deactivateUser(id);
    if (!result.ok) setError(result.error);
    await reload();
  };

  const toggleRole = async (targetUser: UserSummary, roleId: string) => {
    const nextIds = targetUser.roleIds.includes(roleId)
      ? targetUser.roleIds.filter((id) => id !== roleId)
      : [...targetUser.roleIds, roleId];
    setError(null);
    const result = await adminService.setUserRoles(targetUser.id, nextIds);
    if (!result.ok) setError(result.error);
    await reload();
  };

  const roleName = (id: string) => roles.find((role) => role.id === id)?.name ?? id;

  return (
    <div>
      <div className="admin-section-heading">
        <h2>Users</h2>
      </div>
      {error && <div className="admin-inline-error">{error}</div>}

      <form className="admin-form" onSubmit={createUser}>
        <div className="auth-field">
          <label htmlFor="user-username">Username</label>
          <input id="user-username" value={newUsername} onChange={(event) => setNewUsername(event.target.value)} required />
        </div>
        <div className="auth-field">
          <label htmlFor="user-display-name">Display name</label>
          <input id="user-display-name" value={newDisplayName} onChange={(event) => setNewDisplayName(event.target.value)} required />
        </div>
        <div className="auth-field">
          <label htmlFor="user-password">Temporary password</label>
          <input
            id="user-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <label>Roles</label>
          <select
            multiple
            value={newRoleIds}
            onChange={(event) => setNewRoleIds([...event.target.selectedOptions].map((option) => option.value))}
            style={{ minWidth: 160, padding: 6, borderRadius: 8, border: "1px solid #a9ccca" }}
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        <button className="admin-button" type="submit" disabled={!newUsername.trim() || !newDisplayName.trim() || !newPassword}>
          Add user
        </button>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Display name</th>
            <th>Status</th>
            <th>Roles</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <Fragment key={user.id}>
              <tr>
                <td>{user.username}</td>
                <td>{user.displayName}</td>
                <td>
                  <span className={`admin-pill ${user.isActive ? "" : "inactive"}`}>
                    {user.isActive ? "active" : "deactivated"}
                  </span>
                </td>
                <td>{user.roleIds.map(roleName).join(", ") || "—"}</td>
                <td>
                  <button
                    type="button"
                    className="admin-button secondary"
                    onClick={() => setExpandedUserId((current) => (current === user.id ? null : user.id))}
                  >
                    {expandedUserId === user.id ? "Hide" : "Roles"}
                  </button>{" "}
                  {user.isActive && user.id !== currentUser?.userId && (
                    <button type="button" className="admin-button danger" onClick={() => deactivateUser(user.id)}>
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
              {expandedUserId === user.id && (
                <tr>
                  <td colSpan={5}>
                    <div className="admin-permission-grid">
                      {roles.map((role) => (
                        <label key={role.id} className="admin-permission-item">
                          <input
                            type="checkbox"
                            checked={user.roleIds.includes(role.id)}
                            onChange={() => toggleRole(user, role.id)}
                          />
                          <div>
                            <strong>{role.name}</strong>
                            <span>{role.description}</span>
                          </div>
                        </label>
                      ))}
                    </div>
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
