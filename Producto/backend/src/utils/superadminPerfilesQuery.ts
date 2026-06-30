import { z } from 'zod';
import { Prisma, PrismaClient } from '@prisma/client';
import { normalizarRutChileno, formatearRutChileno } from './rutChileno';
import { parseInstitucionId, parseStatsDateRange } from './superadminStatsQuery';
import { regionChileSchema } from './regionChile';
import {
  institucionContactoSelect,
  mapInstitucionContacto
} from './institucionContacto';

/** Tipos que pueden ser dueños de custodia de un perfil estudiante. */
export const TIPOS_INSTITUCION_CUSTODIA_PERFIL = [
  'CENTRO_EDUCACIONAL',
  'CENTRO_MEDICO',
  'CENTRO_PROFESIONAL'
] as const;

export const tipoInstitucionCustodiaSchema = z
  .enum(TIPOS_INSTITUCION_CUSTODIA_PERFIL)
  .optional();

const prisma = new PrismaClient();

export const superadminPerfilesListQuerySchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sort: z
    .enum(['nombre', 'rut', 'created_at', 'consentimiento_estado'])
    .default('nombre'),
  order: z.enum(['asc', 'desc']).default('asc'),
  institucion: z.union([z.string(), z.number()]).optional(),
  region: regionChileSchema.optional(),
  tipo_institucion: tipoInstitucionCustodiaSchema,
  consentimiento: z.enum(['PENDIENTE', 'ACEPTADO', 'RECHAZADO']).optional(),
  desde: z.string().trim().optional(),
  hasta: z.string().trim().optional()
});

export type SuperadminPerfilesListQuery = z.infer<typeof superadminPerfilesListQuerySchema>;

const PERFIL_NACIONAL_SELECT = {
  id: true,
  rut: true,
  nombre: true,
  edad: true,
  fecha_nacimiento: true,
  diagnostico_clinico: true,
  diagnostico_secundario: true,
  nivel_educacional: true,
  consentimiento_estado: true,
  consentimiento_sujeto: true,
  consentimiento_aceptado_at: true,
  created_at: true,
  institucion: { select: institucionContactoSelect }
} as const;

export function buildSuperadminPerfilSearchWhere(q?: string): Prisma.PerfilWhereInput | undefined {
  if (!q?.trim()) return undefined;
  const trimmed = q.trim();
  const rutNorm = normalizarRutChileno(trimmed);
  const or: Prisma.PerfilWhereInput[] = [
    { nombre: { contains: trimmed, mode: 'insensitive' } }
  ];
  if (rutNorm) {
    or.push({ rut: rutNorm });
  }
  const rutDigits = trimmed.replace(/[.\-\s]/g, '');
  if (rutDigits.length >= 3) {
    or.push({ rut: { contains: rutDigits, mode: 'insensitive' } });
  }
  return { OR: or };
}

export function buildInstitucionCustodiaWhere(
  query: Pick<SuperadminPerfilesListQuery, 'region' | 'tipo_institucion'>
): Prisma.InstitucionWhereInput | undefined {
  const where: Prisma.InstitucionWhereInput = {};
  if (query.region) where.region = query.region;
  if (query.tipo_institucion) where.tipo = query.tipo_institucion;
  return Object.keys(where).length > 0 ? where : undefined;
}

function buildSuperadminPerfilListWhere(
  query: SuperadminPerfilesListQuery
): Prisma.PerfilWhereInput {
  const institucionId = parseInstitucionId(query.institucion);
  const dateRange = parseStatsDateRange(query.desde, query.hasta);
  const search = buildSuperadminPerfilSearchWhere(query.q);
  const institucionCustodia = buildInstitucionCustodiaWhere(query);

  return {
    ...(institucionId != null && { institucion_id: institucionId }),
    ...(institucionCustodia && { institucion: institucionCustodia }),
    ...(query.consentimiento && { consentimiento_estado: query.consentimiento }),
    ...(dateRange && { created_at: dateRange }),
    ...(search ?? {})
  };
}

function orderByFromSuperadminQuery(
  sort: SuperadminPerfilesListQuery['sort'],
  order: SuperadminPerfilesListQuery['order']
): Prisma.PerfilOrderByWithRelationInput {
  if (sort === 'rut') {
    return { rut: { sort: order, nulls: order === 'asc' ? 'last' : 'first' } };
  }
  return { [sort]: order };
}

export async function listarPerfilesSuperadminNacional(query: SuperadminPerfilesListQuery) {
  const where = buildSuperadminPerfilListWhere(query);

  const [total, perfiles] = await Promise.all([
    prisma.perfil.count({ where }),
    prisma.perfil.findMany({
      where,
      select: PERFIL_NACIONAL_SELECT,
      orderBy: orderByFromSuperadminQuery(query.sort, query.order),
      skip: (query.page - 1) * query.limit,
      take: query.limit
    })
  ]);

  return {
    perfiles: perfiles.map(p => ({
      id: p.id,
      rut: p.rut,
      rut_formateado: p.rut ? formatearRutChileno(p.rut) : null,
      nombre: p.nombre,
      edad: p.edad,
      fecha_nacimiento: p.fecha_nacimiento,
      diagnostico_clinico: p.diagnostico_clinico,
      diagnostico_secundario: p.diagnostico_secundario,
      nivel_educacional: p.nivel_educacional,
      consentimiento_estado: p.consentimiento_estado,
      consentimiento_sujeto: p.consentimiento_sujeto,
      consentimiento_aceptado_at: p.consentimiento_aceptado_at,
      created_at: p.created_at,
      institucion_custodia: mapInstitucionContacto(p.institucion)
    })),
    paginacion: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 0
    }
  };
}

export async function obtenerDetallePerfilSuperadmin(id: number) {
  const perfil = await prisma.perfil.findUnique({
    where: { id },
    include: {
      institucion: { select: institucionContactoSelect },
      _count: {
        select: {
          observaciones: true,
          usuarios: true,
          solicitudes_institucion: true
        }
      },
      solicitudes_institucion: {
        where: { estado: 'ACEPTADA' },
        select: {
          id: true,
          estado: true,
          institucion_solicitante: { select: institucionContactoSelect },
          institucion_invitada: { select: institucionContactoSelect }
        }
      }
    }
  });

  if (!perfil) return null;

  const { institucion, _count, solicitudes_institucion, ...resto } = perfil;

  return {
    ...resto,
    rut_formateado: resto.rut ? formatearRutChileno(resto.rut) : null,
    institucion_custodia: mapInstitucionContacto(institucion),
    resumen: {
      observaciones: _count.observaciones,
      vinculos_equipo: _count.usuarios,
      solicitudes_colaboracion: _count.solicitudes_institucion
    },
    colaboraciones_activas: solicitudes_institucion.map(s => ({
      id: s.id,
      institucion_solicitante: mapInstitucionContacto(s.institucion_solicitante),
      institucion_invitada: mapInstitucionContacto(s.institucion_invitada)
    }))
  };
}
