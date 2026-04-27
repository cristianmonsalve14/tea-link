import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

// --- INSTITUCIONES ---
const institucionSchema = z.object({
  nombre: z.string().min(2),
  tipo: z.enum(['FAMILIA', 'CENTRO_EDUCACIONAL', 'CENTRO_MEDICO', 'CENTRO_PROFESIONAL']),
  direccion: z.string().min(2).optional()
});

export const createInstitucion = async (req: Request, res: Response) => {
  try {
    const data = institucionSchema.parse(req.body);
    const institucion = await prisma.institucion.create({ data });
    return res.status(201).json({ message: 'Institución creada', institucion });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const listInstituciones = async (_req: Request, res: Response) => {
  try {
    const instituciones = await prisma.institucion.findMany();
    return res.json({ instituciones });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- USUARIOS ---
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre_completo: z.string().min(1),
  rol: z.enum(['FAMILIA', 'EDUCADOR', 'PROFESIONAL', 'ADMINISTRADOR', 'MEDICO'])
});

export const register = async (req: Request, res: Response) => {
  try {
    const admin = (req as AuthRequest).user;
    if (!admin || admin.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores pueden registrar usuarios.' });
    }
    const data = registerSchema.parse(req.body);
    const existingUser = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return res.status(409).json({ error: 'El correo ya está registrado.' });
    }
    const password_hash = await bcrypt.hash(data.password, 10);
    const user = await prisma.usuario.create({
      data: {
        email: data.email,
        password_hash,
        nombre_completo: data.nombre_completo,
        rol: data.rol as any,
        institucion_id: admin.institucion_id
      }
    });
    return res.status(201).json({ message: 'Usuario registrado correctamente', user: { id: user.id, email: user.email, nombre_completo: user.nombre_completo, rol: user.rol, institucion_id: user.institucion_id } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const login = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.usuario.findUnique({ where: { email: data.email }, select: { id: true, email: true, nombre_completo: true, rol: true, institucion_id: true, password_hash: true } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ userId: user.id, rol: user.rol, institucion_id: user.institucion_id }, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });
    const { password_hash, ...userData } = user;
    return res.json({ token, user: userData });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const updateUserSchema = z.object({
  nombre_completo: z.string().min(1).optional(),
  rol: z.enum(['FAMILIA', 'EDUCADOR', 'PROFESIONAL', 'ADMINISTRADOR', 'MEDICO']).optional(),
  password: z.string().min(6).optional()
});

export const updateUser = async (req: Request, res: Response) => {
  try {
    const admin = (req as AuthRequest).user;
    if (!admin || admin.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores pueden editar usuarios.' });
    }
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuario inválido.' });
    }
    const user = await prisma.usuario.findUnique({ where: { id: userId }, select: { institucion_id: true } });
    if (!user || user.institucion_id !== admin.institucion_id) {
      return res.status(404).json({ error: 'Usuario no encontrado en su institución.' });
    }
    const data = updateUserSchema.parse(req.body);
    let updateData: any = {};
    if (data.nombre_completo) updateData.nombre_completo = data.nombre_completo;
    if (data.rol) updateData.rol = data.rol;
    if (data.password) updateData.password_hash = await bcrypt.hash(data.password, 10);
    const updated = await prisma.usuario.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, nombre_completo: true, rol: true, institucion_id: true }
    });
    return res.json({ message: 'Usuario actualizado', user: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const admin = (req as AuthRequest).user;
    if (!admin || admin.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores pueden eliminar usuarios.' });
    }
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuario inválido.' });
    }
    const user = await prisma.usuario.findUnique({ where: { id: userId }, select: { institucion_id: true } });
    if (!user || user.institucion_id !== admin.institucion_id) {
      return res.status(404).json({ error: 'Usuario no encontrado en su institución.' });
    }
    await prisma.usuario.delete({ where: { id: userId } });
    return res.json({ message: 'Usuario eliminado correctamente.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
