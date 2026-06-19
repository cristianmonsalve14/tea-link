// --- ELIMINAR ADMINISTRADOR POR SUPERADMIN ---
export const deleteAdministradorBySuperadmin = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.rol !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Solo SUPERADMIN puede eliminar administradores.' });
    }
    const adminId = Number(req.params.id);
    if (isNaN(adminId)) {
      return res.status(400).json({ error: 'ID de administrador inválido.' });
    }
    const admin = await prisma.usuario.findUnique({ where: { id: adminId } });
    if (!admin || admin.rol !== 'ADMINISTRADOR') {
      return res.status(404).json({ error: 'Administrador no encontrado.' });
    }
    await prisma.usuario.delete({ where: { id: adminId } });
    // Auditoría
    await prisma.auditoriaAdmin.create({
      data: {
        admin_id: user.userId,
        accion: 'ELIMINAR_ADMINISTRADOR',
        entidad: 'usuario',
        entidad_id: adminId,
        detalles: `Administrador eliminado: ${admin.email}`,
        ip_address: req.ip || null
      }
    });
    return res.json({ message: 'Administrador eliminado correctamente.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar administrador' });
  }
};
// --- RESETEAR CONTRASEÑA DE ADMINISTRADOR POR SUPERADMIN ---
export const resetAdminPasswordBySuperadmin = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.rol !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Solo SUPERADMIN puede resetear contraseñas.' });
    }
    const { id } = req.params;
    const admin = await prisma.usuario.findUnique({ where: { id: Number(id) } });
    if (!admin || admin.rol !== 'ADMINISTRADOR') {
      return res.status(404).json({ error: 'Administrador no encontrado.' });
    }
    // Generar nueva contraseña temporal
    const tempPassword = crypto.randomBytes(8).toString('base64url');
    const password_hash = await bcrypt.hash(tempPassword, 10);
    await prisma.usuario.update({
      where: { id: Number(id) },
      data: { password_hash, must_change_password: true }
    });
    // Auditoría
    await prisma.auditoriaAdmin.create({
      data: {
        admin_id: user.userId,
        accion: 'RESETEAR_PASSWORD_ADMIN',
        entidad: 'usuario',
        entidad_id: admin.id,
        detalles: `Password reseteado para admin ${admin.email}`,
        ip_address: req.ip || null
      }
    });
    return res.json({ message: 'Contraseña reseteada', tempPassword });
  } catch (error) {
    return res.status(500).json({ error: 'Error al resetear contraseña' });
  }
};
// --- EDITAR DATOS DE ADMINISTRADOR POR SUPERADMIN ---
export const updateAdministradorBySuperadmin = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.rol !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Solo SUPERADMIN puede editar administradores.' });
    }
    const { id } = req.params;
    const { nombre_completo, institucion_id } = req.body;
    const admin = await prisma.usuario.findUnique({ where: { id: Number(id) } });
    if (!admin || admin.rol !== 'ADMINISTRADOR') {
      return res.status(404).json({ error: 'Administrador no encontrado.' });
    }
    const updateData: { nombre_completo?: string; institucion_id?: number } = {};
    if (nombre_completo) updateData.nombre_completo = nombre_completo;
    if (institucion_id) updateData.institucion_id = Number(institucion_id);
    const updated = await prisma.usuario.update({ where: { id: Number(id) }, data: updateData });
    // Auditoría
    await prisma.auditoriaAdmin.create({
      data: {
        admin_id: user.userId,
        accion: 'EDITAR_ADMINISTRADOR',
        entidad: 'usuario',
        entidad_id: admin.id,
        detalles: `Admin editado: ${nombre_completo ? 'nombre' : ''} ${institucion_id ? 'institución' : ''}`.trim(),
        ip_address: req.ip || null
      }
    });
    return res.json({ message: 'Administrador actualizado', admin: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Error al editar administrador' });
  }
};
// --- LISTADO DE ADMINISTRADORES PARA SUPERADMIN ---
export const listAdministradores = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.rol !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Solo SUPERADMIN puede ver administradores.' });
    }
    const admins = await prisma.usuario.findMany({
      where: { rol: 'ADMINISTRADOR' },
      include: {
        institucion: { select: { id: true, nombre: true, tipo: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    // El campo activo ya está incluido por defecto
    res.json({ administradores: admins });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener administradores' });
  }
};
import crypto from 'crypto';
// --- CREAR ADMINISTRADOR POR SUPERADMIN ---
export const createAdministradorBySuperadmin = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.rol !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Solo SUPERADMIN puede crear administradores.' });
    }
    const { email: emailRaw, nombre_completo, institucion_id } = req.body;
    if (!emailRaw || !nombre_completo || !institucion_id) {
      return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }
    const email = normalizeEmail(String(emailRaw));
    const institucion = await prisma.institucion.findUnique({ where: { id: Number(institucion_id) } });
    if (!institucion) {
      return res.status(404).json({ error: 'Institución no encontrada.' });
    }
    const existing = await prisma.usuario.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } }
    });
    if (existing) {
      return res.status(409).json({ error: 'El correo ya está registrado.' });
    }
    // Generar contraseña temporal segura
    const tempPassword = crypto.randomBytes(8).toString('base64url');
    const password_hash = await bcrypt.hash(tempPassword, 10);
    // Crear usuario administrador
    const admin = await prisma.usuario.create({
      data: {
        email,
        password_hash,
        nombre_completo,
        rol: 'ADMINISTRADOR',
        institucion_id: Number(institucion_id),
        must_change_password: true
      }
    });
    // Auditoría
    await prisma.auditoriaAdmin.create({
      data: {
        admin_id: user.userId,
        accion: 'CREAR_ADMINISTRADOR',
        entidad: 'usuario',
        entidad_id: admin.id,
        detalles: `Admin creado para institución ${institucion.nombre} (${institucion.id}), email: ${email}`,
        ip_address: req.ip || null
      }
    });
    return res.status(201).json({ message: 'Administrador creado', admin: { id: admin.id, email: admin.email, nombre_completo: admin.nombre_completo, institucion_id: admin.institucion_id }, tempPassword });
  } catch (error: any) {
    return res.status(500).json({ error: 'Error al crear administrador' });
  }
};
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import {
  rolesRegistroPorTipoInstitucion,
  etiquetaEquipoInstitucion
} from '../utils/institucionRoles';
import { vincularUsuarioAPerfilesInstitucion } from '../utils/perfilAccess';

