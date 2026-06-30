import { Navigate, useParams } from "react-router-dom";
import { getRole } from "../utils/auth";
import { RoleThemeProvider } from "../context/RoleThemeContext";
import { AppShell } from "../components/layout/AppShell";
import { PerfilDetalleContent } from "../components/perfiles/PerfilDetalleContent";
import { ROL_PANEL_TITULO, type RoleKey } from "../theme/roleTheme";

const ROLES_FICHA: RoleKey[] = ["ADMINISTRADOR", "MEDICO", "PROFESIONAL", "EDUCADOR"];

export default function PerfilDetallePage() {
  const rol = getRole() as RoleKey | null;
  const { id } = useParams<{ id: string }>();
  const perfilId = Number(id);
  const institucion = localStorage.getItem("institucion");
  const tipoInstitucion = localStorage.getItem("institucion_tipo") ?? "";

  if (!rol || !ROLES_FICHA.includes(rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!id || !Number.isFinite(perfilId) || perfilId <= 0) {
    return <Navigate to="/dashboard" replace />;
  }

  const panelTitle = ROL_PANEL_TITULO[rol] ?? "Panel";
  const subtitle =
    rol === "ADMINISTRADOR" ? "Ficha del perfil" : "Ficha del paciente — solo lectura";

  return (
    <RoleThemeProvider rol={rol}>
      <AppShell
        title={panelTitle}
        subtitle={subtitle}
        institucionNombre={institucion}
        backTo="/dashboard"
        backLabel="Volver al panel"
      >
        <PerfilDetalleContent perfilId={perfilId} tipoInstitucion={tipoInstitucion} />
      </AppShell>
    </RoleThemeProvider>
  );
}
