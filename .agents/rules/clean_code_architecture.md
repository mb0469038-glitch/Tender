# Clean Architecture & Anti-Bloat Rules

## 1. No Dense Code & File Size Limits
- `src/App.tsx` must NEVER exceed 250 lines. It is strictly an orchestrator.
- Keep all files under 300 lines. If a file approaches 400 lines, decompose it into smaller sub-components or domain utility functions.
- Do not place business algorithms or large closures inside React components.

## 2. Strict Clean Architecture Layering
Every module in `src/modules/<module_name>/` must obey:
- `domain/`: Pure calculations, entities, constants, permissions. Zero React/Tauri/DOM imports.
- `application/`: State hooks (`use<Feature>State.ts`), orchestration, workflows.
- `infrastructure/`: The ONLY layer permitted to call Tauri `invoke(...)` or backend APIs.
- `ui/`: Pure React presentation. Modals go into `ui/modals/`. Never call `invoke(...)` directly from UI.

## 3. Modals & State
- Never inline modal dialog markup into screens or `App.tsx`.
- Register modal state in `useModalManager.ts` and render via modal dispatchers (e.g., `AppModals.tsx`).
- Composite states belong in `src/application/useAppState.ts`.

## 4. RBAC & Security
- Gate sensitive actions and routes with `<PermissionGate>` or `useHasPermission()`.
- Synchronize any new permissions across domain, frontend catalog, and `src-tauri/src/auth/permissions_catalog.rs`.
