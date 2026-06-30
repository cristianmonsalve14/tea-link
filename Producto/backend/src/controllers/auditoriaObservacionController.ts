import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAuditoriaObservaciones = async (_req: Request, res: Response) => {
  try {
    const acciones = await prisma.auditoriaObservacion.findMany({
      orderBy: { created_at: 'desc' },
      take: 200,
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombre_completo: true,
            rol: true
          }
        }
      }
    });

    const observacionIds = [
      ...new Set(acciones.map(a => a.observacion_id).filter((id): id is number => id != null))
    ];
    const perfilIds = [
      ...new Set(acciones.map(a => a.perfil_id).filter((id): id is number => id != null))
    ];

    const [observaciones, perfiles] = await Promise.all([
      observacionIds.length
        ? prisma.observacion.findMany({
            where: { id: { in: observacionIds } },
            select: { id: true, titulo: true }
          })
        : Promise.resolve([]),
      perfilIds.length
        ? prisma.perfil.findMany({
            where: { id: { in: perfilIds } },
            select: { id: true, nombre: true }
          })
        : Promise.resolve([])
    ]);

    const obsMap = new Map(observaciones.map(o => [o.id, o.titulo]));
    const perfilMap = new Map(perfiles.map(p => [p.id, p.nombre]));

    return res.json({
      acciones: acciones.map(row => ({
        ...row,
        observacion_titulo:
          row.observacion_id != null ? (obsMap.get(row.observacion_id) ?? null) : null,
        perfil_nombre: row.perfil_id != null ? (perfilMap.get(row.perfil_id) ?? null) : null
      }))
    });
  } catch (error) {
    console.error('[AUDITORIA_OBS][LIST]', error);
    return res.status(500).json({ error: 'Error al obtener auditoría de observaciones' });
  }
};
