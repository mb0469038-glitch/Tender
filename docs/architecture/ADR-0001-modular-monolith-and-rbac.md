# ADR-0001: Modular Monolith + RBAC Foundation

**Status:** Accepted, implemented (Phase 1).

## Context

The app was originally built as a single 4,528-line `src/App.tsx`, with all
business logic (materials, assemblies, canvas/window-join geometry, costing)
tangled into one component's closures. There was no concept of users, roles,
or permissions — anyone with the app open could do anything. The business
plan calls for several more modules to be added over time (cutting-off,
workforce load, HR, salaries), which makes both problems worse if left
unaddressed: more logic piling into an already-unmanageable file, and no way
to restrict who can touch what as the app's audience within the company
grows.

## Decisions

1. **Keep the existing JSON-blob workspace persistence as-is.** Materials,
   assemblies, projects, and pricing continue to round-trip through
   `workspace_snapshot` exactly as before. Only the new RBAC data gets proper
   relational tables. Rationale: normalizing the business data is a
   significant, separate effort with real migration risk; doing it at the
   same time as introducing auth would compound risk for no immediate
   benefit. It's deferred until each business module is actually extracted
   from `App.tsx` (Phase 2+), at which point normalizing that module's data
   can be scoped and tested independently.

2. **Login is mandatory, local-only, in-memory sessions.** Accounts and
   argon2 password hashes live in the same SQLite file. No session token, no
   expiry — a relaunch always requires signing in again. Rationale: this is a
   single-process desktop app for one company; token/expiry machinery would
   add complexity with no corresponding benefit. Local-only avoids any
   dependency on network identity providers, consistent with the app's fully
   offline nature.

3. **Modular monolith adopted now, business-logic extraction deferred.** The
   `modules/<name>/{domain,application,infrastructure,ui}` convention is
   established on the new `auth` module (greenfield code, zero coupling to
   anything existing). `App.tsx` itself is not moved or restructured in this
   phase — only given additive `PermissionGate` wraps. Rationale: proving the
   pattern on new code first, and gating the existing screens without
   touching their internals, keeps this phase's risk to the existing working
   app close to zero while still delivering the modular structure and the
   permission system the business needs now.

4. **RBAC schema is additive-only and coexists in the same SQLite file.**
   `CREATE TABLE IF NOT EXISTS` for five new tables
   (`users`/`roles`/`permissions`/`role_permissions`/`user_roles`), run on the
   same connection immediately after the pre-existing workspace-table
   migration. No foreign keys into `workspace_snapshot`. Verified by
   inspecting the database directly after a real app launch: existing
   workspace data was untouched, and the new tables + a single bootstrapped
   admin user + full Administrator permission grant were created correctly.

## Accepted trade-offs

- **Duplicate `Icon` component.** `App.tsx` keeps its own; `design-system/Icon.tsx`
  is a separate, minimal one for new modules. Consolidating them means
  touching ~100+ call sites inside `App.tsx` for a purely cosmetic win — not
  worth the risk in this phase. Revisit when `App.tsx` is extracted anyway.
- **Manual sync between the TS permission catalogs and the Rust
  `permissions_catalog.rs`.** No codegen yet — see `RBAC.md`. Acceptable at
  the current scale (two modules, ~17 permissions); worth automating once
  more modules are added.
- **Not all of `App.tsx`'s CRUD buttons are gated yet.** A representative set
  (nav, project create/delete, assembly create/delete, material delete) was
  wired in this phase to establish the pattern; the rest (~75 remaining
  handlers across PriceBook/AssemblyLibrary/CostingFinancials) are gated
  incrementally as that code is next touched, not all at once.
- **Workspace data stays global, not per-user.** Explicitly out of scope —
  see `RBAC.md`'s note on this. Only screen/button *access* is permissioned
  in this phase, not the underlying business data's ownership.
