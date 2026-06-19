import { PrismaClient, rol_perfil_enum, rol_enum } from '@prisma/client';

const prisma = new PrismaClient();

const ROLES_OPERATIVOS: rol_enum[] = ['FAMILIA', 'EDUCADOR', 'PROFESIONAL', 'MEDICO'];

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

/** IDs de perfiles que el usuario puede consultar (vínculo explícito o perfiles de su institución). */
export async function getPerfilIdsAccesibles(
  userId: number,
  institucionId?: number | null
): Promise<number[]> {
  const [vinculos, porInstitucion] = await Promise.all([
    prisma.perfilUsuario.findMany({
      where: { usuario_id: userId },
      select: { perfil_id: true }
    }),
    institucionId
      ? prisma.perfil.findMany({
          where: { institucion_id: institucionId },
          select: { id: true }
        })
      : Promise.resolve([])
  ]);

  const ids = new Set<number>();
  for (const v of vinculos) ids.add(v.perfil_id);
  for (const p of porInstitucion) ids.add(p.id);
  return [...ids];
}

export async function getPerfilesAccesibles(userId: number, institucionId?: number | null) {
  const ids = await getPerfilIdsAccesibles(userId, institucionId);
  if (ids.length === 0) return [];
  return prisma.perfil.findMany({
    where: { id: { in: ids } },
    orderBy: { nombre: 'asc' }
  });
}

export async function usuarioTieneAccesoPerfil(
  userId: number,
  perfilId: number,
  institucionId?: number | null
): Promise<boolean> {
  const ids = await getPerfilIdsAccesibles(userId, institucionId);
  return ids.includes(perfilId);
}

/** Vincula un usuario operativo a todos los perfiles de su institución. */
export async function vincularUsuarioAPerfilesInstitucion(
  userId: number,
  institucionId: number,
  rol: string
) {
  const rolPerfil = rolEnPerfil(rol);
  if (!rolPerfil) return;

  const perfiles = await prisma.perfil.findMany({
    where: { institucion_id: institucionId },
    select: { id: true }
  });

  for (const p of perfiles) {
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
  const usuarios = await prisma.usuario.findMany({
    where: {
      institucion_id: institucionId,
      rol: { in: ROLES_OPERATIVOS }
    },
    select: { id: true, rol: true }
  });

  for (const u of usuarios) {
    const rolPerfil = rolEnPerfil(u.rol);
    if (!rolPerfil) continue;
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
  rol: string
) {
  const rolPerfil = rolEnPerfil(rol);
  if (!rolPerfil) {
    throw new Error('Rol no vinculable a perfil');
  }
  return prisma.perfilUsuario.upsert({
    where: { perfil_id_usuario_id: { perfil_id: perfilId, usuario_id: usuarioId } },
    create: {
      perfil_id: perfilId,
      usuario_id: usuarioId,
      rol_en_perfil: rolPerfil,
      puede_editar: false
    },
    update: { rol_en_perfil: rolPerfil }
  });
}
