import { FaStethoscope } from "react-icons/fa";
import { ROL_PANEL_CONFIG } from "../config/rolPanelConfig";
import { RoleHero } from "./RoleHero";
import { ObservacionesRolDashboard } from "./ObservacionesRolDashboard";

export function MedicoDashboard() {
  const config = ROL_PANEL_CONFIG.MEDICO;
  return (
    <>
      <RoleHero config={config} icon={FaStethoscope} />
      <ObservacionesRolDashboard rol="MEDICO" />
    </>
  );
}
