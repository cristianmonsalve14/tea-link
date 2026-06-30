import { privacidad_observacion_enum } from '@prisma/client';
import { z } from 'zod';

export const ROLES_OBSERVACION_OPERATIVOS = [
  'EDUCADOR',
  'FAMILIA',
  'PROFESIONAL',
  'MEDICO'
] as const;

export type RolObservacionOperativo = (typeof ROLES_OBSERVACION_OPERATIVOS)[number];

export const observacionCreateSchema = z.object({
  titulo: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres').max(120),
  descripcion: z
    .string()
    .trim()
    .min(10, 'La descripción debe tener al menos 10 caracteres'),
  categoria: z.enum([
    'CONDUCTA',
    'COMUNICACION',
    'SOCIAL',
    'ACADEMICO',
    'SENSORIAL',
    'MOTOR',
    'CLINICO',
    'OTRO'
  ]),
  fecha_evento: z.string().min(1),
  perfil_id: z.coerce.number().int().positive(),
  privacidad: z.enum(['PUBLICA', 'PRIVADA', 'MULTINIVEL']).optional()
});

export const observacionUpdateSchema = observacionCreateSchema
  .partial()
  .omit({ perfil_id: true });

export function isRolOperativoObservacion(
  rol: string
): rol is RolObservacionOperativo {
  return (ROLES_OBSERVACION_OPERATIVOS as readonly string[]).includes(rol);
}

/** Administradores y superadmin no crean ni editan en bitácora operativa. */
export function isRolBloqueadoBitacora(rol: string | undefined): boolean {
  return rol === 'ADMINISTRADOR' || rol === 'SUPERADMIN';
}

/** Lectura de bitácora: roles operativos y administrador institucional (solo consulta). */
export function isRolLecturaObservacion(rol: string | undefined): boolean {
  if (!rol || rol === 'SUPERADMIN') return false;
  return isRolOperativoObservacion(rol) || rol === 'ADMINISTRADOR';
}

/**
 * Solo el médico puede fijar PRIVADA/MULTINIVEL al crear; el resto queda PUBLICA.
 */
export function resolverPrivacidadAlCrear(
  rol: string,
  privacidadSolicitada?: privacidad_observacion_enum | string
): privacidad_observacion_enum {
  if (rol === 'MEDICO' && privacidadSolicitada) {
    return privacidadSolicitada as privacidad_observacion_enum;
  }
  return 'PUBLICA';
}

export function parsePerfilIdQuery(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : NaN;
}

export function isPerfilIdQueryInvalid(value: unknown): boolean {
  if (value == null || value === '') return false;
  const id = Number(value);
  return Number.isNaN(id);
}
