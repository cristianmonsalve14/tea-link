import { z } from 'zod';

import {
  direccionSchema,
  emailContactoSchema,
  telefonoChileSchema
} from './contactoFields';
import { etiquetaRegionChile, regionChileSchema } from './regionChile';
import {
  comunaNombreSchema,
  formatearUbicacionInstitucion,
  localidadSchema,
  ubicacionInstitucionOpcionalSchema,
  ubicacionInstitucionSchema
} from './ubicacionChile';

export const institucionContactoSelect = {
  id: true,
  nombre: true,
  tipo: true,
  region: true,
  comuna: true,
  localidad: true,
  direccion: true,
  email_contacto: true,
  telefono_contacto: true
} as const;

export const TIPO_INSTITUCION_LABEL: Record<string, string> = {
  FAMILIA: 'Familia',
  CENTRO_EDUCACIONAL: 'Centro educacional',
  CENTRO_MEDICO: 'Centro médico',
  CENTRO_PROFESIONAL: 'Centro terapéutico',
  SISTEMA: 'Sistema'
};

export function etiquetaTipoInstitucion(tipo: string): string {
  return TIPO_INSTITUCION_LABEL[tipo] ?? tipo.replace(/_/g, ' ');
}

export type InstitucionContactoPayload = {
  id: number;
  nombre: string;
  tipo: string;
  region?: string | null;
  comuna?: string | null;
  localidad?: string | null;
  direccion?: string | null;
  email_contacto?: string | null;
  telefono_contacto?: string | null;
};

export function mapInstitucionContacto(inst: InstitucionContactoPayload) {
  const region_label = inst.region ? etiquetaRegionChile(inst.region) : null;
  return {
    id: inst.id,
    nombre: inst.nombre,
    tipo: inst.tipo,
    tipo_label: etiquetaTipoInstitucion(inst.tipo),
    region: inst.region ?? null,
    region_label,
    comuna: inst.comuna ?? null,
    localidad: inst.localidad ?? null,
    ubicacion_label: formatearUbicacionInstitucion(region_label, inst.comuna, inst.localidad),
    direccion: inst.direccion ?? null,
    email_contacto: inst.email_contacto ?? null,
    telefono_contacto: inst.telefono_contacto ?? null
  };
}

export const institucionContactoBodySchema = ubicacionInstitucionSchema.extend({
  direccion: direccionSchema,
  email_contacto: emailContactoSchema,
  telefono_contacto: telefonoChileSchema
});

function validarContactoEnAdmin(
  data: {
    tipo?: string;
    direccion?: string | null;
    email_contacto?: string | null;
    telefono_contacto?: string | null;
  },
  ctx: z.RefinementCtx
) {
  if (data.tipo === 'SISTEMA') return;

  const campos = [
    { key: 'direccion' as const, schema: direccionSchema },
    { key: 'email_contacto' as const, schema: emailContactoSchema },
    { key: 'telefono_contacto' as const, schema: telefonoChileSchema }
  ];

  for (const { key, schema } of campos) {
    const parsed = schema.safeParse(data[key] ?? '');
    if (!parsed.success) {
      ctx.addIssue({
        code: 'custom',
        message: parsed.error.issues[0]?.message ?? 'Valor inválido',
        path: [key]
      });
    }
  }
}

export const institucionAdminBodySchema = z
  .object({
    nombre: z.string().min(2).optional(),
    tipo: z
      .enum(['FAMILIA', 'CENTRO_EDUCACIONAL', 'CENTRO_MEDICO', 'CENTRO_PROFESIONAL', 'SISTEMA'])
      .optional(),
    region: regionChileSchema.optional().nullable(),
    comuna: comunaNombreSchema.optional().nullable(),
    localidad: localidadSchema.optional().nullable(),
    direccion: z.string().trim().optional().nullable(),
    email_contacto: z.string().trim().optional().nullable(),
    telefono_contacto: z.string().trim().optional().nullable()
  })
  .and(ubicacionInstitucionOpcionalSchema)
  .superRefine((data, ctx) => validarContactoEnAdmin(data, ctx));

export const institucionesRedQuerySchema = z.object({
  q: z.string().trim().optional(),
  tipo: z
    .enum(['CENTRO_EDUCACIONAL', 'CENTRO_MEDICO', 'CENTRO_PROFESIONAL', 'FAMILIA'])
    .optional(),
  region: regionChileSchema.optional(),
  comuna: comunaNombreSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12)
});

export const institucionesInvitablesQuerySchema = z.object({
  q: z.string().trim().optional(),
  tipo: z.enum(['CENTRO_MEDICO', 'CENTRO_PROFESIONAL']).optional(),
  region: regionChileSchema.optional(),
  comuna: comunaNombreSchema.optional(),
  perfil_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

export type InstitucionesRedQuery = z.infer<typeof institucionesRedQuerySchema>;
export type InstitucionesInvitablesQuery = z.infer<typeof institucionesInvitablesQuerySchema>;

export function filtrarYPaginarInstitucionesRed<
  T extends InstitucionContactoPayload & { vinculos?: number }
>(instituciones: T[], query: InstitucionesRedQuery) {
  let filtradas = [...instituciones];

  if (query.tipo) {
    filtradas = filtradas.filter(i => i.tipo === query.tipo);
  }

  if (query.region) {
    filtradas = filtradas.filter(i => i.region === query.region);
  }

  if (query.comuna) {
    const comuna = query.comuna.trim();
    filtradas = filtradas.filter(
      i => i.comuna?.localeCompare(comuna, 'es', { sensitivity: 'accent' }) === 0
    );
  }

  const q = query.q?.trim().toLowerCase();
  if (q) {
    filtradas = filtradas.filter(i => {
      const haystack = [
        i.nombre,
        etiquetaTipoInstitucion(i.tipo),
        etiquetaRegionChile(i.region),
        i.comuna,
        i.localidad,
        i.direccion,
        i.email_contacto,
        i.telefono_contacto
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  const total = filtradas.length;
  const totalPages = Math.ceil(total / query.limit) || 0;
  const page = totalPages > 0 ? Math.min(query.page, totalPages) : 1;
  const start = (page - 1) * query.limit;

  return {
    instituciones: filtradas.slice(start, start + query.limit),
    paginacion: {
      page,
      limit: query.limit,
      total,
      totalPages
    },
    resumen: {
      total: instituciones.length,
      filtrados: total
    }
  };
}
