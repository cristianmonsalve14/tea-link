import {
  consentimiento_estado_enum,
  consentimiento_sujeto_enum,
  PrismaClient
} from '@prisma/client';

import { calcularEdadDesdeFechaNacimiento } from './edadDesdeFechaNacimiento';

const prisma = new PrismaClient();

export const CONSENTIMIENTO_VERSION = '2026-02';

/** Edad de mayoría para consentimiento directo del titular del perfil. */
export const EDAD_MAYORIA_CONSENTIMIENTO = 18;

export const CONSENTIMIENTO_TEXTO_TUTOR = `TEA Link registra información sobre el desarrollo y seguimiento de personas con Trastorno del Espectro Autista (TEA), incluyendo datos personales y de salud/educación que pueden ser sensibles.

Al aceptar, usted declara ser padre, madre, tutor(a) o apoderado(a) legal autorizado(a) y consiente que:

• Se almacenen y traten los datos de este perfil (nombre, edad, diagnóstico y observaciones del equipo autorizado).
• El equipo vinculado (educadores, profesionales y médicos) registre observaciones según las reglas de privacidad de la plataforma.
• Las observaciones públicas sean visibles para el equipo interdisciplinario; las restringidas solo para los roles autorizados.

Puede solicitar correcciones o revocar el uso contactando al administrador de la institución que creó el perfil. Sin esta autorización no se habilita la bitácora ni las observaciones sobre este menor.`;

export const CONSENTIMIENTO_TEXTO_TITULAR = `TEA Link registra información sobre su desarrollo y seguimiento en el contexto de Trastorno del Espectro Autista (TEA) u otras condiciones registradas, incluyendo datos personales y de salud/educación que pueden ser sensibles.

Al aceptar, usted declara ser la persona titular de este perfil (mayor de edad) y consiente que:

• Se almacenen y traten sus datos en este perfil (nombre, edad, diagnóstico y observaciones del equipo autorizado).
• El equipo vinculado (educadores, profesionales y médicos) registre observaciones según las reglas de privacidad de la plataforma.
• Las observaciones públicas sean visibles para el equipo interdisciplinario; las restringidas solo para los roles autorizados.

Puede solicitar correcciones o revocar el uso contactando al administrador de su institución. Sin esta autorización no se habilita la bitácora ni las observaciones vinculadas a su perfil.`;

/** @deprecated Use textoConsentimientoPerfil */
export const CONSENTIMIENTO_TEXTO = CONSENTIMIENTO_TEXTO_TUTOR;

export function textoConsentimientoPerfil(sujeto: consentimiento_sujeto_enum): string {
  return sujeto === 'TITULAR' ? CONSENTIMIENTO_TEXTO_TITULAR : CONSENTIMIENTO_TEXTO_TUTOR;
}

export function esMenorDeEdad(edad: number | null | undefined): boolean {
  if (edad == null) return true;
  return edad < EDAD_MAYORIA_CONSENTIMIENTO;
}

export function determinarSujetoConsentimiento(
  edad: number | null | undefined,
  fechaNacimiento?: string | Date | null
): consentimiento_sujeto_enum {
  const edadResuelta =
    edad ?? (fechaNacimiento ? calcularEdadDesdeFechaNacimiento(fechaNacimiento) : null);
  return esMenorDeEdad(edadResuelta) ? 'TUTOR_LEGAL' : 'TITULAR';
}

export function etiquetaResponsableConsentimiento(sujeto: consentimiento_sujeto_enum): string {
  return sujeto === 'TITULAR' ? 'estudiante titular' : 'tutor o apoderado';
}

export function etiquetaEstadoConsentimientoPendiente(
  sujeto: consentimiento_sujeto_enum
): string {
  return sujeto === 'TITULAR' ? 'Pendiente estudiante' : 'Pendiente tutor';
}

export function perfilEstaOperativo(estado: consentimiento_estado_enum): boolean {
  return estado === 'ACEPTADO';
}

export function mensajeBloqueoConsentimiento(
  estado: consentimiento_estado_enum,
  sujeto: consentimiento_sujeto_enum = 'TUTOR_LEGAL'
): string {
  const responsable = etiquetaResponsableConsentimiento(sujeto);
  switch (estado) {
    case 'PENDIENTE':
      return sujeto === 'TITULAR'
        ? 'Este perfil está pendiente de autorización del propio estudiante. No se pueden registrar observaciones hasta que acepte el consentimiento.'
        : 'Este perfil está pendiente de autorización del tutor o apoderado legal. No se pueden registrar observaciones hasta que la familia acepte el consentimiento.';
    case 'RECHAZADO':
      return `El ${responsable} rechazó el consentimiento para este perfil. Las observaciones están deshabilitadas.`;
    default:
      return 'Perfil no disponible para operaciones.';
  }
}

export const TIPOS_INSTITUCION_CREAN_PERFIL = [
  'CENTRO_EDUCACIONAL',
  'CENTRO_MEDICO'
] as const;

export function institucionPuedeCrearPerfilMenor(tipo: string): boolean {
  return (TIPOS_INSTITUCION_CREAN_PERFIL as readonly string[]).includes(tipo);
}

/** Instituciones que deben registrar quién aceptará el consentimiento al crear el perfil. */
export function institucionRequiereResponsableConsentimiento(tipo: string): boolean {
  return tipo === 'CENTRO_EDUCACIONAL' || tipo === 'CENTRO_MEDICO';
}

/** @deprecated Use institucionRequiereResponsableConsentimiento */
export function institucionRequiereTutorAlCrear(tipo: string): boolean {
  return institucionRequiereResponsableConsentimiento(tipo);
}

export function mensajeResponsableConsentimientoRequerido(
  sujeto: consentimiento_sujeto_enum
): string {
  if (sujeto === 'TITULAR') {
    return 'Debe registrar el email del estudiante (mayor de edad) que aceptará el consentimiento de su propio perfil.';
  }
  return 'Debe registrar al tutor o apoderado (email y nombre) al crear el perfil del menor.';
}

export async function verificarPerfilOperativo(
  perfilId: number
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const perfil = await prisma.perfil.findUnique({
    where: { id: perfilId },
    select: { consentimiento_estado: true, consentimiento_sujeto: true }
  });
  if (!perfil) {
    return { ok: false, status: 404, error: 'Perfil no encontrado' };
  }
  if (!perfilEstaOperativo(perfil.consentimiento_estado)) {
    return {
      ok: false,
      status: 403,
      error: mensajeBloqueoConsentimiento(
        perfil.consentimiento_estado,
        perfil.consentimiento_sujeto
      )
    };
  }
  return { ok: true };
}
