import { workspaceGateway } from "../../workspace/infrastructure/workspaceGateway";
import { computeRealDashboardSummary } from "../domain/realDashboardEngine";
import type { RealDashboardSummary } from "../domain/dashboardTypes";

let cachedSummary: RealDashboardSummary | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 15_000; // 15 seconds

export const dashboardGateway = {
  async getDashboardSummary(forceRefresh = false): Promise<RealDashboardSummary> {
    const now = Date.now();
    if (!forceRefresh && cachedSummary && now - cacheTime < CACHE_TTL_MS) {
      return cachedSummary;
    }

    try {
      const rawString = await workspaceGateway.loadSnapshot();
      if (!rawString) {
        throw new Error("No workspace snapshot returned from server");
      }

      const parsed = JSON.parse(rawString);
      const summary = computeRealDashboardSummary(parsed);

      cachedSummary = summary;
      cacheTime = now;
      return summary;
    } catch (err) {
      console.warn("Could not fetch fresh workspace snapshot from backend:", err);
      if (cachedSummary) {
        return cachedSummary;
      }
      // Return empty real summary if totally unreachable
      return computeRealDashboardSummary({});
    }
  },

  clearCache() {
    cachedSummary = null;
    cacheTime = 0;
  },
};
