import { AUTH_PERMISSIONS } from "../../modules/auth/domain/permissions";
import { WORKSPACE_PERMISSIONS } from "../../modules/workspace-legacy/domain/permissions";

/**
 * Declarative nav-key -> permission-key map, documenting which permission
 * gates which top-level navigation entry. `App.tsx` wraps each nav button in
 * a `<PermissionGate permission={...}>` using these same keys directly; this
 * map exists as the single readable reference of "what gates what" for
 * anyone adding a new nav entry later (see docs/architecture/RBAC.md).
 */
export const NAV_PERMISSION_MAP = {
  "nav.projects": WORKSPACE_PERMISSIONS.VIEW_PROJECTS,
  "nav.execution-projects": WORKSPACE_PERMISSIONS.VIEW_EXECUTION_PROJECTS,
  "nav.database": WORKSPACE_PERMISSIONS.VIEW_DATABASE,
  "nav.assemblies": WORKSPACE_PERMISSIONS.VIEW_ASSEMBLIES,
  "nav.excel": WORKSPACE_PERMISSIONS.VIEW_EXCEL,
  "admin.backoffice": AUTH_PERMISSIONS.VIEW_ADMIN,
} as const;
