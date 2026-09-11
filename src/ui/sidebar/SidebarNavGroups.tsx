import { useLocation, useNavigate } from "react-router-dom";
import type { ComponentDatabase, ExecutionProject, Screen } from "../../domain/types";
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
  FolderKanban,
  ChevronDown,
  Plus,
} from "lucide-react";

export type SidebarNavGroupsProps = {
  sidebarCollapsed: boolean;
  screen?: Screen;
  setScreen?: (screen: Screen) => void;
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
  executionProjects?: ExecutionProject[];
  selectedExecutionProjectId?: string;
  openExecutionProject?: (id: string) => void;
  setExecutionFolderId?: (id: string | null) => void;
};

const DATABASE_NAV_ITEMS = [
  { id: "prices", path: "/database/soleal", label: "Material database" },
  { id: "glass", path: "/database/glass", label: "Glass price" },
  { id: "costing-financials", path: "/database/costing", label: "Costing & Financials" },
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
  setExecutionFolderId,
}: SidebarNavGroupsProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isStock = location.pathname.startsWith("/stock");
  const isExecution = location.pathname.startsWith("/execution");
  const isProjects =
    location.pathname.startsWith("/estimation") ||
    location.pathname.startsWith("/projects") ||
    location.pathname.startsWith("/canvas");
  const isDatabase = location.pathname.startsWith("/database");
  const isAssemblies = location.pathname.startsWith("/assemblies");
  const isExcel = location.pathname.startsWith("/excel");

  if (isStock) {
    return (
      <nav className="grid gap-1.5 overflow-y-auto pr-0.5" aria-label="Stock navigation">
        <button
          className={topNavBtnClass(true)}
          onClick={() => {
            setActiveDatabaseId("prices");
            navigate("/stock");
          }}
        >
          <Warehouse size={19} strokeWidth={1.8} className="shrink-0" />
          {!sidebarCollapsed && <span>Stock Inventory</span>}
        </button>
      </nav>
    );
  }

  if (isExecution) {
    return (
      <nav className="grid gap-1.5 overflow-y-auto pr-0.5" aria-label="Execution navigation">
        <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_EXECUTION_PROJECTS}>
          <button
            className={topNavBtnClass(true)}
            onClick={() => {
              setExecutionFolderId?.(null);
              navigate("/execution");
            }}
          >
            <FolderKanban size={19} strokeWidth={1.8} className="shrink-0" />
            {!sidebarCollapsed && <span>Projects Under Execution</span>}
          </button>
        </PermissionGate>
      </nav>
    );
  }

  return (
    <nav className="grid gap-1.5 overflow-y-auto pr-0.5" aria-label="Estimation navigation">
      {/* 1. Projects (Estimation Home) */}
      <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_PROJECTS}>
        <button
          className={topNavBtnClass(isProjects)}
          onClick={() => {
            navigate(`/estimation/projects/${activeProjectYear || "2026"}`);
            setProjectsOpen((open) => !open);
          }}
          aria-expanded={projectsOpen}
        >
          <Building2 size={19} strokeWidth={1.8} className="shrink-0 text-inherit" />
          {!sidebarCollapsed && <span>Projects</span>}
          {!sidebarCollapsed && (
            <ChevronDown
              size={15}
              strokeWidth={2}
              className={`ml-auto text-[#98A2B3] group-hover:text-inherit transition-transform duration-200 ${
                projectsOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </button>
        {projectsOpen && !sidebarCollapsed && (
          <div className="grid gap-1 my-1 ml-4 pl-3 border-l-2 border-[#E3E8EF]">
            {projectYears.map((year) => (
              <button
                key={year}
                className={subNavBtnClass(
                  isProjects &&
                    (location.pathname === `/estimation/projects/${year}` ||
                      location.pathname.startsWith(`/estimation/projects/${year}/`) ||
                      (!location.pathname.includes("/estimation/projects/") && activeProjectYear === year))
                )}
                onClick={() => {
                  setActiveProjectYear(year);
                  navigate(`/estimation/projects/${year}`);
                }}
              >
                <span>{year}</span>
              </button>
            ))}
          </div>
        )}
      </PermissionGate>

      {/* 2. Database */}
      <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_DATABASE}>
        <button
          className={topNavBtnClass(isDatabase)}
          onClick={() => {
            navigate("/database/soleal");
            setDatabaseOpen((open) => !open);
          }}
          aria-expanded={databaseOpen}
        >
          <Database size={19} strokeWidth={1.8} className="shrink-0 text-inherit" />
          {!sidebarCollapsed && <span>Database</span>}
          {!sidebarCollapsed && (
            <ChevronDown
              size={15}
              strokeWidth={2}
              className={`ml-auto text-[#98A2B3] group-hover:text-inherit transition-transform duration-200 ${
                databaseOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </button>
        {databaseOpen && !sidebarCollapsed && (
          <div className="grid gap-1 my-1 ml-4 pl-3 border-l-2 border-[#E3E8EF]">
            {DATABASE_NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={subNavBtnClass(location.pathname === item.path)}
                onClick={() => {
                  setActiveDatabaseId(item.id);
                  navigate(item.path);
                }}
              >
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </PermissionGate>

      {/* 3. Assemblies */}
      <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_ASSEMBLIES}>
        <button
          className={topNavBtnClass(isAssemblies)}
          onClick={() => {
            const defaultPage =
              activeDatabaseId && activeDatabaseId !== "prices" ? activeDatabaseId : "two-rail-window";
            navigate(`/assemblies/${defaultPage}`);
            setAssembliesOpen((open) => !open);
          }}
          aria-expanded={assembliesOpen}
        >
          <Layers3 size={19} strokeWidth={1.8} className="shrink-0 text-inherit" />
          {!sidebarCollapsed && <span>Assemblies</span>}
          {!sidebarCollapsed && (
            <ChevronDown
              size={15}
              strokeWidth={2}
              className={`ml-auto text-[#98A2B3] group-hover:text-inherit transition-transform duration-200 ${
                assembliesOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </button>
        {assembliesOpen && !sidebarCollapsed && (
          <div className="grid gap-1 my-1 ml-4 pl-3 border-l-2 border-[#E3E8EF]">
            {TECHNAL_NAV_ITEMS.map((item) => {
              const isItemActive =
                isAssemblies &&
                (activeDatabaseId === item.id ||
                  location.pathname === `/assemblies/${item.id}` ||
                  location.pathname.startsWith(`/assemblies/${item.id}/`));
              return (
                <button
                  key={item.id}
                  className={subNavBtnClass(isItemActive)}
                  onClick={() => {
                    setActiveAssemblySystem("technal");
                    setActiveDatabaseId(item.id);
                    navigate(`/assemblies/${item.id}`);
                  }}
                >
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}

            <div className="flex items-center gap-1 mt-1">
              <button
                className={`${subNavBtnClass(
                  isAssemblies &&
                    (activeAssemblySystem === "sidem" ||
                      location.pathname === "/assemblies/sidem" ||
                      location.pathname.startsWith("/assemblies/sidem/"))
                )} flex-1`}
                onClick={() => {
                  setActiveAssemblySystem("sidem");
                  setActiveDatabaseId("sidem");
                  navigate("/assemblies/sidem");
                }}
              >
                <span>Sidem</span>
              </button>
              <button
                className="grid place-items-center w-6.5 h-6.5 p-0 border border-[#E3E8EF] rounded-md bg-white text-[#165BAA] hover:bg-[#165BAA] hover:text-white hover:border-[#165BAA] cursor-pointer transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                onClick={() => openNewDatabase("sidem")}
                aria-label="Add Sidem assembly database"
                title="Add Sidem assembly database"
              >
                <Plus size={14} strokeWidth={2.2} />
              </button>
            </div>

            {componentDatabases.filter((item) => item.parent === "sidem").length > 0 && (
              <div className="grid gap-1 my-1 ml-3 pl-2.5 border-l border-[#E3E8EF]">
                {componentDatabases
                  .filter((item) => item.parent === "sidem")
                  .map((database) => {
                    const isDbActive =
                      isAssemblies &&
                      (activeDatabaseId === database.id ||
                        location.pathname === `/assemblies/${database.id}` ||
                        location.pathname.startsWith(`/assemblies/${database.id}/`));
                    return (
                      <button
                        key={database.id}
                        className={subNavBtnClass(isDbActive)}
                        onClick={() => {
                          setActiveAssemblySystem("sidem");
                          setActiveDatabaseId(database.id);
                          navigate(`/assemblies/${database.id}`);
                        }}
                      >
                        <span className="truncate">{database.name}</span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </PermissionGate>

      {/* 4. Excel */}
      <PermissionGate permission={WORKSPACE_PERMISSIONS.VIEW_EXCEL}>
        <button
          className={topNavBtnClass(isExcel)}
          onClick={() => navigate("/excel")}
        >
          <FileSpreadsheet size={19} strokeWidth={1.8} className="shrink-0 text-inherit" />
          {!sidebarCollapsed && <span>Excel</span>}
        </button>
      </PermissionGate>
    </nav>
  );
}
