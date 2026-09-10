import type { ComponentDatabase, Screen } from "../domain/types";
import { Icon } from "../design-system/Icon";
import { PermissionGate } from "../shared/permissions/PermissionGate";
import { WORKSPACE_PERMISSIONS } from "../modules/workspace-legacy/domain/permissions";
import {
  FIXED_WINDOW_PAGE,
  FLY_SCREEN_PAGE,
  HINGE_WINDOW_PAGE,
  TILT_AND_TURN_PAGE,
  TWO_RAIL_WINDOW_PAGE,
} from "../modules/catalog/domain/catalogDefinitions";

export type AppSidebarProps = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  screen: Screen;
  setScreen: (screen: Screen) => void;
  projectsOpen: boolean;
  setProjectsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  projectYears: readonly string[];
  activeProjectYear: string;
  setActiveProjectYear: (year: string) => void;
  databaseOpen: boolean;
  setDatabaseOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeDatabaseId: string;
  setActiveDatabaseId: (id: string) => void;
  assembliesOpen: boolean;
  setAssembliesOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeAssemblySystem: "technal" | "sidem";
  setActiveAssemblySystem: (system: "technal" | "sidem") => void;
  componentDatabases: ComponentDatabase[];
  openNewDatabase: (parent: "technal" | "sidem") => void;
  workspaceSaveStatus: "saved" | "saving" | "error";
  recentWorkspaceSaves: string[];
};

