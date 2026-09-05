import { useState } from "react";
import { UsersPage } from "./UsersPage";
import { RolesPage } from "./RolesPage";
import { PermissionsCatalogView } from "./PermissionsCatalogView";
import "../auth.css";

type AdminTab = "users" | "roles" | "permissions";

export function AdminBackofficeLayout({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<AdminTab>("users");

  return (
    <div className="admin-backoffice">
      <nav className="admin-backoffice-nav">
        <button type="button" className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>
          Users
        </button>
        <button type="button" className={tab === "roles" ? "active" : ""} onClick={() => setTab("roles")}>
          Roles
        </button>
        <button type="button" className={tab === "permissions" ? "active" : ""} onClick={() => setTab("permissions")}>
          Permissions
        </button>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={onClose}>
          ← Back to app
        </button>
      </nav>
      <div className="admin-backoffice-content">
        {tab === "users" && <UsersPage />}
        {tab === "roles" && <RolesPage />}
        {tab === "permissions" && <PermissionsCatalogView />}
      </div>
    </div>
  );
}
