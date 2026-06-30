const TIPOS_CREADORES_PERFIL = ["CENTRO_EDUCACIONAL", "CENTRO_MEDICO"] as const;

export type ColaboracionCustodia = {
  institucion_id: number;
  nombre: string;
  tipo: string;
  estado: "PENDIENTE" | "ACEPTADA" | "RECHAZADA";
};

/** Otra institución creadora (educacional o médica) con colaboración aceptada. */
export function receptorCustodiaColaboracion(
  colaboraciones: ColaboracionCustodia[] | undefined
): ColaboracionCustodia | null {
  for (const c of colaboraciones ?? []) {
    if (
      c.estado === "ACEPTADA" &&
      TIPOS_CREADORES_PERFIL.includes(c.tipo as (typeof TIPOS_CREADORES_PERFIL)[number])
    ) {
      return c;
    }
  }
  return null;
}

export function perfilPuedeCederCustodia(perfil: {
  es_propio?: boolean;
  colaboraciones?: ColaboracionCustodia[];
}): boolean {
  return perfil.es_propio === true && receptorCustodiaColaboracion(perfil.colaboraciones) != null;
}
