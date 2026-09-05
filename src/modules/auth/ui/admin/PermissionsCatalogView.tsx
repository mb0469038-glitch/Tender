import { useEffect, useState } from "react";
import { adminService } from "../../application/adminService";
import type { Permission } from "../../domain/entities";

export function PermissionsCatalogView() {
  const [permissions, setPermissions] = useState<Permission[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService.listPermissions().then((result) => {
      if (result.ok) setPermissions(result.value);
      else setError(result.error);
    });
  }, []);

  const groups = new Map<string, Permission[]>();
  (permissions ?? []).forEach((permission) => {
    const list = groups.get(permission.module) ?? [];
    list.push(permission);
    groups.set(permission.module, list);
  });

  return (
    <div>
      <div className="admin-section-heading">
        <h2>Permission catalog</h2>
      </div>
      <p style={{ color: "#5d7377", fontSize: 12, marginTop: -6, marginBottom: 16 }}>
        Permissions are fixed and defined in code by each module. Create a role and assign a subset of these
        permissions to it, then assign that role to users.
      </p>
      {error && <div className="admin-inline-error">{error}</div>}
      <div className="admin-permission-groups">
        {[...groups.entries()].map(([module, items]) => (
          <div key={module} className="admin-permission-group">
            <h4>{module}</h4>
            <div className="admin-permission-grid">
              {items.map((permission) => (
                <div key={permission.id} className="admin-permission-item">
                  <div>
                    <strong>{permission.label}</strong>
                    <span>{permission.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
