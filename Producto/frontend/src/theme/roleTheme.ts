/**
 * Tokens visuales por rol — clases completas para compatibilidad con Tailwind JIT.
 * Paleta base TEA: primary (#4A90E2), secondary (#7ED321).
 */

export type RoleKey =
  | "SUPERADMIN"
  | "ADMINISTRADOR"
  | "EDUCADOR"
  | "FAMILIA"
  | "PROFESIONAL"
  | "MEDICO"
  | "DEFAULT";

export interface RoleTheme {
  id: RoleKey;
  label: string;
  subtitle: string;
  headerBar: string;
  headerText: string;
  badge: string;
  logoIcon: string;
  pageBg: string;
  accentText: string;
  accentTextStrong: string;
  accentBorder: string;
  accentBgSubtle: string;
  accentBgMuted: string;
  accentBgEmpty: string;
  accentBorderDashed: string;
  btnPrimary: string;
  btnPrimaryHover: string;
  btnOutline: string;
  tabActive: string;
  tabInactive: string;
  tableHead: string;
  tableRowHover: string;
  link: string;
  inputFocus: string;
  sidebarBg: string;
  sidebarBorder: string;
  sidebarItemActive: string;
  sidebarItemInactive: string;
  sidebarIconWrapActive: string;
  sidebarIconWrapInactive: string;
  sidebarIndicator: string;
}

const baseInputFocus =
  "focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors";

