import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import {
  isAuthenticated,
  clearSession,
  mustChangePassword
} from "../utils/auth";

interface Props {
  children: ReactNode;
}

/** Solo accesible si hay sesión y aún debe cambiar la contraseña */
export function CambiarPasswordRoute({ children }: Props) {
  if (!isAuthenticated()) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  if (!mustChangePassword()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
