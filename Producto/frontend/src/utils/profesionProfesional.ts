export const PROFESIONES_PROFESIONAL = [
  "PSICOLOGO",
  "NEUROPSICOLOGO",
  "PSICOPEDAGOGO",
  "ORIENTADOR",
  "FONOAUDIOLOGO",
  "KINESIOLOGO",
  "TERAPEUTA_OCUPACIONAL",
  "MUSICOTERAPEUTA",
  "TERAPEUTA_ABA",
  "INTERVENCION_TEMPRANA",
  "TRABAJADOR_SOCIAL",
  "NUTRICIONISTA",
  "COORDINADOR_TERAPEUTICO"
] as const;

export type ProfesionProfesional = (typeof PROFESIONES_PROFESIONAL)[number];

export const PROFESION_PROFESIONAL_LABEL: Record<ProfesionProfesional, string> = {
  PSICOLOGO: "Psicólogo(a)",
  NEUROPSICOLOGO: "Neuropsicólogo(a)",
  PSICOPEDAGOGO: "Psicopedagogo(a)",
  ORIENTADOR: "Orientador(a)",
  FONOAUDIOLOGO: "Fonoaudiólogo(a)",
  KINESIOLOGO: "Kinesiólogo(a)",
  TERAPEUTA_OCUPACIONAL: "Terapeuta ocupacional",
  MUSICOTERAPEUTA: "Musicoterapeuta",
  TERAPEUTA_ABA: "Terapeuta ABA / conductual",
  INTERVENCION_TEMPRANA: "Intervención temprana",
  TRABAJADOR_SOCIAL: "Trabajador(a) social",
  NUTRICIONISTA: "Nutricionista",
  COORDINADOR_TERAPEUTICO: "Coordinador(a) terapéutico"
};

export const PROFESION_PROFESIONAL_GRUPOS: Array<{
  label: string;
  profesiones: ProfesionProfesional[];
}> = [
  {
    label: "Salud mental y educación",
    profesiones: ["PSICOLOGO", "NEUROPSICOLOGO", "PSICOPEDAGOGO", "ORIENTADOR"]
  },
  {
    label: "Rehabilitación",
    profesiones: ["FONOAUDIOLOGO", "KINESIOLOGO", "TERAPEUTA_OCUPACIONAL"]
  },
  {
    label: "Terapias especializadas",
    profesiones: ["MUSICOTERAPEUTA", "TERAPEUTA_ABA", "INTERVENCION_TEMPRANA"]
  },
  {
    label: "Apoyo y coordinación",
    profesiones: ["TRABAJADOR_SOCIAL", "NUTRICIONISTA", "COORDINADOR_TERAPEUTICO"]
  }
];

export function etiquetaProfesionProfesional(
  valor: ProfesionProfesional | string | null | undefined
): string {
  if (!valor) return "Sin profesión asignada";
  return PROFESION_PROFESIONAL_LABEL[valor as ProfesionProfesional] ?? valor;
}

export function requiereProfesionEquipo(rol: string, tipoInstitucion: string): boolean {
  return (
    rol === "PROFESIONAL" &&
    (tipoInstitucion === "CENTRO_PROFESIONAL" || tipoInstitucion === "CENTRO_MEDICO")
  );
}
