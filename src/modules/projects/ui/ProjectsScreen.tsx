import type { Project } from "../../../domain/types";
import { Icon } from "../../../design-system/Icon";
import { PermissionGate } from "../../../shared/permissions/PermissionGate";
import { WORKSPACE_PERMISSIONS } from "../../workspace-legacy/domain/permissions";

export type ProjectsScreenProps = {
  activeProjectYear: string;
  projects: Project[];
  openModal: (type: "project", id?: string) => void;
  remove: (type: "project", id: string) => void;
  onOpenProject: (projectId: string, canvasId: string) => void;
};

export function ProjectsScreen({
  activeProjectYear,
  projects,
  openModal,
  remove,
  onOpenProject,
}: ProjectsScreenProps) {
  const filteredProjects = projects.filter((p) => p.year === activeProjectYear);

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Tender estimates</p>
          <h1>{activeProjectYear} Projects</h1>
          <p className="intro">
            Projects contain window drawings, material schedules, and estimating markups.
          </p>
        </div>
        <PermissionGate permission={WORKSPACE_PERMISSIONS.CREATE_PROJECT}>
          <button className="primary-button" onClick={() => openModal("project")}>
            <Icon name="plus" /> New project
          </button>
        </PermissionGate>
      </section>
      <section className="project-list">
        {filteredProjects.map((project) => (
          <article className="project-card" key={project.id}>
            <div>
              <p className="eyebrow">
                {[project.client, project.company, project.location].filter(Boolean).join(" · ") || "No project details"}
              </p>
              <h2>{project.name}</h2>
              <p>{project.items.length} openings in this project</p>
            </div>
            <div className="project-actions">
              <button
                className="primary-button"
                onClick={() =>
                  onOpenProject(project.id, project.canvases?.[0]?.id ?? "opening-1")
                }
              >
                Open project <Icon name="arrow" size={16} />
              </button>
              <button
                className="secondary-button"
                onClick={() => openModal("project", project.id)}
              >
                <Icon name="edit" size={16} /> Details
              </button>
              <PermissionGate permission={WORKSPACE_PERMISSIONS.DELETE_PROJECT}>
                <button
                  className="icon-button danger-icon"
                  onClick={() => remove("project", project.id)}
                  aria-label={`Delete ${project.name}`}
                >
                  <Icon name="trash" />
                </button>
              </PermissionGate>
            </div>
          </article>
        ))}
        {!filteredProjects.length && (
          <p className="price-book-empty">No projects found for {activeProjectYear}. Create one to start estimating.</p>
        )}
      </section>
    </>
  );
}
