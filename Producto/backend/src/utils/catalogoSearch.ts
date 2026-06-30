import {
  catalogo_ambito_enum,
  catalogo_fuente_enum,
  Prisma,
  PrismaClient
} from '@prisma/client';
import { z } from 'zod';

import { regionChileSchema } from './regionChile';
import {
  etiquetaAmbitoCatalogo,
  etiquetaCodigoCatalogo,
  etiquetaTipoOficial,
  normalizarTextoBusqueda,
  sugerirTipoInstitucionTeaLink,
  TIPOS_OFICIALES_EDUCACION,
  TIPOS_OFICIALES_SALUD
} from './catalogoEstablecimiento';
import { comunaNombreSchema } from './ubicacionChile';

const prisma = new PrismaClient();

export const catalogoBusquedaSchema = z.object({
  q: z.string().trim().optional(),
  ambito: z.enum(['EDUCACION', 'SALUD', 'TERAPEUTICO']).optional(),
  region: regionChileSchema.optional(),
  comuna: comunaNombreSchema.optional(),
  localidad: z.string().trim().optional(),
  tipo_oficial: z.string().trim().optional(),
  solo_con_codigo: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform(v => v === 'true'),
  tiene_pie: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform(v => (v === undefined ? undefined : v === 'true')),
  es_escuela_especial: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform(v => (v === undefined ? undefined : v === 'true')),
  excluir_incorporados: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform(v => v !== 'false'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30)
});

export type CatalogoBusquedaInput = z.infer<typeof catalogoBusquedaSchema>;

/** Prefijo sin tildes (4–7 letras) para emparejar comunas del catálogo MINEDUC. */
function claveUbicacionBusqueda(valor: string): string {
  const n = normalizarTextoBusqueda(valor).replace(/\s+/g, '');
  if (n.length <= 4) return n;
  return n.slice(0, 7);
}

function filtroTextoUbicacion(campo: 'comuna' | 'localidad', valor: string): Prisma.CatalogoEstablecimientoWhereInput {
  const clave = claveUbicacionBusqueda(valor);
  return {
    OR: [
      { [campo]: { equals: valor.trim(), mode: 'insensitive' } },
      { [campo]: { contains: clave, mode: 'insensitive' } }
    ]
  };
}

function mapItem(
  row: {
    id: number;
    fuente: catalogo_fuente_enum;
    ambito: catalogo_ambito_enum;
    codigo_externo: string;
    nombre: string;
    tipo_oficial: string | null;
    region: string | null;
    comuna: string | null;
    localidad: string | null;
    direccion: string | null;
    dependencia: string | null;
    sostenedor: string | null;
    tiene_pie: boolean;
    es_escuela_especial: boolean;
    vigente: boolean;
    institucion: { id: number } | null;
  }
) {
  return {
    id: row.id,
    fuente: row.fuente,
    ambito: row.ambito,
    ambito_label: etiquetaAmbitoCatalogo(row.ambito),
    codigo_externo: row.codigo_externo,
    codigo_label: etiquetaCodigoCatalogo(row.fuente, row.codigo_externo),
    nombre: row.nombre,
    tipo_oficial: row.tipo_oficial,
    tipo_oficial_label: etiquetaTipoOficial(row.tipo_oficial),
    region: row.region,
    comuna: row.comuna,
    localidad: row.localidad,
    direccion: row.direccion,
    dependencia: row.dependencia,
    sostenedor: row.sostenedor,
    tiene_pie: row.tiene_pie,
    es_escuela_especial: row.es_escuela_especial,
    vigente: row.vigente,
    ya_incorporado: Boolean(row.institucion),
    institucion_id: row.institucion?.id ?? null,
    tipo_sugerido: sugerirTipoInstitucionTeaLink(row.ambito)
  };
}

export async function buscarCatalogoEstablecimientos(query: CatalogoBusquedaInput) {
  const where: Prisma.CatalogoEstablecimientoWhereInput = {
    vigente: true
  };

  if (query.ambito) where.ambito = query.ambito;
  if (query.region) where.region = query.region;
  const ubicacionAnd: Prisma.CatalogoEstablecimientoWhereInput[] = [];
  if (query.comuna) ubicacionAnd.push(filtroTextoUbicacion('comuna', query.comuna));
  if (query.localidad) ubicacionAnd.push(filtroTextoUbicacion('localidad', query.localidad));
  if (ubicacionAnd.length > 0) {
    where.AND = [...(Array.isArray(where.AND) ? where.AND : []), ...ubicacionAnd];
  }
  if (query.tipo_oficial) where.tipo_oficial = query.tipo_oficial;
  if (query.tiene_pie !== undefined) where.tiene_pie = query.tiene_pie;
  if (query.es_escuela_especial !== undefined) {
    where.es_escuela_especial = query.es_escuela_especial;
  }
  if (query.solo_con_codigo) {
    where.codigo_externo = { not: '' };
  }
  if (query.excluir_incorporados) {
    where.institucion = { is: null };
  }
  if (query.q) {
    const q = query.q.trim();
    const or: Prisma.CatalogoEstablecimientoWhereInput[] = [
      { nombre: { contains: q, mode: 'insensitive' } },
      { comuna: { contains: q, mode: 'insensitive' } },
      { localidad: { contains: q, mode: 'insensitive' } },
      { sostenedor: { contains: q, mode: 'insensitive' } }
    ];
    if (/^\d+$/.test(q)) {
      or.push({ codigo_externo: q });
    }
    where.OR = or;
  }

  const skip = (query.page - 1) * query.limit;
  const [total, rows] = await Promise.all([
    prisma.catalogoEstablecimiento.count({ where }),
    prisma.catalogoEstablecimiento.findMany({
      where,
      orderBy: [{ nombre: 'asc' }],
      skip,
      take: query.limit,
      include: { institucion: { select: { id: true } } }
    })
  ]);

  return {
    resultados: rows.map(mapItem),
    paginacion: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit))
    }
  };
}

export async function obtenerCatalogoEstablecimientoPorId(id: number) {
  const row = await prisma.catalogoEstablecimiento.findUnique({
    where: { id },
    include: { institucion: { select: { id: true } } }
  });
  return row ? mapItem(row) : null;
}

export async function metaFiltrosCatalogo() {
  const [totalEducacion, totalSalud, totalTerapeutico, totalDeis, totalMineduc] =
    await Promise.all([
      prisma.catalogoEstablecimiento.count({ where: { ambito: 'EDUCACION', vigente: true } }),
      prisma.catalogoEstablecimiento.count({ where: { ambito: 'SALUD', vigente: true } }),
      prisma.catalogoEstablecimiento.count({ where: { ambito: 'TERAPEUTICO', vigente: true } }),
      prisma.catalogoEstablecimiento.count({ where: { fuente: 'DEIS_SALUD', vigente: true } }),
      prisma.catalogoEstablecimiento.count({ where: { fuente: 'MINEDUC_ESCOLAR', vigente: true } })
    ]);

  return {
    totales: {
      educacion: totalEducacion,
      salud: totalSalud,
      terapeutico: totalTerapeutico,
      mineduc: totalMineduc,
      deis: totalDeis
    },
    tipos_oficiales: {
      educacion: [...TIPOS_OFICIALES_EDUCACION],
      salud: [...TIPOS_OFICIALES_SALUD],
      terapeutico: ['centro_terapeutico', 'centro_medico', 'consultorio_aps']
    }
  };
}

export async function contarCatalogo(): Promise<number> {
  return prisma.catalogoEstablecimiento.count();
}
