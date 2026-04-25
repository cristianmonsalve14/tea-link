import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre_completo: z.string().min(1),
  rol: z.enum(['FAMILIA', 'EDUCADOR', 'PROFESIONAL', 'ADMINISTRADOR'])
});

export const register = async (req: Request, res: Response) => {
  try {
    console.log('Intentando registrar usuario con datos:', req.body);
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
        rol: data.rol as any
      }
    });
    return res.status(201).json({ message: 'Usuario registrado correctamente', user: { id: user.id, email: user.email, nombre_completo: user.nombre_completo, rol: user.rol } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("Error en registro:", error);
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
    const user = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ userId: user.id, rol: user.rol }, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });
    return res.json({ token, user: { id: user.id, email: user.email, nombre_completo: user.nombre_completo, rol: user.rol } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
