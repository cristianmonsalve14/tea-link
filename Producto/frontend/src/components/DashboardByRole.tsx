import Dashboard from "../pages/Dashboard";
import DashboardSuperadmin from "../pages/DashboardSuperadmin";
import { ErrorBoundary } from "./ErrorBoundary";
import { getRole, syncSessionFromToken } from "../utils/auth";

export function DashboardByRole() {
  syncSessionFromToken();
  const rol = getRole();

  if (rol === "SUPERADMIN") {
    return (
      <ErrorBoundary>
        <DashboardSuperadmin />
      </ErrorBoundary>
    );
  }

  return <Dashboard />;
}
