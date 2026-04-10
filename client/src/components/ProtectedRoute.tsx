import { usePermissions } from "@/hooks/usePermissions";
import type { Permission } from "@shared/roles";

interface ProtectedRouteProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wraps a page/component and only renders it if the user has the required permission.
 * Shows a "no access" message otherwise.
 */
export default function ProtectedRoute({ permission, children, fallback }: ProtectedRouteProps) {
  const { can, roleLabel } = usePermissions();

  if (!can(permission)) {
    return fallback ?? (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3 max-w-md">
          <div className="text-4xl">🔒</div>
          <h2 className="text-lg font-semibold text-foreground">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">
            Your current role ({roleLabel}) does not have access to this page.
            Contact an administrator if you need access.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
