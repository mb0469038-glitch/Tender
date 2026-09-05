import { useState } from "react";
import type { CanvasItem, Project } from "../../../domain/types";

/**
 * Owns the `projects` array plus its tightly-coupled selection/undo state.
 * Same injected-initial-value pattern as `useCatalogItemsState` (Phase 7):
 * the seed data (`projectData`) stays in App.tsx, only passed in. The
 * complex update functions (`updateProject`, join reconciliation, canvas
 * reference numbering, etc.) all stay in App.tsx unchanged — only these
 * bare `useState` declarations move. See docs/architecture/OVERVIEW.md.
 */
export function useProjectsState(initialProjects: Project[]) {
  const [projects, setProjects] = useState(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState("project-1");
  const [selectedCanvasId, setSelectedCanvasId] = useState("opening-1");
  const [selectedItemId, setSelectedItemId] = useState<string | null>("item-1");
  const [copiedCanvasItem, setCopiedCanvasItem] = useState<CanvasItem | null>(null);
  const [undoProjectHistory, setUndoProjectHistory] = useState<Project[]>([]);
  const [redoProjectHistory, setRedoProjectHistory] = useState<Project[]>([]);

  return {
    projects,
    setProjects,
    selectedProjectId,
    setSelectedProjectId,
    selectedCanvasId,
    setSelectedCanvasId,
    selectedItemId,
    setSelectedItemId,
    copiedCanvasItem,
    setCopiedCanvasItem,
    undoProjectHistory,
    setUndoProjectHistory,
    redoProjectHistory,
    setRedoProjectHistory,
  };
}
