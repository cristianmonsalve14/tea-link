import { FaHome } from "react-icons/fa";
import { ROL_PANEL_CONFIG } from "../config/rolPanelConfig";
import { RoleHero } from "./RoleHero";
import { ObservacionesRolDashboard } from "./ObservacionesRolDashboard";

export function FamiliaDashboard() {
  const config = ROL_PANEL_CONFIG.FAMILIA;
  return (
    <>
      <RoleHero config={config} icon={FaHome} />
      <ObservacionesRolDashboard rol="FAMILIA" />
    </>
  );
}
