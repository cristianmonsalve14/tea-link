import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { enviarReportePdf } from '../utils/reportePdf';
import { usuarioTieneAccesoPerfil } from '../utils/perfilAccess';
import { privacidadVisibleParaRol } from '../utils/privacidadObservacion';
import { buildReportesListWhere } from '../utils/reporteListQuery';
import { canViewReporte, isValidNumericId } from '../utils/reporteAccess';
import { verificarPerfilOperativo } from '../utils/perfilConsentimiento';
import {
  ACCION_AUDITORIA_OBS,
  filtrarObservacionesAuditables,
  ipDesdeRequest,
  registrarAuditoriaObservacion
} from '../utils/auditoriaObservacion';

const prisma = new PrismaClient();

const ROLES_REPORTE = ['EDUCADOR', 'FAMILIA', 'PROFESIONAL', 'MEDICO'] as const;

const createReporteSchema = z.object({
  titulo: z.string().min(2),
  fecha_inicio: z.string().min(1),
  fecha_fin: z.string().min(1),
  formato: z.enum(['PDF', 'EXCEL']),
  perfil_id: z.coerce.number().int().positive(),
  observacion_ids: z.array(z.coerce.number().int().positive()).min(1)
});

const updateReporteSchema = z.object({
  titulo: z.string().min(2).optional(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  formato: z.enum(['PDF', 'EXCEL']).optional(),
  url_archivo: z.string().url().optional().nullable()
});

export const listMisReportes = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user?.userId || !ROLES_REPORTE.includes(user.rol as (typeof ROLES_REPORTE)[number])) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const reportes = await prisma.reporte.findMany({
      where: { creador_id: user.userId },
      orderBy: { created_at: 'desc' },
      include: {
        _count: { select: { observaciones: true } },
        observaciones: {
          take: 1,
          include: {
            observacion: {
              select: { perfil: { select: { id: true, nombre: true } } }
            }
          }
        }
      }
    });

    return res.json({ reportes });
  } catch (error) {
    console.error('[REPORTES][MIS]', error);
    return res.status(500).json({ error: 'Error al obtener reportes' });
  }
};

export const createReporte = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user?.userId || !ROLES_REPORTE.includes(user.rol as (typeof ROLES_REPORTE)[number])) {
      return res.status(403).json({ error: 'No autorizado para crear reportes' });
    }

    const data = createReporteSchema.parse(req.body);
    const inicio = new Date(data.fecha_inicio);
    const fin = new Date(data.fecha_fin);
    if (fin < inicio) {
      return res.status(400).json({ error: 'La fecha fin debe ser posterior a la fecha inicio' });
    }

    const perfil = await prisma.perfil.findUnique({
      where: { id: data.perfil_id },
      select: { id: true, nombre: true }
    });
    if (!perfil) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    const tieneAcceso = await usuarioTieneAccesoPerfil(
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

    const visibles = privacidadVisibleParaRol(user.rol);
    const observaciones = await prisma.observacion.findMany({
      where: {
        id: { in: data.observacion_ids },
        perfil_id: data.perfil_id,
        privacidad: { in: visibles }
      },
      include: {
        autor: { select: { nombre_completo: true } },
        perfil: { select: { nombre: true } }
      }
    });

    if (observaciones.length !== data.observacion_ids.length) {
      return res.status(400).json({
        error: 'Algunas observaciones no existen o no puede incluirlas en el reporte'
      });
    }

    const reporte = await prisma.reporte.create({
      data: {
        titulo: data.titulo,
        fecha_inicio: inicio,
        fecha_fin: fin,
        formato: data.formato,
        creador_id: user.userId,
        observaciones: {
          create: data.observacion_ids.map(observacion_id => ({ observacion_id }))
        }
      },
      include: {
        observaciones: {
          include: {
            observacion: {
              select: {
                id: true,
                titulo: true,
                descripcion: true,
                categoria: true,
                fecha_evento: true,
                perfil: { select: { nombre: true } }
              }
            }
          }
        }
      }
    });

    const sensibles = filtrarObservacionesAuditables(observaciones);
    if (sensibles.length > 0) {
      await registrarAuditoriaObservacion(prisma, {
        usuarioId: user.userId,
        accion: ACCION_AUDITORIA_OBS.CREAR_REPORTE,
        reporteId: reporte.id,
        perfilId: data.perfil_id,
        detalles: `Reporte "${reporte.titulo}" incluye ${sensibles.length} observación(es) sensible(s)`,
        ipAddress: ipDesdeRequest(req)
      });
    }

    return res.status(201).json({ message: 'Reporte creado', reporte });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('[REPORTES][CREATE]', error);
    return res.status(500).json({ error: 'Error al crear reporte' });
  }
};

