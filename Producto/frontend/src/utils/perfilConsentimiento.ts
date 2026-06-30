export const EDAD_MAYORIA_CONSENTIMIENTO = 18;

export type ConsentimientoSujeto = "TUTOR_LEGAL" | "TITULAR";

export function esMenorDeEdad(edad: number | null | undefined): boolean {
  if (edad == null) return true;
  return edad < EDAD_MAYORIA_CONSENTIMIENTO;
}

export function determinarSujetoConsentimiento(
  edad: number | null | undefined
): ConsentimientoSujeto {
  return esMenorDeEdad(edad) ? "TUTOR_LEGAL" : "TITULAR";
}

export function etiquetaEstadoConsentimientoPendiente(sujeto: ConsentimientoSujeto): string {
  return sujeto === "TITULAR" ? "Pendiente estudiante" : "Pendiente tutor";
}

export function etiquetaResponsableConsentimiento(sujeto: ConsentimientoSujeto): string {
  return sujeto === "TITULAR" ? "estudiante titular" : "tutor o apoderado";
}

/** Tipos de institución cuyo administrador puede dar de alta perfiles (alineado con backend). */
export const TIPOS_INSTITUCION_CREAN_PERFIL = [
  "CENTRO_EDUCACIONAL",
  "CENTRO_MEDICO"
] as const;

export function institucionPuedeCrearPerfil(tipo: string): boolean {
  return (TIPOS_INSTITUCION_CREAN_PERFIL as readonly string[]).includes(tipo);
}
