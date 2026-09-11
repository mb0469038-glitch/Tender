import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "./SessionContext";
import { PermissionGate } from "./PermissionGate";
import { AUTH_PERMISSIONS } from "../domain/permissions";
import "./auth.css";

const initialsFor = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

export function ProfileMenu() {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  return (
    <div className="auth-profile-menu">
      <button
        type="button"
        className="auth-profile-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="User profile"
      >
        <span className="auth-profile-avatar">{initialsFor(user.displayName)}</span>
        <span className="auth-profile-name">{user.displayName}</span>
      </button>
      {open && (
        <div className="auth-profile-dropdown" onMouseLeave={() => setOpen(false)}>
          <div className="auth-profile-meta">Signed in as {user.username}</div>
          <PermissionGate permission={AUTH_PERMISSIONS.VIEW_ADMIN}>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/admin/users");
              }}
            >
              Manage users &amp; roles
            </button>
          </PermissionGate>
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await logout();
              navigate("/login");
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
