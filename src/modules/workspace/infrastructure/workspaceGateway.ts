import { invoke } from "@tauri-apps/api/core";

/**
 * The only file allowed to call `invoke(...)` for workspace persistence.
 * Thin wrappers around the three Tauri commands in src-tauri/src/lib.rs —
 * no orchestration here, see application/persistWorkspace.ts for that.
 */
export const workspaceGateway = {
  loadSnapshot: () => invoke<string | null>("load_workspace"),
  saveSnapshot: (snapshot: string) => invoke<void>("save_workspace", { snapshot }),
  fetchRecentSaves: () => invoke<string[]>("recent_workspace_saves"),
};
