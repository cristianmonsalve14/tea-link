export type DiagnosticoClinico =
  | "TEA"
  | "TDAH"
  | "TEL"
  | "DISCAPACIDAD_INTELECTUAL"
  | "SINDROME_DOWN"
  | "PARALISIS_CEREBRAL"
  | "DISCAPACIDAD_VISUAL"
  | "DISCAPACIDAD_AUDITIVA"
  | "EPILEPSIA"
  | "SINDROME_FRAGIL_X"
  | "RETRASO_GLOBAL_DESARROLLO"
  | "TRASTORNO_APRENDIZAJE"
  | "TRASTORNO_PSICOTICO_INFANTIL"
  | "TRASTORNO_MOVIMIENTO"
  | "ALTAS_CAPACIDADES";

export type CausaDiscapacidad =
  | "FISICA"
  | "SENSORIAL_VISUAL"
  | "SENSORIAL_AUDITIVA"
  | "SENSORIAL_COMUNICACION"
  | "MENTAL_PSIQUICA"
  | "MENTAL_INTELECTUAL"
  | "MULTIPLE";

export type GradoDiscapacidad =
  | "NO_CALIFICADO"
  | "SIN_DISCAPACIDAD"
  | "LEVE"
  | "MODERADA"
  | "SEVERA"
  | "PROFUNDA";

export const DIAGNOSTICO_CLINICO_LABEL: Record<DiagnosticoClinico, string> = {
  TEA: "Trastorno del espectro autista (TEA)",
  TDAH: "Trastorno por déficit atencional e hiperactividad (TDAH)",
  TEL: "Trastorno específico del lenguaje (TEL)",
  DISCAPACIDAD_INTELECTUAL: "Discapacidad intelectual",
  SINDROME_DOWN: "Síndrome de Down",
  PARALISIS_CEREBRAL: "Parálisis cerebral",
  DISCAPACIDAD_VISUAL: "Discapacidad visual",
  DISCAPACIDAD_AUDITIVA: "Discapacidad auditiva",
  EPILEPSIA: "Epilepsia",
  SINDROME_FRAGIL_X: "Síndrome de X frágil",
  RETRASO_GLOBAL_DESARROLLO: "Retraso global del desarrollo",
  TRASTORNO_APRENDIZAJE: "Trastorno específico del aprendizaje",
  TRASTORNO_PSICOTICO_INFANTIL: "Trastorno psicótico infantil",
  TRASTORNO_MOVIMIENTO: "Trastorno del movimiento / motor",
  ALTAS_CAPACIDADES: "Altas capacidades intelectuales"
};

export const DIAGNOSTICO_CLINICO_GRUPOS: Array<{
  label: string;
  items: DiagnosticoClinico[];
}> = [
  {
    label: "Neurodesarrollo y conducta",
    items: ["TEA", "TDAH", "RETRASO_GLOBAL_DESARROLLO", "TRASTORNO_APRENDIZAJE", "ALTAS_CAPACIDADES"]
  },
  { label: "Lenguaje y comunicación", items: ["TEL"] },
  {
    label: "Intelectual y genético",
    items: ["DISCAPACIDAD_INTELECTUAL", "SINDROME_DOWN", "SINDROME_FRAGIL_X"]
  },
  {
    label: "Sensorial y neurológico",
    items: [
      "DISCAPACIDAD_VISUAL",
      "DISCAPACIDAD_AUDITIVA",
      "EPILEPSIA",
      "PARALISIS_CEREBRAL",
      "TRASTORNO_MOVIMIENTO"
    ]
  },
  { label: "Salud mental infantil", items: ["TRASTORNO_PSICOTICO_INFANTIL"] }
];

export const CAUSA_DISCAPACIDAD_LABEL: Record<CausaDiscapacidad, string> = {
  FISICA: "Deficiencia física (Decreto 47)",
  SENSORIAL_VISUAL: "Deficiencia sensorial visual",
  SENSORIAL_AUDITIVA: "Deficiencia sensorial auditiva",
  SENSORIAL_COMUNICACION: "Deficiencia sensorial de la comunicación",
  MENTAL_PSIQUICA: "Deficiencia mental de causa psíquica",
  MENTAL_INTELECTUAL: "Deficiencia mental de causa intelectual",
  MULTIPLE: "Causas múltiples"
};

export const CAUSAS_DISCAPACIDAD = Object.keys(CAUSA_DISCAPACIDAD_LABEL) as CausaDiscapacidad[];

export const GRADO_DISCAPACIDAD_LABEL: Record<GradoDiscapacidad, string> = {
  NO_CALIFICADO: "Sin calificación RND",
  SIN_DISCAPACIDAD: "Sin discapacidad (0%–4%)",
  LEVE: "Discapacidad leve (5%–24%)",
  MODERADA: "Discapacidad moderada (25%–49%)",
  SEVERA: "Discapacidad severa (50%–94%)",
  PROFUNDA: "Discapacidad profunda (95%–100%)"
};

export const GRADOS_DISCAPACIDAD = Object.keys(GRADO_DISCAPACIDAD_LABEL) as GradoDiscapacidad[];

export function etiquetaDiagnosticoClinico(
  valor: DiagnosticoClinico | string | null | undefined
): string {
  if (!valor) return "Sin diagnóstico";
  return DIAGNOSTICO_CLINICO_LABEL[valor as DiagnosticoClinico] ?? valor;
}

export function etiquetaCausaDiscapacidad(
  valor: CausaDiscapacidad | string | null | undefined
): string {
  if (!valor) return "—";
  return CAUSA_DISCAPACIDAD_LABEL[valor as CausaDiscapacidad] ?? valor;
}

export function etiquetaGradoDiscapacidad(
  valor: GradoDiscapacidad | string | null | undefined
): string {
  if (!valor) return "—";
  return GRADO_DISCAPACIDAD_LABEL[valor as GradoDiscapacidad] ?? valor;
}

export function resumenDiagnosticoPerfil(perfil: {
  diagnostico_clinico?: DiagnosticoClinico | string | null;
  diagnostico_secundario?: DiagnosticoClinico | string | null;
}): string {
  const partes = [etiquetaDiagnosticoClinico(perfil.diagnostico_clinico)];
  if (perfil.diagnostico_secundario) {
    partes.push(etiquetaDiagnosticoClinico(perfil.diagnostico_secundario));
  }
  return partes.join(" · ");
}

export function requiereDatosRnd(
  tieneCredencial: boolean,
  grado: GradoDiscapacidad | ""
): boolean {
  return tieneCredencial || (grado !== "" && grado !== "NO_CALIFICADO");
}