export const exportReporte = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const reporte = await prisma.reporte.findUnique({
      where: { id },
      include: {
        creador: {
          select: {
            id: true,
            nombre_completo: true,
            rol: true,
            email: true,
            institucion: { select: { nombre: true } }
          }
        },
        observaciones: {
          include: {
            observacion: {
              include: {
                autor: { select: { nombre_completo: true } },
                perfil: { select: { nombre: true } }
              }
            }
          }
        }
      }
    });

    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });

    if (!canViewReporte(user?.rol, user?.userId, reporte.creador_id)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const obsEnReporte = reporte.observaciones.map(o => o.observacion);
    const sensibles = filtrarObservacionesAuditables(obsEnReporte);
    if (sensibles.length > 0 && user?.userId) {
      await registrarAuditoriaObservacion(prisma, {
        usuarioId: user.userId,
        accion: ACCION_AUDITORIA_OBS.EXPORTAR_REPORTE,
        reporteId: reporte.id,
        perfilId: sensibles[0]?.perfil_id ?? null,
        detalles: `Exportó reporte #${reporte.id} (${reporte.formato}) con ${sensibles.length} observación(es) sensible(s)`,
        ipAddress: ipDesdeRequest(req)
      });
    }

    const perfilNombre =
      reporte.observaciones[0]?.observacion.perfil.nombre ?? 'Estudiante';

    if (reporte.formato === 'EXCEL') {
      const header = 'Fecha,Categoría,Título,Descripción,Autor';
      const rows = reporte.observaciones.map(o => {
        const obs = o.observacion;
        const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
        return [
          obs.fecha_evento.toISOString().slice(0, 10),
          obs.categoria,
          esc(obs.titulo),
          esc(obs.descripcion),
          esc(obs.autor.nombre_completo)
        ].join(',');
      });
      const csv = [header, ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="reporte-${reporte.id}.csv"`
      );
      return res.send('\uFEFF' + csv);
    }

    await enviarReportePdf(res, {
      id: reporte.id,
      titulo: reporte.titulo,
      fecha_inicio: reporte.fecha_inicio,
      fecha_fin: reporte.fecha_fin,
      emitidoEn: new Date(),
      observacionIds: reporte.observaciones.map(o => o.observacion.id),
      creador: {
        id: reporte.creador.id,
        nombre_completo: reporte.creador.nombre_completo,
        rol: reporte.creador.rol,
        email: reporte.creador.email
      },
      institucionNombre: reporte.creador.institucion?.nombre ?? null,
      perfilNombre,
      observaciones: reporte.observaciones.map(o => o.observacion)
    });
    return;
  } catch (error) {
    console.error('[REPORTES][EXPORT]', error);
    return res.status(500).json({ error: 'Error al exportar reporte' });
  }
};

export const listReportes = async (req: AuthRequest, res: Response) => {
  try {
    const where = buildReportesListWhere(req.query);

    const reportes = await prisma.reporte.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        creador: {
          select: {
            id: true,
            nombre_completo: true,
            email: true,
            institucion: { select: { nombre: true } }
          }
        },
        _count: { select: { observaciones: true } }
      }
    });

    return res.json({ reportes });
  } catch (error) {
    console.error('[REPORTES][LIST]', error);
    return res.status(500).json({ error: 'Error al obtener reportes' });
  }
};

export const getReporteById = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const reporte = await prisma.reporte.findUnique({
      where: { id },
      include: {
        creador: {
          select: {
            id: true,
            nombre_completo: true,
            email: true,
            institucion: { select: { nombre: true } }
          }
        },
        observaciones: {
          include: {
            observacion: {
              select: {
                id: true,
                titulo: true,
                descripcion: true,
                categoria: true,
                fecha_evento: true,
                perfil: { select: { nombre: true } },
                autor: { select: { nombre_completo: true, rol: true } }
              }
            }
          }
        }
      }
    });

    if (!reporte) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    const user = req.user;
    if (!canViewReporte(user?.rol, user?.userId, reporte.creador_id)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    return res.json({ reporte });
  } catch (error) {
    console.error('[REPORTES][GET]', error);
    return res.status(500).json({ error: 'Error al obtener reporte' });
  }
};

export const updateReporte = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const data = updateReporteSchema.parse(req.body);
    const existing = await prisma.reporte.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    if (data.fecha_inicio && data.fecha_fin) {
      const inicio = new Date(data.fecha_inicio);
      const fin = new Date(data.fecha_fin);
      if (fin < inicio) {
        return res.status(400).json({ error: 'La fecha fin debe ser posterior a la fecha inicio' });
      }
    }

    const reporte = await prisma.reporte.update({
      where: { id },
      data: {
        ...(data.titulo && { titulo: data.titulo }),
        ...(data.formato && { formato: data.formato }),
        ...(data.url_archivo !== undefined && { url_archivo: data.url_archivo }),
        ...(data.fecha_inicio && { fecha_inicio: new Date(data.fecha_inicio) }),
        ...(data.fecha_fin && { fecha_fin: new Date(data.fecha_fin) })
      },
      include: {
        creador: {
          select: { nombre_completo: true, email: true }
        },
        _count: { select: { observaciones: true } }
      }
    });

    if (req.user?.userId) {
      await prisma.auditoriaAdmin.create({
        data: {
          admin_id: req.user.userId,
          accion: 'EDITAR_REPORTE',
          entidad: 'reporte',
          entidad_id: reporte.id,
          detalles: `Reporte actualizado: ${reporte.titulo}`,
          ip_address: req.ip || null
        }
      });
    }

    return res.json({ message: 'Reporte actualizado', reporte });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('[REPORTES][UPDATE]', error);
    return res.status(500).json({ error: 'Error al actualizar reporte' });
  }
};

export const deleteReporte = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const reporte = await prisma.reporte.findUnique({ where: { id } });
    if (!reporte) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    const user = req.user;
    if (!canViewReporte(user?.rol, user?.userId, reporte.creador_id)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await prisma.reporte.delete({ where: { id } });

    if (req.user?.userId) {
      await prisma.auditoriaAdmin.create({
        data: {
          admin_id: req.user.userId,
          accion: 'ELIMINAR_REPORTE',
          entidad: 'reporte',
          entidad_id: id,
          detalles: `Reporte eliminado: ${reporte.titulo}`,
          ip_address: req.ip || null
        }
      });
    }

    return res.json({ message: 'Reporte eliminado' });
  } catch (error) {
    console.error('[REPORTES][DELETE]', error);
    return res.status(500).json({ error: 'Error al eliminar reporte' });
  }
};