export const ROLE_THEMES: Record<RoleKey, RoleTheme> = {
  SUPERADMIN: {
    id: "SUPERADMIN",
    label: "Superadministrador",
    subtitle: "Gestión global del sistema",
    headerBar: "bg-linear-to-r from-indigo-700 to-indigo-600",
    headerText: "text-white",
    badge: "bg-indigo-500/30 text-indigo-50 border border-indigo-300/40",
    logoIcon: "bg-white text-indigo-600",
    pageBg: "bg-neutral-gray-light",
    accentText: "text-indigo-700",
    accentTextStrong: "text-indigo-900",
    accentBorder: "border-indigo-100",
    accentBgSubtle: "bg-indigo-50",
    accentBgMuted: "bg-indigo-50/80",
    accentBgEmpty: "bg-indigo-50",
    accentBorderDashed: "border-indigo-200",
    btnPrimary: "bg-indigo-600 text-white shadow-sm",
    btnPrimaryHover: "hover:bg-indigo-700",
    btnOutline: "border border-indigo-200 text-indigo-700 hover:bg-indigo-50",
    tabActive: "border-indigo-600 text-indigo-700",
    tabInactive: "border-transparent text-neutral-gray-medium hover:text-indigo-600",
    tableHead: "bg-indigo-50 text-indigo-900",
    tableRowHover: "hover:bg-indigo-50/60",
    link: "text-indigo-600 hover:text-indigo-800",
    inputFocus:
      "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors",
    sidebarBg: "bg-linear-to-b from-indigo-50 via-white to-white",
    sidebarBorder: "border-indigo-100",
    sidebarItemActive: "bg-indigo-600 text-white shadow-md",
    sidebarItemInactive: "text-indigo-800 hover:bg-indigo-100",
    sidebarIconWrapActive: "bg-white text-indigo-600",
    sidebarIconWrapInactive: "bg-indigo-100 text-indigo-700 group-hover:bg-white group-hover:text-indigo-600",
    sidebarIndicator: "bg-indigo-600"
  },
  ADMINISTRADOR: {
    id: "ADMINISTRADOR",
    label: "Administrador",
    subtitle: "Gestión institucional",
    headerBar: "bg-linear-to-r from-primary-dark to-primary",
    headerText: "text-white",
    badge: "bg-white/20 text-white border border-white/30",
    logoIcon: "bg-white text-primary",
    pageBg: "bg-neutral-gray-light",
    accentText: "text-primary-dark",
    accentTextStrong: "text-primary-dark",
    accentBorder: "border-primary/20",
    accentBgSubtle: "bg-primary/5",
    accentBgMuted: "bg-primary/10",
    accentBgEmpty: "bg-primary/5",
    accentBorderDashed: "border-primary/30",
    btnPrimary: "bg-primary text-white shadow-sm",
    btnPrimaryHover: "hover:bg-primary-dark",
    btnOutline: "border border-primary/30 text-primary-dark hover:bg-primary/5",
    tabActive: "border-primary text-primary-dark",
    tabInactive: "border-transparent text-neutral-gray-medium hover:text-primary",
    tableHead: "bg-primary/10 text-primary-dark",
    tableRowHover: "hover:bg-primary/5",
    link: "text-primary hover:text-primary-dark",
    inputFocus: baseInputFocus,
    sidebarBg: "bg-white",
    sidebarBorder: "border-primary/15",
    sidebarItemActive: "bg-primary text-white shadow",
    sidebarItemInactive: "text-primary-dark hover:bg-primary/10",
    sidebarIconWrapActive: "bg-white text-primary",
    sidebarIconWrapInactive: "bg-primary/15 text-primary group-hover:bg-white",
    sidebarIndicator: "bg-primary"
  },
  EDUCADOR: {
    id: "EDUCADOR",
    label: "Educador",
    subtitle: "Observaciones y reportes",
    headerBar: "bg-linear-to-r from-secondary-dark to-secondary",
    headerText: "text-white",
    badge: "bg-white/25 text-white border border-white/35",
    logoIcon: "bg-white text-secondary-dark",
    pageBg: "bg-neutral-gray-light",
    accentText: "text-secondary-dark",
    accentTextStrong: "text-[#4a7c16]",
    accentBorder: "border-secondary/25",
    accentBgSubtle: "bg-secondary/10",
    accentBgMuted: "bg-secondary/15",
    accentBgEmpty: "bg-secondary/10",
    accentBorderDashed: "border-secondary/35",
    btnPrimary: "bg-secondary text-white shadow-sm",
    btnPrimaryHover: "hover:bg-secondary-dark",
    btnOutline: "border border-secondary/40 text-secondary-dark hover:bg-secondary/10",
    tabActive: "border-secondary-dark text-secondary-dark",
    tabInactive: "border-transparent text-neutral-gray-medium hover:text-secondary-dark",
    tableHead: "bg-secondary/15 text-secondary-dark",
    tableRowHover: "hover:bg-secondary/10",
    link: "text-secondary-dark hover:underline",
    inputFocus:
      "focus:border-secondary focus:ring-2 focus:ring-secondary/25 outline-none transition-colors",
    sidebarBg: "bg-white",
    sidebarBorder: "border-secondary/20",
    sidebarItemActive: "bg-secondary text-white shadow",
    sidebarItemInactive: "text-secondary-dark hover:bg-secondary/10",
    sidebarIconWrapActive: "bg-white text-secondary-dark",
    sidebarIconWrapInactive: "bg-secondary/15 text-secondary-dark",
    sidebarIndicator: "bg-secondary-dark"
  },
  FAMILIA: {
    id: "FAMILIA",
    label: "Familia",
    subtitle: "Seguimiento del estudiante",
    headerBar: "bg-linear-to-r from-amber-600 to-amber-500",
    headerText: "text-white",
    badge: "bg-white/25 text-white border border-white/35",
    logoIcon: "bg-white text-amber-700",
    pageBg: "bg-neutral-gray-light",
    accentText: "text-amber-800",
    accentTextStrong: "text-amber-900",
    accentBorder: "border-amber-200",
    accentBgSubtle: "bg-amber-50",
    accentBgMuted: "bg-amber-50/90",
    accentBgEmpty: "bg-amber-50",
    accentBorderDashed: "border-amber-300",
    btnPrimary: "bg-amber-600 text-white shadow-sm",
    btnPrimaryHover: "hover:bg-amber-700",
    btnOutline: "border border-amber-300 text-amber-800 hover:bg-amber-50",
    tabActive: "border-amber-600 text-amber-800",
    tabInactive: "border-transparent text-neutral-gray-medium hover:text-amber-700",
    tableHead: "bg-amber-50 text-amber-900",
    tableRowHover: "hover:bg-amber-50/80",
    link: "text-amber-700 hover:text-amber-900",
    inputFocus:
      "focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-colors",
    sidebarBg: "bg-white",
    sidebarBorder: "border-amber-100",
    sidebarItemActive: "bg-amber-600 text-white shadow",
    sidebarItemInactive: "text-amber-800 hover:bg-amber-50",
    sidebarIconWrapActive: "bg-white text-amber-700",
    sidebarIconWrapInactive: "bg-amber-100 text-amber-800",
    sidebarIndicator: "bg-amber-600"
  },
  PROFESIONAL: {
    id: "PROFESIONAL",
    label: "Profesional",
    subtitle: "Apoyo terapéutico",
    headerBar: "bg-linear-to-r from-violet-700 to-violet-600",
    headerText: "text-white",
    badge: "bg-white/25 text-white border border-white/35",
    logoIcon: "bg-white text-violet-700",
    pageBg: "bg-neutral-gray-light",
    accentText: "text-violet-700",
    accentTextStrong: "text-violet-900",
    accentBorder: "border-violet-100",
    accentBgSubtle: "bg-violet-50",
    accentBgMuted: "bg-violet-50/90",
    accentBgEmpty: "bg-violet-50",
    accentBorderDashed: "border-violet-200",
    btnPrimary: "bg-violet-600 text-white shadow-sm",
    btnPrimaryHover: "hover:bg-violet-700",
    btnOutline: "border border-violet-200 text-violet-700 hover:bg-violet-50",
    tabActive: "border-violet-600 text-violet-800",
    tabInactive: "border-transparent text-neutral-gray-medium hover:text-violet-600",
    tableHead: "bg-violet-50 text-violet-900",
    tableRowHover: "hover:bg-violet-50/80",
    link: "text-violet-600 hover:text-violet-800",
    inputFocus:
      "focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-colors",
    sidebarBg: "bg-white",
    sidebarBorder: "border-violet-100",
    sidebarItemActive: "bg-violet-600 text-white shadow",
    sidebarItemInactive: "text-violet-800 hover:bg-violet-50",
    sidebarIconWrapActive: "bg-white text-violet-700",
    sidebarIconWrapInactive: "bg-violet-100 text-violet-800",
    sidebarIndicator: "bg-violet-600"
  },
  MEDICO: {
    id: "MEDICO",
    label: "Médico",
    subtitle: "Registro clínico",
    headerBar: "bg-linear-to-r from-teal-700 to-teal-600",
    headerText: "text-white",
    badge: "bg-white/25 text-white border border-white/35",
    logoIcon: "bg-white text-teal-700",
    pageBg: "bg-neutral-gray-light",
    accentText: "text-teal-700",
    accentTextStrong: "text-teal-900",
    accentBorder: "border-teal-100",
    accentBgSubtle: "bg-teal-50",
    accentBgMuted: "bg-teal-50/90",
    accentBgEmpty: "bg-teal-50",
    accentBorderDashed: "border-teal-200",
    btnPrimary: "bg-teal-600 text-white shadow-sm",
    btnPrimaryHover: "hover:bg-teal-700",
    btnOutline: "border border-teal-200 text-teal-800 hover:bg-teal-50",
    tabActive: "border-teal-600 text-teal-800",
    tabInactive: "border-transparent text-neutral-gray-medium hover:text-teal-600",
    tableHead: "bg-teal-50 text-teal-900",
    tableRowHover: "hover:bg-teal-50/80",
    link: "text-teal-600 hover:text-teal-800",
    inputFocus:
      "focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-colors",
    sidebarBg: "bg-white",
    sidebarBorder: "border-teal-100",
    sidebarItemActive: "bg-teal-600 text-white shadow",
    sidebarItemInactive: "text-teal-800 hover:bg-teal-50",
    sidebarIconWrapActive: "bg-white text-teal-700",
    sidebarIconWrapInactive: "bg-teal-100 text-teal-800",
    sidebarIndicator: "bg-teal-600"
  },
  DEFAULT: {
    id: "DEFAULT",
    label: "Usuario",
    subtitle: "TEA Link",
    headerBar: "bg-linear-to-r from-primary-dark to-primary",
    headerText: "text-white",
    badge: "bg-white/20 text-white border border-white/30",
    logoIcon: "bg-white text-primary",
    pageBg: "bg-neutral-gray-light",
    accentText: "text-primary-dark",
    accentTextStrong: "text-primary-dark",
    accentBorder: "border-primary/20",
    accentBgSubtle: "bg-primary/5",
    accentBgMuted: "bg-primary/10",
    accentBgEmpty: "bg-primary/5",
    accentBorderDashed: "border-primary/30",
    btnPrimary: "bg-primary text-white shadow-sm",
    btnPrimaryHover: "hover:bg-primary-dark",
    btnOutline: "border border-primary/30 text-primary-dark hover:bg-primary/5",
    tabActive: "border-primary text-primary-dark",
    tabInactive: "border-transparent text-neutral-gray-medium hover:text-primary",
    tableHead: "bg-primary/10 text-primary-dark",
    tableRowHover: "hover:bg-primary/5",
    link: "text-primary hover:text-primary-dark",
    inputFocus: baseInputFocus,
    sidebarBg: "bg-white",
    sidebarBorder: "border-gray-100",
    sidebarItemActive: "bg-primary text-white",
    sidebarItemInactive: "text-primary-dark hover:bg-primary/10",
    sidebarIconWrapActive: "bg-white text-primary",
    sidebarIconWrapInactive: "bg-primary/15 text-primary",
    sidebarIndicator: "bg-primary"
  }
};

