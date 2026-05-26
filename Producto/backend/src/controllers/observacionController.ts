import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { PrismaClient, privacidad_observacion_enum } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const ROLES_OBSERVACION = ['EDUCADOR', 'FAMILIA', 'PROFESIONAL', 'MEDICO'] as const;

const observacionSchema = z.object({
  titulo: z.string().min(1),
  descripcion: z.string().min(1),
  categoria: z.enum([
    'CONDUCTA',
    'COMUNICACION',
    'SOCIAL',
    'ACADEMICO',
    'SENSORIAL',
    'MOTOR',
    'CLINICO',
    'OTRO'
  ]),
  fecha_evento: z.string().min(1),
  perfil_id: z.coerce.number().int().positive(),
  privacidad: z.enum(['PUBLICA', 'PRIVADA', 'MULTINIVEL']).optional()
});

const observacionUpdateSchema = observacionSchema.partial().omit({ perfil_id: true });

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

async function perfilDeInstitucion(perfilId: number, institucionId: number | undefined) {
  if (!institucionId) return null;
  return prisma.perfil.findFirst({
    where: { id: perfilId, institucion_id: institucionId }
  });
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
    if (!user?.rol || user.rol === 'ADMINISTRADOR' || user.rol === 'SUPERADMIN') {
      return res.status(403).json({
        error: 'Los administradores no pueden consultar observaciones.'
      });
    }
    if (!ROLES_OBSERVACION.includes(user.rol as (typeof ROLES_OBSERVACION)[number])) {
      return res.status(403).json({ error: 'Rol no autorizado' });
    }

    const perfilId = req.query.perfil_id ? Number(req.query.perfil_id) : undefined;
    if (perfilId !== undefined && isNaN(perfilId)) {
      return res.status(400).json({ error: 'perfil_id inválido' });
    }

    if (perfilId) {
      const perfil = await perfilDeInstitucion(perfilId, user.institucion_id);
      if (!perfil) {
        return res.status(404).json({ error: 'Perfil no encontrado en su institución' });
      }
    }

    const visibles = privacidadVisibleParaRol(user.rol);

    const observaciones = await prisma.observacion.findMany({
      where: {
        privacidad: { in: visibles },
        ...(perfilId ? { perfil_id: perfilId } : {}),
        perfil: { institucion_id: user.institucion_id ?? -1 }
      },
      orderBy: { fecha_evento: 'desc' },
      include: {
        autor: { select: { id: true, nombre_completo: true, rol: true } },
        perfil: { select: { id: true, nombre: true } }
      }
    });

    return res.json({ observaciones });
  } catch (error) {
    console.error('[OBSERVACIONES][LIST]', error);
    return res.status(500).json({ error: 'Error al obtener observaciones' });
  }
};

export const crearObservacion = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user?.userId || !user.rol) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (user.rol === 'ADMINISTRADOR' || user.rol === 'SUPERADMIN') {
      return res.status(403).json({
        error: 'Los administradores no pueden crear observaciones.'
      });
    }
    if (!ROLES_OBSERVACION.includes(user.rol as (typeof ROLES_OBSERVACION)[number])) {
      return res.status(403).json({ error: 'Rol no autorizado' });
    }

    const data = observacionSchema.parse(req.body);
    const perfil = await perfilDeInstitucion(data.perfil_id, user.institucion_id);
    if (!perfil) {
      return res.status(404).json({ error: 'Perfil no encontrado en su institución' });
    }

    let privacidad: privacidad_observacion_enum = 'PUBLICA';
    if (user.rol === 'MEDICO' && data.privacidad) {
      privacidad = data.privacidad;
    }

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
    if (!user?.userId || user.rol === 'ADMINISTRADOR' || user.rol === 'SUPERADMIN') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const existente = await prisma.observacion.findFirst({
      where: {
        id,
        perfil: { institucion_id: user.institucion_id ?? -1 }
      }
    });
    if (!existente) {
      return res.status(404).json({ error: 'Observación no encontrada' });
    }
    if (existente.autor_id !== user.userId) {
      return res.status(403).json({ error: 'Solo puede editar sus propias observaciones' });
    }

    const data = observacionUpdateSchema.parse(req.body);
    const observacion = await prisma.observacion.update({
      where: { id },
      data: {
        ...(data.titulo && { titulo: data.titulo }),
        ...(data.descripcion && { descripcion: data.descripcion }),
        ...(data.categoria && { categoria: data.categoria }),
        ...(data.fecha_evento && { fecha_evento: new Date(data.fecha_evento) }),
        ...(user.rol === 'MEDICO' && data.privacidad && { privacidad: data.privacidad })
      }
    });

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
    if (!user?.userId || user.rol === 'ADMINISTRADOR' || user.rol === 'SUPERADMIN') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const existente = await prisma.observacion.findFirst({
      where: {
        id,
        perfil: { institucion_id: user.institucion_id ?? -1 }
      }
    });
    if (!existente) {
      return res.status(404).json({ error: 'Observación no encontrada' });
    }
    if (existente.autor_id !== user.userId) {
      return res.status(403).json({ error: 'Solo puede eliminar sus propias observaciones' });
    }

    await prisma.observacion.delete({ where: { id } });
    return res.json({ message: 'Observación eliminada' });
  } catch {
    return res.status(500).json({ error: 'Error al eliminar observación' });
  }
};
