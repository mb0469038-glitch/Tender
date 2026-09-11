import { useLocation, useNavigate, useParams } from "react-router-dom";
import { UsersPage } from "./UsersPage";
import { RolesPage } from "./RolesPage";
import { PermissionsCatalogView } from "./PermissionsCatalogView";
import { Users, ShieldCheck, KeyRound, ArrowLeft } from "lucide-react";
import "../auth.css";

export type AdminTab = "users" | "roles" | "permissions";

export function AdminBackofficeLayout({ onClose }: { onClose?: () => void }) {
  const { tab: paramTab } = useParams<{ tab?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab: AdminTab =
    paramTab === "roles" || location.pathname.includes("/roles")
      ? "roles"
      : paramTab === "permissions" || location.pathname.includes("/permissions")
        ? "permissions"
        : "users";

  const handleTabChange = (nextTab: AdminTab) => {
    navigate(`/admin/${nextTab}`);
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="admin-backoffice bg-white min-h-[calc(100vh-69px)] flex">
      <nav className="admin-backoffice-nav w-[220px] p-4 border-r border-[#E3E8EF] bg-[#F8FAFC] flex flex-col gap-1.5 select-none">
        <div className="px-2 py-1 mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#165BAA]">
            Administration
          </span>
          <h2 className="text-sm font-bold text-[#0B1F4D] m-0">Access Control</h2>
        </div>

        <button
          type="button"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer border-0 ${
            currentTab === "users"
              ? "bg-[#0B1F4D] text-white shadow-sm"
              : "bg-transparent text-[#475467] hover:bg-[#EDF2F7] hover:text-[#0B1F4D]"
          }`}
          onClick={() => handleTabChange("users")}
        >
          <Users size={16} strokeWidth={1.8} />
          <span>Users</span>
        </button>

        <button
          type="button"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer border-0 ${
            currentTab === "roles"
              ? "bg-[#0B1F4D] text-white shadow-sm"
              : "bg-transparent text-[#475467] hover:bg-[#EDF2F7] hover:text-[#0B1F4D]"
          }`}
          onClick={() => handleTabChange("roles")}
        >
          <ShieldCheck size={16} strokeWidth={1.8} />
          <span>Roles</span>
        </button>

        <button
          type="button"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer border-0 ${
            currentTab === "permissions"
              ? "bg-[#0B1F4D] text-white shadow-sm"
              : "bg-transparent text-[#475467] hover:bg-[#EDF2F7] hover:text-[#0B1F4D]"
          }`}
          onClick={() => handleTabChange("permissions")}
        >
          <KeyRound size={16} strokeWidth={1.8} />
          <span>Permissions</span>
        </button>

        <div className="flex-1" />

        <div className="pt-3 border-t border-[#E3E8EF]">
          <button
            type="button"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px] font-semibold text-[#475467] hover:bg-[#EDF2F7] hover:text-[#0B1F4D] transition-colors cursor-pointer border-0 bg-transparent"
            onClick={handleBack}
          >
            <ArrowLeft size={16} strokeWidth={1.8} />
            <span>← Back to app</span>
          </button>
        </div>
      </nav>

      <div className="admin-backoffice-content flex-1 p-6 overflow-y-auto">
        {currentTab === "users" && <UsersPage />}
        {currentTab === "roles" && <RolesPage />}
        {currentTab === "permissions" && <PermissionsCatalogView />}
      </div>
    </div>
  );
}
