import { useParams } from "react-router-dom";
import { ProjectsRouteWrapper } from "./ProjectsRouteWrapper";
import { CanvasRouteWrapper } from "./CanvasRouteWrapper";

export function ProjectsOrCanvasDispatcher(props: any) {
  const { yearOrId } = useParams<{ yearOrId?: string }>();
  // If yearOrId is empty or a 4-digit number (e.g. 2026, 2027), render year projects screen
  const isYear = !yearOrId || /^\d{4}$/.test(yearOrId);

  if (isYear) {
    return <ProjectsRouteWrapper {...props} year={yearOrId} />;
  }

  // Otherwise, it's a project ID (UUID or slug) — render the Canvas takeoff screen
  return <CanvasRouteWrapper {...props} targetId={yearOrId} />;
}
