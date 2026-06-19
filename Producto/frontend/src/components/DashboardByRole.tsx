import Dashboard from "../pages/Dashboard";
import DashboardSuperadmin from "../pages/DashboardSuperadmin";
import { ErrorBoundary } from "./ErrorBoundary";
import { getRole, syncSessionFromToken } from "../utils/auth";
import { RoleThemeProvider } from "../context/RoleThemeContext";

export function DashboardByRole() {
  syncSessionFromToken();
  const rol = getRole();

  if (rol === "SUPERADMIN") {
    return (
      <RoleThemeProvider rol="SUPERADMIN">
        <ErrorBoundary>
          <DashboardSuperadmin />
        </ErrorBoundary>
      </RoleThemeProvider>
    );
  }

  return <Dashboard />;
}
