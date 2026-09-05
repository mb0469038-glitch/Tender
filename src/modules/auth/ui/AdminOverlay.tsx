import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AdminBackofficeLayout } from "./admin";

type AdminOverlayContextValue = { openAdmin: () => void };

const AdminOverlayContext = createContext<AdminOverlayContextValue | null>(null);

/**
 * Wraps the existing <App/> and swaps it for the admin backoffice full-screen
 * when opened, so App.tsx only needs a single `onOpenAdmin` call site (in the
 * profile menu) rather than owning any admin routing itself.
 */
export function AdminOverlayProvider({ children }: { children: ReactNode }) {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const value = useMemo(() => ({ openAdmin: () => setIsAdminOpen(true) }), []);

  if (isAdminOpen) {
    return <AdminBackofficeLayout onClose={() => setIsAdminOpen(false)} />;
  }
  return <AdminOverlayContext.Provider value={value}>{children}</AdminOverlayContext.Provider>;
}

export function useAdminOverlay() {
  const context = useContext(AdminOverlayContext);
  if (!context) throw new Error("useAdminOverlay must be used within an AdminOverlayProvider.");
  return context;
}
