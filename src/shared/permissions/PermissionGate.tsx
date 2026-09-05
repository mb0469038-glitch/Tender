import type { ReactNode } from "react";
// Documented exception: shared/ is allowed to depend on modules/auth because
// auth is foundational infrastructure (permission checks), not a peer feature
// module. See docs/architecture/OVERVIEW.md.
import { useSession } from "../../modules/auth/ui/SessionContext";

export const hasPermission = (permissions: Set<string>, permissionId: string) => permissions.has(permissionId);

export function useHasPermission(permissionId: string): boolean {
  const { permissions } = useSession();
  return hasPermission(permissions, permissionId);
}

export function PermissionGate({
  permission,
  fallback = null,
  children,
}: {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const allowed = useHasPermission(permission);
  return <>{allowed ? children : fallback}</>;
}