const prisma = new PrismaClient();

// --- INSTITUCIONES ---
const institucionSchema = z.object({
  nombre: z.string().min(2),
  tipo: z.enum(['FAMILIA', 'CENTRO_EDUCACIONAL', 'CENTRO_MEDICO', 'CENTRO_PROFESIONAL', 'SISTEMA']),
  direccion: z.string().min(2).optional()
});

const institucionUpdateSchema = z.object({
  nombre: z.string().min(2).optional(),
  tipo: z.enum(['FAMILIA', 'CENTRO_EDUCACIONAL', 'CENTRO_MEDICO', 'CENTRO_PROFESIONAL', 'SISTEMA']).optional(),
  direccion: z.string().min(2).optional()
});

export const createInstitucion = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.rol !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Solo SUPERADMIN puede crear instituciones.' });
    }
    const data = institucionSchema.parse(req.body);
    // Forzar tipo como enum Prisma
    const institucion = await prisma.institucion.create({
      data: {
        ...data,
        tipo: data.tipo as any // Prisma espera el enum generado, pero el string es igual
      }
    });
    // Auditoría
    await prisma.auditoriaAdmin.create({
      data: {
        admin_id: user.userId,
        accion: 'CREAR_INSTITUCION',
        entidad: 'institucion',
        entidad_id: institucion.id,
        detalles: `Nombre: ${institucion.nombre}, Tipo: ${institucion.tipo}`,
        ip_address: req.ip || null
      }
    });
    return res.status(201).json({ message: 'Institución creada', institucion });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateInstitucion = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.rol !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Solo SUPERADMIN puede editar instituciones.' });
    }
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const data = institucionUpdateSchema.parse(req.body);
    const institucion = await prisma.institucion.update({
      where: { id },
      data: {
        ...data,
        ...(data.tipo ? { tipo: data.tipo as any } : {})
      }
    });
    // Auditoría
    await prisma.auditoriaAdmin.create({
      data: {
        admin_id: user.userId,
        accion: 'EDITAR_INSTITUCION',
        entidad: 'institucion',
        entidad_id: institucion.id,
        detalles: `Actualización: ${JSON.stringify(data)}`,
        ip_address: req.ip || null
      }
    });
    return res.json({ message: 'Institución actualizada', institucion });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteInstitucion = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.rol !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Solo SUPERADMIN puede eliminar instituciones.' });
    }
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const institucion = await prisma.institucion.delete({ where: { id } });
    // Auditoría
    await prisma.auditoriaAdmin.create({
      data: {
        admin_id: user.userId,
        accion: 'ELIMINAR_INSTITUCION',
        entidad: 'institucion',
        entidad_id: institucion.id,
        detalles: `Nombre: ${institucion.nombre}, Tipo: ${institucion.tipo}`,
        ip_address: req.ip || null
      }
    });
    return res.json({ message: 'Institución eliminada', institucion });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Institución no encontrada' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const listInstituciones = async (_req: Request, res: Response) => {
  try {
    const instituciones = await prisma.institucion.findMany();
    console.log("[INSTITUCIONES]", instituciones);
    return res.json({ instituciones });
  } catch (error) {
    console.error("[INSTITUCIONES][ERROR]", error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- USUARIOS ---

// --- DASHBOARD SUPERADMIN ---
export const getSuperadminStats = async (_req: Request, res: Response) => {
  try {
    // Totales
    const [instituciones, usuarios, perfiles, observaciones] = await Promise.all([
      prisma.institucion.count(),
      prisma.usuario.count(),
      prisma.perfil.count(),
      prisma.observacion.count(),
    ]);

    // Última institución creada
    const ultimaInstitucion = await prisma.institucion.findFirst({
      orderBy: { created_at: 'desc' },
    });

    // Última acción de auditoría
    const ultimaAuditoria = await prisma.auditoriaAdmin.findFirst({
      orderBy: { created_at: 'desc' },
      include: {
        admin: { select: { email: true, nombre_completo: true, rol: true } }
      }
    });

    res.json({
      instituciones,
      usuarios,
      perfiles,
      observaciones,
      ultimaInstitucion,
      ultimaAuditoria,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
};

export const getUltimasAccionesAuditoria = async (_req: Request, res: Response) => {
  try {
    const acciones = await prisma.auditoriaAdmin.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        admin: { select: { email: true, nombre_completo: true, rol: true } }
      }
    });
    res.json({ acciones });
  } catch (error) {
    return res.status(500).json({ error: 'Error obteniendo auditoría' });
  }
};

const ROLES_REGISTRO_ADMIN = ['FAMILIA', 'EDUCADOR', 'PROFESIONAL', 'MEDICO'] as const;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const registerSchema = z.object({
  email: z.string().email().transform(normalizeEmail),
  password: z.string().min(6).optional(),
  nombre_completo: z.string().min(1),
  rol: z.enum(ROLES_REGISTRO_ADMIN)
});

async function institucionIdDelAdmin(admin: { userId?: number; institucion_id?: number }) {
  if (admin.institucion_id) return admin.institucion_id;
  if (!admin.userId) return null;
  const row = await prisma.usuario.findUnique({
    where: { id: admin.userId },
    select: { institucion_id: true }
  });
  return row?.institucion_id ?? null;
}

export const listUsuariosInstitucion = async (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user;
    if (!admin || admin.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores pueden listar usuarios.' });
    }
    const institucion_id = await institucionIdDelAdmin(admin);
    if (!institucion_id) {
      return res.status(400).json({ error: 'Administrador sin institución asignada.' });
    }

    const institucion = await prisma.institucion.findUnique({
      where: { id: institucion_id },
      select: { tipo: true, nombre: true }
    });
    if (!institucion) {
      return res.status(404).json({ error: 'Institución no encontrada.' });
    }

    const rolesPermitidos = rolesRegistroPorTipoInstitucion(institucion.tipo);

    const usuarios = await prisma.usuario.findMany({
      where: {
        institucion_id,
        rol: { in: rolesPermitidos }
      },
      select: {
        id: true,
        email: true,
        nombre_completo: true,
        rol: true,
        created_at: true
      },
      orderBy: { nombre_completo: 'asc' }
    });
    return res.json({
      usuarios,
      configuracion: {
        rolesPermitidos,
        etiquetaEquipo: etiquetaEquipoInstitucion(institucion.tipo),
        tipoInstitucion: institucion.tipo,
        institucionNombre: institucion.nombre
      }
    });
  } catch (error) {
    console.error('[USUARIOS][LIST]', error);
    return res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

/** Alta de educador por administrador de colegio (ruta dedicada) */
export const createEducadorByAdmin = async (req: AuthRequest, res: Response) => {
  req.body = {
    ...req.body,
    rol: 'EDUCADOR'
  };
  return register(req, res);
};

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user;
    if (!admin?.userId || admin.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({
        error: 'Solo administradores pueden registrar usuarios.',
        detalle: 'Cierre sesión e ingrese de nuevo como administrador del colegio.'
      });
    }
    const institucion_id = await institucionIdDelAdmin(admin);
    if (!institucion_id) {
      return res.status(400).json({ error: 'Administrador sin institución asignada.' });
    }

    const institucion = await prisma.institucion.findUnique({
      where: { id: institucion_id },
      select: { tipo: true, nombre: true }
    });
    if (!institucion) {
      return res.status(404).json({ error: 'Institución no encontrada.' });
    }

    const rolesPermitidos = rolesRegistroPorTipoInstitucion(institucion.tipo);
    const data = registerSchema.parse(req.body);

    if (!rolesPermitidos.includes(data.rol)) {
      return res.status(400).json({
        error:
          institucion.tipo === 'CENTRO_EDUCACIONAL'
            ? 'El administrador del colegio solo puede registrar educadores.'
            : `Su institución no permite registrar el rol ${data.rol}.`
      });
    }

    const existingUser = await prisma.usuario.findFirst({
      where: { email: { equals: data.email, mode: 'insensitive' } }
    });

    const tempPassword = data.password ?? crypto.randomBytes(8).toString('base64url');
    const password_hash = await bcrypt.hash(tempPassword, 10);

    if (existingUser) {
      if (existingUser.institucion_id === institucion_id) {
        return res.status(409).json({
          error: 'El correo ya está registrado en su institución.'
        });
      }
      if (existingUser.institucion_id != null) {
        return res.status(409).json({
          error: 'El correo ya está registrado en otra institución.'
        });
      }
      if (existingUser.rol !== data.rol) {
        return res.status(409).json({
          error: `El correo ya existe con otro rol (${existingUser.rol}). Use otro correo.`
        });
      }
      const user = await prisma.usuario.update({
        where: { id: existingUser.id },
        data: {
          nombre_completo: data.nombre_completo,
          password_hash,
          institucion_id,
          must_change_password: !data.password
        }
      });
      try {
        await prisma.auditoriaAdmin.create({
          data: {
            admin_id: admin.userId,
            accion: 'REASIGNAR_USUARIO_INSTITUCION',
            entidad: 'usuario',
            entidad_id: user.id,
            detalles: `Usuario ${user.rol} reasignado: ${user.email}`,
            ip_address: req.ip || null
          }
        });
      } catch (auditErr) {
        console.warn('[REGISTER] Auditoría no registrada:', auditErr);
      }
      await vincularUsuarioAPerfilesInstitucion(user.id, institucion_id, user.rol);
      return res.status(201).json({
        message: 'Usuario registrado correctamente',
        user: {
          id: user.id,
          email: user.email,
          nombre_completo: user.nombre_completo,
          rol: user.rol,
          institucion_id: user.institucion_id
        },
        tempPassword: data.password ? undefined : tempPassword
      });
    }

    const user = await prisma.usuario.create({
      data: {
        email: data.email,
        password_hash,
        nombre_completo: data.nombre_completo,
        rol: data.rol,
        institucion_id,
        must_change_password: !data.password
      }
    });
    try {
      await prisma.auditoriaAdmin.create({
        data: {
          admin_id: admin.userId,
          accion: 'CREAR_USUARIO_INSTITUCION',
          entidad: 'usuario',
          entidad_id: user.id,
          detalles: `Usuario ${user.rol} creado: ${user.email}`,
          ip_address: req.ip || null
        }
      });
    } catch (auditErr) {
      console.warn('[REGISTER] Auditoría no registrada:', auditErr);
    }
    await vincularUsuarioAPerfilesInstitucion(user.id, institucion_id, user.rol);
    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      user: {
        id: user.id,
        email: user.email,
        nombre_completo: user.nombre_completo,
        rol: user.rol,
        institucion_id: user.institucion_id
      },
      tempPassword: data.password ? undefined : tempPassword
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const loginSchema = z.object({
  email: z.string().email().transform(normalizeEmail),
  password: z.string().min(6)
});

export const login = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.usuario.findFirst({
      where: { email: { equals: data.email, mode: 'insensitive' } },
      select: {
        id: true,
        email: true,
        nombre_completo: true,
        rol: true,
        institucion_id: true,
        password_hash: true,
        must_change_password: true,
        institucion: {
          select: {
            nombre: true,
            tipo: true
          }
        }
      }
    });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ userId: user.id, rol: user.rol, institucion_id: user.institucion_id }, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });
    const { password_hash, ...userData } = user;
    // Adjuntar nombre y tipo de institución al usuario
    const userWithInstitucion = {
      ...userData,
      institucion_nombre: user.institucion?.nombre || null,
      institucion_tipo: user.institucion?.tipo || null
    };
    return res.json({ token, user: userWithInstitucion });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const cambiarPasswordInicialSchema = z.object({
  password_actual: z.string().min(6),
  password_nueva: z.string().min(8)
});

