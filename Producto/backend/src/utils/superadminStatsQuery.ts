export const ROLES_KPIS = [
  'FAMILIA',
  'EDUCADOR',
  'PROFESIONAL',
  'ADMINISTRADOR',
  'MEDICO',
  'SUPERADMIN'
] as const;

export type RolKpi = (typeof ROLES_KPIS)[number];

export function parseStatsDateRange(desde: unknown, hasta: unknown) {
  const desdeStr = typeof desde === 'string' ? desde.trim() : '';
  const hastaStr = typeof hasta === 'string' ? hasta.trim() : '';
  if (!desdeStr && !hastaStr) return undefined;
  const created_at: { gte?: Date; lte?: Date } = {};
  if (desdeStr) created_at.gte = new Date(`${desdeStr}T00:00:00.000`);
  if (hastaStr) created_at.lte = new Date(`${hastaStr}T23:59:59.999`);
  return created_at;
}

export function parseRolFilter(rol: unknown): RolKpi | undefined {
  if (typeof rol !== 'string' || !rol.trim()) return undefined;
  const upper = rol.trim().toUpperCase();
  return ROLES_KPIS.includes(upper as RolKpi) ? (upper as RolKpi) : undefined;
}

export function parseInstitucionId(institucion: unknown): number | undefined {
  if (institucion == null || institucion === '') return undefined;
  const id = Number(institucion);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

export function buildSuperadminStatsWhere(query: {
  desde?: unknown;
  hasta?: unknown;
  rol?: unknown;
  institucion?: unknown;
}) {
  const dateRange = parseStatsDateRange(query.desde, query.hasta);
  const rolFilter = parseRolFilter(query.rol);
  const institucionId = parseInstitucionId(query.institucion);

  const usuarioWhere = {
    ...(institucionId != null && { institucion_id: institucionId }),
    ...(rolFilter && { rol: rolFilter }),
    ...(dateRange && { created_at: dateRange })
  };

  const perfilWhere = {
    ...(institucionId != null && { institucion_id: institucionId }),
    ...(dateRange && { created_at: dateRange }),
    ...(rolFilter &&
      institucionId == null && {
        usuarios: { some: { usuario: { rol: rolFilter } } }
      })
  };

  const observacionWhere = {
    ...(institucionId != null && { perfil: { institucion_id: institucionId } }),
    ...(rolFilter && { autor: { rol: rolFilter } }),
    ...(dateRange && { created_at: dateRange })
  };

  const institucionWhere = {
    ...(institucionId != null && { id: institucionId }),
    ...(dateRange && { created_at: dateRange }),
    ...(rolFilter &&
      institucionId == null && {
        usuarios: { some: { rol: rolFilter } }
      })
  };

  return { usuarioWhere, perfilWhere, observacionWhere, institucionWhere };
}
