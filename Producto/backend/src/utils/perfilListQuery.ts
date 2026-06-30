import { z } from 'zod';
import { Prisma, PrismaClient } from '@prisma/client';
import { adminPuedeGestionarColaboracion } from './solicitudInstitucionRules';
import { getPerfilIdsAccesibles } from './perfilAccess';
import { nivelEducacionalSchema } from './nivelEducacional';
import { diagnosticoClinicoSchema } from './diagnosticoPerfil';

const prisma = new PrismaClient();

export const perfilListQuerySchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(['nombre', 'edad', 'consentimiento', 'created_at', 'nivel_educacional'])
    .default('nombre'),
  order: z.enum(['asc', 'desc']).default('asc'),
  tipo: z.enum(['todos', 'propios', 'compartidos']).default('todos'),
  nivel: z
    .union([z.literal('sin_nivel'), nivelEducacionalSchema])
    .optional(),
  diagnostico: diagnosticoClinicoSchema.optional()
});

export type PerfilListQuery = z.infer<typeof perfilListQuerySchema>;

export const perfilOperativoListQuerySchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  sort: z.enum(['nombre', 'edad', 'created_at']).default('nombre'),
  order: z.enum(['asc', 'desc']).default('asc'),
  include_id: z.coerce.number().int().positive().optional(),
  all: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform(v => v === true || v === 'true')
});

export type PerfilOperativoListQuery = z.infer<typeof perfilOperativoListQuerySchema>;

const PERFIL_OPERATIVO_SELECT = {
  id: true,
  nombre: true,
  edad: true,
  diagnostico_clinico: true,
  diagnostico_secundario: true,
  notas: true
} as const;

export async function listarPerfilesOperativoPaginado(
  userId: number,
  institucionId: number | null | undefined,
  rol: string,
  query: PerfilOperativoListQuery
) {
  const ids = await getPerfilIdsAccesibles(userId, institucionId, {
    soloConsentimientoActivo: true,
    rol
  });

  const totalAsignados = ids.length;

  if (ids.length === 0) {
    return {
      perfiles: [],
      paginacion: {
        page: query.page,
        limit: query.limit,
        total: 0,
        totalPages: 0
      },
      resumen: { total: 0, filtrados: 0 }
    };
  }

  const search = buildSearchWhere(query.q);
  const where: Prisma.PerfilWhereInput = {
    id: { in: ids },
    ...(search ?? {})
  };

  const [totalFiltrados, perfiles] = await Promise.all([
    prisma.perfil.count({ where }),
    prisma.perfil.findMany({
      where,
      select: PERFIL_OPERATIVO_SELECT,
      orderBy: orderByFromQuery(query.sort, query.order),
      ...(query.all
        ? {}
        : {
            skip: (query.page - 1) * query.limit,
            take: query.limit
          })
    })
  ]);

  const effectiveLimit = query.all ? totalFiltrados || 1 : query.limit;
  const effectivePage = query.all ? 1 : query.page;
  const effectivePages = query.all ? 1 : Math.ceil(totalFiltrados / query.limit) || 0;

  let lista = perfiles;
  if (
    query.include_id &&
    ids.includes(query.include_id) &&
    !lista.some(p => p.id === query.include_id)
  ) {
    const extra = await prisma.perfil.findFirst({
      where: { id: query.include_id },
      select: PERFIL_OPERATIVO_SELECT
    });
    if (extra) {
      lista = [extra, ...lista];
    }
  }

  return {
    perfiles: lista,
    paginacion: {
      page: effectivePage,
      limit: effectiveLimit,
      total: totalFiltrados,
      totalPages: effectivePages
    },
    resumen: {
      total: totalAsignados,
      filtrados: totalFiltrados
    }
  };
}

export async function idsPerfilesAdminAccesibles(
  institucionId: number,
  tipoInstitucion: string,
  tipoFiltro: PerfilListQuery['tipo']
): Promise<{ ids: number[]; propios: number; compartidos: number }> {
  const propiosRows = await prisma.perfil.findMany({
    where: { institucion_id: institucionId },
    select: { id: true }
  });
  const propiosSet = new Set(propiosRows.map(p => p.id));

  let compartidosSet = new Set<number>();
  if (adminPuedeGestionarColaboracion(tipoInstitucion as Parameters<typeof adminPuedeGestionarColaboracion>[0])) {
    const cols = await prisma.solicitudInstitucionPerfil.findMany({
      where: { institucion_invitada_id: institucionId, estado: 'ACEPTADA' },
      select: { perfil_id: true }
    });
    compartidosSet = new Set(cols.map(c => c.perfil_id).filter(id => !propiosSet.has(id)));
  }

  let ids: number[];
  if (tipoFiltro === 'propios') {
    ids = [...propiosSet];
  } else if (tipoFiltro === 'compartidos') {
    ids = [...compartidosSet];
  } else {
    ids = [...new Set([...propiosSet, ...compartidosSet])];
  }

  return {
    ids,
    propios: propiosSet.size,
    compartidos: compartidosSet.size
  };
}

