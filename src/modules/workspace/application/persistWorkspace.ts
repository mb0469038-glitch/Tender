import { workspaceGateway } from "../infrastructure/workspaceGateway";

/**
 * Save the workspace snapshot, then (by default) refresh the recent-saves
 * list. Used by every save call site in App.tsx — the debounced autosave and
 * the Ctrl+S handler both want the refreshed list; the Ctrl+R handler passes
 * `refreshRecentSaves: false` since it reloads the page immediately after
 * saving and has no use for the list.
 */
export const persistWorkspaceSnapshot = async (
  snapshot: string,
  options?: { refreshRecentSaves?: boolean },
): Promise<string[] | null> => {
  await workspaceGateway.saveSnapshot(snapshot);
  if (options?.refreshRecentSaves === false) return null;
  return workspaceGateway.fetchRecentSaves();
};
