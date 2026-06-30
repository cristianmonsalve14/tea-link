import { PrismaClient, nivel_educacional_enum, rol_perfil_enum, rol_enum, consentimiento_sujeto_enum } from '@prisma/client';
import { educadorAtiendeNivelPerfil } from './educadorEquipo';

const prisma = new PrismaClient();

const ROLES_OPERATIVOS: rol_enum[] = ['FAMILIA', 'EDUCADOR', 'PROFESIONAL', 'MEDICO'];
const ROLES_SOLO_VINCULO_EXPLICITO: rol_enum[] = ['MEDICO', 'PROFESIONAL', 'EDUCADOR'];

export type PerfilAccessOptions = {
  soloConsentimientoActivo?: boolean;
  rol?: string | null;
};

export function rolEnPerfil(rol: string): rol_perfil_enum | null {
  switch (rol) {
    case 'FAMILIA':
      return 'TUTOR';
    case 'EDUCADOR':
      return 'EDUCADOR';
    case 'PROFESIONAL':
      return 'PROFESIONAL';
    case 'MEDICO':
      return 'MEDICO';
    default:
      return null;
  }
}

export function rolEnPerfilParaConsentimiento(
  sujeto: consentimiento_sujeto_enum
): rol_perfil_enum {
  return sujeto === 'TITULAR' ? 'TITULAR' : 'TUTOR';
}

export function puedeGestionarConsentimientoPerfil(rolEnPerfil: rol_perfil_enum): boolean {
  return rolEnPerfil === 'TUTOR' || rolEnPerfil === 'TITULAR';
}

function usaSoloVinculoExplicito(rol?: string | null): boolean {
  return !!rol && ROLES_SOLO_VINCULO_EXPLICITO.includes(rol as rol_enum);
}

/** IDs de perfiles que el usuario puede consultar. */
export async function getPerfilIdsAccesibles(
  userId: number,
  institucionId?: number | null,
  options?: PerfilAccessOptions
): Promise<number[]> {
  const soloActivo = options?.soloConsentimientoActivo ?? true;
  const soloVinculo = usaSoloVinculoExplicito(options?.rol);

  const [vinculos, porInstitucion] = await Promise.all([
    prisma.perfilUsuario.findMany({
      where: { usuario_id: userId },
      select: { perfil_id: true }
    }),
    institucionId && !soloVinculo
      ? prisma.perfil.findMany({
          where: { institucion_id: institucionId },
          select: { id: true }
        })
      : Promise.resolve([])
  ]);

  const ids = new Set<number>();
  for (const v of vinculos) ids.add(v.perfil_id);
  for (const p of porInstitucion) ids.add(p.id);
  let allIds = [...ids];
  if (allIds.length === 0) return [];

  if (options?.rol === 'EDUCADOR') {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { niveles_educacionales: true }
    });
    const perfilesNivel = await prisma.perfil.findMany({
      where: { id: { in: allIds } },
      select: { id: true, nivel_educacional: true }
    });
    allIds = perfilesNivel
      .filter(p => educadorAtiendeNivelPerfil(usuario?.niveles_educacionales, p.nivel_educacional))
      .map(p => p.id);
    if (allIds.length === 0) return [];
  }

  if (!soloActivo) return allIds;

  if (options?.rol === 'FAMILIA') {
    const vinculosActivos = await prisma.perfilUsuario.findMany({
      where: {
        usuario_id: userId,
        perfil_id: { in: allIds },
        consentimiento_aceptado_at: { not: null },
        perfil: { consentimiento_estado: 'ACEPTADO' }
      },
      select: { perfil_id: true }
    });
    return vinculosActivos.map(v => v.perfil_id);
  }

  const activos = await prisma.perfil.findMany({
    where: { id: { in: allIds }, consentimiento_estado: 'ACEPTADO' },
    select: { id: true }
  });
  return activos.map(p => p.id);
}

