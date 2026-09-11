import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ExecutionProjectsScreen } from "../../modules/execution/ui/ExecutionProjectsScreen";
import type { useAppState } from "../../application/useAppState";

export type ExecutionRouteWrapperProps = {
  state: ReturnType<typeof useAppState>;
};

export function ExecutionRouteWrapper({ state }: ExecutionRouteWrapperProps) {
  const { id, projectId } = useParams<{ id?: string; projectId?: string }>();
  const navigate = useNavigate();
  const currentProjectId = id || projectId;
  const { execution, modals } = state;

  useEffect(() => {
    if (currentProjectId && execution.selectedExecutionProjectId !== currentProjectId) {
      execution.setSelectedExecutionProjectId(currentProjectId);
    }
  }, [currentProjectId, execution]);

  const handleOpenExecutionProject = (projId: string) => {
    execution.setSelectedExecutionProjectId(projId);
    execution.setExecutionFolderId(null);
    navigate(`/execution/${projId}`);
  };

  const handleBackToProjects = () => {
    execution.setExecutionFolderId(null);
    navigate("/execution");
  };

  const handleOpenExecutionWorkspace = (fileId: string) => {
    execution.openExecutionWorkspace(fileId);
    navigate("/execution/workspace");
  };

  const isDetail = Boolean(currentProjectId);

  return (
    <ExecutionProjectsScreen
      embedded
      screen={isDetail ? "execution-project-detail" : "execution-projects"}
      setScreen={(screen: string) => {
        if (screen === "execution-projects") {
          handleBackToProjects();
        } else {
          state.setScreen(screen as any);
        }
      }}
      executionProjects={execution.executionProjects}
      selectedExecutionProjectId={currentProjectId || execution.selectedExecutionProjectId}
      executionFolderId={execution.executionFolderId}
      setExecutionFolderId={execution.setExecutionFolderId}
      executionNewMenuOpen={execution.executionNewMenuOpen}
      setExecutionNewMenuOpen={execution.setExecutionNewMenuOpen}
      newExecutionItemType={execution.newExecutionItemType}
      setNewExecutionItemType={execution.setNewExecutionItemType}
      newExecutionItemName={execution.newExecutionItemName}
      setNewExecutionItemName={execution.setNewExecutionItemName}
      openModal={modals.openModal}
      openExecutionProject={handleOpenExecutionProject}
      copyExecutionProject={execution.copyExecutionProject}
      removeExecutionProject={execution.removeExecutionProject}
      openExecutionWorkspace={handleOpenExecutionWorkspace}
      createExecutionProjectItem={execution.createExecutionProjectItem}
      removeExecutionProjectItem={execution.removeExecutionProjectItem}
    />
  );
}
