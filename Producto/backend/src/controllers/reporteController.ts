import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { PrismaClient, privacidad_observacion_enum } from '@prisma/client';
import { z } from 'zod';
import { enviarReportePdf } from '../utils/reportePdf';

const prisma = new PrismaClient();

const ROLES_REPORTE = ['EDUCADOR', 'FAMILIA', 'PROFESIONAL', 'MEDICO'] as const;

function privacidadVisibleParaRol(rol: string): privacidad_observacion_enum[] {
  switch (rol) {
    case 'MEDICO':
      return ['PUBLICA', 'PRIVADA', 'MULTINIVEL'];
    case 'PROFESIONAL':
      return ['PUBLICA', 'MULTINIVEL'];
    default:
      return ['PUBLICA'];
  }
}

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

    const perfil = await prisma.perfil.findFirst({
      where: { id: data.perfil_id, institucion_id: user.institucion_id ?? -1 }
    });
    if (!perfil) {
      return res.status(404).json({ error: 'Perfil no encontrado en su institución' });
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
        creador: { select: { nombre_completo: true, id: true } },
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

    const esSuperadmin = user?.rol === 'SUPERADMIN';
    const esCreador = user?.userId === reporte.creador_id;
    if (!esSuperadmin && !esCreador) {
      return res.status(403).json({ error: 'No autorizado' });
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
      creador: reporte.creador,
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
    const { formato, desde, hasta } = req.query;
    const where: {
      formato?: 'PDF' | 'EXCEL';
      AND?: Array<{ fecha_inicio?: { gte?: Date }; fecha_fin?: { lte?: Date } }>;
    } = {};

    if (formato === 'PDF' || formato === 'EXCEL') {
      where.formato = formato;
    }

    if (desde || hasta) {
      const rango: { fecha_inicio?: { gte?: Date }; fecha_fin?: { lte?: Date } } = {};
      if (desde) rango.fecha_inicio = { gte: new Date(String(desde)) };
      if (hasta) rango.fecha_fin = { lte: new Date(String(hasta)) };
      where.AND = [rango];
    }

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
                categoria: true,
                fecha_evento: true,
                perfil: { select: { nombre: true } }
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
    if (
      user?.rol !== 'SUPERADMIN' &&
      user?.userId !== reporte.creador_id
    ) {
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
    const esSuperadmin = user?.rol === 'SUPERADMIN';
    const esCreador = user?.userId === reporte.creador_id;
    if (!esSuperadmin && !esCreador) {
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
