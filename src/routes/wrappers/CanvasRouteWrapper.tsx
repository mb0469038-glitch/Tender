import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CanvasScreen, type CanvasScreenProps } from "../../modules/projects/ui/CanvasScreen";
import type { Project } from "../../domain/types";

export type CanvasRouteWrapperProps = Omit<
  CanvasScreenProps,
  "project" | "onNavigateToProjects" | "onOpenProjectDetails" | "selectedCanvasId"
> & {
  projects?: Project[];
  selectedProject?: Project;
  selectedProjectId?: string;
  setSelectedProjectId?: (id: string) => void;
  selectedCanvasId?: string;
  setSelectedCanvasId?: (id: string) => void;
  targetId?: string;
  openModal: (type: any, id?: string) => void;
};

export function CanvasRouteWrapper(props: CanvasRouteWrapperProps) {
  const { year, id, projectId, yearOrId } = useParams<{
    year?: string;
    id?: string;
    projectId?: string;
    yearOrId?: string;
  }>();
  const navigate = useNavigate();

  const {
    projects,
    selectedProject,
    selectedProjectId,
    setSelectedProjectId,
    selectedCanvasId,
    setSelectedCanvasId,
    targetId,
    openModal,
    ...canvasProps
  } = props;

  const routeProjectId =
    targetId ||
    id ||
    projectId ||
    (yearOrId && !/^\d{4}$/.test(yearOrId) ? yearOrId : undefined);

  const activeProject =
    (routeProjectId ? projects?.find((p) => p.id === routeProjectId) : undefined) ||
    selectedProject;

  useEffect(() => {
    if (activeProject && selectedProjectId !== activeProject.id) {
      setSelectedProjectId?.(activeProject.id);
    }
  }, [activeProject, selectedProjectId, setSelectedProjectId]);

  useEffect(() => {
    if (activeProject && !selectedCanvasId && activeProject.canvases?.[0]?.id) {
      setSelectedCanvasId?.(activeProject.canvases[0].id);
    }
  }, [activeProject, selectedCanvasId, setSelectedCanvasId]);

  if (!activeProject) {
    const returnYear = year || "2026";
    return (
      <div className="p-12 text-center max-w-lg mx-auto my-12 bg-white rounded-xl border border-[#E3E8EF] shadow-sm">
        <h2 className="text-lg font-bold text-[#172033] mb-2">Project not found</h2>
        <p className="text-sm text-[#667085] mb-6">
          The requested project {routeProjectId ? `("${routeProjectId}")` : ""} could not be found in your workspace.
        </p>
        <button
          type="button"
          onClick={() => navigate(`/estimation/projects/${returnYear}`)}
          className="px-5 py-2.5 bg-[#0B1F4D] text-white rounded-lg text-sm font-semibold hover:bg-[#165BAA] transition-colors cursor-pointer"
        >
          ← Return to {returnYear} Projects
        </button>
      </div>
    );
  }

  return (
    <CanvasScreen
      {...canvasProps}
      project={activeProject}
      selectedCanvasId={selectedCanvasId || activeProject.canvases?.[0]?.id || "opening-1"}
      onNavigateToProjects={() => navigate(`/estimation/projects/${activeProject.year || year || "2026"}`)}
      onOpenProjectDetails={() => openModal("project", activeProject.id)}
    />
  );
}
