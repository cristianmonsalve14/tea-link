import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Middleware de autorización por roles
export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Acceso denegado: rol no autorizado' });
    }
    next();
  };
};

export interface AuthRequest extends Request {
  user?: any;
}

export type JwtUser = {
  userId: number;
  rol: string;
  institucion_id?: number | null;
};

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtUser;

    if (decoded.userId) {
      const fresh = await prisma.usuario.findUnique({
        where: { id: decoded.userId },
        select: { institucion_id: true, rol: true }
      });
      if (!fresh) {
        return res.status(401).json({ error: 'Usuario no encontrado o sesión inválida' });
      }
      decoded.institucion_id = fresh.institucion_id;
      decoded.rol = fresh.rol;
    }

    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};