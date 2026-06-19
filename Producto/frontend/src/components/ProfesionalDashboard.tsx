import { FaHandsHelping } from "react-icons/fa";
import { ROL_PANEL_CONFIG } from "../config/rolPanelConfig";
import { RoleHero } from "./RoleHero";
import { ObservacionesRolDashboard } from "./ObservacionesRolDashboard";

export function ProfesionalDashboard() {
  const config = ROL_PANEL_CONFIG.PROFESIONAL;
  return (
    <>
      <RoleHero config={config} icon={FaHandsHelping} />
      <ObservacionesRolDashboard rol="PROFESIONAL" />
    </>
  );
}
