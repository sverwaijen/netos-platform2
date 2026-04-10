import { useAuth } from "@/_core/hooks/useAuth";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  migrateRole,
  type Permission,
  type UserRole,
  ROLE_LABELS,
  ROLE_HIERARCHY,
} from "@shared/roles";

/**
 * Hook that provides permission-checking utilities based on the current user's role.
 */
export function usePermissions() {
  const { user } = useAuth();

  const role: UserRole = user?.role
    ? migrateRole(user.role as string)
    : "guest";

  return {
    role,
    roleLabel: ROLE_LABELS[role],
    roleLevel: ROLE_HIERARCHY[role],
    can: (permission: Permission) => hasPermission(role, permission),
    canAll: (permissions: Permission[]) => hasAllPermissions(role, permissions),
    canAny: (permissions: Permission[]) => hasAnyPermission(role, permissions),
    isAdmin: role === "administrator",
    isHost: role === "host",
    isTeamAdmin: role === "teamadmin",
    isMember: role === "member",
    isGuest: role === "guest",
    isAdminOrHost: role === "administrator" || role === "host",
  };
}
