import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

/* =====================
   SCHEMAS
===================== */
const crearPerfilSchema = z.object({
  nombre: z.string().min(1),
  edad: z.coerce.number().int().positive().optional(),
  diagnostico: z.string().max(500).optional(),
  fecha_nacimiento: z.string().optional(),
  notas: z.string().optional()
});

const actualizarPerfilSchema = z.object({
  nombre: z.string().min(1).optional(),
  edad: z.coerce.number().int().positive().optional(),
  diagnostico: z.string().max(500).optional(),
  fecha_nacimiento: z.string().optional(),
  notas: z.string().optional()
});

/* =====================
   CREAR PERFIL
===================== */
export const crearPerfil = async (req: AuthRequest, res: Response) => {
  try {
    const data = crearPerfilSchema.parse(req.body);
    const institucion_id = req.user?.institucion_id;
    const userId = req.user?.userId;
    const userRol = req.user?.rol;

    if (!institucion_id) {
      return res.status(400).json({ error: 'Institución no encontrada' });
    }

    const perfil = await prisma.perfil.create({
      data: {
        ...data,
        fecha_nacimiento: data.fecha_nacimiento
          ? new Date(data.fecha_nacimiento)
          : undefined,
        institucion_id
      }
    });

    // Auditoría solo si es ADMINISTRADOR
    if (userRol === 'ADMINISTRADOR') {
      await prisma.auditoriaAdmin.create({
        data: {
          admin_id: userId,
          accion: 'Crear perfil',
          entidad: 'perfil',
          entidad_id: perfil.id,
          detalles: `Perfil creado por ADMINISTRADOR (${req.user.email})`,
          ip_address: req.ip || null
        }
      });
    }

    return res.status(201).json({ perfil });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al crear perfil' });
  }
};

/* =====================
   LISTAR PERFILES
===================== */
export const obtenerPerfiles = async (req: AuthRequest, res: Response) => {
  try {
    const institucion_id = req.user?.institucion_id;
    if (!institucion_id) {
      return res.status(400).json({ error: 'Institución no encontrada' });
    }
    const perfiles = await prisma.perfil.findMany({
      where: { institucion_id }
    });
    return res.json({ perfiles });
  } catch {
    return res.status(500).json({ error: 'Error al obtener perfiles' });
  }
};

/* =====================
   OBTENER PERFIL POR ID
===================== */
export const obtenerPerfilPorId = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const institucion_id = req.user?.institucion_id;
    const perfil = await prisma.perfil.findFirst({
      where: { id, institucion_id }
    });
    if (!perfil) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }
    return res.json({ perfil });
  } catch {
    return res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

/* =====================
   ACTUALIZAR PERFIL
===================== */
export const actualizarPerfil = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const institucion_id = req.user?.institucion_id;
    const userId = req.user?.userId;
    const userRol = req.user?.rol;
    // Verificar que el perfil pertenece a la misma institución
    const perfilActual = await prisma.perfil.findUnique({ where: { id } });
    if (!perfilActual) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }
    if (perfilActual.institucion_id !== institucion_id) {
      return res.status(403).json({ error: 'No puedes editar perfiles de otra institución' });
    }
    const perfil = await prisma.perfil.update({
      where: { id },
      data: {
        ...actualizarPerfilSchema.parse(req.body),
        fecha_nacimiento: req.body.fecha_nacimiento
          ? new Date(req.body.fecha_nacimiento)
          : undefined
      }
    });
    // Auditoría solo si es ADMINISTRADOR
    if (userRol === 'ADMINISTRADOR') {
      await prisma.auditoriaAdmin.create({
        data: {
          admin_id: userId,
          accion: 'Actualizar perfil',
          entidad: 'perfil',
          entidad_id: perfil.id,
          detalles: `Perfil actualizado por ADMINISTRADOR (${req.user.email})`,
          ip_address: req.ip || null
        }
      });
    }
    return res.json({ perfil });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

/* =====================
   ELIMINAR PERFIL
===================== */
export const eliminarPerfil = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const institucion_id = req.user?.institucion_id;
    const userId = req.user?.userId;
    const userRol = req.user?.rol;
    // Verificar que el perfil pertenece a la misma institución
    const perfilActual = await prisma.perfil.findUnique({ where: { id } });
    if (!perfilActual) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }
    if (perfilActual.institucion_id !== institucion_id) {
      return res.status(403).json({ error: 'No puedes eliminar perfiles de otra institución' });
    }
    await prisma.perfil.delete({ where: { id } });
    // Auditoría solo si es ADMINISTRADOR
    if (userRol === 'ADMINISTRADOR') {
      await prisma.auditoriaAdmin.create({
        data: {
          admin_id: userId,
          accion: 'Eliminar perfil',
          entidad: 'perfil',
          entidad_id: id,
          detalles: `Perfil eliminado por ADMINISTRADOR (${req.user.email})`,
          ip_address: req.ip || null
        }
      });
    }
    return res.json({ message: 'Perfil eliminado correctamente' });
  } catch {
    return res.status(500).json({ error: 'Error al eliminar perfil' });
  }
};
