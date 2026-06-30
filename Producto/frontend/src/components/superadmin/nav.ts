import {
  FaChartBar,
  FaUniversity,
  FaUsers,
  FaShieldAlt,
  FaUserGraduate
} from "react-icons/fa";

export const SUPERADMIN_BASE = "/superadmin";

export const SUPERADMIN_NAV = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: SUPERADMIN_BASE,
    icon: FaChartBar,
    description: "Métricas y actividad global"
  },
  {
    key: "instituciones",
    label: "Instituciones",
    path: `${SUPERADMIN_BASE}/instituciones`,
    icon: FaUniversity,
    description: "Directorio y altas"
  },
  {
    key: "perfiles",
    label: "Registro perfiles",
    path: `${SUPERADMIN_BASE}/perfiles`,
    icon: FaUserGraduate,
    description: "Consulta de perfiles por RUT"
  },
  {
    key: "usuarios",
    label: "Administradores",
    path: `${SUPERADMIN_BASE}/usuarios`,
    icon: FaUsers,
    description: "Gestión de admins institucionales"
  },
  {
    key: "auditoria",
    label: "Auditoría",
    path: `${SUPERADMIN_BASE}/auditoria`,
    icon: FaShieldAlt,
    description: "Trazabilidad administrativa"
  }
] as const;

export type SuperadminNavKey = (typeof SUPERADMIN_NAV)[number]["key"];

export function resolveSuperadminNavKey(pathname: string): SuperadminNavKey {
  if (pathname.startsWith(`${SUPERADMIN_BASE}/instituciones`)) return "instituciones";
  if (pathname.startsWith(`${SUPERADMIN_BASE}/perfiles`)) return "perfiles";
  if (pathname.startsWith(`${SUPERADMIN_BASE}/usuarios`)) return "usuarios";
  if (pathname.startsWith(`${SUPERADMIN_BASE}/auditoria`)) return "auditoria";
  return "dashboard";
}
