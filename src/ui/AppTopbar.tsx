import type { CompanyDatabase, Screen } from "../domain/types";
import { Icon } from "../design-system/Icon";
import { ProfileMenu } from "../modules/auth/ui/ProfileMenu";

export type AppTopbarProps = {
  screen: Screen;
  activeDatabaseId: string;
  setActiveDatabaseId: (id: string) => void;
  companyDatabases: CompanyDatabase[];
  openNewCompanyDatabase: () => void;
};

export function AppTopbar({
  screen,
  activeDatabaseId,
  setActiveDatabaseId,
  companyDatabases,
  openNewCompanyDatabase,
}: AppTopbarProps) {
  return (
    <header className="h-[69px] flex items-center justify-between px-12 border-b border-[#e0e8e9] bg-white sticky top-0 z-20">
      {screen === "database" || screen === "stock" ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`flex items-center gap-1.5 min-h-[32px] px-3 border rounded-md text-xs font-extrabold transition-colors duration-150 ${
              activeDatabaseId === "prices"
                ? "border-[#287e78] bg-[#dff1ee] text-[#145752]"
                : "border-[#a9cfca] bg-white text-[#1e6f6b] hover:border-[#287e78] hover:bg-[#f0f9f7]"
            }`}
            onClick={() => setActiveDatabaseId("prices")}
          >
            Soleal Database
          </button>
          {companyDatabases.map((database) => (
            <button
              key={database.id}
              type="button"
              className={`flex items-center gap-1.5 min-h-[32px] px-3 border rounded-md text-xs font-extrabold transition-colors duration-150 ${
                activeDatabaseId === database.id
                  ? "border-[#287e78] bg-[#dff1ee] text-[#145752]"
                  : "border-[#a9cfca] bg-white text-[#1e6f6b] hover:border-[#287e78] hover:bg-[#f0f9f7]"
              }`}
              onClick={() => setActiveDatabaseId(database.id)}
            >
              {database.name} Database
            </button>
          ))}
          {screen === "database" && (
            <button
              type="button"
              className="flex items-center gap-1.5 min-h-[32px] px-3 border border-dashed border-[#a9cfca] rounded-md text-xs font-extrabold text-[#497578] hover:border-[#287e78] hover:bg-[#f0f9f7] hover:text-[#176c68] transition-colors duration-150"
              onClick={openNewCompanyDatabase}
            >
              <Icon name="plus" size={14} /> Add other system
            </button>
          )}
        </div>
      ) : (
        <div className="text-[#5d7377] text-sm font-semibold">
          {screen === "canvas" ? "Project canvas" : screen[0].toUpperCase() + screen.slice(1)}
        </div>
      )}
      <ProfileMenu />
    </header>
  );
}
