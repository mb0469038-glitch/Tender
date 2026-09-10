import { invoke } from "@tauri-apps/api/core";
import { isTauri, http } from "../../../shared/kernel/http";

/**
 * Persistence gateway supporting dual-mode:
 * - When running in Tauri desktop: invokes local Tauri commands.
 * - When running in Web browser / Docker: calls server REST API endpoints.
 */
export const workspaceGateway = {
  loadSnapshot: async (): Promise<string | null> => {
    if (isTauri()) {
      return invoke<string | null>("load_workspace");
    }
    const res = await http.get<{ snapshot: string | null }>("/api/workspace");
    return res.snapshot;
  },

  saveSnapshot: async (snapshot: string): Promise<void> => {
    if (isTauri()) {
      return invoke<void>("save_workspace", { snapshot });
    }
    await http.post<void>("/api/workspace", { snapshot });
  },

  fetchRecentSaves: async (): Promise<string[]> => {
    if (isTauri()) {
      return invoke<string[]>("recent_workspace_saves");
    }
    const res = await http.get<{ saves: string[] }>("/api/workspace/recent-saves");
    return res.saves;
  },
};
