import { useNavigate } from "react-router-dom";
import { CanvasScreen } from "../../modules/projects/ui/CanvasScreen";

export function CanvasRouteWrapper(props: any) {
  const navigate = useNavigate();
  if (!props.selectedProject) {
    return (
      <div className="p-8 text-center text-[#667085]">
        <p>No project currently selected for canvas editing.</p>
        <button
          type="button"
          onClick={() => navigate("/home")}
          className="px-4 py-2 bg-[#0B1F4D] text-white rounded-lg text-xs font-bold cursor-pointer"
        >
          Return to Projects
        </button>
      </div>
    );
  }

  return (
    <CanvasScreen
      {...props}
      project={props.selectedProject}
      onNavigateToProjects={() => navigate("/home")}
      onOpenProjectDetails={() => props.openModal("project", props.selectedProject.id)}
    />
  );
}
