import type { ReactNode } from "react";
import { useSession } from "./SessionContext";
import { LoginScreen } from "./LoginScreen";

export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading, user } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-3">
        <div className="w-8 h-8 border-3 border-[#176f6b] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Loading TenderStudio...</p>
      </div>
    );
  }
  if (!user) return <LoginScreen />;
  return <>{children}</>;
}
