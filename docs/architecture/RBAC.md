# Users, Roles & Permissions (RBAC)

## Model

- **Permission** — a fixed, code-defined capability, e.g. `workspace.materials.delete`.
  Permissions are **not** admin-creatable. They exist because a developer
  added a feature and decided it needs gating.
- **Role** — an admin-creatable/editable named bundle of permissions (e.g.
  "Estimator", "Warehouse", "Accountant"). Roles are how admins actually
  configure access.
- **User** — a local account (username + password). A user can hold multiple
  roles; their effective permissions are the union of every role's
  permissions.
- The built-in **Administrator** role (`is_system = true`) always has every
  permission in the catalog and cannot be renamed, edited, or deleted. The
  very first launch of the app creates one `admin` user with this role (see
  Bootstrap below).

## Naming convention

`module.resource.action`, e.g.:

- `auth.users.manage`, `auth.roles.manage`, `auth.admin.view`
- `workspace.projects.view`, `workspace.projects.create`, `workspace.projects.delete`
- `workspace.materials.edit`, `workspace.assemblies.delete`, `workspace.costing.edit`

`module` matches the module's folder name under `src/modules/`. Keep actions
to a small closed set per resource (`view`, `create`, `edit`, `delete`, or a
module-specific verb like `manage`) — don't invent a new action per screen.

## Where permissions are defined (and why it's manual right now)

Every module owns its own list in `modules/<name>/domain/permissions.ts`
(frontend) — see `modules/auth/domain/permissions.ts` and
`modules/workspace-legacy/domain/permissions.ts` for the two that exist today.
`shared/permissions/permissionCatalog.ts` aggregates all of them into one list
for the admin UI.

The actual source of truth the database seeds from is
`src-tauri/src/auth/permissions_catalog.rs` — a single Rust const list
covering every module's permissions in one place.

**These two catalogs (TS aggregate + Rust const list) must be kept in sync by
hand.** There is no codegen step yet. When you add a permission:

1. Add the key to the relevant module's `domain/permissions.ts`.
2. Add the matching `(id, module, label, description)` tuple to
   `permissions_catalog.rs`.
3. Rebuild and relaunch — the migration's `INSERT OR IGNORE` picks up the new
   row automatically, and the Administrator role is granted it automatically
   (see Bootstrap below). Existing custom roles do **not** get it
   automatically — an admin must opt a role into a new permission explicitly.

A codegen step (generating one from the other, or from a single shared
manifest) is a reasonable Phase-2 improvement once there are enough modules to
make manual sync error-prone.

## Bootstrap and safety guarantees

`src-tauri/src/db/migrations.rs::run_auth_migrations` runs on every app start,
on the same connection as the pre-existing workspace-table migration, and is
safe to re-run indefinitely:

- Tables: `CREATE TABLE IF NOT EXISTS` — never drops or alters.
- Permissions: `INSERT OR IGNORE` — new catalog entries appear, existing rows
  are never touched or removed automatically.
- Administrator role: `INSERT OR IGNORE` (created once, id is the fixed string
  `role-administrator`), then granted every current catalog permission via
  `INSERT OR IGNORE` on every launch — so it always has 100% coverage as the
  catalog grows.
- Default `admin` user: only inserted when `SELECT COUNT(*) FROM users` is
  `0` — i.e. exactly once, ever, on the very first launch. Later launches
  never touch it again, so changing the admin password sticks. Default
  credentials are `admin` / `admin123` — change this after first login via
  "change password" (backend command `change_password` exists; wiring a
  settings-screen entry point for it is a small follow-up UI task).
- This migration never references or modifies `workspace_snapshot` /
  `workspace_save_history` — verified by relaunching the app and confirming
  existing workspace data is byte-identical.

## Sessions

Sessions are **in-memory only** on the Rust side (`Mutex<Option<CurrentSession>>`,
not a database table). There's no token, no expiry logic — a process restart
always requires signing in again. This matches "login is mandatory" literally
and avoids session-expiry complexity that has no real value for a single-user
desktop process. If a future need arises for a session to survive relaunch
(e.g. "remember me"), it should be a deliberate additive change to
`SessionState`, not treated as a bug.

Admin commands (`create_user`, `delete_role`, etc.) re-check the acting
session's permission **on the backend** (`require_permission` in
`src-tauri/src/auth/commands.rs`), not just in the UI — the frontend
`PermissionGate` is a UX convenience, not the security boundary.

## Frontend usage

```tsx
import { PermissionGate, useHasPermission, hasPermission } from "../../shared/permissions/PermissionGate";

// Hiding a button entirely:
<PermissionGate permission={WORKSPACE_PERMISSIONS.DELETE_PROJECT}>
  <button onClick={...}>Delete</button>
</PermissionGate>

// Guarding logic inside a handler (defense in depth beyond hiding the button):
const { permissions } = useSession();
if (!hasPermission(permissions, WORKSPACE_PERMISSIONS.DELETE_PROJECT)) return;
```

`App.tsx`'s existing screens follow this same pattern at a handful of
representative call sites (the sidebar nav, project create/delete, assembly
create/delete, material delete). The remaining CRUD actions across
`PriceBook`/`AssemblyLibrary`/`Projects`/`CostingFinancials` are not all gated
yet — extend them incrementally using the exact same wrap-the-trigger pattern
as new work touches those areas, rather than as one giant separate pass.

## Workspace data is global, not per-user

`load_workspace` / `save_workspace` / `recent_workspace_saves` are **not**
scoped per user. This is one shared desktop workspace for one company —
adding login only gates *who can open which screens and press which buttons*,
not *whose data it is*. Don't assume materials/projects/etc. are
user-partitioned anywhere in the code; they aren't, and partitioning them is a
separate, larger decision for if/when real multi-tenancy is needed.

## Admin backoffice

`modules/auth/ui/admin/` — Users (create, deactivate, assign roles), Roles
(create, delete, edit permissions — Administrator excluded), Permissions
(read-only catalog view grouped by module). Reached via the profile menu's
"Manage users & roles" (itself gated by `auth.admin.view`), which swaps the
whole app view for the backoffice via `AdminOverlayProvider` — see
`modules/auth/ui/AdminOverlay.tsx`.
