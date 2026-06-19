import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, clearSession, mustChangePassword } from "../utils/auth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();

  if (!isAuthenticated()) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  if (mustChangePassword() && location.pathname !== "/cambiar-contrasena") {
    return <Navigate to="/cambiar-contrasena" replace />;
  }

  return children;
}
