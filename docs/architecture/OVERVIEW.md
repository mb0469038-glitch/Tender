# Architecture Overview

TenderHelpingSystem is being grown, module by module, into a **modular
monolith**: one deployable Tauri desktop app, internally organized as a set of
independent modules, each following **clean-architecture layering**. This
document describes the conventions every module follows and where today's
code stands relative to them.

## Why a modular monolith

The app is expected to grow several more business modules over time (a
cutting-off system, workforce load organization, HR, employee salaries, and
whatever comes after). A single deployable is still the right call — it's one
desktop app for one company, not a distributed system — but the *internal*
code needs hard seams between modules so that:

- a new module can be added without re-learning or re-tangling an existing
  one,
- one module's data model changes don't ripple into another's,
- permission checks are consistent everywhere, and
- any future decision to split a module into its own service (if that ever
  becomes necessary) is a matter of moving a folder, not a rewrite.

## Module layout

Every module lives under `src/modules/<name>/` with up to four sublayers:

```
modules/<name>/
  domain/           entities, value objects, and this module's fixed
                    permission-key catalog. Zero imports from the other
                    three layers. No Tauri/React/IO of any kind.
  application/      use-cases / services. Orchestrate domain logic and call
                    infrastructure through the interfaces domain/application
                    define — never talks to Tauri directly.
  infrastructure/   the ONLY layer allowed to call `invoke(...)` (or any other
                    IO). Maps raw backend shapes (Rust serde output is
                    snake_case) to the module's camelCase domain entities.
  ui/               React components/hooks. Depends on application (and
                    domain types), never reaches into another module's
                    infrastructure directly.
```

Dependency rule: `domain` → nothing. `application` → `domain` (+ its own
`infrastructure` interfaces). `infrastructure` → `domain`. `ui` → `application`
(+ `domain` types). Arrows point inward only.

