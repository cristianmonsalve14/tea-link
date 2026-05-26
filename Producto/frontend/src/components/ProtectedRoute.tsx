import { Navigate } from "react-router-dom";
import { isAuthenticated, clearSession } from "../utils/auth";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    clearSession();
    return <Navigate to="/login" replace />;
  }
  return children;
}
