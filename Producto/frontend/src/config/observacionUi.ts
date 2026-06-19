import type { CategoriaObs } from "../config/rolPanelConfig";

export const CATEGORIA_INFO: Record<
  CategoriaObs,
  { label: string; descripcion: string; emoji: string }
> = {
  CONDUCTA: {
    label: "Conducta",
    descripcion: "Comportamientos, rutinas o reacciones observadas",
    emoji: "🎯"
  },
  COMUNICACION: {
    label: "Comunicación",
    descripcion: "Lenguaje verbal, gestual o uso de apoyos",
    emoji: "💬"
  },
  SOCIAL: {
    label: "Social",
    descripcion: "Interacción con pares, adultos o entorno",
    emoji: "🤝"
  },
  ACADEMICO: {
    label: "Académico",
    descripcion: "Aprendizaje, tareas o participación escolar",
    emoji: "📚"
  },
  SENSORIAL: {
    label: "Sensorial",
    descripcion: "Estímulos, sensibilidades o autorregulación",
    emoji: "✨"
  },
  MOTOR: {
    label: "Motor",
    descripcion: "Motricidad gruesa, fina o coordinación",
    emoji: "🏃"
  },
  CLINICO: {
    label: "Clínico",
    descripcion: "Aspectos de salud o seguimiento médico",
    emoji: "🩺"
  },
  OTRO: {
    label: "Otro",
    descripcion: "Situaciones que no encajan en otra categoría",
    emoji: "📋"
  }
};

export const PRIVACIDAD_INFO = {
  PUBLICA: {
    label: "Pública",
    descripcion: "Visible para familia, educadores, profesionales y médicos del equipo"
  },
  PRIVADA: {
    label: "Solo médico",
    descripcion: "Solo visible para el equipo médico"
  },
  MULTINIVEL: {
    label: "Profesionales y médicos",
    descripcion: "Visible para profesionales de apoyo y equipo médico (no familia ni educadores)"
  }
} as const;

export const ROLES_OBSERVACION = ["EDUCADOR", "FAMILIA", "PROFESIONAL", "MEDICO"] as const;
