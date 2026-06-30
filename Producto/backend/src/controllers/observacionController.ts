import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  getPerfilIdsAccesibles,
  usuarioTieneAccesoPerfil
} from '../utils/perfilAccess';
import { privacidadVisibleParaRol } from '../utils/privacidadObservacion';
import {
  isRolBloqueadoBitacora,
  isRolLecturaObservacion,
  isRolOperativoObservacion,
  isPerfilIdQueryInvalid,
  observacionCreateSchema,
  observacionUpdateSchema,
  resolverPrivacidadAlCrear
} from '../utils/observacionRules';
import { verificarPerfilOperativo } from '../utils/perfilConsentimiento';
import {
  ACCION_AUDITORIA_OBS,
  esPrivacidadAuditable,
  filtrarObservacionesAuditables,
  ipDesdeRequest,
  registrarAuditoriaObservacion
} from '../utils/auditoriaObservacion';

const prisma = new PrismaClient();

async function assertAccesoPerfil(
  userId: number,
  perfilId: number,
  institucionId?: number | null,
  rol?: string | null
) {
  const ok = await usuarioTieneAccesoPerfil(userId, perfilId, institucionId, rol);
  return ok;
}

export const getUltimasObservaciones = async (_req: AuthRequest, res: Response) => {
  try {
    const observaciones = await prisma.observacion.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        autor: { select: { email: true, nombre_completo: true, rol: true } },
        perfil: { select: { nombre: true } }
      }
    });
    res.json({ observaciones });
  } catch {
    return res.status(500).json({ error: 'Error obteniendo observaciones' });
  }
};

export const listObservaciones = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user?.rol || !isRolLecturaObservacion(user.rol)) {
      return res.status(403).json({ error: 'Rol no autorizado' });
    }

    if (!user?.userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const perfilId = req.query.perfil_id ? Number(req.query.perfil_id) : undefined;
    if (isPerfilIdQueryInvalid(req.query.perfil_id)) {
      return res.status(400).json({ error: 'perfil_id inválido' });
    }

    const perfilIdsAccesibles = await getPerfilIdsAccesibles(user.userId, user.institucion_id, {
      rol: user.rol
    });
    if (perfilIdsAccesibles.length === 0) {
      return res.json({ observaciones: [] });
    }

    if (perfilId) {
      if (!perfilIdsAccesibles.includes(perfilId)) {
        return res.status(404).json({ error: 'Perfil no encontrado o sin acceso' });
      }
      const consent = await verificarPerfilOperativo(perfilId);
      if (!consent.ok) {
        return res.status(consent.status).json({ error: consent.error });
      }
    }

    const visibles = privacidadVisibleParaRol(user.rol);

    const observaciones = await prisma.observacion.findMany({
      where: {
        privacidad: { in: visibles },
        perfil_id: perfilId ?? { in: perfilIdsAccesibles }
      },
      orderBy: { fecha_evento: 'desc' },
      include: {
        autor: { select: { id: true, nombre_completo: true, rol: true } },
        perfil: { select: { id: true, nombre: true } }
      }
    });

    const sensibles = filtrarObservacionesAuditables(observaciones);
    if (sensibles.length > 0 && user.userId) {
      const perfilAudit = perfilId ?? sensibles[0]?.perfil_id;
      const multinivel = sensibles.filter(o => o.privacidad === 'MULTINIVEL').length;
      const privada = sensibles.filter(o => o.privacidad === 'PRIVADA').length;
      await registrarAuditoriaObservacion(prisma, {
        usuarioId: user.userId,
        accion: ACCION_AUDITORIA_OBS.CONSULTAR_LISTA,
        perfilId: perfilAudit,
        detalles: `Listó bitácora: ${sensibles.length} sensible(s) — MULTINIVEL: ${multinivel}, PRIVADA: ${privada}`,
        ipAddress: ipDesdeRequest(req)
      });
    }

    return res.json({ observaciones });
  } catch (error) {
    console.error('[OBSERVACIONES][LIST]', error);
    return res.status(500).json({ error: 'Error al obtener observaciones' });
  }
};

export const getObservacionById = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user?.rol || !isRolLecturaObservacion(user.rol)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const visibles = privacidadVisibleParaRol(user.rol);
    const observacion = await prisma.observacion.findFirst({
      where: {
        id,
        ...(isRolOperativoObservacion(user.rol)
          ? { OR: [{ privacidad: { in: visibles } }, { autor_id: user.userId }] }
          : { privacidad: { in: visibles } })
      },
      include: {
        autor: { select: { id: true, nombre_completo: true, rol: true } },
        perfil: { select: { id: true, nombre: true } }
      }
    });

    if (!observacion) {
      return res.status(404).json({ error: 'Observación no encontrada' });
    }

    const tieneAcceso = await assertAccesoPerfil(
      user.userId,
      observacion.perfil_id,
      user.institucion_id,
      user.rol
    );
    if (!tieneAcceso) {
      return res.status(404).json({ error: 'Observación no encontrada' });
    }

    const consent = await verificarPerfilOperativo(observacion.perfil_id);
    if (!consent.ok) {
      return res.status(consent.status).json({ error: consent.error });
    }

    if (esPrivacidadAuditable(observacion.privacidad) && user.userId) {
      await registrarAuditoriaObservacion(prisma, {
        usuarioId: user.userId,
        accion: ACCION_AUDITORIA_OBS.CONSULTAR,
        observacionId: observacion.id,
        perfilId: observacion.perfil_id,
        privacidad: observacion.privacidad,
        detalles: `Consultó observación sensible: ${observacion.titulo}`,
        ipAddress: ipDesdeRequest(req)
      });
    }

    return res.json({ observacion });
  } catch (error) {
    console.error('[OBSERVACIONES][GET]', error);
    return res.status(500).json({ error: 'Error al obtener observación' });
  }
};

