# AGENTS.md — Architectural Guidelines & Clean Code Rules for AI Agents

> **Audience:** AI Coding Assistants (Antigravity, Copilot, Claude, Cursor, etc.) and human contributors.  
> **Repository:** TenderHelpingSystem / TenderStudio  
> **Pattern:** Clean Architecture Modular Monolith

---

## 1. Core Mission: Zero-Density & Clean Separation

This codebase previously suffered from monolithic bloat where `App.tsx` grew beyond 4,500 lines. It has been refactored into a clean, layered modular monolith.

**RULE 1:** Never allow code density or monolithic files to creep back in. Every file must have a single, well-defined responsibility.

---

## 2. File Size & Density Limits ("No Dense Code")

* **`src/App.tsx` Limit:** Strict ceiling of **250 lines**.
  * `App.tsx` is strictly a high-level shell orchestrator and route gate.
  * **DO NOT** add raw `useState` calls, business logic, calculations, or screen JSX directly into `App.tsx`.
* **General File Limit:** Target **under 300 lines** per file.
  * If any component or hook approaches 400 lines, you must proactively decompose it into sub-components, focused hooks, or pure domain utilities.
* **No Giant Closures:** Extract inline handlers and calculation algorithms into standalone pure functions with explicit arguments.

---

## 3. Clean Architecture Layering Rules

Every feature lives under `src/modules/<module_name>/` and must strictly follow this four-tier inward dependency model:

```
src/modules/<module_name>/
  ├── domain/          <-- Pure business logic, entity types, pure calculations
  ├── application/     <-- Use-cases, custom state hooks (use<Feature>State)
  ├── infrastructure/  <-- The ONLY layer allowed to call Tauri invoke(...) or raw I/O
  └── ui/              <-- Presentational React components, screens, and modals
```

### Layer Constraints (Strict Seams):

1. **`domain/` (Inward Core):**
   * **Dependencies:** Zero imports from `application`, `infrastructure`, or `ui`.
   * **Prohibited:** No React (`useState`, `useEffect`, JSX), no Tauri `invoke`, no DOM APIs, no `window`.
   * **Allowed:** Pure TypeScript types, interfaces, mathematical calculation engines (e.g. `joinEngine.ts`, `quantityEngine.ts`), and constants.

2. **`application/` (Orchestration & State):**
   * **Dependencies:** Depends on `domain` and `infrastructure` interfaces.
   * **Responsibilities:** Encapsulates state hooks (e.g., `usePriceBookState`, `useCanvasInteraction`, `useModalManager`), orchestrates domain logic, and handles user workflows.
   * **Rule:** Exposes clear state and handler interfaces. Does not render UI markup.

3. **`infrastructure/` (I/O & IPC Gateways):**
   * **Dependencies:** Depends on `domain`.
   * **Responsibilities:** The **sole** layer permitted to call Tauri's `invoke(...)` or backend services.
   * **Rule:** Translates raw backend snake_case payloads into camelCase domain models.

4. **`ui/` (Presentation):**
   * **Dependencies:** Depends on `application` hooks and `domain` types.
   * **Prohibited:** Never call Tauri `invoke(...)` directly from UI components.
   * **Rule:** Presentational components should receive state and callbacks via props or feature hooks.

---

## 4. Cross-Module Rules & Dependency Inversion

* Modules must not create circular dependencies (`A -> B -> A`).
* If Module A needs functionality from Module B (e.g., Costing needs Join geometry from Projects):
  * **One-way import:** Only import pure domain calculations or types.
  * **Dependency Inversion:** Pass external resolvers as explicit function parameters rather than importing stateful peers.
* Shared utilities belong in:
  * `src/shared/kernel/`: Generic helpers (formatting, IDs, result wrappers).
  * `src/shared/permissions/`: RBAC gating primitives.
  * `src/design-system/`: Pure presentational UI components (Icons, Buttons, Badges).

---

## 5. State Management & Modals Conventions

1. **Composite State:**
   * Global state is orchestrated in `src/application/useAppState.ts` by combining sub-module hooks.
   * When creating a new feature's state, create a dedicated `use<Feature>State.ts` inside that module's `application/` folder.
2. **Modals Rule:**
   * **NEVER** inline modal popup markup into screens or `App.tsx`.
   * Modals must be registered in `src/modules/catalog/application/useModalManager.ts` (or the module's modal hook) and mounted via dedicated modal dispatchers (e.g., `AppModals.tsx`).

---

## 6. RBAC & Security Rules

* Every user-facing action, navigation item, and administrative view must be gated by the Role-Based Access Control system.
* Use `<PermissionGate permission="...">` to protect UI components.
* Use `useHasPermission(...)` for programmatic checks.
* New permissions must be added to:
  1. `src/modules/<module>/domain/permissions.ts`
  2. `src-tauri/src/auth/permissions_catalog.rs`
  3. `src/shared/permissions/permissionCatalog.ts`

---

## 7. Agent Pre-Execution Checklist

Before completing any task or editing code, verify:
- [ ] Is `App.tsx` kept lean (<250 lines)?
- [ ] Did I place business logic in `domain/` instead of inside a React component?
- [ ] Is any new file under the 300–400 line limit?
- [ ] Are all imports pointing inward according to Clean Architecture?
- [ ] Did I avoid hardcoded placeholders or broken stubs?
- [ ] Are TypeScript types explicit, clean, and free of unnecessary `any`?

---

## 8. Local Development & Hot Reload Rule

* **When user says "run local host" (or similar):**
  * **Always launch the local Vite dev server** (`cmd.exe /c "npm run dev"`) as a daemon on `http://localhost:1420`.
  * **Never restart or rebuild Docker containers** for local frontend development.
  * Rely on **Vite Hot Module Replacement (HMR)** so all frontend changes in `src/` appear instantly in milliseconds without browser reloads or container reboots.
  * Ensure the local Vite dev server proxies `/api/*` to the cloud backend (`http://213.199.37.145`) so authentication, database, and workspace persistence work immediately on localhost.

---

## 9. Iconography Rules (Lucide Icons)

* **Whenever UI components require icons:** Default to **Lucide Icons** (`lucide-react`).
* **Visual Consistency:** Maintain crisp technical outline styling:
  * Default: `strokeWidth={1.8}` with `size={20}` or `size={22}`.
  * Subtle/Micro: `size={16}` for inline badges or table indicators.
* **Architectural Semantics:**
  * Projects / Buildings: `<Building2 />`
  * Façades / Systems: `<Layers3 />`
  * Engineering / Design: `<Ruler />`
  * Fabrication: `<Factory />`
  * Installation / Tools: `<Wrench />`
  * Quality / Certifications: `<ShieldCheck />`
  * Documents / Tenders: `<FileText />`
* **Hierarchy:** Lucide is the primary standard for the public AMA architectural experience; Tabler is approved for deep internal ERP/data grids. Avoid heavy or filled icon sets.

---

## 10. Strict Git & Deployment Control Rule (Zero Auto-Commit / Auto-Push / Auto-Deploy)

* **NEVER run `git commit` or `git push`** unless the user explicitly and clearly requests it (e.g. "commit changes", "push to git").
* **NEVER deploy, scp, or upload files to the remote server** (`213.199.37.145`) unless the user explicitly and clearly instructs you to deploy (e.g. "deploy to server", "upload to live server").
* Keep all code edits within the local development environment (`localhost:1420` via HMR) so the user can review and approve changes locally first.

