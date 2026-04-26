import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Esquema de validación para crear observación
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
    'OTRO',
  ]),
  fecha_evento: z.string().min(1),
  perfil_id: z.number(),
  privacidad: z.enum(['PUBLICA', 'SOLO_PROFESIONALES', 'SOLO_MEDICO'])
});

export const crearObservacion = async (req: Request, res: Response) => {
  console.log('Petición recibida en crearObservacion:', req.body);
  try {
    const data = observacionSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    const rol = (req as any).user?.rol;
    console.log('Datos parseados:', data);
    console.log('Usuario autenticado:', { userId, rol });
    if (!userId || rol !== 'MEDICO') {
      return res.status(403).json({ error: 'Solo médicos pueden crear observaciones médicas.' });
    }
    const observacion = await prisma.observacion.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        categoria: data.categoria,
        fecha_evento: new Date(data.fecha_evento),
        perfil_id: data.perfil_id,
        autor_id: userId,
        privacidad: data.privacidad
      }
    });
    console.log('Observación creada:', observacion);
    return res.status(201).json({ message: 'Observación creada', observacion });
  } catch (error: any) {
    console.error('Error en crearObservacion:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
