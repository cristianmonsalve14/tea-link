import { FaChalkboardTeacher } from "react-icons/fa";
import { ROL_PANEL_CONFIG } from "../config/rolPanelConfig";
import { RoleHero } from "./RoleHero";
import { ObservacionesRolDashboard } from "./ObservacionesRolDashboard";

export function EducadorDashboard() {
  const config = ROL_PANEL_CONFIG.EDUCADOR;
  return (
    <>
      <RoleHero config={config} icon={FaChalkboardTeacher} />
      <ObservacionesRolDashboard rol="EDUCADOR" />
    </>
  );
}
