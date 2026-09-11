import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type AdminOverlayContextValue = { openAdmin: () => void };

const AdminOverlayContext = createContext<AdminOverlayContextValue | null>(null);

export function AdminOverlayProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const value = useMemo(() => ({ openAdmin: () => navigate("/admin/users") }), [navigate]);

  return <AdminOverlayContext.Provider value={value}>{children}</AdminOverlayContext.Provider>;
}

export function useAdminOverlay() {
  const context = useContext(AdminOverlayContext);
  if (!context) throw new Error("useAdminOverlay must be used within an AdminOverlayProvider.");
  return context;
}
