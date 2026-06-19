import { Navigate, useSearchParams } from "react-router-dom";
import { getRole } from "../utils/auth";
import { RoleThemeProvider } from "../context/RoleThemeContext";
import { AppShell } from "../components/layout/AppShell";
import { NuevaObservacionForm } from "../components/observaciones/NuevaObservacionForm";
import { getRolPanelConfig } from "../config/rolPanelConfig";
import { ROLES_OBSERVACION } from "../config/observacionUi";
import { ROL_PANEL_TITULO } from "../theme/roleTheme";

export default function NuevaObservacionPage() {
  const rol = getRole();
  const [searchParams] = useSearchParams();
  const perfilId = searchParams.get("perfil") ?? undefined;
  const institucion = localStorage.getItem("institucion");

  if (!rol || !ROLES_OBSERVACION.includes(rol as (typeof ROLES_OBSERVACION)[number])) {
    return <Navigate to="/dashboard" replace />;
  }

  const config = getRolPanelConfig(rol);
  const panelTitle = ROL_PANEL_TITULO[rol] ?? "Panel";

  return (
    <RoleThemeProvider rol={rol}>
      <AppShell
        title={panelTitle}
        subtitle={config.modalTitle}
        institucionNombre={institucion}
        backTo="/dashboard"
        backLabel="Volver al panel"
      >
        <NuevaObservacionForm perfilIdInicial={perfilId} />
      </AppShell>
    </RoleThemeProvider>
  );
}
