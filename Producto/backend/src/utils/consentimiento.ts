/** Versión vigente del texto de consentimiento informado (familia/tutor). */
export const CONSENTIMIENTO_VERSION = '2026-01';

export const CONSENTIMIENTO_TEXTO = `TEA Link registra información sobre el desarrollo y seguimiento de personas con Trastorno del Espectro Autista (TEA), incluyendo datos personales y de salud/educación que pueden ser sensibles.

Al aceptar, usted declara ser padre, madre, tutor(a) o apoderado(a) legal autorizado(a) y consiente que:

• Se almacenen datos del perfil del menor/a (nombre, edad, diagnóstico y notas administradas por su institución).
• Usted y el equipo autorizado (educadores, profesionales y médicos vinculados al perfil) registren observaciones según las reglas de privacidad de la plataforma.
• Las observaciones públicas sean visibles para el equipo interdisciplinario; las notas clínicas restringidas solo las verán los roles autorizados (médico/profesional según corresponda).

Usted puede solicitar correcciones o revocar el uso de la plataforma contactando al administrador de su institución. Sin esta autorización no podrá acceder al panel familiar.`;

export function usuarioNecesitaConsentimiento(
  rol: string,
  consentimientoAceptadoAt: Date | null | undefined
): boolean {
  return rol === 'FAMILIA' && consentimientoAceptadoAt == null;
}