/** Variantes de sección dentro del panel admin (perfiles vs equipo) */
export type SectionVariant = "default" | "team" | "reports" | "institutions";

export function getSectionTheme(variant: SectionVariant): Pick<
  RoleTheme,
  | "accentText"
  | "accentBorder"
  | "accentBgSubtle"
  | "accentBgEmpty"
  | "accentBorderDashed"
  | "btnPrimary"
  | "btnPrimaryHover"
  | "tableHead"
  | "tableRowHover"
> {
  switch (variant) {
    case "team":
      return {
        accentText: "text-secondary-dark",
        accentBorder: "border-secondary/25",
        accentBgSubtle: "bg-secondary/10",
        accentBgEmpty: "bg-secondary/10",
        accentBorderDashed: "border-secondary/35",
        btnPrimary: "bg-secondary text-white shadow-sm",
        btnPrimaryHover: "hover:bg-secondary-dark",
        tableHead: "bg-secondary/15 text-secondary-dark",
        tableRowHover: "hover:bg-secondary/10"
      };
    case "reports":
      return {
        accentText: "text-violet-700",
        accentBorder: "border-violet-100",
        accentBgSubtle: "bg-violet-50",
        accentBgEmpty: "bg-violet-50",
        accentBorderDashed: "border-violet-200",
        btnPrimary: "bg-violet-600 text-white shadow-sm",
        btnPrimaryHover: "hover:bg-violet-700",
        tableHead: "bg-violet-50 text-violet-900",
        tableRowHover: "hover:bg-violet-50/80"
      };
    case "institutions":
      return {
        accentText: "text-secondary-dark",
        accentBorder: "border-secondary/25",
        accentBgSubtle: "bg-secondary/10",
        accentBgEmpty: "bg-secondary/10",
        accentBorderDashed: "border-secondary/35",
        btnPrimary: "bg-secondary text-white shadow-sm",
        btnPrimaryHover: "hover:bg-secondary-dark",
        tableHead: "bg-secondary/15 text-secondary-dark",
        tableRowHover: "hover:bg-secondary/10"
      };
    default:
      return {
        accentText: ROLE_THEMES.ADMINISTRADOR.accentText,
        accentBorder: ROLE_THEMES.ADMINISTRADOR.accentBorder,
        accentBgSubtle: ROLE_THEMES.ADMINISTRADOR.accentBgSubtle,
        accentBgEmpty: ROLE_THEMES.ADMINISTRADOR.accentBgEmpty,
        accentBorderDashed: ROLE_THEMES.ADMINISTRADOR.accentBorderDashed,
        btnPrimary: ROLE_THEMES.ADMINISTRADOR.btnPrimary,
        btnPrimaryHover: ROLE_THEMES.ADMINISTRADOR.btnPrimaryHover,
        tableHead: ROLE_THEMES.ADMINISTRADOR.tableHead,
        tableRowHover: ROLE_THEMES.ADMINISTRADOR.tableRowHover
      };
  }
}

export function resolveRoleTheme(rol: string | null | undefined): RoleTheme {
  if (!rol) return ROLE_THEMES.DEFAULT;
  const key = rol.toUpperCase() as RoleKey;
  return ROLE_THEMES[key] ?? ROLE_THEMES.DEFAULT;
}

export const ROL_PANEL_TITULO: Record<string, string> = {
  EDUCADOR: "Panel de Educador",
  FAMILIA: "Panel de Familia",
  PROFESIONAL: "Panel de Profesional",
  MEDICO: "Panel de Médico",
  ADMINISTRADOR: "Panel de Administrador",
  SUPERADMIN: "Panel de Superadministrador"
};
