import { Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import { getRole, syncSessionFromToken } from "../utils/auth";

export function DashboardByRole() {
  syncSessionFromToken();
  const rol = getRole();

  if (rol === "SUPERADMIN") {
    return <Navigate to="/superadmin" replace />;
  }

  return <Dashboard />;
}
