import { useNavigate } from "react-router-dom";
import { useSession } from "./SessionContext";
import { AUTH_PERMISSIONS } from "../domain/permissions";
import { hasPermission } from "../../../shared/permissions/PermissionGate";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import type { ReactNode } from "react";

export function AdminRouteGuard({ children }: { children: ReactNode }) {
  const { user, permissions, isLoading } = useSession();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-[#5e7478] gap-3">
        <div className="w-5 h-5 border-2 border-[#165baa] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Verifying administrator authorization…</span>
      </div>
    );
  }

  // Check if user is an administrator via explicit permission or admin role/username
  const isAdmin =
    Boolean(user) &&
    (hasPermission(permissions, AUTH_PERMISSIONS.VIEW_ADMIN) ||
      user?.roleIds?.includes("admin") ||
      user?.username === "admin");

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-140px)] p-6 bg-[#F8FAFC]">
        <div className="max-w-md w-full p-8 bg-white border border-[#E3E8EF] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] grid place-items-center text-[#DC2626]">
            <ShieldAlert size={28} strokeWidth={1.8} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 rounded-full bg-[#FEF2F2] text-[#DC2626] text-[11px] font-bold uppercase tracking-wider">
            <Lock size={12} strokeWidth={2} /> 403 Forbidden
          </div>

          <h1 className="text-xl font-bold text-[#0B1F4D] mb-2">Administrator Access Required</h1>
          <p className="text-sm text-[#667085] leading-relaxed mb-6">
            The User &amp; Role Management section is restricted to authorized system administrators only. Your current role ({user?.username || "Guest"}) does not have administrative privileges.
          </p>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0B1F4D] text-white text-sm font-bold rounded-lg hover:bg-[#165BAA] transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} strokeWidth={2} /> Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
