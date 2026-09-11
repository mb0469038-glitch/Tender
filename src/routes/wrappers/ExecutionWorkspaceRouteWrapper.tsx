import { useNavigate } from "react-router-dom";
import type { useAppState } from "../../application/useAppState";
import { ExecutionWorkspaceScreen } from "../../modules/execution/ui/ExecutionWorkspaceScreen";

export function ExecutionWorkspaceRouteWrapper({
  state,
}: {
  state: ReturnType<typeof useAppState>;
}) {
  const navigate = useNavigate();
  const project = state.execution.executionProjects.find(
    (p) => p.id === state.execution.selectedExecutionProjectId
  );
  const workspace = project?.files?.find(
    (f) => f.id === state.execution.selectedExecutionWorkspaceId
  );

  if (!project || !workspace) {
    return (
      <div className="p-8 text-center text-[#667085]">
        <p>Workspace file not found or none selected.</p>
        <button
          type="button"
          onClick={() => navigate("/execution")}
          className="px-4 py-2 bg-[#0B1F4D] text-white rounded-lg text-xs font-bold cursor-pointer"
        >
          Return to Execution
        </button>
      </div>
    );
  }

  return (
    <ExecutionWorkspaceScreen
      project={project}
      workspace={workspace}
      setExecutionProjects={state.execution.setExecutionProjects}
      executionWorkspacePage={state.execution.executionWorkspacePage}
      setExecutionWorkspacePage={state.execution.setExecutionWorkspacePage}
      workspaceStockDatabaseId={state.execution.workspaceStockDatabaseId}
      setWorkspaceStockDatabaseId={state.execution.setWorkspaceStockDatabaseId}
      workspaceStockSearch={state.execution.workspaceStockSearch}
      setWorkspaceStockSearch={state.execution.setWorkspaceStockSearch}
      workspaceStockAssemblyType={state.execution.workspaceStockAssemblyType}
      setWorkspaceStockAssemblyType={state.execution.setWorkspaceStockAssemblyType}
      workspaceOptimizationError={state.execution.workspaceOptimizationError}
      setWorkspaceOptimizationError={state.execution.setWorkspaceOptimizationError}
      setScreen={(screen) => {
        if (screen === "execution-projects") navigate("/execution");
        else state.setScreen(screen);
      }}
      materials={state.materials}
      assemblies={state.assemblies}
      componentDatabases={state.componentDatabases}
      companyDatabases={state.companyDatabases}
      companyPriceTables={state.companyPriceTables}
      movedOriginalPriceTableIds={state.movedOriginalPriceTableIds}
    />
  );
}
