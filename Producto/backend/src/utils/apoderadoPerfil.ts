import { PrismaClient, rol_perfil_enum } from '@prisma/client';

const prisma = new PrismaClient();

export const MAX_APODERADOS_POR_PERFIL = 3;

export function esRolApoderado(rol: rol_perfil_enum): boolean {
  return rol === 'TUTOR' || rol === 'TITULAR';
}

export async function contarApoderadosPerfil(perfilId: number): Promise<number> {
  return prisma.perfilUsuario.count({
    where: {
      perfil_id: perfilId,
      rol_en_perfil: { in: ['TUTOR', 'TITULAR'] }
    }
  });
}

export async function usuarioEsApoderadoPrincipal(
  usuarioId: number,
  perfilId: number
): Promise<boolean> {
  const vinculo = await prisma.perfilUsuario.findUnique({
    where: { perfil_id_usuario_id: { perfil_id: perfilId, usuario_id: usuarioId } }
  });
  if (!vinculo || !esRolApoderado(vinculo.rol_en_perfil)) return false;
  return vinculo.puede_editar === true;
}

export async function puedeInvitarApoderado(
  usuarioId: number,
  perfilId: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const perfil = await prisma.perfil.findUnique({
    where: { id: perfilId },
    select: { consentimiento_estado: true, nombre: true }
  });
  if (!perfil) {
    return { ok: false, error: 'Perfil no encontrado' };
  }
  if (perfil.consentimiento_estado !== 'ACEPTADO') {
    return {
      ok: false,
      error:
        'El consentimiento del perfil debe estar autorizado antes de invitar a otro apoderado.'
    };
  }

  const esPrincipal = await usuarioEsApoderadoPrincipal(usuarioId, perfilId);
  if (!esPrincipal) {
    return {
      ok: false,
      error: 'Solo el apoderado principal puede invitar a otros tutores o apoderados.'
    };
  }

  const total = await contarApoderadosPerfil(perfilId);
  if (total >= MAX_APODERADOS_POR_PERFIL) {
    return {
      ok: false,
      error: `Ya hay ${MAX_APODERADOS_POR_PERFIL} apoderados en este perfil. Para más accesos contacte al colegio o centro de salud.`
    };
  }

  return { ok: true };
}