export async function getPerfilesAccesibles(
  userId: number,
  institucionId?: number | null,
  options?: PerfilAccessOptions
) {
  const ids = await getPerfilIdsAccesibles(userId, institucionId, options);
  if (ids.length === 0) return [];
  return prisma.perfil.findMany({
    where: { id: { in: ids } },
    orderBy: { nombre: 'asc' }
  });
}

export async function usuarioTieneAccesoPerfil(
  userId: number,
  perfilId: number,
  institucionId?: number | null,
  rol?: string | null
): Promise<boolean> {
  const ids = await getPerfilIdsAccesibles(userId, institucionId, { rol });
  return ids.includes(perfilId);
}

/** Vincula un usuario operativo a todos los perfiles de su institución (excepto FAMILIA). */
export async function vincularUsuarioAPerfilesInstitucion(
  userId: number,
  institucionId: number,
  rol: string
) {
  if (rol === 'FAMILIA') return;
  const rolPerfil = rolEnPerfil(rol);
  if (!rolPerfil) return;

  const perfiles = await prisma.perfil.findMany({
    where: { institucion_id: institucionId },
    select: { id: true, nivel_educacional: true }
  });

  let nivelesEducador: nivel_educacional_enum[] = [];
  if (rol === 'EDUCADOR') {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { niveles_educacionales: true }
    });
    nivelesEducador = usuario?.niveles_educacionales ?? [];
  }

  for (const p of perfiles) {
    if (rol === 'EDUCADOR' && !educadorAtiendeNivelPerfil(nivelesEducador, p.nivel_educacional)) {
      continue;
    }
    await prisma.perfilUsuario.upsert({
      where: { perfil_id_usuario_id: { perfil_id: p.id, usuario_id: userId } },
      create: {
        perfil_id: p.id,
        usuario_id: userId,
        rol_en_perfil: rolPerfil,
        puede_editar: false
      },
      update: {}
    });
  }
}

/** Vincula el equipo operativo de una institución a un perfil recién creado. */
export async function vincularEquipoInstitucionAPerfil(perfilId: number, institucionId: number) {
  const perfil = await prisma.perfil.findUnique({
    where: { id: perfilId },
    select: { nivel_educacional: true }
  });

  const usuarios = await prisma.usuario.findMany({
    where: {
      institucion_id: institucionId,
      rol: { in: ROLES_OPERATIVOS }
    },
    select: { id: true, rol: true, niveles_educacionales: true }
  });

  for (const u of usuarios) {
    const rolPerfil = rolEnPerfil(u.rol);
    if (!rolPerfil) continue;
    if (
      u.rol === 'EDUCADOR' &&
      !educadorAtiendeNivelPerfil(u.niveles_educacionales, perfil?.nivel_educacional ?? null)
    ) {
      continue;
    }
    await prisma.perfilUsuario.upsert({
      where: { perfil_id_usuario_id: { perfil_id: perfilId, usuario_id: u.id } },
      create: {
        perfil_id: perfilId,
        usuario_id: u.id,
        rol_en_perfil: rolPerfil,
        puede_editar: false
      },
      update: {}
    });
  }
}

export async function vincularUsuarioAPerfil(
  perfilId: number,
  usuarioId: number,
  rol: string,
  rolPerfilExplicito?: rol_perfil_enum,
  options?: { puedeEditar?: boolean }
) {
  const rolPerfil = rolPerfilExplicito ?? rolEnPerfil(rol);
  if (!rolPerfil) {
    throw new Error('Rol no vinculable a perfil');
  }
  const puedeEditar = options?.puedeEditar ?? false;
  return prisma.perfilUsuario.upsert({
    where: { perfil_id_usuario_id: { perfil_id: perfilId, usuario_id: usuarioId } },
    create: {
      perfil_id: perfilId,
      usuario_id: usuarioId,
      rol_en_perfil: rolPerfil,
      puede_editar: puedeEditar
    },
    update: {
      rol_en_perfil: rolPerfil,
      ...(options?.puedeEditar !== undefined ? { puede_editar: puedeEditar } : {})
    }
  });
}
