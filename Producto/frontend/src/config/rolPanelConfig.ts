/** Configuración de panel operativo por rol (observaciones + reportes) */

export type RolOperativo = "EDUCADOR" | "FAMILIA" | "PROFESIONAL" | "MEDICO";

export type CategoriaObs =
  | "CONDUCTA"
  | "COMUNICACION"
  | "SOCIAL"
  | "ACADEMICO"
  | "SENSORIAL"
  | "MOTOR"
  | "CLINICO"
  | "OTRO";

export interface RolPanelConfig {
  rol: RolOperativo;
  heroTitle: string;
  heroSubtitle: string;
  features: string[];
  hint: string;
  perfilLabel: string;
  observacionesTitle: string;
  reportesTabLabel: string;
  nuevaObservacionLabel: string;
  modalTitle: string;
  emptyObservaciones: string;
  defaultCategoria: CategoriaObs;
  categorias: readonly CategoriaObs[];
  showPrivacidad: boolean;
  showReportesTab: boolean;
  showCategoriaClinico: boolean;
}

const TODAS: readonly CategoriaObs[] = [
  "CONDUCTA",
  "COMUNICACION",
  "SOCIAL",
  "ACADEMICO",
  "SENSORIAL",
  "MOTOR",
  "CLINICO",
  "OTRO"
] as const;

export const ROL_PANEL_CONFIG: Record<RolOperativo, RolPanelConfig> = {
  EDUCADOR: {
    rol: "EDUCADOR",
    heroTitle: "Seguimiento pedagógico",
    heroSubtitle: "Registre y consulte observaciones del aula y del establecimiento.",
    features: [
      "Observaciones por estudiante",
      "Generación de reportes PDF/Excel",
      "Colaboración con familia y equipo"
    ],
    hint: "Registre observaciones pedagógicas del estudiante.",
    perfilLabel: "Estudiante",
    observacionesTitle: "Observaciones del curso",
    reportesTabLabel: "Reportes",
    nuevaObservacionLabel: "Nueva observación",
    modalTitle: "Nueva observación educativa",
    emptyObservaciones: "No hay observaciones para este estudiante.",
    defaultCategoria: "ACADEMICO",
    categorias: TODAS,
    showPrivacidad: false,
    showReportesTab: true,
    showCategoriaClinico: true
  },
  FAMILIA: {
    rol: "FAMILIA",
    heroTitle: "Espacio familiar",
    heroSubtitle: "Acompañe el desarrollo de su hijo/a y comparta lo que observa en casa.",
    features: [
      "Consulta observaciones visibles para la familia",
      "Aportes desde el hogar",
      "Informes para reuniones y seguimiento"
    ],
    hint: "Consulta y aporte al seguimiento de su hijo/a desde el hogar.",
    perfilLabel: "Hijo/a / familiar",
    observacionesTitle: "Bitácora familiar",
    reportesTabLabel: "Informes",
    nuevaObservacionLabel: "Aportar observación",
    modalTitle: "Registrar observación desde casa",
    emptyObservaciones:
      "Aún no hay observaciones visibles. Puede ser la primera en registrar una.",
    defaultCategoria: "COMUNICACION",
    categorias: [
      "CONDUCTA",
      "COMUNICACION",
      "SOCIAL",
      "SENSORIAL",
      "MOTOR",
      "OTRO"
    ],
    showPrivacidad: false,
    showReportesTab: true,
    showCategoriaClinico: false
  },
  PROFESIONAL: {
    rol: "PROFESIONAL",
    heroTitle: "Apoyo terapéutico",
    heroSubtitle: "Documente avances de intervención y coordine con el equipo.",
    features: [
      "Observaciones públicas y multinivel",
      "Enfoque social y conductual",
      "Reportes de intervención"
    ],
    hint: "Observaciones de apoyo terapéutico (visibles según privacidad del registro).",
    perfilLabel: "Persona en seguimiento",
    observacionesTitle: "Registro terapéutico",
    reportesTabLabel: "Reportes de intervención",
    nuevaObservacionLabel: "Nueva nota terapéutica",
    modalTitle: "Nueva observación profesional",
    emptyObservaciones: "No hay observaciones terapéuticas para este perfil.",
    defaultCategoria: "SOCIAL",
    categorias: [
      "CONDUCTA",
      "COMUNICACION",
      "SOCIAL",
      "SENSORIAL",
      "MOTOR",
      "OTRO"
    ],
    showPrivacidad: false,
    showReportesTab: true,
    showCategoriaClinico: false
  },
  MEDICO: {
    rol: "MEDICO",
    heroTitle: "Registro clínico",
    heroSubtitle: "Notas clínicas con control de privacidad para el equipo de salud.",
    features: [
      "Categoría clínica",
      "Privacidad: pública, privada o multinivel",
      "Reportes para derivaciones y controles"
    ],
    hint: "Registro clínico con control de privacidad (pública, privada o multinivel).",
    perfilLabel: "Paciente / estudiante",
    observacionesTitle: "Observaciones clínicas",
    reportesTabLabel: "Informes clínicos",
    nuevaObservacionLabel: "Nueva nota clínica",
    modalTitle: "Nueva observación clínica",
    emptyObservaciones: "No hay observaciones clínicas para este perfil.",
    defaultCategoria: "CLINICO",
    categorias: TODAS,
    showPrivacidad: true,
    showReportesTab: true,
    showCategoriaClinico: true
  }
};

export function getRolPanelConfig(rol: string): RolPanelConfig {
  const key = rol as RolOperativo;
  return ROL_PANEL_CONFIG[key] ?? ROL_PANEL_CONFIG.EDUCADOR;
}
