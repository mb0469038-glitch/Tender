import { useLocation, useNavigate } from "react-router-dom";
import type { CompanyDatabase, Screen } from "../domain/types";
import { Icon } from "../design-system/Icon";
import { ProfileMenu } from "../modules/auth/ui/ProfileMenu";
import { ArrowLeft } from "lucide-react";

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

  const isHome = location.pathname === "/home" || location.pathname === "/";
  const isStock = location.pathname.startsWith("/stock");
  const isDatabase = location.pathname.startsWith("/database");

  return (
    <header className="h-[69px] flex items-center justify-between px-6 lg:px-8 border-b border-[#E3E8EF] bg-white sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Left: Company Logo + Divider + Go Back to Home Button */}
      <div className="flex items-center gap-4 sm:gap-6 min-w-0">
        {/* Company Logo */}
        <button
          type="button"
          className="flex items-center gap-2 p-1 border-0 bg-transparent rounded-lg cursor-pointer hover:opacity-85 transition-opacity shrink-0"
          onClick={() => navigate("/home")}
          title="L’Atelier Moderne de l’Aluminium"
          aria-label="AMA Home"
        >
          <img
            src="/brand/atelier-moderne-logo.png"
            alt="L’Atelier Moderne de l’Aluminium"
            className="h-10 w-auto max-w-[130px] object-contain shrink-0"
          />
        </button>

        {/* Go Back to Home Button (Visible whenever not on Home) */}
        {!isHome && (
          <>
            {/* Vertical Divider */}
            <div className="h-7 w-[1px] bg-[#E3E8EF] shrink-0" />

            <button
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] text-[13.5px] font-bold text-[#0B1F4D] bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] transition-all duration-150 cursor-pointer shadow-sm group"
              onClick={() => navigate("/home")}
              title="Return to Home"
            >
              <ArrowLeft size={16} strokeWidth={2.2} className="transition-transform duration-150 group-hover:-translate-x-0.5 text-[#165BAA]" />
              <span>Back to Home</span>
            </button>
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
