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

const DATABASE_NAV_ITEMS = [
  { id: "prices", label: "Material database" },
  { id: "glass", label: "Glass price" },
  { id: "costing-financials", label: "Costing & Financials" },
] as const;

const TECHNAL_NAV_ITEMS = [
  { id: TWO_RAIL_WINDOW_PAGE, label: "2 rail system" },
  { id: HINGE_WINDOW_PAGE, label: "Hinged system" },
  { id: FIXED_WINDOW_PAGE, label: "Fixed window" },
  { id: FLY_SCREEN_PAGE, label: "Fly screen" },
  { id: TILT_AND_TURN_PAGE, label: "Tilt and Turn" },
] as const;

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
  const topNavBtnClass = (isActive: boolean) =>
    `flex items-center gap-2.5 w-full border-0 rounded-[8px] text-left text-[13px] font-bold cursor-pointer transition-colors duration-150 ${
      sidebarCollapsed
        ? "justify-center p-[11px]"
        : "p-[9px_10px] max-[700px]:justify-center max-[700px]:p-[12px_5px]"
    } ${
      isActive
        ? "bg-[#28636a] text-white"
        : "bg-transparent text-[#b7cccc] hover:bg-[#1d4c51] hover:text-white max-[700px]:hidden"
    }`;

  const subNavBtnClass = (isActive: boolean) =>
    `relative flex items-center min-h-[28px] px-[7px] py-[5px] border-0 rounded-[6px] text-left text-[11px] font-bold cursor-pointer transition-colors duration-150 ${
      isActive
        ? "bg-[#28636a] text-white"
        : "bg-transparent text-[#b7cccc] hover:bg-[#1d4c51] hover:text-white"
    }`;

  const statusDotClass =
    workspaceSaveStatus === "saving"
      ? "bg-[#e8bd5a]"
      : workspaceSaveStatus === "error"
      ? "bg-[#df6a6a]"
      : "bg-[#6ed4a0]";

  return (
    <aside
      className={`h-screen flex flex-col sticky top-0 overflow-y-auto bg-[#123b40] text-[#d9e6e7] transition-[width,padding] duration-200 ease-in-out select-none ${
        sidebarCollapsed
          ? "w-[72px] flex-[0_0_72px] p-[28px_10px_20px]"
          : "w-[224px] flex-[0_0_224px] p-[28px_15px_20px] max-[700px]:w-[63px] max-[700px]:flex-[0_0_63px] max-[700px]:p-[22px_8px]"
      }`}
    >
      <button
        className={`flex items-center gap-2.5 text-white text-[15px] font-extrabold leading-[1.05] border-0 bg-transparent text-left cursor-pointer [&>svg]:text-[#82d4c9] ${
          sidebarCollapsed
            ? "justify-center px-0 pb-[32px]"
            : "px-[11px] pb-[32px] max-[700px]:justify-center max-[700px]:px-0 max-[700px]:pb-[29px]"
        }`}
        type="button"
        onClick={() => setScreen("home")}
        aria-label="Return to AMA services"
      >
        <Icon name="box" size={22} />
        {!sidebarCollapsed && (
          <span className="max-[700px]:hidden">
            AMA
            <br />
            {screen === "stock" ? "Stock" : "Estimation"}
          </span>
        )}
      </button>

      {screen !== "stock" && (
        <button
          className={`absolute z-10 top-[28px] -right-[15px] grid place-items-center w-[30px] h-[30px] p-0 border border-[#bcd3d4] rounded-full bg-white text-[#174d51] shadow-[0_2px_7px_rgba(20,49,52,0.2)] transition-transform duration-200 hover:bg-[#def1ef] cursor-pointer max-[700px]:hidden ${
            sidebarCollapsed ? "rotate-0" : "rotate-180"
          }`}
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          aria-label={sidebarCollapsed ? "Expand main navigation" : "Collapse main navigation"}
          title={sidebarCollapsed ? "Expand main navigation" : "Collapse main navigation"}
        >
          <Icon name="arrow" size={16} />
        </button>
      )}

      <nav className="grid gap-[3px]">
        {screen === "stock" ? (
          <button
            className={topNavBtnClass(true)}
            onClick={() => {
              setActiveDatabaseId("prices");
              setScreen("stock");
            }}
          >
            <Icon name="warehouse" /> {!sidebarCollapsed && <span className="max-[700px]:hidden">Stock</span>}
          </button>
        ) : (
          <>
            <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_PROJECTS}>
              <button
                className={topNavBtnClass(screen === "projects" || screen === "canvas")}
                onClick={() => {
                  setScreen("projects");
                  setProjectsOpen((open) => !open);
                }}
                aria-expanded={projectsOpen}
              >
                <Icon name="folder" /> {!sidebarCollapsed && <span className="max-[700px]:hidden">Projects</span>}
                {!sidebarCollapsed && (
                  <small className="ml-auto text-inherit text-[15px] leading-none max-[700px]:hidden">
                    {projectsOpen ? "⌄" : "›"}
                  </small>
                )}
              </button>
              {projectsOpen && !sidebarCollapsed && (
                <div className="grid gap-[1px] my-[1px] mb-[3px] ml-[9px] pl-[8px] border-l border-[#315d61] max-[700px]:hidden">
                  {projectYears.map((year) => (
                    <button
                      key={year}
                      className={subNavBtnClass(
                        (screen === "projects" || screen === "canvas") && activeProjectYear === year
                      )}
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
                className={topNavBtnClass(screen === "database")}
                onClick={() => {
                  setScreen("database");
                  setDatabaseOpen((open) => !open);
                }}
              >
                <Icon name="box" /> {!sidebarCollapsed && <span className="max-[700px]:hidden">Database</span>}
                {!sidebarCollapsed && (
                  <small className="ml-auto text-inherit text-[15px] leading-none max-[700px]:hidden">
                    {databaseOpen ? "⌄" : "›"}
                  </small>
                )}
              </button>
              {databaseOpen && !sidebarCollapsed && (
                <div className="grid gap-[1px] my-[1px] mb-[3px] ml-[9px] pl-[8px] border-l border-[#315d61] max-[700px]:hidden">
                  {DATABASE_NAV_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      className={subNavBtnClass(
                        screen === "database" && activeDatabaseId === item.id
                      )}
                      onClick={() => {
                        setActiveDatabaseId(item.id);
                        setScreen("database");
                      }}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </PermissionGate>

            <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_ASSEMBLIES}>
              <button
                className={topNavBtnClass(screen === "assemblies")}
                onClick={() => {
                  setScreen("assemblies");
                  setAssembliesOpen((open) => !open);
                }}
                aria-expanded={assembliesOpen}
              >
                <Icon name="layers" /> {!sidebarCollapsed && <span className="max-[700px]:hidden">Assemblies</span>}
                {!sidebarCollapsed && (
                  <small className="ml-auto text-inherit text-[15px] leading-none max-[700px]:hidden">
                    {assembliesOpen ? "⌄" : "›"}
                  </small>
                )}
              </button>
              {assembliesOpen && !sidebarCollapsed && (
                <div className="grid gap-[1px] my-[1px] mb-[3px] ml-[9px] pl-[8px] border-l border-[#315d61] max-[700px]:hidden">
                  {TECHNAL_NAV_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      className={subNavBtnClass(
                        screen === "assemblies" && activeDatabaseId === item.id
                      )}
                      onClick={() => {
                        setActiveAssemblySystem("technal");
                        setActiveDatabaseId(item.id);
                        setScreen("assemblies");
                      }}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                  <div className="flex items-center gap-[1px]">
                    <button
                      className={`${subNavBtnClass(
                        screen === "assemblies" && activeAssemblySystem === "sidem"
                      )} flex-1`}
                      onClick={() => {
                        setActiveAssemblySystem("sidem");
                        setActiveDatabaseId("sidem");
                        setScreen("assemblies");
                      }}
                    >
                      <span>Sidem</span>
                    </button>
                    <button
                      className="grid place-items-center w-[26px] min-h-[26px] p-0 border border-[#3d6e72] rounded-[5px] bg-[#1d4c51] text-[#9fe2d8] hover:bg-[#28636a] hover:text-white cursor-pointer transition-colors"
                      onClick={() => openNewDatabase("sidem")}
                      aria-label="Add Sidem assembly database"
                      title="Add Sidem assembly database"
                    >
                      <Icon name="plus" size={14} />
                    </button>
                  </div>
                  <div className="grid gap-[1px] my-[1px] mb-[3px] ml-[8px] pl-[8px] border-l border-[#315d61]">
                    {componentDatabases
                      .filter((item) => item.parent === "sidem")
                      .map((database) => (
                        <button
                          key={database.id}
                          className={subNavBtnClass(
                            screen === "assemblies" &&
                              activeAssemblySystem === "sidem" &&
                              activeDatabaseId === database.id
                          )}
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
                className={topNavBtnClass(screen === "excel")}
                onClick={() => setScreen("excel")}
              >
                <Icon name="box" /> {!sidebarCollapsed && <span className="max-[700px]:hidden">Excel</span>}
              </button>
            </PermissionGate>
          </>
        )}
      </nav>

      {screen !== "stock" && !sidebarCollapsed && (
        <div className="mt-auto p-[16px_11px] border-t border-[#315d61] text-[13px] leading-[1.5] max-[700px]:hidden">
          <span className={`inline-block w-[7px] h-[7px] mr-[6px] rounded-full ${statusDotClass}`} />
          Local workspace
          <br />
          <small className="text-[#91afb1]">
            {workspaceSaveStatus === "saving"
              ? "Saving changes…"
              : workspaceSaveStatus === "error"
              ? "Save failed — changes are still open."
              : "All changes saved to SQLite."}
          </small>
          {recentWorkspaceSaves.length > 0 && (
            <ol className="mt-[10px] pt-[8px] pl-[16px] border-t border-[#315d61] text-[#91afb1] text-[11px] leading-[1.55] list-decimal" aria-label="Recent saves">
              {recentWorkspaceSaves.map((savedAt, index) => (
                <li key={`${savedAt}-${index}`} className="pl-[1px]">Saved {savedAt}</li>
              ))}
            </ol>
          )}
        </div>
      )}
    </aside>
  );
}
