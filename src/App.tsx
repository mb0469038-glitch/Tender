import { useAppState } from "./application/useAppState";
import { projectYears } from "./modules/projects/domain/projectDefaults";
import { ExecutionWorkspaceScreen } from "./modules/execution/ui/ExecutionWorkspaceScreen";
import { AppSidebar } from "./ui/AppSidebar";
import { AppTopbar } from "./ui/AppTopbar";
import { AppScreens } from "./ui/AppScreens";
import { AppModals } from "./modules/catalog/ui/modals/AppModals";
import "./App.css";

export function App() {
  const state = useAppState();

  if (state.screen === "execution-workspace") {
    const project = state.execution.executionProjects.find(
      (p) => p.id === state.execution.selectedExecutionProjectId
    );
    const workspace = project?.files?.find(
      (f) => f.id === state.execution.selectedExecutionWorkspaceId
    );
    if (!project || !workspace) {
      state.setScreen("execution-projects");
      return null;
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
        setScreen={state.setScreen}
        materials={state.materials}
        assemblies={state.assemblies}
        componentDatabases={state.componentDatabases}
        companyDatabases={state.companyDatabases}
        companyPriceTables={state.companyPriceTables}
        movedOriginalPriceTableIds={state.movedOriginalPriceTableIds}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <AppTopbar
        screen={state.screen}
        setScreen={state.setScreen}
        activeDatabaseId={state.activeDatabaseId}
        setActiveDatabaseId={state.setActiveDatabaseId}
        companyDatabases={state.companyDatabases}
        openNewCompanyDatabase={state.modals.openNewCompanyDatabase}
      />

      <div className="flex-1 flex min-h-0">
        <AppSidebar
          sidebarCollapsed={state.sidebarCollapsed}
          setSidebarCollapsed={state.setSidebarCollapsed}
          screen={state.screen}
          setScreen={state.setScreen}
          projectsOpen={state.projectsOpen}
          setProjectsOpen={state.setProjectsOpen}
          projectYears={projectYears}
          activeProjectYear={state.activeProjectYear}
          setActiveProjectYear={state.setActiveProjectYear}
          databaseOpen={state.databaseOpen}
          setDatabaseOpen={state.setDatabaseOpen}
          activeDatabaseId={state.activeDatabaseId}
          setActiveDatabaseId={state.setActiveDatabaseId}
          assembliesOpen={state.assembliesOpen}
          setAssembliesOpen={state.setAssembliesOpen}
          activeAssemblySystem={state.activeAssemblySystem}
          setActiveAssemblySystem={state.setActiveAssemblySystem}
          componentDatabases={state.componentDatabases}
          openNewDatabase={state.modals.openNewDatabase}
          workspaceSaveStatus={state.persistence.workspaceSaveStatus}
          recentWorkspaceSaves={state.persistence.recentWorkspaceSaves}
          executionProjects={state.execution.executionProjects}
          selectedExecutionProjectId={state.execution.selectedExecutionProjectId}
          openExecutionProject={state.execution.openExecutionProject}
          setExecutionFolderId={state.execution.setExecutionFolderId}
        />

        <main className="min-w-0 flex-1 max-[900px]:w-full overflow-y-auto">
          <AppScreens
            execution={state.execution}
          screen={state.screen}
          activeDatabaseId={state.activeDatabaseId}
          activeAssemblySystem={state.activeAssemblySystem}
          companyDatabases={state.companyDatabases}
          companyPriceTables={state.companyPriceTables}
          movedOriginalPriceTableIds={state.movedOriginalPriceTableIds}
          materials={state.materials}
          setMaterials={state.setMaterials}
          assemblies={state.assemblies}
          componentDatabases={state.componentDatabases}
          weightRates={state.weightRates}
          setWeightRates={state.setWeightRates}
          shippingTypes={state.shippingTypes}
          setShippingTypes={state.setShippingTypes}
          shippingRateForType={state.shippingRateForType}
          shippingRateForMaterial={state.shippingRateForMaterial}
          markupRates={state.markupRates}
          setMarkupRates={state.setMarkupRates}
          manpowerCurrency={state.manpowerCurrency}
          setManpowerCurrency={state.setManpowerCurrency}
          manpowerCosts={state.manpowerCosts}
          setManpowerCosts={state.setManpowerCosts}
          shippingCosts={state.shippingCosts}
          setShippingCosts={state.setShippingCosts}
          priceBook={state.priceBook}
          modals={state.modals}
          activeDatabase={state.activeDatabase}
          filtered={state.filtered}
          materialView={state.materialView}
          setMaterialView={state.setMaterialView}
          setMaterialDatabaseOverride={state.setMaterialDatabaseOverride}
          search={state.search}
          setSearch={state.setSearch}
          assemblyTypeFilter={state.assemblyTypeFilter}
          setAssemblyTypeFilter={state.setAssemblyTypeFilter}
          solealAccessoryMaterials={state.solealAccessoryMaterials}
          solealProfileMaterials={state.solealProfileMaterials}
          materialDatabaseReference={state.materialDatabaseReference}
          activeProjectYear={state.activeProjectYear}
          projects={state.projects}
          selectedProject={state.selectedProject}
          setSelectedProjectId={state.setSelectedProjectId}
          selectedCanvasId={state.selectedCanvasId}
          setSelectedCanvasId={state.setSelectedCanvasId}
          selectedItemId={state.selectedItemId}
          setSelectedItemId={state.setSelectedItemId}
          setScreen={state.setScreen}
          updateProject={state.updateProject}
          undoCanvasChange={state.undoCanvasChange}
          redoCanvasChange={state.redoCanvasChange}
          undoProjectHistory={state.undoProjectHistory}
          redoProjectHistory={state.redoProjectHistory}
          canvasInteraction={state.canvasInteraction}
          takeoff={state.takeoff}
        />
      </main>
    </div>

    <AppModals
      modals={state.modals}
      canvasInteraction={state.canvasInteraction}
      assemblies={state.assemblies}
      materials={state.materials}
      companyDatabases={state.companyDatabases}
      materialDatabaseReference={state.materialDatabaseReference}
      activeDatabaseId={state.activeDatabaseId}
      workspaceSaveStatus={state.persistence.workspaceSaveStatus}
    />
  </div>
);
}

export default App;
