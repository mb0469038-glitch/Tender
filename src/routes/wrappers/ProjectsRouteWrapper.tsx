import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Project } from "../../domain/types";
import { ProjectsScreen } from "../../modules/projects/ui/ProjectsScreen";

export type ProjectsRouteWrapperProps = {
  projects: Project[];
  activeProjectYear: string;
  setActiveProjectYear: (year: string) => void;
  setSelectedProjectId: (id: string) => void;
  setSelectedCanvasId: (id: string) => void;
  openModal: (type: "project", id?: string) => void;
  remove: (type: "project", id: string) => void;
  year?: string;
};

export function ProjectsRouteWrapper({
  projects,
  activeProjectYear,
  setActiveProjectYear,
  setSelectedProjectId,
  setSelectedCanvasId,
  openModal,
  remove,
  year: propYear,
}: ProjectsRouteWrapperProps) {
  const { year: paramYear, yearOrId } = useParams<{ year?: string; yearOrId?: string }>();
  const navigate = useNavigate();

  const currentYear =
    propYear ||
    paramYear ||
    (yearOrId && /^\d{4}$/.test(yearOrId) ? yearOrId : activeProjectYear) ||
    "2026";

  useEffect(() => {
    if (currentYear && currentYear !== activeProjectYear) {
      setActiveProjectYear(currentYear);
    }
  }, [currentYear, activeProjectYear, setActiveProjectYear]);

  const handleOpenProject = (projectId: string, canvasId: string) => {
    setSelectedProjectId(projectId);
    setSelectedCanvasId(canvasId);
    navigate(`/estimation/projects/${projectId}`);
  };

  return (
    <ProjectsScreen
      activeProjectYear={currentYear}
      projects={projects}
      openModal={openModal}
      remove={remove}
      onOpenProject={handleOpenProject}
    />
  );
}
