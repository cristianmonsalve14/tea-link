export type NivelEducacional =
  | "PARVULARIA_NT1"
  | "PARVULARIA_NT2"
  | "BASICO_1"
  | "BASICO_2"
  | "BASICO_3"
  | "BASICO_4"
  | "BASICO_5"
  | "BASICO_6"
  | "BASICO_7"
  | "BASICO_8"
  | "MEDIO_1"
  | "MEDIO_2"
  | "MEDIO_3"
  | "MEDIO_4"
  | "ESPECIAL_TRANSICION"
  | "LABORAL"
  | "FORMACION_TECNICA"
  | "UNIVERSITARIO";

export const NIVEL_EDUCACIONAL_LABEL: Record<NivelEducacional, string> = {
  PARVULARIA_NT1: "Parvularia NT1 (nivel medio)",
  PARVULARIA_NT2: "Parvularia NT2 (transición)",
  BASICO_1: "1° básico",
  BASICO_2: "2° básico",
  BASICO_3: "3° básico",
  BASICO_4: "4° básico",
  BASICO_5: "5° básico",
  BASICO_6: "6° básico",
  BASICO_7: "7° básico",
  BASICO_8: "8° básico",
  MEDIO_1: "1° medio",
  MEDIO_2: "2° medio",
  MEDIO_3: "3° medio",
  MEDIO_4: "4° medio",
  ESPECIAL_TRANSICION: "Educación especial — transición",
  LABORAL: "Formación laboral (escuela especial)",
  FORMACION_TECNICA: "Formación técnica (CFT / IP)",
  UNIVERSITARIO: "Educación universitaria"
};

export const NIVEL_EDUCACIONAL_GRUPOS: Array<{
  label: string;
  niveles: NivelEducacional[];
}> = [
  {
    label: "Educación parvularia",
    niveles: ["PARVULARIA_NT1", "PARVULARIA_NT2"]
  },
  {
    label: "Enseñanza básica",
    niveles: [
      "BASICO_1",
      "BASICO_2",
      "BASICO_3",
      "BASICO_4",
      "BASICO_5",
      "BASICO_6",
      "BASICO_7",
      "BASICO_8"
    ]
  },
  {
    label: "Enseñanza media",
    niveles: ["MEDIO_1", "MEDIO_2", "MEDIO_3", "MEDIO_4"]
  },
  {
    label: "Educación especial y laboral",
    niveles: ["ESPECIAL_TRANSICION", "LABORAL"]
  },
  {
    label: "Educación superior",
    niveles: ["FORMACION_TECNICA", "UNIVERSITARIO"]
  }
];

export function etiquetaNivelEducacional(
  nivel: NivelEducacional | string | null | undefined
): string {
  if (!nivel) return "Sin nivel";
  return NIVEL_EDUCACIONAL_LABEL[nivel as NivelEducacional] ?? nivel;
}

/** Etiquetas más cortas para tablas y celdas estrechas. */
const NIVEL_EDUCACIONAL_LABEL_CORTO: Partial<Record<NivelEducacional, string>> = {
  PARVULARIA_NT1: "Parv. NT1",
  PARVULARIA_NT2: "Parv. NT2",
  ESPECIAL_TRANSICION: "Esp. transición",
  LABORAL: "Formación laboral",
  FORMACION_TECNICA: "Form. técnica",
  UNIVERSITARIO: "Universitario"
};

export function etiquetaNivelEducacionalCorta(
  nivel: NivelEducacional | string | null | undefined
): string {
  if (!nivel) return "Sin nivel";
  const key = nivel as NivelEducacional;
  return NIVEL_EDUCACIONAL_LABEL_CORTO[key] ?? NIVEL_EDUCACIONAL_LABEL[key] ?? nivel;
}

export function resumenNivelesEducador(
  niveles: NivelEducacional[] | string[] | null | undefined
): string {
  if (!niveles?.length) return "Sin nivel asignado";
  return niveles.map(n => etiquetaNivelEducacionalCorta(n)).join(", ");
}
