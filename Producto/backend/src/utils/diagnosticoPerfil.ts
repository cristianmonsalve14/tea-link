import {
  diagnostico_clinico_enum,
  causa_discapacidad_enum,
  grado_discapacidad_enum
} from '@prisma/client';
import { z } from 'zod';

export const DIAGNOSTICOS_CLINICOS: diagnostico_clinico_enum[] = [
  'TEA',
  'TDAH',
  'TEL',
  'DISCAPACIDAD_INTELECTUAL',
  'SINDROME_DOWN',
  'PARALISIS_CEREBRAL',
  'DISCAPACIDAD_VISUAL',
  'DISCAPACIDAD_AUDITIVA',
  'EPILEPSIA',
  'SINDROME_FRAGIL_X',
  'RETRASO_GLOBAL_DESARROLLO',
  'TRASTORNO_APRENDIZAJE',
  'TRASTORNO_PSICOTICO_INFANTIL',
  'TRASTORNO_MOVIMIENTO',
  'ALTAS_CAPACIDADES'
];

export const DIAGNOSTICO_CLINICO_LABEL: Record<diagnostico_clinico_enum, string> = {
  TEA: 'Trastorno del espectro autista (TEA)',
  TDAH: 'Trastorno por déficit atencional e hiperactividad (TDAH)',
  TEL: 'Trastorno específico del lenguaje (TEL)',
  DISCAPACIDAD_INTELECTUAL: 'Discapacidad intelectual',
  SINDROME_DOWN: 'Síndrome de Down',
  PARALISIS_CEREBRAL: 'Parálisis cerebral',
  DISCAPACIDAD_VISUAL: 'Discapacidad visual',
  DISCAPACIDAD_AUDITIVA: 'Discapacidad auditiva',
  EPILEPSIA: 'Epilepsia',
  SINDROME_FRAGIL_X: 'Síndrome de X frágil',
  RETRASO_GLOBAL_DESARROLLO: 'Retraso global del desarrollo',
  TRASTORNO_APRENDIZAJE: 'Trastorno específico del aprendizaje',
  TRASTORNO_PSICOTICO_INFANTIL: 'Trastorno psicótico infantil',
  TRASTORNO_MOVIMIENTO: 'Trastorno del movimiento / motor',
  ALTAS_CAPACIDADES: 'Altas capacidades intelectuales'
};

export const DIAGNOSTICO_CLINICO_GRUPOS: Array<{
  label: string;
  items: diagnostico_clinico_enum[];
}> = [
  {
    label: 'Neurodesarrollo y conducta',
    items: ['TEA', 'TDAH', 'RETRASO_GLOBAL_DESARROLLO', 'TRASTORNO_APRENDIZAJE', 'ALTAS_CAPACIDADES']
  },
  {
    label: 'Lenguaje y comunicación',
    items: ['TEL']
  },
  {
    label: 'Intelectual y genético',
    items: ['DISCAPACIDAD_INTELECTUAL', 'SINDROME_DOWN', 'SINDROME_FRAGIL_X']
  },
  {
    label: 'Sensorial y neurológico',
    items: [
      'DISCAPACIDAD_VISUAL',
      'DISCAPACIDAD_AUDITIVA',
      'EPILEPSIA',
      'PARALISIS_CEREBRAL',
      'TRASTORNO_MOVIMIENTO'
    ]
  },
  {
    label: 'Salud mental infantil',
    items: ['TRASTORNO_PSICOTICO_INFANTIL']
  }
];

export const CAUSAS_DISCAPACIDAD: causa_discapacidad_enum[] = [
  'FISICA',
  'SENSORIAL_VISUAL',
  'SENSORIAL_AUDITIVA',
  'SENSORIAL_COMUNICACION',
  'MENTAL_PSIQUICA',
  'MENTAL_INTELECTUAL',
  'MULTIPLE'
];

export const CAUSA_DISCAPACIDAD_LABEL: Record<causa_discapacidad_enum, string> = {
  FISICA: 'Deficiencia física (Decreto 47)',
  SENSORIAL_VISUAL: 'Deficiencia sensorial visual',
  SENSORIAL_AUDITIVA: 'Deficiencia sensorial auditiva',
  SENSORIAL_COMUNICACION: 'Deficiencia sensorial de la comunicación',
  MENTAL_PSIQUICA: 'Deficiencia mental de causa psíquica',
  MENTAL_INTELECTUAL: 'Deficiencia mental de causa intelectual',
  MULTIPLE: 'Causas múltiples'
};

export const GRADOS_DISCAPACIDAD: grado_discapacidad_enum[] = [
  'NO_CALIFICADO',
  'SIN_DISCAPACIDAD',
  'LEVE',
  'MODERADA',
  'SEVERA',
  'PROFUNDA'
];

export const GRADO_DISCAPACIDAD_LABEL: Record<grado_discapacidad_enum, string> = {
  NO_CALIFICADO: 'Sin calificación RND',
  SIN_DISCAPACIDAD: 'Sin discapacidad (0%–4%)',
  LEVE: 'Discapacidad leve (5%–24%)',
  MODERADA: 'Discapacidad moderada (25%–49%)',
  SEVERA: 'Discapacidad severa (50%–94%)',
  PROFUNDA: 'Discapacidad profunda (95%–100%)'
};

