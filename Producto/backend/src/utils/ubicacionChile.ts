import { region_chile_enum } from '@prisma/client';
import { z } from 'zod';

import { COMUNAS_POR_REGION } from '../data/comunasPorRegion.generated';
import { regionChileSchema } from './regionChile';

export { COMUNAS_POR_REGION };

export const localidadSchema = z
  .string()
  .trim()
  .min(2, 'La localidad debe tener al menos 2 caracteres')
  .max(120, 'La localidad no puede superar 120 caracteres');

export const comunaNombreSchema = z
  .string()
  .trim()
  .min(2, 'La comuna debe tener al menos 2 caracteres')
  .max(100, 'La comuna no puede superar 100 caracteres');

export function listarComunasPorRegion(region: region_chile_enum): string[] {
  return COMUNAS_POR_REGION[region] ?? [];
}

export function comunaValidaEnRegion(
  region: region_chile_enum | string | null | undefined,
  comuna: string | null | undefined
): boolean {
  if (!region || !comuna?.trim()) return false;
  const lista = COMUNAS_POR_REGION[region as region_chile_enum];
  if (!lista) return false;
  const normalizada = comuna.trim();
  return lista.some(c => c.localeCompare(normalizada, 'es', { sensitivity: 'accent' }) === 0);
}

export function normalizarComuna(
  region: region_chile_enum,
  comuna: string
): string | null {
  const lista = listarComunasPorRegion(region);
  const match = lista.find(c => c.localeCompare(comuna.trim(), 'es', { sensitivity: 'accent' }) === 0);
  return match ?? null;
}

export const ubicacionInstitucionSchema = z
  .object({
    region: regionChileSchema,
    comuna: comunaNombreSchema,
    localidad: localidadSchema
  })
  .superRefine((data, ctx) => {
    if (!comunaValidaEnRegion(data.region, data.comuna)) {
      ctx.addIssue({
        code: 'custom',
        message: 'La comuna no corresponde a la región seleccionada',
        path: ['comuna']
      });
    }
  });

export const ubicacionInstitucionOpcionalSchema = z
  .object({
    region: regionChileSchema.optional().nullable(),
    comuna: comunaNombreSchema.optional().nullable(),
    localidad: localidadSchema.optional().nullable()
  })
  .superRefine((data, ctx) => {
    const tieneAlguno = Boolean(data.region || data.comuna?.trim() || data.localidad?.trim());
    const tieneTodos = Boolean(data.region && data.comuna?.trim() && data.localidad?.trim());
    if (tieneAlguno && !tieneTodos) {
      ctx.addIssue({
        code: 'custom',
        message: 'Región, comuna y localidad deben indicarse juntas',
        path: ['region']
      });
    }
    if (tieneTodos && !comunaValidaEnRegion(data.region, data.comuna)) {
      ctx.addIssue({
        code: 'custom',
        message: 'La comuna no corresponde a la región seleccionada',
        path: ['comuna']
      });
    }
  });

export function formatearUbicacionInstitucion(
  regionLabel: string | null | undefined,
  comuna: string | null | undefined,
  localidad: string | null | undefined
): string | null {
  const partes = [regionLabel, comuna, localidad].filter(Boolean);
  return partes.length > 0 ? partes.join(' · ') : null;
}

export function parseUbicacionInstitucion(data: {
  region: region_chile_enum;
  comuna: string;
  localidad: string;
}) {
  const comuna = normalizarComuna(data.region, data.comuna);
  if (!comuna) {
    throw new Error('Comuna inválida');
  }
  return {
    region: data.region,
    comuna,
    localidad: data.localidad.trim()
  };
}