/** Primer ingreso: el usuario define su contraseña definitiva */
export const cambiarPasswordInicial = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const data = cambiarPasswordInicialSchema.parse(req.body);

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombre_completo: true,
        rol: true,
        institucion_id: true,
        password_hash: true,
        must_change_password: true,
        institucion: { select: { nombre: true, tipo: true } }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!user.must_change_password) {
      return res.status(400).json({
        error: 'Su cuenta no requiere cambio de contraseña inicial.'
      });
    }

    const valid = await bcrypt.compare(data.password_actual, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'La contraseña actual no es correcta' });
    }

    if (data.password_actual === data.password_nueva) {
      return res.status(400).json({
        error: 'La nueva contraseña debe ser distinta a la temporal'
      });
    }

    const password_hash = await bcrypt.hash(data.password_nueva, 10);
    await prisma.usuario.update({
      where: { id: userId },
      data: { password_hash, must_change_password: false }
    });

    const token = jwt.sign(
      { userId: user.id, rol: user.rol, institucion_id: user.institucion_id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    const { password_hash: _ph, ...userData } = user;
    return res.json({
      message: 'Contraseña actualizada. Ya puede usar el panel con normalidad.',
      token,
      user: {
        ...userData,
        must_change_password: false,
        institucion_nombre: user.institucion?.nombre ?? null,
        institucion_tipo: user.institucion?.tipo ?? null
      }
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al actualizar contraseña' });
  }
};

const updateUserSchema = z.object({
  nombre_completo: z.string().min(1).optional(),
  rol: z.enum(ROLES_REGISTRO_ADMIN).optional(),
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
    const institucion_id = await institucionIdDelAdmin(admin);
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { institucion_id: true, rol: true }
    });
    if (!user || user.institucion_id !== institucion_id) {
      return res.status(404).json({ error: 'Usuario no encontrado en su institución.' });
    }
    const inst = institucion_id
      ? await prisma.institucion.findUnique({
          where: { id: institucion_id },
          select: { tipo: true }
        })
      : null;
    const rolesPermitidos = inst
      ? rolesRegistroPorTipoInstitucion(inst.tipo)
      : ['EDUCADOR'];
    if (!rolesPermitidos.includes(user.rol)) {
      return res.status(403).json({ error: 'No puede editar este tipo de usuario.' });
    }
    const data = updateUserSchema.parse(req.body);
    if (data.rol && !rolesPermitidos.includes(data.rol)) {
      return res.status(400).json({ error: 'Rol no permitido para su institución.' });
    }
    let updateData: any = {};
    if (data.nombre_completo) updateData.nombre_completo = data.nombre_completo;
    if (data.rol) updateData.rol = data.rol;
    if (data.password) {
      updateData.password_hash = await bcrypt.hash(data.password, 10);
      updateData.must_change_password = false;
    }
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

export const resetUserPasswordByAdmin = async (req: Request, res: Response) => {
  try {
    const admin = (req as AuthRequest).user;
    if (!admin?.userId || admin.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores pueden resetear contraseñas.' });
    }
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuario inválido.' });
    }
    const institucion_id = await institucionIdDelAdmin(admin);
    if (!institucion_id) {
      return res.status(400).json({ error: 'Administrador sin institución asignada.' });
    }
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, email: true, institucion_id: true, rol: true }
    });
    if (!user || user.institucion_id !== institucion_id) {
      return res.status(404).json({ error: 'Usuario no encontrado en su institución.' });
    }
    const inst = await prisma.institucion.findUnique({
      where: { id: institucion_id },
      select: { tipo: true }
    });
    const rolesPermitidos = inst
      ? rolesRegistroPorTipoInstitucion(inst.tipo)
      : ['EDUCADOR'];
    if (!rolesPermitidos.includes(user.rol)) {
      return res.status(403).json({ error: 'No puede resetear la contraseña de este tipo de usuario.' });
    }
    const tempPassword = crypto.randomBytes(8).toString('base64url');
    const password_hash = await bcrypt.hash(tempPassword, 10);
    await prisma.usuario.update({
      where: { id: userId },
      data: { password_hash, must_change_password: true }
    });
    try {
      await prisma.auditoriaAdmin.create({
        data: {
          admin_id: admin.userId,
          accion: 'RESETEAR_PASSWORD_USUARIO',
          entidad: 'usuario',
          entidad_id: user.id,
          detalles: `Password reseteado para ${user.rol} ${user.email}`,
          ip_address: req.ip || null
        }
      });
    } catch (auditErr) {
      console.warn('[RESET_PASSWORD] Auditoría no registrada:', auditErr);
    }
    return res.json({ message: 'Contraseña reseteada', tempPassword });
  } catch (error) {
    return res.status(500).json({ error: 'Error al resetear contraseña' });
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
    const institucion_id = await institucionIdDelAdmin(admin);
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { institucion_id: true, rol: true }
    });
    if (!user || user.institucion_id !== institucion_id) {
      return res.status(404).json({ error: 'Usuario no encontrado en su institución.' });
    }
    const inst = institucion_id
      ? await prisma.institucion.findUnique({
          where: { id: institucion_id },
          select: { tipo: true }
        })
      : null;
    const rolesPermitidos = inst
      ? rolesRegistroPorTipoInstitucion(inst.tipo)
      : ['EDUCADOR'];
    if (!rolesPermitidos.includes(user.rol)) {
      return res.status(403).json({ error: 'No puede eliminar este tipo de usuario.' });
    }

    await prisma.$transaction(async tx => {
      const observacionIds = await tx.observacion.findMany({
        where: { autor_id: userId },
        select: { id: true }
      });
      if (observacionIds.length > 0) {
        await tx.observacionEnReporte.deleteMany({
          where: { observacion_id: { in: observacionIds.map(o => o.id) } }
        });
        await tx.observacion.deleteMany({ where: { autor_id: userId } });
      }

      const reporteIds = await tx.reporte.findMany({
        where: { creador_id: userId },
        select: { id: true }
      });
      if (reporteIds.length > 0) {
        await tx.observacionEnReporte.deleteMany({
          where: { reporte_id: { in: reporteIds.map(r => r.id) } }
        });
        await tx.reporte.deleteMany({ where: { creador_id: userId } });
      }

      await tx.perfilUsuario.deleteMany({ where: { usuario_id: userId } });
      await tx.usuario.delete({ where: { id: userId } });
    });

    return res.json({
      message: 'Usuario eliminado correctamente (incluye observaciones y reportes asociados).'
    });
  } catch (error: unknown) {
    console.error('[DELETE_USER]', error);
    return res.status(500).json({
      error:
        'No se pudo eliminar el usuario. Si el problema continúa, contacte al soporte técnico.'
    });
  }
};