export function AppSidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
  screen,
  setScreen,
  projectsOpen,
  setProjectsOpen,
  projectYears,
  activeProjectYear,
  setActiveProjectYear,
  databaseOpen,
  setDatabaseOpen,
  activeDatabaseId,
  setActiveDatabaseId,
  assembliesOpen,
  setAssembliesOpen,
  activeAssemblySystem,
  setActiveAssemblySystem,
  componentDatabases,
  openNewDatabase,
  workspaceSaveStatus,
  recentWorkspaceSaves,
}: AppSidebarProps) {
  return (
    <aside className="sidebar">
      <button
        className="brand-mark"
        type="button"
        onClick={() => setScreen("home")}
        aria-label="Return to AMA services"
      >
        <Icon name="box" size={22} />
        <span>
          AMA
          <br />
          {screen === "stock" ? "Stock" : "Estimation"}
        </span>
      </button>
      {screen !== "stock" && (
        <button
          className="sidebar-collapse"
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          aria-label={sidebarCollapsed ? "Expand main navigation" : "Collapse main navigation"}
          title={sidebarCollapsed ? "Expand main navigation" : "Collapse main navigation"}
        >
          <Icon name="arrow" size={16} />
        </button>
      )}
      <nav>
        {screen === "stock" ? (
          <button
            className="active"
            onClick={() => {
              setActiveDatabaseId("prices");
              setScreen("stock");
            }}
          >
            <Icon name="warehouse" /> <span>Stock</span>
          </button>
        ) : (
          <>
            <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_PROJECTS}>
              <button
                className={screen === "projects" || screen === "canvas" ? "active" : ""}
                onClick={() => {
                  setScreen("projects");
                  setProjectsOpen((open) => !open);
                }}
                aria-expanded={projectsOpen}
              >
                <Icon name="folder" /> <span>Projects</span>
                <small className="nav-caret">{projectsOpen ? "⌄" : "›"}</small>
              </button>
              {projectsOpen && (
                <div className="database-nav project-year-nav">
                  {projectYears.map((year) => (
                    <button
                      key={year}
                      className={
                        (screen === "projects" || screen === "canvas") && activeProjectYear === year
                          ? "active"
                          : ""
                      }
                      onClick={() => {
                        setActiveProjectYear(year);
                        setScreen("projects");
                      }}
                    >
                      <span>{year}</span>
                    </button>
                  ))}
                </div>
              )}
            </PermissionGate>
            <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_DATABASE}>
              <button
                className={screen === "database" ? "active" : ""}
                onClick={() => {
                  setScreen("database");
                  setDatabaseOpen((open) => !open);
                }}
              >
                <Icon name="box" /> <span>Database</span>
                <small className="nav-caret">{databaseOpen ? "⌄" : "›"}</small>
              </button>
              {databaseOpen && (
                <div className="database-nav">
                  <button
                    className={screen === "database" && activeDatabaseId === "prices" ? "active" : ""}
                    onClick={() => {
                      setActiveDatabaseId("prices");
                      setScreen("database");
                    }}
                  >
                    <span>Material database</span>
                  </button>
                  <button
                    className={screen === "database" && activeDatabaseId === "glass" ? "active" : ""}
                    onClick={() => {
                      setActiveDatabaseId("glass");
                      setScreen("database");
                    }}
                  >
                    <span>Glass price</span>
                  </button>
                  <button
                    className={
                      screen === "database" && activeDatabaseId === "costing-financials" ? "active" : ""
                    }
                    onClick={() => {
                      setActiveDatabaseId("costing-financials");
                      setScreen("database");
                    }}
                  >
                    <span>Costing &amp; Financials</span>
                  </button>
                </div>
              )}
            </PermissionGate>
            <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_ASSEMBLIES}>
              <button
                className={screen === "assemblies" ? "active" : ""}
                onClick={() => {
                  setScreen("assemblies");
                  setAssembliesOpen((open) => !open);
                }}
                aria-expanded={assembliesOpen}
              >
                <Icon name="layers" /> <span>Assemblies</span>
                <small className="nav-caret">{assembliesOpen ? "⌄" : "›"}</small>
              </button>
              {assembliesOpen && (
                <div className="database-nav">
                  <button
                    className={
                      screen === "assemblies" && activeDatabaseId === TWO_RAIL_WINDOW_PAGE ? "active" : ""
                    }
                    onClick={() => {
                      setActiveAssemblySystem("technal");
                      setActiveDatabaseId(TWO_RAIL_WINDOW_PAGE);
                      setScreen("assemblies");
                    }}
                  >
                    <span>2 rail system</span>
                  </button>
                  <button
                    className={
                      screen === "assemblies" && activeDatabaseId === HINGE_WINDOW_PAGE ? "active" : ""
                    }
                    onClick={() => {
                      setActiveAssemblySystem("technal");
                      setActiveDatabaseId(HINGE_WINDOW_PAGE);
                      setScreen("assemblies");
                    }}
                  >
                    <span>Hinged system</span>
                  </button>
                  <button
                    className={
                      screen === "assemblies" && activeDatabaseId === FIXED_WINDOW_PAGE ? "active" : ""
                    }
                    onClick={() => {
                      setActiveAssemblySystem("technal");
                      setActiveDatabaseId(FIXED_WINDOW_PAGE);
                      setScreen("assemblies");
                    }}
                  >
                    <span>Fixed window</span>
                  </button>
                  <button
                    className={
                      screen === "assemblies" && activeDatabaseId === FLY_SCREEN_PAGE ? "active" : ""
                    }
                    onClick={() => {
                      setActiveAssemblySystem("technal");
                      setActiveDatabaseId(FLY_SCREEN_PAGE);
                      setScreen("assemblies");
                    }}
                  >
                    <span>Fly screen</span>
                  </button>
                  <button
                    className={
                      screen === "assemblies" && activeDatabaseId === TILT_AND_TURN_PAGE ? "active" : ""
                    }
                    onClick={() => {
                      setActiveAssemblySystem("technal");
                      setActiveDatabaseId(TILT_AND_TURN_PAGE);
                      setScreen("assemblies");
                    }}
                  >
                    <span>Tilt and Turn</span>
                  </button>
                  <div className="database-nav-parent">
                    <button
                      className={
                        screen === "assemblies" && activeAssemblySystem === "sidem" ? "active" : ""
                      }
                      onClick={() => {
                        setActiveAssemblySystem("sidem");
                        setActiveDatabaseId("sidem");
                        setScreen("assemblies");
                      }}
                    >
                      <span>Sidem</span>
                    </button>
                    <button
                      className="database-add"
                      onClick={() => openNewDatabase("sidem")}
                      aria-label="Add Sidem assembly database"
                      title="Add Sidem assembly database"
                    >
                      <Icon name="plus" size={14} />
                    </button>
                  </div>
                  <div className="database-nav component-nav">
                    {componentDatabases
                      .filter((item) => item.parent === "sidem")
                      .map((database) => (
                        <button
                          key={database.id}
                          className={
                            screen === "assemblies" &&
                            activeAssemblySystem === "sidem" &&
                            activeDatabaseId === database.id
                              ? "active"
                              : ""
                          }
                          onClick={() => {
                            setActiveAssemblySystem("sidem");
                            setActiveDatabaseId(database.id);
                            setScreen("assemblies");
                          }}
                        >
                          <span>{database.name}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </PermissionGate>
            <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_EXCEL}>
              <button
                className={screen === "excel" ? "active" : ""}
                onClick={() => setScreen("excel")}
              >
                <Icon name="box" /> <span>Excel</span>
              </button>
            </PermissionGate>
          </>
        )}
      </nav>
      {screen !== "stock" && (
        <div className="sidebar-note">
          <span className={`status-dot ${workspaceSaveStatus}`} /> Local workspace
          <br />
          <small>
            {workspaceSaveStatus === "saving"
              ? "Saving changes…"
              : workspaceSaveStatus === "error"
              ? "Save failed — changes are still open."
              : "All changes saved to SQLite."}
          </small>
          {recentWorkspaceSaves.length > 0 && (
            <ol className="save-history" aria-label="Recent saves">
              {recentWorkspaceSaves.map((savedAt, index) => (
                <li key={`${savedAt}-${index}`}>Saved {savedAt}</li>
              ))}
            </ol>
          )}
        </div>
      )}
    </aside>
  );
}
