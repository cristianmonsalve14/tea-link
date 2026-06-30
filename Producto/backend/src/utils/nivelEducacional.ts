import { nivel_educacional_enum } from '@prisma/client';
import { z } from 'zod';

/** Orden curricular; coincide con el orden del enum en PostgreSQL. */
export const NIVELES_EDUCACIONALES: nivel_educacional_enum[] = [
  'PARVULARIA_NT1',
  'PARVULARIA_NT2',
  'BASICO_1',
  'BASICO_2',
  'BASICO_3',
  'BASICO_4',
  'BASICO_5',
  'BASICO_6',
  'BASICO_7',
  'BASICO_8',
  'MEDIO_1',
  'MEDIO_2',
  'MEDIO_3',
  'MEDIO_4',
  'ESPECIAL_TRANSICION',
  'LABORAL',
  'FORMACION_TECNICA',
  'UNIVERSITARIO'
];

export const NIVEL_EDUCACIONAL_LABEL: Record<nivel_educacional_enum, string> = {
  PARVULARIA_NT1: 'Parvularia NT1 (nivel medio)',
  PARVULARIA_NT2: 'Parvularia NT2 (transición)',
  BASICO_1: '1° básico',
  BASICO_2: '2° básico',
  BASICO_3: '3° básico',
  BASICO_4: '4° básico',
  BASICO_5: '5° básico',
  BASICO_6: '6° básico',
  BASICO_7: '7° básico',
  BASICO_8: '8° básico',
  MEDIO_1: '1° medio',
  MEDIO_2: '2° medio',
  MEDIO_3: '3° medio',
  MEDIO_4: '4° medio',
  ESPECIAL_TRANSICION: 'Educación especial — transición',
  LABORAL: 'Formación laboral (escuela especial)',
  FORMACION_TECNICA: 'Formación técnica (CFT / IP)',
  UNIVERSITARIO: 'Educación universitaria'
};

export const NIVEL_EDUCACIONAL_GRUPOS: Array<{
  label: string;
  niveles: nivel_educacional_enum[];
}> = [
  {
    label: 'Educación parvularia',
    niveles: ['PARVULARIA_NT1', 'PARVULARIA_NT2']
  },
  {
    label: 'Enseñanza básica',
    niveles: [
      'BASICO_1',
      'BASICO_2',
      'BASICO_3',
      'BASICO_4',
      'BASICO_5',
      'BASICO_6',
      'BASICO_7',
      'BASICO_8'
    ]
  },
  {
    label: 'Enseñanza media',
    niveles: ['MEDIO_1', 'MEDIO_2', 'MEDIO_3', 'MEDIO_4']
  },
  {
    label: 'Educación especial y laboral',
    niveles: ['ESPECIAL_TRANSICION', 'LABORAL']
  },
  {
    label: 'Educación superior',
    niveles: ['FORMACION_TECNICA', 'UNIVERSITARIO']
  }
];

export const nivelEducacionalSchema = z.enum(
  NIVELES_EDUCACIONALES as [nivel_educacional_enum, ...nivel_educacional_enum[]]
);

export function etiquetaNivelEducacional(
  nivel: nivel_educacional_enum | null | undefined
): string {
  if (!nivel) return 'Sin nivel asignado';
  return NIVEL_EDUCACIONAL_LABEL[nivel];
}

export function institucionRequiereNivelEducacional(tipoInstitucion: string): boolean {
  return tipoInstitucion === 'CENTRO_EDUCACIONAL';
}
