import type { ComponentDatabase, Screen } from "../domain/types";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebarResize } from "./sidebar/useSidebarResize";
import { SidebarWorkspaceStatus } from "./sidebar/SidebarWorkspaceStatus";
import { SidebarNavGroups } from "./sidebar/SidebarNavGroups";

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

export function AppSidebar(props: AppSidebarProps) {
  const { sidebarCollapsed, setSidebarCollapsed, screen, setScreen } = props;
  const { width, isDragging, startResizing, resetWidth } = useSidebarResize(sidebarCollapsed);

  const topNavBtnClass = (isActive: boolean) =>
    `group flex items-center gap-2.5 w-full border-0 rounded-[8px] text-left text-[13px] font-semibold cursor-pointer transition-all duration-150 ${
      sidebarCollapsed ? "justify-center p-2.5" : "px-3 py-2"
    } ${
      isActive
        ? "bg-[#0B1F4D] text-white shadow-[0_1px_3px_rgba(11,31,77,0.16)]"
        : "bg-transparent text-[#344054] hover:bg-[#EDF2F7] hover:text-[#0B1F4D]"
    }`;

  const subNavBtnClass = (isActive: boolean) =>
    `flex items-center min-h-[28px] px-2.5 py-1 border-0 rounded-[6px] text-left text-[12px] cursor-pointer transition-all duration-150 ${
      isActive
        ? "bg-[#165BAA] text-white font-semibold shadow-[0_1px_2px_rgba(22,91,170,0.18)]"
        : "bg-transparent text-[#475467] hover:bg-[#EDF2F7] hover:text-[#0B1F4D]"
    }`;

  return (
    <aside
      style={{ width: `${width}px`, flex: `0 0 ${width}px` }}
      className={`h-screen relative flex flex-col sticky top-0 bg-[#F8FAFC] border-r border-[#E3E8EF] text-[#172033] transition-[padding] duration-150 ease-in-out select-none ${
        sidebarCollapsed ? "p-[20px_8px_16px]" : "p-[22px_14px_16px]"
      }`}
    >
      {/* Resizer Handle */}
      {!sidebarCollapsed && (
        <div
          onPointerDown={startResizing}
          onDoubleClick={resetWidth}
          className={`absolute top-0 right-0 w-2 h-full cursor-col-resize z-30 group hover:bg-[#2D8ACD]/25 transition-colors ${
            isDragging ? "bg-[#165BAA] w-1" : ""
          }`}
          title="Drag to resize sidebar (Double click to reset)"
        >
          <div className="w-[1px] h-full bg-[#E3E8EF] absolute right-0 top-0 group-hover:bg-[#2D8ACD]" />
        </div>
      )}

      {/* Brand Header */}
      <div className="flex items-center justify-between gap-2 pb-5 mb-2 border-b border-[#E3E8EF]">
        <button
          className="flex items-center gap-2.5 border-0 bg-transparent text-left cursor-pointer p-1 rounded-md hover:bg-[#EDF2F7] transition-colors"
          type="button"
          onClick={() => setScreen("home")}
          aria-label="Return to AMA services"
        >
          <div className="grid place-items-center w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#165BAA] shrink-0">
            <Building2 size={18} strokeWidth={2} />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="text-[14px] font-black tracking-tight text-[#0B1F4D] leading-none">AMA</div>
              <div className="text-[11px] font-semibold text-[#165BAA] leading-none mt-1">
                {screen === "stock" ? "Stock Service" : "Estimation"}
              </div>
            </div>
          )}
        </button>

        {/* Collapse Toggle */}
        <button
          className="grid place-items-center w-7 h-7 p-0 border border-[#E3E8EF] rounded-md bg-white text-[#667085] hover:text-[#0B1F4D] hover:bg-[#F1F5F9] hover:border-[#CBD5E1] shadow-[0_1px_2px_rgba(16,24,40,0.05)] cursor-pointer transition-all shrink-0"
          onClick={() => setSidebarCollapsed((c) => !c)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={15} strokeWidth={2} />
          ) : (
            <ChevronLeft size={15} strokeWidth={2} />
          )}
        </button>
      </div>

      {/* Main Navigation Groups */}
      <SidebarNavGroups
        {...props}
        topNavBtnClass={topNavBtnClass}
        subNavBtnClass={subNavBtnClass}
      />

      {/* Workspace Status & Recent Saves */}
      {screen !== "stock" && (
        <SidebarWorkspaceStatus
          workspaceSaveStatus={props.workspaceSaveStatus}
          recentWorkspaceSaves={props.recentWorkspaceSaves}
          isCollapsed={sidebarCollapsed}
        />
      )}
    </aside>
  );
}
