import React from "react";
import { getRole } from "../utils/auth";
import { RoleThemeProvider } from "../context/RoleThemeContext";
import { AppShell } from "../components/layout/AppShell";
import { AdminInstitucionDashboard } from "../components/AdminInstitucionDashboard";
import { FamiliaAdminSinPanel } from "../components/FamiliaAdminSinPanel";
import { EducadorDashboard } from "../components/EducadorDashboard";
import { FamiliaDashboard } from "../components/FamiliaDashboard";
import { ProfesionalDashboard } from "../components/ProfesionalDashboard";
import { MedicoDashboard } from "../components/MedicoDashboard";
import { ROL_PANEL_TITULO } from "../theme/roleTheme";
import { Card } from "../components/ui/Card";

const Dashboard: React.FC = () => {
  const rol = getRole();
  const institucion = localStorage.getItem("institucion");
  const panelTitle = (rol && ROL_PANEL_TITULO[rol]) || "Panel de usuario";

  let contenido: React.ReactNode;
  switch (rol) {
    case "ADMINISTRADOR":
      contenido =
        localStorage.getItem("institucion_tipo") === "FAMILIA" ? (
          <FamiliaAdminSinPanel />
        ) : (
          <AdminInstitucionDashboard institucionNombre={institucion} />
        );
      break;
    case "EDUCADOR":
      contenido = <EducadorDashboard />;
      break;
    case "FAMILIA":
      contenido = <FamiliaDashboard />;
      break;
    case "PROFESIONAL":
      contenido = <ProfesionalDashboard />;
      break;
    case "MEDICO":
      contenido = <MedicoDashboard />;
      break;
    default:
      contenido = (
        <Card title="Bienvenido">
          <p className="text-lg text-neutral-gray-medium">
            Has iniciado sesión correctamente. Tu rol aún no tiene un panel asignado.
          </p>
        </Card>
      );
  }

  return (
    <RoleThemeProvider rol={rol}>
      <AppShell title={panelTitle} institucionNombre={institucion}>
        {contenido}
      </AppShell>
    </RoleThemeProvider>
  );
};

export default Dashboard;
