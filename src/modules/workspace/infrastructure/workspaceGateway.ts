import { http } from "../../../shared/kernel/http";

/**
 * Persistence gateway:
 * Exclusively uses the PostgreSQL HTTP REST API endpoints (/api/workspace).
 */
export const workspaceGateway = {
  loadSnapshot: async (): Promise<string | null> => {
    const res = await http.get<{ snapshot: string | null }>("/api/workspace");
    return res.snapshot;
  },

  saveSnapshot: async (snapshot: string): Promise<void> => {
    await http.post<void>("/api/workspace", { snapshot });
  },

  fetchRecentSaves: async (): Promise<string[]> => {
    const res = await http.get<{ saves: string[] }>("/api/workspace/recent-saves");
    return res.saves;
  },
};
