import { PrismaClient, tipo_institucion_enum } from '@prisma/client';
import { esInstitucionCreadoraPerfil } from './solicitudInstitucionRules';

const prisma = new PrismaClient();

export type ReceptorCustodia = {
  id: number;
  nombre: string;
  tipo: tipo_institucion_enum;
  solicitudId: number;
};

export class ErrorCesionCustodia extends Error {
  constructor(
    public codigo: 'NO_RECEPTOR' | 'NO_DUENO' | 'PERFIL_NO_ENCONTRADO',
    message: string
  ) {
    super(message);
    this.name = 'ErrorCesionCustodia';
  }
}

/** Institución creadora colaboradora (educacional o médica) con invitación aceptada. */
export async function buscarReceptorCustodia(
  perfilId: number,
  duenoInstitucionId: number
): Promise<ReceptorCustodia | null> {
  const solicitudes = await prisma.solicitudInstitucionPerfil.findMany({
    where: { perfil_id: perfilId, estado: 'ACEPTADA' },
    include: {
      institucion_invitada: { select: { id: true, nombre: true, tipo: true } },
      institucion_solicitante: { select: { id: true, nombre: true, tipo: true } }
    }
  });

  for (const s of solicitudes) {
    if (
      s.institucion_solicitante_id === duenoInstitucionId &&
      esInstitucionCreadoraPerfil(s.institucion_invitada.tipo)
    ) {
      return {
        id: s.institucion_invitada.id,
        nombre: s.institucion_invitada.nombre,
        tipo: s.institucion_invitada.tipo,
        solicitudId: s.id
      };
    }
    if (
      s.institucion_invitada_id === duenoInstitucionId &&
      esInstitucionCreadoraPerfil(s.institucion_solicitante.tipo)
    ) {
      return {
        id: s.institucion_solicitante.id,
        nombre: s.institucion_solicitante.nombre,
        tipo: s.institucion_solicitante.tipo,
        solicitudId: s.id
      };
    }
  }
  return null;
}

/**
 * Transfiere la custodia del perfil a la otra institución creadora colaboradora.
 * Conserva observaciones; retira acceso del equipo de la institución cedente.
 */
export async function ejecutarCesionCustodiaPerfil(
  perfilId: number,
  duenoInstitucionId: number,
  adminId: number,
  ip?: string | null
): Promise<ReceptorCustodia> {
  const perfil = await prisma.perfil.findUnique({
    where: { id: perfilId },
    select: { id: true, nombre: true, institucion_id: true }
  });
  if (!perfil) {
    throw new ErrorCesionCustodia('PERFIL_NO_ENCONTRADO', 'Perfil no encontrado.');
  }
  if (perfil.institucion_id !== duenoInstitucionId) {
    throw new ErrorCesionCustodia(
      'NO_DUENO',
      'Solo la institución dueña del perfil puede ceder la custodia.'
    );
  }

  const receptor = await buscarReceptorCustodia(perfilId, duenoInstitucionId);
  if (!receptor) {
    throw new ErrorCesionCustodia(
      'NO_RECEPTOR',
      'No hay colaboración activa con otra institución educacional o médica que pueda recibir la custodia.'
    );
  }

  await prisma.$transaction(async tx => {
    const usuariosSalientes = await tx.usuario.findMany({
      where: {
        institucion_id: duenoInstitucionId,
        rol: { in: ['EDUCADOR', 'MEDICO', 'PROFESIONAL'] }
      },
      select: { id: true }
    });
    if (usuariosSalientes.length > 0) {
      await tx.perfilUsuario.deleteMany({
        where: {
          perfil_id: perfilId,
          usuario_id: { in: usuariosSalientes.map(u => u.id) }
        }
      });
    }

    await tx.solicitudInstitucionPerfil.update({
      where: { id: receptor.solicitudId },
      data: {
        institucion_solicitante_id: receptor.id,
        institucion_invitada_id: duenoInstitucionId,
        estado: 'ACEPTADA'
      }
    });

    await tx.solicitudInstitucionPerfil.updateMany({
      where: {
        perfil_id: perfilId,
        institucion_solicitante_id: duenoInstitucionId,
        id: { not: receptor.solicitudId }
      },
      data: { institucion_solicitante_id: receptor.id }
    });

    await tx.perfil.update({
      where: { id: perfilId },
      data: { institucion_id: receptor.id }
    });

    await tx.auditoriaAdmin.create({
      data: {
        admin_id: adminId,
        accion: 'CEDER_CUSTODIA_PERFIL',
        entidad: 'perfil',
        entidad_id: perfilId,
        detalles: `Custodia de "${perfil.nombre}" cedida a ${receptor.nombre} (id ${receptor.id}). Observaciones conservadas.`,
        ip_address: ip ?? null
      }
    });
  });

  return receptor;
}