function buildSearchWhere(q?: string): Prisma.PerfilWhereInput | undefined {
  if (!q) return undefined;
  return {
    nombre: { contains: q, mode: 'insensitive' }
  };
}

function buildDiagnosticoWhere(
  diagnostico?: PerfilListQuery['diagnostico']
): Prisma.PerfilWhereInput | undefined {
  if (!diagnostico) return undefined;
  return {
    OR: [
      { diagnostico_clinico: diagnostico },
      { diagnostico_secundario: diagnostico }
    ]
  };
}

function buildNivelWhere(
  nivel?: PerfilListQuery['nivel']
): Prisma.PerfilWhereInput | undefined {
  if (!nivel) return undefined;
  if (nivel === 'sin_nivel') {
    return { nivel_educacional: null };
  }
  return { nivel_educacional: nivel };
}

function orderByFromQuery(
  sort: PerfilListQuery['sort'] | PerfilOperativoListQuery['sort'],
  order: PerfilListQuery['order']
): Prisma.PerfilOrderByWithRelationInput | Prisma.PerfilOrderByWithRelationInput[] {
  if (sort === 'consentimiento') {
    return { consentimiento_estado: order };
  }
  if (sort === 'nivel_educacional') {
    return [
      { nivel_educacional: { sort: order, nulls: order === 'asc' ? 'last' : 'first' } },
      { nombre: 'asc' }
    ];
  }
  return { [sort]: order };
}

export async function listarPerfilesAdminPaginado(
  institucionId: number,
  tipoInstitucion: string,
  query: PerfilListQuery
) {
  const { ids, propios, compartidos } = await idsPerfilesAdminAccesibles(
    institucionId,
    tipoInstitucion,
    query.tipo
  );

  if (ids.length === 0) {
    return {
      perfiles: [],
      paginacion: {
        page: query.page,
        limit: query.limit,
        total: 0,
        totalPages: 0
      },
      resumen: {
        total: propios + compartidos,
        propios,
        compartidos,
        filtrados: 0
      }
    };
  }

  const search = buildSearchWhere(query.q);
  const nivelFilter = buildNivelWhere(query.nivel);
  const diagnosticoFilter = buildDiagnosticoWhere(query.diagnostico);
  const where: Prisma.PerfilWhereInput = {
    id: { in: ids },
    ...(search ?? {}),
    ...(nivelFilter ?? {}),
    ...(diagnosticoFilter ?? {})
  };

  const [totalFiltrados, perfiles] = await Promise.all([
    prisma.perfil.count({ where }),
    prisma.perfil.findMany({
      where,
      orderBy: orderByFromQuery(query.sort, query.order),
      skip: (query.page - 1) * query.limit,
      take: query.limit
    })
  ]);

  return {
    perfiles,
    paginacion: {
      page: query.page,
      limit: query.limit,
      total: totalFiltrados,
      totalPages: Math.ceil(totalFiltrados / query.limit) || 0
    },
    resumen: {
      total: propios + compartidos,
      propios,
      compartidos,
      filtrados: totalFiltrados
    }
  };
}

export async function adminTieneAccesoPerfil(
  institucionId: number,
  tipoInstitucion: string,
  perfilId: number
): Promise<boolean> {
  const perfil = await prisma.perfil.findUnique({
    where: { id: perfilId },
    select: { institucion_id: true }
  });
  if (!perfil) return false;
  if (perfil.institucion_id === institucionId) return true;
  if (!adminPuedeGestionarColaboracion(tipoInstitucion as Parameters<typeof adminPuedeGestionarColaboracion>[0])) {
    return false;
  }
  const col = await prisma.solicitudInstitucionPerfil.findFirst({
    where: {
      perfil_id: perfilId,
      institucion_invitada_id: institucionId,
      estado: 'ACEPTADA'
    }
  });
  return !!col;
}
