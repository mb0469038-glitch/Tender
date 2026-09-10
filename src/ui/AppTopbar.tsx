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
    <header className="topbar">
      {screen === "database" || screen === "stock" ? (
        <div className="system-top-actions">
          <button
            type="button"
            className={activeDatabaseId === "prices" ? "active" : ""}
            onClick={() => setActiveDatabaseId("prices")}
          >
            Soleal Database
          </button>
          {companyDatabases.map((database) => (
            <button
              key={database.id}
              type="button"
              className={activeDatabaseId === database.id ? "active" : ""}
              onClick={() => setActiveDatabaseId(database.id)}
            >
              {database.name} Database
            </button>
          ))}
          {screen === "database" && (
            <button
              type="button"
              className="add-system-button"
              onClick={openNewCompanyDatabase}
            >
              <Icon name="plus" size={14} /> Add other system
            </button>
          )}
        </div>
      ) : (
        <div className="breadcrumb">
          {screen === "canvas" ? "Project canvas" : screen[0].toUpperCase() + screen.slice(1)}
        </div>
      )}
      <ProfileMenu />
    </header>
  );
}
