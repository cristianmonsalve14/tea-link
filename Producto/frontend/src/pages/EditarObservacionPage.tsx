import { Navigate, useParams } from "react-router-dom";
import { getRole } from "../utils/auth";
import { RoleThemeProvider } from "../context/RoleThemeContext";
import { AppShell } from "../components/layout/AppShell";
import { NuevaObservacionForm } from "../components/observaciones/NuevaObservacionForm";
import { ROLES_OBSERVACION } from "../config/observacionUi";
import { ROL_PANEL_TITULO } from "../theme/roleTheme";

export default function EditarObservacionPage() {
  const rol = getRole();
  const { id } = useParams();
  const observacionId = Number(id);
  const institucion = localStorage.getItem("institucion");

  if (!rol || !ROLES_OBSERVACION.includes(rol as (typeof ROLES_OBSERVACION)[number])) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!id || Number.isNaN(observacionId)) {
    return <Navigate to="/dashboard" replace />;
  }

  const panelTitle = ROL_PANEL_TITULO[rol] ?? "Panel";

  return (
    <RoleThemeProvider rol={rol}>
      <AppShell
        title="Editar observación"
        subtitle={`${panelTitle} · registro #${observacionId}`}
        institucionNombre={institucion}
        backTo="/dashboard"
        backLabel="Volver al panel"
      >
        <NuevaObservacionForm observacionId={observacionId} />
      </AppShell>
    </RoleThemeProvider>
  );
}
