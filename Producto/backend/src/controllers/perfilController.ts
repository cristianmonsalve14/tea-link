import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  getPerfilesAccesibles,
  vincularEquipoInstitucionAPerfil,
  vincularUsuarioAPerfil
} from '../utils/perfilAccess';

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

    await vincularEquipoInstitucionAPerfil(perfil.id, institucion_id);

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
    const userId = req.user?.userId;
    const institucion_id = req.user?.institucion_id;
    const rol = req.user?.rol;

    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const rolesOperativos = ['EDUCADOR', 'FAMILIA', 'PROFESIONAL', 'MEDICO'];
    let perfiles;

    if (rol && rolesOperativos.includes(rol)) {
      perfiles = await getPerfilesAccesibles(userId, institucion_id);
    } else {
      if (!institucion_id) {
        return res.status(400).json({ error: 'Institución no encontrada' });
      }
      perfiles = await prisma.perfil.findMany({
        where: { institucion_id },
        orderBy: { nombre: 'asc' }
      });
    }

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

const vincularMiembroSchema = z.object({
  email: z.string().email()
});

/** Admin vincula a un usuario (p. ej. médico de otro centro) al perfil del estudiante. */
export const vincularMiembroEquipo = async (req: AuthRequest, res: Response) => {
  try {
    const perfilId = Number(req.params.id);
    if (isNaN(perfilId)) {
      return res.status(400).json({ error: 'ID de perfil inválido' });
    }
    const admin = req.user;
    if (!admin?.userId || admin.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores pueden vincular miembros del equipo' });
    }
    const institucion_id = admin.institucion_id;
    if (!institucion_id) {
      return res.status(400).json({ error: 'Administrador sin institución' });
    }

    const perfil = await prisma.perfil.findFirst({
      where: { id: perfilId, institucion_id }
    });
    if (!perfil) {
      return res.status(404).json({ error: 'Perfil no encontrado en su institución' });
    }

    const { email } = vincularMiembroSchema.parse(req.body);
    const usuario = await prisma.usuario.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, email: true, nombre_completo: true, rol: true }
    });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado con ese correo' });
    }
    const rolesEquipo = ['FAMILIA', 'EDUCADOR', 'PROFESIONAL', 'MEDICO'];
    if (!rolesEquipo.includes(usuario.rol)) {
      return res.status(400).json({
        error: 'Solo se pueden vincular usuarios con rol FAMILIA, EDUCADOR, PROFESIONAL o MÉDICO'
      });
    }

    await vincularUsuarioAPerfil(perfilId, usuario.id, usuario.rol);

    await prisma.auditoriaAdmin.create({
      data: {
        admin_id: admin.userId,
        accion: 'VINCULAR_EQUIPO_PERFIL',
        entidad: 'perfil',
        entidad_id: perfilId,
        detalles: `${usuario.rol} ${usuario.email} vinculado al perfil ${perfil.nombre}`,
        ip_address: req.ip || null
      }
    });

    return res.status(201).json({
      message: `${usuario.nombre_completo} ahora puede ver y aportar observaciones en este perfil (según privacidad).`,
      usuario
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al vincular miembro del equipo' });
  }
};
