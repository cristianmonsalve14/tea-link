import { z } from 'zod';

export const ESPECIALIDADES_EDUCADOR = [
  'DOCENTE_TITULAR',
  'PROFESOR_JEFE',
  'EDUCADOR_PARVULARIA',
  'EDUCADOR_DIFERENCIAL',
  'EDUCADOR_AULA_INTEGRADA',
  'COORDINADOR_PIE',
  'PSICOPEDAGOGO',
  'ASISTENTE_AULA',
  'ORIENTADOR',
  'FONOAUDIOLOGO',
  'KINESIOLOGO',
  'TERAPEUTA_OCUPACIONAL'
] as const;

export type EspecialidadEducador = (typeof ESPECIALIDADES_EDUCADOR)[number];

export const ESPECIALIDAD_EDUCADOR_LABEL: Record<EspecialidadEducador, string> = {
  DOCENTE_TITULAR: 'Docente titular',
  PROFESOR_JEFE: 'Profesor jefe',
  EDUCADOR_PARVULARIA: 'Educador(a) de párvulos',
  EDUCADOR_DIFERENCIAL: 'Educador(a) diferencial',
  EDUCADOR_AULA_INTEGRADA: 'Educador(a) de aula integrada',
  COORDINADOR_PIE: 'Coordinador(a) PIE',
  PSICOPEDAGOGO: 'Psicopedagogo(a)',
  ASISTENTE_AULA: 'Asistente de aula',
  ORIENTADOR: 'Orientador(a)',
  FONOAUDIOLOGO: 'Fonoaudiólogo(a) PIE',
  KINESIOLOGO: 'Kinesiólogo(a) PIE',
  TERAPEUTA_OCUPACIONAL: 'Terapeuta ocupacional PIE'
};

export const especialidadEducadorSchema = z.enum(ESPECIALIDADES_EDUCADOR);

export function etiquetaEspecialidadEducador(
  valor: EspecialidadEducador | string | null | undefined
): string {
  if (!valor) return 'Sin cargo asignado';
  return ESPECIALIDAD_EDUCADOR_LABEL[valor as EspecialidadEducador] ?? valor;
}