export const diagnosticoClinicoSchema = z.enum(
  DIAGNOSTICOS_CLINICOS as [diagnostico_clinico_enum, ...diagnostico_clinico_enum[]]
);

export const causaDiscapacidadSchema = z.enum(
  CAUSAS_DISCAPACIDAD as [causa_discapacidad_enum, ...causa_discapacidad_enum[]]
);

export const gradoDiscapacidadSchema = z.enum(
  GRADOS_DISCAPACIDAD as [grado_discapacidad_enum, ...grado_discapacidad_enum[]]
);

export function etiquetaDiagnosticoClinico(
  valor: diagnostico_clinico_enum | null | undefined
): string {
  if (!valor) return 'Sin diagnóstico';
  return DIAGNOSTICO_CLINICO_LABEL[valor];
}

export function etiquetaCausaDiscapacidad(
  valor: causa_discapacidad_enum | null | undefined
): string {
  if (!valor) return '—';
  return CAUSA_DISCAPACIDAD_LABEL[valor];
}

export function etiquetaGradoDiscapacidad(
  valor: grado_discapacidad_enum | null | undefined
): string {
  if (!valor) return '—';
  return GRADO_DISCAPACIDAD_LABEL[valor];
}

export function resumenDiagnosticoPerfil(perfil: {
  diagnostico_clinico?: diagnostico_clinico_enum | null;
  diagnostico_secundario?: diagnostico_clinico_enum | null;
  grado_discapacidad?: grado_discapacidad_enum | null;
}): string {
  const partes = [etiquetaDiagnosticoClinico(perfil.diagnostico_clinico)];
  if (perfil.diagnostico_secundario) {
    partes.push(etiquetaDiagnosticoClinico(perfil.diagnostico_secundario));
  }
  return partes.join(' · ');
}

const RANGO_POR_GRADO: Record<
  Exclude<grado_discapacidad_enum, 'NO_CALIFICADO'>,
  [number, number]
> = {
  SIN_DISCAPACIDAD: [0, 4],
  LEVE: [5, 24],
  MODERADA: [25, 49],
  SEVERA: [50, 94],
  PROFUNDA: [95, 100]
};

export function validarPorcentajeRnd(
  grado: grado_discapacidad_enum | null | undefined,
  porcentaje: number | null | undefined
): string | null {
  if (!grado || grado === 'NO_CALIFICADO') {
    if (porcentaje != null) {
      return 'No indique porcentaje RND si no hay calificación de discapacidad.';
    }
    return null;
  }
  if (porcentaje == null) return null;
  const rango = RANGO_POR_GRADO[grado];
  if (porcentaje < rango[0] || porcentaje > rango[1]) {
    return `El porcentaje debe estar entre ${rango[0]}% y ${rango[1]}% para el grado ${GRADO_DISCAPACIDAD_LABEL[grado]}.`;
  }
  return null;
}

export const camposDiagnosticoPerfilObjectSchema = z.object({
  diagnostico_clinico: diagnosticoClinicoSchema,
  diagnostico_secundario: diagnosticoClinicoSchema.optional().nullable(),
  causa_discapacidad: causaDiscapacidadSchema.optional().nullable(),
  grado_discapacidad: gradoDiscapacidadSchema.optional().default('NO_CALIFICADO'),
  porcentaje_rnd: z.coerce.number().int().min(0).max(100).optional().nullable(),
  tiene_credencial_rnd: z.boolean().optional().default(false)
});

export function validarReglasDiagnostico(
  data: z.infer<typeof camposDiagnosticoPerfilObjectSchema>,
  ctx: z.RefinementCtx
) {
  if (
    data.diagnostico_secundario &&
    data.diagnostico_secundario === data.diagnostico_clinico
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'El diagnóstico secundario debe ser distinto del principal.',
      path: ['diagnostico_secundario']
    });
  }
  if (data.tiene_credencial_rnd) {
    if (!data.causa_discapacidad) {
      ctx.addIssue({
        code: 'custom',
        message: 'Indique la causa de discapacidad según calificación COMPIN.',
        path: ['causa_discapacidad']
      });
    }
    if (!data.grado_discapacidad || data.grado_discapacidad === 'NO_CALIFICADO') {
      ctx.addIssue({
        code: 'custom',
        message: 'Indique el grado de discapacidad del Registro Nacional (RND).',
        path: ['grado_discapacidad']
      });
    }
  }
  const errorPct = validarPorcentajeRnd(data.grado_discapacidad, data.porcentaje_rnd);
  if (errorPct) {
    ctx.addIssue({
      code: 'custom',
      message: errorPct,
      path: ['porcentaje_rnd']
    });
  }
}

export const camposDiagnosticoPerfilSchema = camposDiagnosticoPerfilObjectSchema.superRefine(
  validarReglasDiagnostico
);