export const crearObservacion = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user?.userId || !user.rol) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (isRolBloqueadoBitacora(user.rol)) {
      return res.status(403).json({
        error: 'Los administradores no pueden crear observaciones.'
      });
    }
    if (!isRolOperativoObservacion(user.rol)) {
      return res.status(403).json({ error: 'Rol no autorizado' });
    }

    const data = observacionCreateSchema.parse(req.body);
    const tieneAcceso = await assertAccesoPerfil(
      user.userId,
      data.perfil_id,
      user.institucion_id,
      user.rol
    );
    if (!tieneAcceso) {
      return res.status(404).json({ error: 'Perfil no encontrado o sin acceso' });
    }

    const consent = await verificarPerfilOperativo(data.perfil_id);
    if (!consent.ok) {
      return res.status(consent.status).json({ error: consent.error });
    }

    const privacidad = resolverPrivacidadAlCrear(user.rol, data.privacidad);

    const observacion = await prisma.observacion.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        categoria: data.categoria,
        fecha_evento: new Date(data.fecha_evento),
        perfil_id: data.perfil_id,
        autor_id: user.userId,
        privacidad
      },
      include: {
        autor: { select: { nombre_completo: true, rol: true } },
        perfil: { select: { nombre: true } }
      }
    });

    if (esPrivacidadAuditable(privacidad)) {
      await registrarAuditoriaObservacion(prisma, {
        usuarioId: user.userId,
        accion: ACCION_AUDITORIA_OBS.CREAR,
        observacionId: observacion.id,
        perfilId: observacion.perfil_id,
        privacidad,
        detalles: `Creó observación ${privacidad}: ${observacion.titulo}`,
        ipAddress: ipDesdeRequest(req)
      });
    }

    return res.status(201).json({ message: 'Observación creada', observacion });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('[OBSERVACIONES][CREATE]', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const actualizarObservacion = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    if (!user?.userId || isRolBloqueadoBitacora(user.rol)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const existente = await prisma.observacion.findUnique({ where: { id } });
    if (!existente) {
      return res.status(404).json({ error: 'Observación no encontrada' });
    }
    const tieneAcceso = await assertAccesoPerfil(
      user.userId,
      existente.perfil_id,
      user.institucion_id,
      user.rol
    );
    if (!tieneAcceso) {
      return res.status(404).json({ error: 'Observación no encontrada' });
    }
    if (existente.autor_id !== user.userId) {
      return res.status(403).json({ error: 'Solo puede editar sus propias observaciones' });
    }

    const data = observacionUpdateSchema.parse(req.body);
    const privacidadResultante =
      user.rol === 'MEDICO' && data.privacidad ? data.privacidad : existente.privacidad;

    const observacion = await prisma.observacion.update({
      where: { id },
      data: {
        ...(data.titulo && { titulo: data.titulo }),
        ...(data.descripcion && { descripcion: data.descripcion }),
        ...(data.categoria && { categoria: data.categoria }),
        ...(data.fecha_evento && { fecha_evento: new Date(data.fecha_evento) }),
        ...(user.rol === 'MEDICO' && data.privacidad && { privacidad: data.privacidad })
      },
      include: {
        autor: { select: { id: true, nombre_completo: true, rol: true } },
        perfil: { select: { id: true, nombre: true } }
      }
    });

    if (
      esPrivacidadAuditable(existente.privacidad) ||
      esPrivacidadAuditable(privacidadResultante)
    ) {
      await registrarAuditoriaObservacion(prisma, {
        usuarioId: user.userId,
        accion: ACCION_AUDITORIA_OBS.EDITAR,
        observacionId: observacion.id,
        perfilId: observacion.perfil_id,
        privacidad: privacidadResultante,
        detalles:
          existente.privacidad !== privacidadResultante
            ? `Editó observación sensible (${existente.privacidad} → ${privacidadResultante}): ${observacion.titulo}`
            : `Editó observación sensible (${privacidadResultante}): ${observacion.titulo}`,
        ipAddress: ipDesdeRequest(req)
      });
    }

    return res.json({ message: 'Observación actualizada', observacion });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al actualizar observación' });
  }
};

export const eliminarObservacion = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    if (!user?.userId || isRolBloqueadoBitacora(user.rol)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const existente = await prisma.observacion.findUnique({ where: { id } });
    if (!existente) {
      return res.status(404).json({ error: 'Observación no encontrada' });
    }
    const tieneAcceso = await assertAccesoPerfil(
      user.userId,
      existente.perfil_id,
      user.institucion_id,
      user.rol
    );
    if (!tieneAcceso) {
      return res.status(404).json({ error: 'Observación no encontrada' });
    }
    if (existente.autor_id !== user.userId) {
      return res.status(403).json({ error: 'Solo puede eliminar sus propias observaciones' });
    }

    if (esPrivacidadAuditable(existente.privacidad)) {
      await registrarAuditoriaObservacion(prisma, {
        usuarioId: user.userId,
        accion: ACCION_AUDITORIA_OBS.ELIMINAR,
        observacionId: existente.id,
        perfilId: existente.perfil_id,
        privacidad: existente.privacidad,
        detalles: `Eliminó observación ${existente.privacidad} id=${existente.id}`,
        ipAddress: ipDesdeRequest(req)
      });
    }

    await prisma.observacion.delete({ where: { id } });
    return res.json({ message: 'Observación eliminada' });
  } catch {
    return res.status(500).json({ error: 'Error al eliminar observación' });
  }
};
