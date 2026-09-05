# workspace-legacy (transitional placeholder)

This directory does **not** contain the existing app's business logic. `App.tsx`
(the canvas/window-join UI, screen components, hydration/migration effects)
still lives at `src/App.tsx`. Its state and pure logic have been steadily
extracted into `modules/{auth,catalog,costing,projects,workspace}` across
several phases (see `docs/architecture/OVERVIEW.md` for the conventions used).

This folder exists only to:

1. Own the fixed permission catalog (`domain/permissions.ts`) that gates the
   existing screens today, via `PermissionGate` wraps added directly inside
   `App.tsx`.
2. Track progress on splitting `App.tsx`'s remaining business logic and
   screens into proper clean-architecture modules.

## Target seams

Each of the following should end up as its own
`modules/<name>/{domain,application,infrastructure,ui}` module, following the
exact same layering used by `modules/auth`:

- **catalog** — materials, assemblies, component/company databases, the price
  book. Extracted so far: the "material sub-database" bookkeeping state
  (`modules/catalog/application/useMaterialDatabasesState.ts`); the material
  addressing/reference-numbering scheme
  (`modules/catalog/domain/materialReference.ts`, pure functions with thin
  wrappers left in `App.tsx`); the `materials`/`assemblies` state itself
  (`modules/catalog/application/useCatalogItemsState.ts` — this hook takes
  the initial values as parameters rather than owning seed data, since
  `withTechnalSeed`/`technalRows`/etc. are large and App.tsx-specific; they
  stay there, computed and passed in). **Still not extracted**: every catalog
  screen component (`PriceBook`, `Library`, `AssemblyLibrary` all still live
  in `App.tsx`, reading the extracted state/functions by the same names).
- **costing** — markup rates, manpower, shipping, the formula/quantity
  engine, selling price. Extracted so far: the formula/quantity engine
  (`modules/costing/domain/quantityEngine.ts`); the markup/manpower/shipping
  state (`modules/costing/application/useCostingState.ts`, the first
  `use<Module>State()` hook); shipping-rate and selling-price pricing
  (`modules/costing/domain/pricing.ts`: `shippingRateForType`,
  `shippingRateForMaterial`, `sellingPriceFromDirectCost`). The
  `CostingFinancials` screen component is **not** moved — still in `App.tsx`,
  reading the hook's values by the same names. **Deliberately left in
  `App.tsx`** (investigated and decided against forcing this): the
  `liveMaterialTotals`/`itemMaterialTakeoff`/`itemGlassTakeoff` `useMemo`
  aggregation loops — each closes over several bound wrapper functions
  (`calculatePartQuantity`, `shippingRateForMaterial`,
  `materialDatabaseReference`, `formulaValuesForItem`) rather than raw state,
  so extracting the loop body would mean threading all of those through as
  explicit function parameters (the dependency-inversion trick used for
  `frameTypeForItem`) for comparatively low payoff versus the risk of a
  mistake in duplicated aggregation logic. Revisit once the screens that use
  them move.
- **projects** — projects, canvases, canvas items, the window-joining engine,
  takeoff aggregation. Extracted so far: the window-joining/geometry engine
  (`modules/projects/domain/joinEngine.ts`); the `projects` state plus its
  selection/undo state (`selectedProjectId`, `selectedCanvasId`,
  `selectedItemId`, `copiedCanvasItem`, `undoProjectHistory`,
  `redoProjectHistory`) in `modules/projects/application/useProjectsState.ts`
  (same initial-value-injected pattern as `useCatalogItemsState`). The
  complex update functions (`updateProject`, join reconciliation, reference
  numbering) all stay in `App.tsx` unchanged — only the bare state
  declarations moved. **Still not extracted**: canvas item CRUD helpers,
  reference-numbering (`nextCanvasReference` and friends), the canvas
  pointer/interaction state machine, and the `Projects`/`Canvas` screen
  components.
- **workspace** — persistence/autosave/migration/save-history. Extracted so
  far: the raw Tauri commands (`modules/workspace/infrastructure/workspaceGateway.ts`),
  the save-then-refresh orchestration
  (`modules/workspace/application/persistWorkspace.ts`), and the snapshot
  shape (`modules/workspace/domain/snapshot.ts`). **Deliberately left in
  `App.tsx` for good** (not just deferred — a considered decision): the
  ~150-line hydration/migration effect and its 7 one-time post-hydration
  migration effects. They're temporary, versionless data-shape migrations
  tightly coupled to nearly every state setter in `App.tsx` — high risk to
  move, and being one-time/legacy-by-nature code, there's no real
  architectural benefit to relocating them into a "clean" module. Also still
  owned by `App.tsx`: the `workspaceSaveQueue`/`workspaceSaveVersion`
  React-side coordination refs (they coordinate *when* to call the workspace
  module's functions from React state changes, which is legitimately
  App.tsx's/a future screen's concern, not the workspace module's).

## Conventions established so far

- **Pure-function extraction** (Phase 2 pattern): move a closure-based
  function to `domain/` with explicit parameters instead of implicit
  closures; leave a one-line same-signature wrapper in `App.tsx` so no call
  site elsewhere needs to change. Used for the join engine, quantity engine,
  material reference scheme, pricing helpers.
- **State-ownership extraction** (`use<Module>State()`, Phase 4 pattern): a
  hook in `modules/<name>/application/` owns a slice of `useState`, returning
  the exact same variable/setter names `App.tsx` already used, so every read/
  write call site needs zero changes. Two variants:
  - Small, self-contained state with its own seed data → the hook imports
    its own defaults (`useCostingState`, `useMaterialDatabasesState`).
  - Large state whose initial value comes from an expensive/App.tsx-specific
    seed pipeline → the hook takes the initial value as a parameter instead
    (`useCatalogItemsState`, `useProjectsState`), leaving the seed pipeline
    exactly where it is.
- **Dependency inversion for cross-engine needs**: when engine A needs a
  result that depends on engine B, and B also needs something from A, don't
  import across modules (that's a cycle) — have A accept the needed function
  as an explicit parameter, and let the caller (today, `App.tsx`) supply it.
  Used for `joinEngine`'s Real-join functions needing a `frameTypeForItem`
  resolver from `quantityEngine`.
- **Documented must-match constants**: a handful of tiny business-id string
  constants (`TECHNAL_FYN_DATABASE`, etc.) are duplicated into extracted
  modules rather than imported back from `App.tsx` (which would create a
  circular dependency) or relocated (since they're used broadly elsewhere in
  `App.tsx` too). Each duplication is commented "must match the constant of
  the same name in App.tsx."
- **Know when not to extract**: several targets were investigated and
  deliberately left alone — the hydration/migration effect (permanently),
  the takeoff aggregation loops (for now, revisit when their screens move).
  Forcing an extraction with high risk and low architectural payoff is worse
  than leaving well-documented legacy code in place.

See `docs/architecture/OVERVIEW.md` for the dependency rules each module must
follow.
