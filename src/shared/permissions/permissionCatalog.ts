import { AUTH_PERMISSIONS_LIST } from "../../modules/auth/domain/permissions";
import { WORKSPACE_PERMISSIONS_LIST } from "../../modules/workspace-legacy/domain/permissions";

/**
 * Frontend-only convenience list aggregating every module's fixed permission
 * keys, e.g. for rendering the admin UI's "assign permissions" checkboxes
 * grouped by module. The actual source of truth for what a permission IS
 * (and its label/description) lives in the backend catalog and is fetched via
 * `listPermissions()` — this list is only used to sanity-check/group keys.
 *
 * Add a new module's permissions by importing its `..._LIST` export here.
 */
export const ALL_PERMISSION_KEYS: string[] = [...AUTH_PERMISSIONS_LIST, ...WORKSPACE_PERMISSIONS_LIST];
