import { ReactNode } from "react";
import { UserRole } from "../../models/UserRole";
import { useAuth } from "../../context/AuthContext";
import { Navigate, useLocation } from "react-router";


interface RoleGuardProps {
  requiredRoles: UserRole[];
  children: ReactNode;
  redirectTo: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ requiredRoles, children, redirectTo }) => {
  const { userRoles, isAuthenticated } = useAuth();
  const location = useLocation();

  // If user is authenticated and has required roles, show content
  if (isAuthenticated && requiredRoles.some(role => userRoles.includes(role))) {
    return <>{children}</>;
  }

  // If user is authenticated but doesn't have required roles, don't show anything
  // This prevents infinite redirects when users don't have the necessary permissions
  if (isAuthenticated) {
    return null;
  }

  // If user is not authenticated, redirect to login
  const redirectUrl = `${redirectTo}?redirectTo=${encodeURIComponent(location.pathname)}`;
  return <Navigate to={redirectUrl} state={{ from: location }} />;
};
