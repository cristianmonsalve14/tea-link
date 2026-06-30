import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import {
  clearSession,
  getRole,
  isAuthenticated,
  mustChangePassword
} from "../utils/auth";

interface Props {
  children: ReactNode;
}

export function FamiliaPerfilRoute({ children }: Props) {
  if (!isAuthenticated()) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  if (mustChangePassword()) {
    return <Navigate to="/cambiar-contrasena" replace />;
  }

  if (getRole() !== "FAMILIA") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
