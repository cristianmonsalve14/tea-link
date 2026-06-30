import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getRole, isAuthenticated, clearSession } from "../utils/auth";

export function SuperadminRoute({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) {
    clearSession();
    return <Navigate to="/login" replace />;
  }
  if (getRole() !== "SUPERADMIN") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
