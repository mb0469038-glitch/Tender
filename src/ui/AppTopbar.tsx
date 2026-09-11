import { useLocation, useNavigate } from "react-router-dom";
import type { CompanyDatabase, Screen } from "../domain/types";
import { Icon } from "../design-system/Icon";
import { ProfileMenu } from "../modules/auth/ui/ProfileMenu";
import { Layers3, Warehouse, FolderKanban } from "lucide-react";

export type AppTopbarProps = {
  screen?: Screen;
  setScreen?: (screen: Screen) => void;
  activeDatabaseId: string;
  setActiveDatabaseId: (id: string) => void;
  companyDatabases: CompanyDatabase[];
  openNewCompanyDatabase: () => void;
};

export function AppTopbar({
  activeDatabaseId,
  setActiveDatabaseId,
  companyDatabases,
  openNewCompanyDatabase,
}: AppTopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isDashboard = location.pathname === "/dashboard" || location.pathname === "/";
  const isExecution = location.pathname.startsWith("/execution");
  const isStock = location.pathname.startsWith("/stock");
  const isEstimation = !isDashboard && !isExecution && !isStock;
  const isDatabase = location.pathname.startsWith("/database");

  return (
    <header className="h-[69px] flex items-center justify-between px-6 lg:px-8 border-b border-[#E3E8EF] bg-white sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Left: Company Logo + Divider + Main Switcher Tabs */}
      <div className="flex items-center gap-4 sm:gap-6 min-w-0">
        {/* Company Logo */}
        <button
          type="button"
          className="flex items-center gap-2 p-1 border-0 bg-transparent rounded-lg cursor-pointer hover:opacity-85 transition-opacity shrink-0"
          onClick={() => navigate("/dashboard")}
          title="L’Atelier Moderne de l’Aluminium"
          aria-label="AMA Home"
        >
          <img
            src="/brand/atelier-moderne-logo.png"
            alt="L’Atelier Moderne de l’Aluminium"
            className="h-10 w-auto max-w-[130px] object-contain shrink-0"
          />
        </button>

        {/* Divider & Switcher Tabs (Hidden on Dashboard) */}
        {!isDashboard && (
          <>
            {/* Vertical Divider */}
            <div className="h-7 w-[1px] bg-[#E3E8EF] shrink-0" />

            {/* Main Service Switcher Tabs */}
            <nav
              className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-[10px]"
              aria-label="AMA Workspaces"
            >
              {/* 1. Estimation Service */}
              <button
                type="button"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[7px] text-[13.5px] font-bold transition-all duration-150 cursor-pointer ${
                  isEstimation
                    ? "bg-[#0B1F4D] text-white shadow-[0_1px_3px_rgba(11,31,77,0.24)]"
                    : "text-[#475467] hover:text-[#0B1F4D] hover:bg-white/80"
                }`}
                onClick={() => navigate("/home")}
              >
                <Layers3 size={16} strokeWidth={2} className="shrink-0" />
                <span className="truncate">Estimation Service</span>
              </button>

              {/* 2. AMA Stock */}
              <button
                type="button"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[7px] text-[13.5px] font-bold transition-all duration-150 cursor-pointer ${
                  isStock
                    ? "bg-[#0B1F4D] text-white shadow-[0_1px_3px_rgba(11,31,77,0.24)]"
                    : "text-[#475467] hover:text-[#0B1F4D] hover:bg-white/80"
                }`}
                onClick={() => {
                  setActiveDatabaseId("prices");
                  navigate("/stock");
                }}
              >
                <Warehouse size={16} strokeWidth={2} className="shrink-0" />
                <span className="truncate">AMA Stock</span>
              </button>

              {/* 3. Projects Under Execution */}
              <button
                type="button"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[7px] text-[13.5px] font-bold transition-all duration-150 cursor-pointer ${
                  isExecution
                    ? "bg-[#0B1F4D] text-white shadow-[0_1px_3px_rgba(11,31,77,0.24)]"
                    : "text-[#475467] hover:text-[#0B1F4D] hover:bg-white/80"
                }`}
                onClick={() => navigate("/execution")}
              >
                <FolderKanban size={16} strokeWidth={2} className="shrink-0" />
                <span className="truncate">Projects Under Execution</span>
              </button>
            </nav>
          </>
        )}
      </div>

      {/* Right: Sub-controls (e.g. Database systems) & Profile Menu */}
      <div className="flex items-center gap-4 shrink-0">
        {(isDatabase || isStock) && (
          <div className="flex items-center gap-2 max-lg:hidden">
            <button
              type="button"
              className={`flex items-center gap-1.5 min-h-[32px] px-3 border rounded-md text-xs font-extrabold transition-colors duration-150 cursor-pointer ${
                location.pathname === "/database/soleal" || activeDatabaseId === "prices"
                  ? "border-[#287e78] bg-[#dff1ee] text-[#145752]"
                  : "border-[#a9cfca] bg-white text-[#1e6f6b] hover:border-[#287e78] hover:bg-[#f0f9f7]"
              }`}
              onClick={() => {
                setActiveDatabaseId("prices");
                navigate("/database/soleal");
              }}
            >
              Soleal Database
            </button>
            {companyDatabases.map((database) => (
              <button
                key={database.id}
                type="button"
                className={`flex items-center gap-1.5 min-h-[32px] px-3 border rounded-md text-xs font-extrabold transition-colors duration-150 cursor-pointer ${
                  activeDatabaseId === database.id
                    ? "border-[#287e78] bg-[#dff1ee] text-[#145752]"
                    : "border-[#a9cfca] bg-white text-[#1e6f6b] hover:border-[#287e78] hover:bg-[#f0f9f7]"
                }`}
                onClick={() => {
                  setActiveDatabaseId(database.id);
                  navigate(`/database/${database.id}`);
                }}
              >
                {database.name} Database
              </button>
            ))}
            {isDatabase && (
              <button
                type="button"
                className="flex items-center gap-1.5 min-h-[32px] px-3 border border-dashed border-[#a9cfca] rounded-md text-xs font-extrabold text-[#497578] hover:border-[#287e78] hover:bg-[#f0f9f7] hover:text-[#176c68] transition-colors duration-150 cursor-pointer"
                onClick={openNewCompanyDatabase}
              >
                <Icon name="plus" size={14} /> Add other system
              </button>
            )}
          </div>
        )}
        <ProfileMenu />
      </div>
    </header>
  );
}
