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
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-5 pt-8 pb-7 md:px-12 md:pt-10">
        <div>
          <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">
            Tender estimates
          </p>
          <h1 className="m-0 text-[#11262a] text-4xl tracking-[-0.035em] font-bold">
            {activeProjectYear} Projects
          </h1>
          <p className="max-w-[650px] mt-2.5 mb-0 text-[#5e7478] text-sm leading-relaxed">
            Projects contain window drawings, material schedules, and estimating markups.
          </p>
        </div>
        <PermissionGate permission={WORKSPACE_PERMISSIONS.CREATE_PROJECT}>
          <button
            className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-lg font-bold border border-[#146c68] bg-[#176f6b] text-white shadow-[0_2px_5px_rgba(22,78,77,0.18)] hover:bg-[#105d59] transition-colors cursor-pointer"
            onClick={() => openModal("project")}
          >
            <Icon name="plus" /> New project
          </button>
        </PermissionGate>
      </section>
      <section className="grid gap-3.5 mx-5 md:mx-12 mb-9">
        {filteredProjects.map((project) => (
          <article
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-6 border border-[#dfe8e8] rounded-[11px] bg-white shadow-[0_5px_18px_rgba(24,63,65,0.04)] hover:border-[#8dbdb8] transition-colors"
            key={project.id}
          >
            <div>
              <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">
                {[project.client, project.company, project.location].filter(Boolean).join(" · ") || "No project details"}
              </p>
              <h2 className="mt-[3px] mb-1.5 text-[19px] font-bold text-[#183f41]">{project.name}</h2>
              <p className="m-0 text-[#6b8185] text-[13px]">{project.items.length} openings in this project</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-lg font-bold border border-[#146c68] bg-[#176f6b] text-white shadow-[0_2px_5px_rgba(22,78,77,0.18)] hover:bg-[#105d59] transition-colors cursor-pointer"
                onClick={() =>
                  onOpenProject(project.id, project.canvases?.[0]?.id ?? "opening-1")
                }
              >
                Open project <Icon name="arrow" size={16} />
              </button>
              <button
                className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-lg font-bold border border-[#cad9da] bg-white text-[#345156] hover:bg-[#f0f6f6] transition-colors cursor-pointer"
                onClick={() => openModal("project", project.id)}
              >
                <Icon name="edit" size={16} /> Details
              </button>
              <PermissionGate permission={WORKSPACE_PERMISSIONS.DELETE_PROJECT}>
                <button
                  className="w-[38px] h-[38px] grid place-items-center rounded-[7px] border-0 bg-transparent text-[#577176] hover:bg-[#f9e8e8] hover:text-[#a52f2f] transition-colors cursor-pointer"
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
          <p className="m-0 p-10 border border-dashed border-[#b8d1d3] rounded-[10px] bg-white text-[#607d80] text-center text-sm">
            No projects found for {activeProjectYear}. Create one to start estimating.
          </p>
        )}
      </section>
    </>
  );
}
