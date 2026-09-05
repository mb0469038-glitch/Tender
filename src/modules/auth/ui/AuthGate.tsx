import type { ReactNode } from "react";
import { useSession } from "./SessionContext";
import { LoginScreen } from "./LoginScreen";

export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading, user } = useSession();

  if (isLoading) return null;
  if (!user) return <LoginScreen />;
  return <>{children}</>;
}
