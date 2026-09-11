import { useLocation } from "react-router-dom";
import { useAppState } from "./application/useAppState";
import { projectYears } from "./modules/projects/domain/projectDefaults";
import { AppSidebar } from "./ui/AppSidebar";
import { AppTopbar } from "./ui/AppTopbar";
import { AppRoutes } from "./routes/AppRoutes";
import { AppModals } from "./modules/catalog/ui/modals/AppModals";
import "./App.css";

export function App() {
  const state = useAppState();
  const location = useLocation();

  const isExecutionWorkspace =
    location.pathname === "/execution/workspace" || state.screen === "execution-workspace";
  const isDashboard = location.pathname === "/dashboard" || location.pathname === "/";

  // If in dedicated full-screen execution workspace (without shell topbar/sidebar)
  if (isExecutionWorkspace) {
    return <AppRoutes state={state} />;
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
        {!isDashboard && (
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
        )}

        <main className="min-w-0 flex-1 max-[900px]:w-full overflow-y-auto">
          <AppRoutes state={state} />
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
