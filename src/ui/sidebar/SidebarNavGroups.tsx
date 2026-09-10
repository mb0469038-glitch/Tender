import type { ComponentDatabase, Screen } from "../../domain/types";
import { PermissionGate } from "../../shared/permissions/PermissionGate";
import { WORKSPACE_PERMISSIONS } from "../../modules/workspace-legacy/domain/permissions";
import {
  FIXED_WINDOW_PAGE,
  FLY_SCREEN_PAGE,
  HINGE_WINDOW_PAGE,
  TILT_AND_TURN_PAGE,
  TWO_RAIL_WINDOW_PAGE,
} from "../../modules/catalog/domain/catalogDefinitions";
import {
  Building2,
  Database,
  Layers3,
  FileSpreadsheet,
  Warehouse,
  ChevronDown,
  Plus,
} from "lucide-react";

export type SidebarNavGroupsProps = {
  sidebarCollapsed: boolean;
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
  topNavBtnClass: (isActive: boolean) => string;
  subNavBtnClass: (isActive: boolean) => string;
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

export function SidebarNavGroups({
  sidebarCollapsed,
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
  topNavBtnClass,
  subNavBtnClass,
}: SidebarNavGroupsProps) {
  if (screen === "stock") {
    return (
      <nav className="grid gap-1 overflow-y-auto pr-0.5">
        <button
          className={topNavBtnClass(true)}
          onClick={() => {
            setActiveDatabaseId("prices");
            setScreen("stock");
          }}
        >
          <Warehouse size={17} strokeWidth={1.8} className="shrink-0" />
          {!sidebarCollapsed && <span>Stock</span>}
        </button>
      </nav>
    );
  }

  return (
    <nav className="grid gap-1 overflow-y-auto pr-0.5">
      {/* Projects */}
      <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_PROJECTS}>
        <button
          className={topNavBtnClass(screen === "projects" || screen === "canvas")}
          onClick={() => {
            setScreen("projects");
            setProjectsOpen((open) => !open);
          }}
          aria-expanded={projectsOpen}
        >
          <Building2 size={17} strokeWidth={1.8} className="shrink-0 text-inherit" />
          {!sidebarCollapsed && <span>Projects</span>}
          {!sidebarCollapsed && (
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={`ml-auto text-[#98A2B3] group-hover:text-inherit transition-transform duration-200 ${
                projectsOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </button>
        {projectsOpen && !sidebarCollapsed && (
          <div className="grid gap-0.5 my-1 ml-3.5 pl-2.5 border-l-2 border-[#E3E8EF]">
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

      {/* Database */}
      <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_DATABASE}>
        <button
          className={topNavBtnClass(screen === "database")}
          onClick={() => {
            setScreen("database");
            setDatabaseOpen((open) => !open);
          }}
          aria-expanded={databaseOpen}
        >
          <Database size={17} strokeWidth={1.8} className="shrink-0 text-inherit" />
          {!sidebarCollapsed && <span>Database</span>}
          {!sidebarCollapsed && (
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={`ml-auto text-[#98A2B3] group-hover:text-inherit transition-transform duration-200 ${
                databaseOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </button>
        {databaseOpen && !sidebarCollapsed && (
          <div className="grid gap-0.5 my-1 ml-3.5 pl-2.5 border-l-2 border-[#E3E8EF]">
            {DATABASE_NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={subNavBtnClass(screen === "database" && activeDatabaseId === item.id)}
                onClick={() => {
                  setActiveDatabaseId(item.id);
                  setScreen("database");
                }}
              >
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </PermissionGate>

      {/* Assemblies */}
      <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_ASSEMBLIES}>
        <button
          className={topNavBtnClass(screen === "assemblies")}
          onClick={() => {
            setScreen("assemblies");
            setAssembliesOpen((open) => !open);
          }}
          aria-expanded={assembliesOpen}
        >
          <Layers3 size={17} strokeWidth={1.8} className="shrink-0 text-inherit" />
          {!sidebarCollapsed && <span>Assemblies</span>}
          {!sidebarCollapsed && (
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={`ml-auto text-[#98A2B3] group-hover:text-inherit transition-transform duration-200 ${
                assembliesOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </button>
        {assembliesOpen && !sidebarCollapsed && (
          <div className="grid gap-0.5 my-1 ml-3.5 pl-2.5 border-l-2 border-[#E3E8EF]">
            {TECHNAL_NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={subNavBtnClass(screen === "assemblies" && activeDatabaseId === item.id)}
                onClick={() => {
                  setActiveAssemblySystem("technal");
                  setActiveDatabaseId(item.id);
                  setScreen("assemblies");
                }}
              >
                <span className="truncate">{item.label}</span>
              </button>
            ))}

            <div className="flex items-center gap-1 mt-1">
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
                className="grid place-items-center w-6 h-6 p-0 border border-[#E3E8EF] rounded-md bg-white text-[#165BAA] hover:bg-[#165BAA] hover:text-white hover:border-[#165BAA] cursor-pointer transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                onClick={() => openNewDatabase("sidem")}
                aria-label="Add Sidem assembly database"
                title="Add Sidem assembly database"
              >
                <Plus size={13} strokeWidth={2.2} />
              </button>
            </div>

            {componentDatabases.filter((item) => item.parent === "sidem").length > 0 && (
              <div className="grid gap-0.5 my-1 ml-2.5 pl-2 border-l border-[#E3E8EF]">
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
                      <span className="truncate">{database.name}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </PermissionGate>

      {/* Excel */}
      <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_EXCEL}>
        <button
          className={topNavBtnClass(screen === "excel")}
          onClick={() => setScreen("excel")}
        >
          <FileSpreadsheet size={17} strokeWidth={1.8} className="shrink-0 text-inherit" />
          {!sidebarCollapsed && <span>Excel</span>}
        </button>
      </PermissionGate>
    </nav>
  );
}
