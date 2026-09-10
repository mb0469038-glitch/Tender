import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authService } from "../application/authService";
import type { SessionInfo } from "../domain/entities";

type SessionContextValue = {
  isLoading: boolean;
  user: SessionInfo | null;
  permissions: Set<string>;
  login: (username: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SessionInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    authService
      .getCurrentSession()
      .then((session) => {
        if (!cancelled) {
          setUser(session);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Could not retrieve current session:", err);
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await authService.login(username, password);
    if (!result.ok) return { ok: false as const, error: result.error };
    setUser(result.value);
    return { ok: true as const };
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    setUser(await authService.getCurrentSession());
  }, []);

  const permissions = useMemo(() => new Set(user?.permissions ?? []), [user]);

  const value = useMemo(
    () => ({ isLoading, user, permissions, login, logout, refresh }),
    [isLoading, user, permissions, login, logout, refresh],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within a SessionProvider.");
  return context;
}