**Documented exceptions** (the only cross-module imports that should exist —
don't add others without recording the reason here):

- `shared/permissions/PermissionGate.tsx` imports from
  `modules/auth/ui/SessionContext`. Auth is treated as foundational
  infrastructure (every module needs permission checks), not a peer feature
  module.
- `modules/costing/domain/quantityEngine.ts` imports from
  `modules/projects/domain/joinEngine.ts` (`joinedSidesForItem`,
  `joinLengthForItem`) — costing needs join-derived geometry to compute
  quantities. This is one-directional: `joinEngine.ts` never imports from
  `quantityEngine.ts`. The reverse-looking dependency (join validation needing
  a materials-aware "frame type for this item" lookup, which itself needs the
  quantity engine's formula-values bag) is resolved by **dependency
  inversion**: `joinEngine.ts`'s `realJoinCheck`/`reconcileRealJoins`/
  `recheckCombinationJoins` take a `frameTypeForItem` resolver as an explicit
  function parameter (type `FrameTypeResolver`) instead of importing one. The
  caller (currently a thin wrapper in `App.tsx`) supplies
  `quantityEngine.ts`'s `frameTypeForItem`, composing the two engines without
  either module importing the other. Reach for this pattern again whenever
  two modules seem to need each other — inject the missing piece as a
  parameter rather than creating a cycle.

The Rust backend mirrors this per-module split under `src-tauri/src/<module>/`
(see `auth/{models,password,permissions_catalog,commands}.rs` for the
reference implementation) with a shared `db/` for connection/migration
plumbing used by every module.

## `shared/` vs `design-system/`

- `shared/kernel/` — truly generic, business-agnostic helpers usable by any
  module (`Result` type, id generation, formatting). Thin re-exports where an
  existing implementation already exists elsewhere (e.g.
  `shared/kernel/formatting.ts` re-exports `domain/calculations.ts`'s
  `money`/`number` rather than duplicating them).
- `shared/permissions/` — the permission-gating primitives (`PermissionGate`,
  `useHasPermission`) and the frontend permission-key aggregator.
- `shared/navigation/` — declarative maps describing which permission gates
  which nav entry, for readability (`navPermissionMap.ts`).
- `design-system/` — presentational UI primitives with no business logic
  (icons, buttons, etc.), the home for anything genuinely new modules should
  reuse instead of reinventing.

## Current System Structure & Decomposed App.tsx

`src/App.tsx` has been completely decomposed from an earlier ~4,500 line monolith down to a **lean ~196-line root orchestrator**. All screen rendering, modal dispatching, interaction handlers, and state management now live in dedicated clean-architecture layers:

```
src/
  ├── App.tsx                      # Lean orchestrator (<200 lines), screen routing & shell mount
  ├── application/
  │   └── useAppState.ts           # Master composite hook aggregating module sub-states
  ├── ui/                          # Global shell presentation
  │   ├── AppSidebar.tsx           # Navigation sidebar (collapsible, project years, databases)
  │   ├── AppTopbar.tsx            # Top header bar, breadcrumbs, action buttons
  │   └── AppScreens.tsx           # Screen routing dispatcher (Catalog, Projects, Stock, etc.)
  ├── modules/
  │   ├── catalog/                 # Catalog, Materials, Assemblies, and Price Books
  │   │   ├── domain/              # Entities, seeds, material references
  │   │   ├── application/         # usePriceBookState, useModalManager, useCatalogItemsState
  │   │   └── ui/modals/           # AppModals, MaterialModal, AssemblyModal, CompanyDatabaseModals
  │   ├── projects/                # Projects & 2D Canvas Takeoff
  │   │   ├── domain/              # joinEngine, projectDefaults
  │   │   ├── application/         # useCanvasInteraction, useCanvasTakeoff, useProjectsState
  │   │   └── ui/                  # CanvasScreen, Project Modals
  │   ├── execution/               # Execution & Cutting Optimizer
  │   │   ├── domain/              # cuttingOptimizer
  │   │   ├── application/         # useExecutionState
  │   │   └── ui/                  # ExecutionProjectsScreen, ExecutionWorkspaceScreen, CuttingList
  │   ├── costing/                 # Quantity Calculations & Financial Estimation
  │   │   ├── domain/              # quantityEngine, pricing, defaults
  │   │   ├── application/         # useCostingState
  │   │   └── ui/                  # CostingFinancials
  │   ├── auth/                    # RBAC, Authentication & Session Management
  │   │   ├── domain/              # permissions, user/role entities
  │   │   ├── application/         # authService, adminService
  │   │   ├── infrastructure/      # tauriAuthGateway
  │   │   └── ui/                  # LoginScreen, AdminBackofficeLayout, PermissionGate
  │   └── workspace/               # App Lifecycle & Home
  │       ├── application/         # useWorkspacePersistence
  │       └── ui/                  # AmaHome (Landing Splash Screen)
  ├── design-system/               # Reusable UI primitives (Icon, Sketch, Buttons)
  └── shared/                      # Kernel helpers, permission gates, navigation mappings
```

## Persistence

Two persistence strategies coexist on purpose, in the same SQLite file
(`tender-studio.sqlite`, one per installation, in the OS app-data directory):

- **RBAC data** (`users`, `roles`, `permissions`, `role_permissions`,
  `user_roles`) — normalized relational tables, because that data genuinely
  needs relational integrity and querying.
- **Everything else** (materials, assemblies, projects, pricing) — a single
  JSON blob in `workspace_snapshot`, exactly as before. This is intentionally
  *not* normalized in this phase (see `docs/architecture/ADR-0001-modular-monolith-and-rbac.md`).
  Normalizing it is a future decision, likely made module-by-module as each
  one is extracted from `App.tsx`, not all at once.

Both migrations run additively, on the same connection, every app start —
`CREATE TABLE IF NOT EXISTS` / `INSERT OR IGNORE` only. Neither ever touches
the other's tables.

## State-owning modules: the `use<Module>State()` convention

Phase 4 introduced the first extraction of actual `useState` ownership (not
just pure functions) out of `App.tsx`: `modules/costing/application/useCostingState.ts`
owns the markup/manpower/shipping state. The pattern:

- The hook lives in `modules/<name>/application/use<Name>State.ts` (an
  exception to "application has no React" — a state-owning hook is still
  orchestration, just orchestration of React state instead of async
  use-cases).
- It returns the **exact same variable and setter names** the call site
  already used when the state lived locally (e.g. `markupRates`,
  `setMarkupRates`), so moving the `useState` calls into the hook requires
  **zero changes** to any other line that reads or writes that state —
  same zero-downstream-impact principle as the Phase 2/3 function/effect
  relocations, now applied to state.
- Any pure derived helpers that closed over the state (e.g.
  `shippingRateForMaterial` closing over `shippingCosts`) move to the
  module's `domain/` layer as explicit-parameter pure functions (same as
  Phase 2), and the hook exposes bound convenience wrappers over them.
- `App.tsx` calls the hook once, near where the state used to be declared,
  and destructures its return value.

**Two variants**, chosen by how the state gets its initial value:
- Small, self-contained state with its own cheap seed data → the hook
  imports its own defaults (`useCostingState`, `useMaterialDatabasesState`).
- Large state whose initial value comes from an expensive or App.tsx-specific
  seed pipeline (e.g. `materials`/`assemblies` seeded via `withTechnalSeed` +
  large hardcoded arrays) → the hook takes the initial value as a parameter
  instead (`useCatalogItemsState`, `useProjectsState`), leaving the seed
  pipeline exactly where it is rather than relocating a large, risky data
  blob for no architectural benefit.

This state-ownership extraction is now complete for `materials`, `assemblies`,
`projects` (+ selection/undo state), markup/manpower/shipping, and the
material sub-database bookkeeping — i.e. **all of `App.tsx`'s top-level
domain state now lives in module hooks**. What's left in `App.tsx` is
UI-local state (modal-open flags, canvas pointer/interaction state, search/
filter text) that legitimately belongs with the screens that use it, plus the
screens themselves — see "Where today's business logic stands" above.

## Adding a new module

1. Create `src/modules/<name>/{domain,application,infrastructure,ui}` and (if
   it needs its own backend commands) `src-tauri/src/<name>/`.
2. Define the module's fixed permission keys in
   `modules/<name>/domain/permissions.ts`, following the `module.resource.action`
   convention (see `docs/architecture/RBAC.md`).
3. Add those same keys to the Rust `permissions_catalog.rs` (currently
   `src-tauri/src/auth/permissions_catalog.rs` holds every module's catalog in
   one file, since there's no per-module catalog registration mechanism yet —
   see RBAC.md for why this is a manual step for now).
4. Import the new permission list into `shared/permissions/permissionCatalog.ts`.
5. Gate the module's nav entry and action buttons with `<PermissionGate>`,
   using the pattern established in `App.tsx`'s existing wraps.
