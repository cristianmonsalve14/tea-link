import crypto from 'crypto';
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import {
  institucionAdminBodySchema,
  institucionContactoBodySchema,
  institucionContactoSelect,
  mapInstitucionContacto
} from '../utils/institucionContacto';
import { regionChileSchema } from '../utils/regionChile';
import {
  comunaNombreSchema,
  localidadOpcionalSchema,
  parseUbicacionInstitucion
} from '../utils/ubicacionChile';
import { vincularUsuarioAPerfilesInstitucion } from '../utils/perfilAccess';
import {
  rolesRegistroPorTipoInstitucion,
  etiquetaEquipoInstitucion
} from '../utils/institucionRoles';
import {
  buildSuperadminStatsWhere,
  parseInstitucionId,
  parseRolFilter,
  parseStatsDateRange
} from '../utils/superadminStatsQuery';
import {
  collectAuditoriaEntidadIds,
  formatEntidadAuditoriaLabel
} from '../utils/auditoriaEntidadLabel';
import { normalizeEmail } from '../utils/email';
import {
  resolveAuditAdminId,
  sanitizeAuditIp,
  truncateAuditDetalles
} from '../utils/auditAdminHelpers';
import { nombreCompletoConApellidoSchema } from '../utils/nombrePersona';
import { loginSchema } from '../utils/authValidation';
import {
  educadorEquipoBodySchema,
  datosEquipoParaPersistir,
  ordenarNivelesEducador,
  requiereDatosEducadorColegio
} from '../utils/educadorEquipo';
import { nivelEducacionalSchema } from '../utils/nivelEducacional';
import { especialidadEducadorSchema } from '../utils/especialidadEducador';
import {
  profesionalEquipoBodySchema,
  profesionProfesionalSchema,
  requiereProfesionEquipo
} from '../utils/profesionProfesional';
import {
  CONSENTIMIENTO_TEXTO,
  CONSENTIMIENTO_VERSION,
  usuarioNecesitaConsentimiento
} from '../utils/consentimiento';

const prisma = new PrismaClient();

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
        ip_address: sanitizeAuditIp(req.ip)
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
        ip_address: sanitizeAuditIp(req.ip)
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
    if (nombre_completo) {
      updateData.nombre_completo = nombreCompletoConApellidoSchema.parse(nombre_completo);
    }
    if (institucion_id) updateData.institucion_id = Number(institucion_id);
    if (updateData.institucion_id) {
      const inst = await prisma.institucion.findUnique({
        where: { id: updateData.institucion_id },
        select: { tipo: true }
      });
      if (!inst) {
        return res.status(404).json({ error: 'Institución no encontrada.' });
      }
      if (inst.tipo === 'FAMILIA' || inst.tipo === 'SISTEMA') {
        return res.status(400).json({
          error:
            inst.tipo === 'FAMILIA'
              ? 'Las instituciones tipo familia no tienen administrador. Los apoderados acceden con rol FAMILIA tras la invitación del colegio o centro médico.'
              : 'No se puede asignar un administrador a la institución Sistema.'
        });
      }
    }
    const updated = await prisma.usuario.update({ where: { id: Number(id) }, data: updateData });
    // Auditoría
    await prisma.auditoriaAdmin.create({
      data: {
        admin_id: user.userId,
        accion: 'EDITAR_ADMINISTRADOR',
        entidad: 'usuario',
        entidad_id: admin.id,
        detalles: `Admin editado: ${nombre_completo ? 'nombre' : ''} ${institucion_id ? 'institución' : ''}`.trim(),
        ip_address: sanitizeAuditIp(req.ip)
      }
    });
    return res.json({ message: 'Administrador actualizado', admin: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
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
// --- CREAR ADMINISTRADOR POR SUPERADMIN ---
export const createAdministradorBySuperadmin = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.rol !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Solo SUPERADMIN puede crear administradores.' });
    }
    const { email: emailRaw, institucion_id } = req.body;
    if (!emailRaw || !institucion_id) {
      return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }
    let nombre_completo: string;
    try {
      nombre_completo = nombreCompletoConApellidoSchema.parse(req.body.nombre_completo);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.issues });
      }
      throw err;
    }
    const email = normalizeEmail(String(emailRaw));
    const institucion = await prisma.institucion.findUnique({ where: { id: Number(institucion_id) } });
    if (!institucion) {
      return res.status(404).json({ error: 'Institución no encontrada.' });
    }
    if (institucion.tipo === 'FAMILIA') {
      return res.status(400).json({
        error:
          'Las instituciones tipo familia no tienen administrador. Los apoderados acceden con rol FAMILIA tras la invitación del colegio o centro médico.'
      });
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
        ip_address: sanitizeAuditIp(req.ip)
      }
    });
    return res.status(201).json({ message: 'Administrador creado', admin: { id: admin.id, email: admin.email, nombre_completo: admin.nombre_completo, institucion_id: admin.institucion_id }, tempPassword });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al crear administrador' });
  }
};

// --- INSTITUCIONES ---
const institucionSchema = z
  .object({
    nombre: z.string().min(2).optional(),
    tipo: z.enum(['FAMILIA', 'CENTRO_EDUCACIONAL', 'CENTRO_MEDICO', 'CENTRO_PROFESIONAL', 'SISTEMA']),
    region: regionChileSchema.optional().nullable(),
    comuna: comunaNombreSchema.optional().nullable(),
    localidad: localidadOpcionalSchema.optional().nullable(),
    direccion: institucionContactoBodySchema.shape.direccion,
    email_contacto: institucionContactoBodySchema.shape.email_contacto,
    telefono_contacto: institucionContactoBodySchema.shape.telefono_contacto,
    catalogo_establecimiento_id: z.number().int().positive().optional(),
    registro_manual: z.boolean().optional()
  })
  .superRefine((data, ctx) => {
    if (data.catalogo_establecimiento_id) return;
    if (!data.nombre?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'El nombre es obligatorio para ingreso manual',
        path: ['nombre']
      });
    }
    if (data.tipo === 'SISTEMA') return;
    if (!data.region || !data.comuna?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Región y comuna son obligatorias para instituciones en Chile',
        path: ['region']
      });
      return;
    }
    try {
      parseUbicacionInstitucion({
        region: data.region,
        comuna: data.comuna,
        localidad: data.localidad
      });
    } catch {
      ctx.addIssue({
        code: 'custom',
        message: 'La comuna no corresponde a la región seleccionada',
        path: ['comuna']
      });
    }
  });

const institucionUpdateSchema = institucionAdminBodySchema;

function prepararUbicacionInstitucion(
  data: {
    tipo?: string;
    region?: string | null;
    comuna?: string | null;
    localidad?: string | null;
  }
) {
  if (data.tipo === 'SISTEMA') {
    return { region: null, comuna: null, localidad: null };
  }
  if (data.region && data.comuna?.trim()) {
    try {
      return parseUbicacionInstitucion({
        region: data.region as Parameters<typeof parseUbicacionInstitucion>[0]['region'],
        comuna: data.comuna,
        localidad: data.localidad ?? null
      });
    } catch {
      throw new Error('UBICACION_INVALIDA');
    }
  }
  return {};
}

export const createInstitucion = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.rol !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Solo SUPERADMIN puede crear instituciones.' });
    }
    const data = institucionSchema.parse(req.body);

    let payload: {
      nombre: string;
      tipo: typeof data.tipo;
      region?: typeof data.region;
      comuna?: string | null;
      localidad?: string | null;
      direccion?: string | null;
      email_contacto?: string | null;
      telefono_contacto?: string | null;
      registro_manual: boolean;
      catalogo_establecimiento_id?: number;
      codigo_externo?: string | null;
      catalogo_fuente?: 'MINEDUC_ESCOLAR' | 'DEIS_SALUD' | null;
      tipo_oficial?: string | null;
      dependencia_oficial?: string | null;
    };

    if (data.catalogo_establecimiento_id) {
      const catalogo = await prisma.catalogoEstablecimiento.findUnique({
        where: { id: data.catalogo_establecimiento_id },
        include: { institucion: true }
      });
      if (!catalogo) {
        return res.status(404).json({ error: 'Establecimiento no encontrado en catálogo oficial' });
      }
      if (catalogo.institucion) {
        return res.status(409).json({
          error: 'Este establecimiento oficial ya fue incorporado a TEA Link',
          institucion_id: catalogo.institucion.id
        });
      }
      if (!catalogo.region || !catalogo.comuna) {
        return res.status(400).json({
          error: 'El registro del catálogo no tiene región/comuna suficientes para crear la institución'
        });
      }

      payload = {
        nombre: catalogo.nombre,
        tipo: data.tipo,
        region: catalogo.region,
        comuna: catalogo.comuna,
        localidad: data.localidad?.trim() || catalogo.localidad || null,
        direccion: data.direccion ?? catalogo.direccion,
        email_contacto: data.email_contacto,
        telefono_contacto: data.telefono_contacto,
        registro_manual: false,
        catalogo_establecimiento_id: catalogo.id,
        codigo_externo: catalogo.codigo_externo,
        catalogo_fuente: catalogo.fuente,
        tipo_oficial: catalogo.tipo_oficial,
        dependencia_oficial: catalogo.dependencia
      };
    } else {
      const ubicacion = prepararUbicacionInstitucion(data);
      payload = {
        nombre: data.nombre!.trim(),
        tipo: data.tipo,
        ...ubicacion,
        region: ubicacion.region ?? data.region ?? undefined,
        comuna: ubicacion.comuna ?? data.comuna ?? null,
        localidad: ubicacion.localidad ?? data.localidad ?? null,
        direccion: data.direccion,
        email_contacto: data.email_contacto,
        telefono_contacto: data.telefono_contacto,
        registro_manual: data.registro_manual ?? true,
        codigo_externo: null,
        catalogo_fuente: null,
        tipo_oficial: null,
        dependencia_oficial: null
      };
    }

    if (payload.tipo === 'SISTEMA') {
      payload.region = null;
      payload.comuna = null;
      payload.localidad = null;
    }

    const institucion = await prisma.institucion.create({
      data: {
        nombre: payload.nombre,
        tipo: payload.tipo as any,
        region: payload.region ?? null,
        comuna: payload.comuna ?? null,
        localidad: payload.localidad ?? null,
        direccion: payload.direccion,
        email_contacto: payload.email_contacto,
        telefono_contacto: payload.telefono_contacto,
        registro_manual: payload.registro_manual,
        catalogo_establecimiento_id: payload.catalogo_establecimiento_id ?? null,
        codigo_externo: payload.codigo_externo,
        catalogo_fuente: payload.catalogo_fuente,
        tipo_oficial: payload.tipo_oficial,
        dependencia_oficial: payload.dependencia_oficial
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
        ip_address: sanitizeAuditIp(req.ip)
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
    const adminId = resolveAuditAdminId(user);
    if (!adminId) {
      return res.status(401).json({ error: 'Sesión inválida: no se pudo identificar al usuario.' });
    }
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const data = institucionUpdateSchema.parse(req.body);
    let ubicacion: ReturnType<typeof prepararUbicacionInstitucion>;
    try {
      ubicacion = prepararUbicacionInstitucion(data);
    } catch (e) {
      if (e instanceof Error && e.message === 'UBICACION_INVALIDA') {
        return res.status(400).json({ error: 'La comuna no corresponde a la región seleccionada' });
      }
      throw e;
    }
    const institucion = await prisma.institucion.update({
      where: { id },
      data: {
        ...data,
        ...ubicacion,
        ...(data.tipo ? { tipo: data.tipo as any } : {})
      }
    });
    await prisma.auditoriaAdmin.create({
      data: {
        admin_id: adminId,
        accion: 'EDITAR_INSTITUCION',
        entidad: 'institucion',
        entidad_id: institucion.id,
        detalles: truncateAuditDetalles(`Actualización: ${JSON.stringify(data)}`),
        ip_address: sanitizeAuditIp(req.ip)
      }
    });
    return res.json({ message: 'Institución actualizada', institucion });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Institución no encontrada' });
    }
    console.error('[INSTITUCION][UPDATE]', error);
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
        ip_address: sanitizeAuditIp(req.ip)
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
    const instituciones = await prisma.institucion.findMany({
      orderBy: { nombre: 'asc' },
      select: {
        ...institucionContactoSelect,
        registro_manual: true,
        codigo_externo: true,
        catalogo_fuente: true,
        tipo_oficial: true,
        dependencia_oficial: true
      }
    });
    return res.json({
      instituciones: instituciones.map(inst => ({
        ...mapInstitucionContacto(inst),
        registro_manual: inst.registro_manual,
        codigo_externo: inst.codigo_externo,
        catalogo_fuente: inst.catalogo_fuente,
        tipo_oficial: inst.tipo_oficial,
        dependencia_oficial: inst.dependencia_oficial
      }))
    });
  } catch (error) {
    console.error('[INSTITUCIONES][ERROR]', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Datos de contacto de la institución del administrador autenticado. */
export const getMiInstitucion = async (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user;
    if (!admin?.institucion_id || admin.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores institucionales.' });
    }
    const institucion = await prisma.institucion.findUnique({
      where: { id: admin.institucion_id },
      select: institucionContactoSelect
    });
    if (!institucion) {
      return res.status(404).json({ error: 'Institución no encontrada' });
    }
    return res.json({ institucion: mapInstitucionContacto(institucion) });
  } catch {
    return res.status(500).json({ error: 'Error al obtener institución' });
  }
};

/** Actualiza datos de contacto de la propia institución (admin). */
export const updateMiInstitucionContacto = async (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user;
    if (!admin?.institucion_id || admin.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores institucionales.' });
    }
    const data = institucionContactoBodySchema.parse(req.body);
    const ubicacion = parseUbicacionInstitucion(data);
    const institucion = await prisma.institucion.update({
      where: { id: admin.institucion_id },
      data: {
        ...data,
        ...ubicacion
      },
      select: institucionContactoSelect
    });
    return res.json({
      message: 'Datos de contacto actualizados',
      institucion: mapInstitucionContacto(institucion)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al actualizar contacto' });
  }
};

// --- USUARIOS ---

// --- DASHBOARD SUPERADMIN ---
export const getSuperadminStats = async (req: Request, res: Response) => {
  try {
    const { usuarioWhere, perfilWhere, observacionWhere, institucionWhere } =
      buildSuperadminStatsWhere(req.query);

    const [usuarios, perfiles, observaciones, instituciones] = await Promise.all([
      prisma.usuario.count({ where: usuarioWhere }),
      prisma.perfil.count({ where: perfilWhere }),
      prisma.observacion.count({ where: observacionWhere }),
      prisma.institucion.count({ where: institucionWhere }),
    ]);

    res.json({
      kpis: { usuarios, perfiles, observaciones, instituciones },
    });
  } catch (error) {
    console.error('[SUPERADMIN][STATS]', error);
    return res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
};

/** Panel ejecutivo: KPIs filtrados, totales globales, distribución por rol y actividad reciente. */
export const getSuperadminOverview = async (req: Request, res: Response) => {
  try {
    const { usuarioWhere, perfilWhere, observacionWhere, institucionWhere } =
      buildSuperadminStatsWhere(req.query);

    const querySinRol = { ...req.query, rol: undefined };
    const { usuarioWhere: usuarioWhereSinRol } = buildSuperadminStatsWhere(querySinRol);

    const [
      usuarios,
      perfiles,
      observaciones,
      instituciones,
      totalUsuarios,
      totalPerfiles,
      totalObservaciones,
      totalInstituciones,
      usuariosPorRol,
      actividadReciente
    ] = await Promise.all([
      prisma.usuario.count({ where: usuarioWhere }),
      prisma.perfil.count({ where: perfilWhere }),
      prisma.observacion.count({ where: observacionWhere }),
      prisma.institucion.count({ where: institucionWhere }),
      prisma.usuario.count(),
      prisma.perfil.count(),
      prisma.observacion.count(),
      prisma.institucion.count(),
      prisma.usuario.groupBy({
        by: ['rol'],
        _count: { _all: true },
        where: usuarioWhereSinRol,
        orderBy: { rol: 'asc' }
      }),
      prisma.auditoriaAdmin.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: {
          admin: { select: { email: true, nombre_completo: true, rol: true } }
        }
      })
    ]);

    res.json({
      kpis: { usuarios, perfiles, observaciones, instituciones },
      totales: {
        usuarios: totalUsuarios,
        perfiles: totalPerfiles,
        observaciones: totalObservaciones,
        instituciones: totalInstituciones
      },
      usuariosPorRol: usuariosPorRol.map(row => ({
        rol: row.rol,
        cantidad: row._count._all
      })),
      actividadReciente: actividadReciente
    });
  } catch (error) {
    console.error('[SUPERADMIN][OVERVIEW]', error);
    return res.status(500).json({ error: 'Error obteniendo resumen del panel' });
  }
};

export const getUltimasAccionesAuditoria = async (_req: Request, res: Response) => {
  try {
    const acciones = await prisma.auditoriaAdmin.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
      include: {
        admin: { select: { email: true, nombre_completo: true, rol: true } }
      }
    });

    const { perfilIds, institucionIds, usuarioIds } = collectAuditoriaEntidadIds(acciones);

    const [perfiles, instituciones, usuarios] = await Promise.all([
      perfilIds.length
        ? prisma.perfil.findMany({
            where: { id: { in: perfilIds } },
            select: { id: true, nombre: true }
          })
        : Promise.resolve([]),
      institucionIds.length
        ? prisma.institucion.findMany({
            where: { id: { in: institucionIds } },
            select: { id: true, nombre: true }
          })
        : Promise.resolve([]),
      usuarioIds.length
        ? prisma.usuario.findMany({
            where: { id: { in: usuarioIds } },
            select: { id: true, nombre_completo: true, email: true }
          })
        : Promise.resolve([])
    ]);

    const maps = {
      perfiles: new Map(perfiles.map(p => [p.id, p.nombre])),
      instituciones: new Map(instituciones.map(i => [i.id, i.nombre])),
      usuarios: new Map(
        usuarios.map(u => [u.id, u.nombre_completo?.trim() || u.email])
      )
    };

    res.json({
      acciones: acciones.map(row => ({
        ...row,
        entidad_label: formatEntidadAuditoriaLabel(row, maps)
      }))
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error obteniendo auditoría' });
  }
};

const ROLES_REGISTRO_ADMIN = ['FAMILIA', 'EDUCADOR', 'PROFESIONAL', 'MEDICO'] as const;

const registerSchema = z.object({
  email: z.string().email().transform(normalizeEmail),
  password: z.string().min(6).optional(),
  nombre_completo: nombreCompletoConApellidoSchema,
  rol: z.enum(ROLES_REGISTRO_ADMIN),
  niveles_educacionales: z.array(nivelEducacionalSchema).optional(),
  especialidad: z
    .union([especialidadEducadorSchema, profesionProfesionalSchema])
    .optional()
});

function datosEducadorParaPersistir(
  rol: string,
  tipoInstitucion: string,
  body: { niveles_educacionales?: string[]; especialidad?: string }
) {
  return datosEquipoParaPersistir(rol, tipoInstitucion, body);
}

const usuarioEquipoSelect = {
  id: true,
  email: true,
  nombre_completo: true,
  rol: true,
  niveles_educacionales: true,
  especialidad: true,
  institucion_id: true,
  created_at: true
} as const;

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
        ...usuarioEquipoSelect
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
    const educadorData = datosEducadorParaPersistir(data.rol, institucion.tipo, data);

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
          must_change_password: !data.password,
          ...educadorData
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
            ip_address: sanitizeAuditIp(req.ip)
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
          institucion_id: user.institucion_id,
          niveles_educacionales: user.niveles_educacionales,
          especialidad: user.especialidad
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
        must_change_password: !data.password,
        ...educadorData
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
          ip_address: sanitizeAuditIp(req.ip)
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
        institucion_id: user.institucion_id,
        niveles_educacionales: user.niveles_educacionales,
        especialidad: user.especialidad
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
        consentimiento_aceptado_at: true,
        consentimiento_version: true,
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
    const userWithInstitucion = {
      ...userData,
      needs_consent: false,
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
        consentimiento_aceptado_at: true,
        consentimiento_version: true,
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
        needs_consent: false,
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

const aceptarConsentimientoSchema = z.object({
  version: z.string().min(1),
  acepto: z.literal(true)
});

/** Estado del consentimiento informado (solo aplica a rol FAMILIA). */
export const getConsentimientoEstado = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        rol: true,
        consentimiento_aceptado_at: true,
        consentimiento_version: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const needs_consent = usuarioNecesitaConsentimiento(
      user.rol,
      user.consentimiento_aceptado_at
    );

    return res.json({
      needs_consent,
      version: CONSENTIMIENTO_VERSION,
      texto: CONSENTIMIENTO_TEXTO,
      aceptado_at: user.consentimiento_aceptado_at,
      version_aceptada: user.consentimiento_version
    });
  } catch {
    return res.status(500).json({ error: 'Error al consultar consentimiento' });
  }
};

/** Registra la aceptación del consentimiento por padre/tutor (FAMILIA). */
export const aceptarConsentimiento = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const data = aceptarConsentimientoSchema.parse(req.body);

    if (data.version !== CONSENTIMIENTO_VERSION) {
      return res.status(400).json({
        error: 'La versión del consentimiento no coincide. Recargue la página e intente de nuevo.'
      });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombre_completo: true,
        rol: true,
        institucion_id: true,
        must_change_password: true,
        consentimiento_aceptado_at: true,
        institucion: { select: { nombre: true, tipo: true } }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.rol !== 'FAMILIA') {
      return res.status(403).json({
        error: 'El consentimiento informado solo aplica a cuentas de familia/tutor.'
      });
    }

    if (user.must_change_password) {
      return res.status(403).json({
        error: 'Debe definir su contraseña antes de aceptar el consentimiento.'
      });
    }

    if (user.consentimiento_aceptado_at) {
      return res.json({
        message: 'El consentimiento ya fue registrado anteriormente.',
        needs_consent: false
      });
    }

    const aceptadoAt = new Date();
    await prisma.usuario.update({
      where: { id: userId },
      data: {
        consentimiento_aceptado_at: aceptadoAt,
        consentimiento_version: CONSENTIMIENTO_VERSION
      }
    });

    return res.json({
      message: 'Consentimiento registrado. Ya puede acceder al panel familiar.',
      needs_consent: false,
      aceptado_at: aceptadoAt,
      version: CONSENTIMIENTO_VERSION,
      user: {
        id: user.id,
        email: user.email,
        nombre_completo: user.nombre_completo,
        rol: user.rol,
        institucion_id: user.institucion_id,
        must_change_password: false,
        needs_consent: false,
        institucion_nombre: user.institucion?.nombre ?? null,
        institucion_tipo: user.institucion?.tipo ?? null
      }
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al registrar consentimiento' });
  }
};

const updateUserSchema = z.object({
  nombre_completo: nombreCompletoConApellidoSchema.optional(),
  rol: z.enum(ROLES_REGISTRO_ADMIN).optional(),
  password: z.string().min(6).optional(),
  niveles_educacionales: z.array(nivelEducacionalSchema).optional(),
  especialidad: z
    .union([especialidadEducadorSchema, profesionProfesionalSchema])
    .optional()
});

export const getUsuarioDetalle = async (req: Request, res: Response) => {
  try {
    const admin = (req as AuthRequest).user;
    if (!admin || admin.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores pueden ver usuarios.' });
    }
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuario inválido.' });
    }
    const institucion_id = await institucionIdDelAdmin(admin);
    if (!institucion_id) {
      return res.status(400).json({ error: 'Administrador sin institución asignada.' });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: usuarioEquipoSelect
    });
    if (!usuario || usuario.institucion_id !== institucion_id) {
      return res.status(404).json({ error: 'Usuario no encontrado en su institución.' });
    }

    const inst = await prisma.institucion.findUnique({
      where: { id: institucion_id },
      select: { tipo: true }
    });
    const rolesPermitidos = inst
      ? rolesRegistroPorTipoInstitucion(inst.tipo)
      : ['EDUCADOR'];
    if (!rolesPermitidos.includes(usuario.rol)) {
      return res.status(403).json({ error: 'No puede consultar este tipo de usuario.' });
    }

    const vinculos = await prisma.perfilUsuario.findMany({
      where: {
        usuario_id: userId,
        perfil: { institucion_id }
      },
      select: {
        rol_en_perfil: true,
        perfil: {
          select: {
            id: true,
            nombre: true,
            nivel_educacional: true,
            consentimiento_estado: true,
            edad: true
          }
        }
      },
      orderBy: { perfil: { nombre: 'asc' } }
    });

    return res.json({
      usuario,
      perfiles: vinculos.map(v => ({
        id: v.perfil.id,
        nombre: v.perfil.nombre,
        nivel_educacional: v.perfil.nivel_educacional,
        consentimiento_estado: v.perfil.consentimiento_estado,
        edad: v.perfil.edad,
        rol_en_perfil: v.rol_en_perfil
      }))
    });
  } catch {
    return res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

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
    const rolFinal = data.rol ?? user.rol;
    if (data.rol && !rolesPermitidos.includes(data.rol)) {
      return res.status(400).json({ error: 'Rol no permitido para su institución.' });
    }
    if (
      inst &&
      requiereDatosEducadorColegio(rolFinal, inst.tipo) &&
      (data.niveles_educacionales !== undefined || data.especialidad !== undefined)
    ) {
      const actual = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { niveles_educacionales: true, especialidad: true }
      });
      educadorEquipoBodySchema.parse({
        niveles_educacionales:
          data.niveles_educacionales ?? actual?.niveles_educacionales ?? [],
        especialidad: data.especialidad !== undefined ? data.especialidad : actual?.especialidad
      });
    }
    if (
      inst &&
      requiereProfesionEquipo(rolFinal, inst.tipo) &&
      data.especialidad !== undefined
    ) {
      profesionalEquipoBodySchema.parse({ especialidad: data.especialidad });
    }
    const updateData: Record<string, unknown> = {};
    if (data.nombre_completo) updateData.nombre_completo = data.nombre_completo;
    if (data.rol) updateData.rol = data.rol;
    if (data.password) {
      updateData.password_hash = await bcrypt.hash(data.password, 10);
      updateData.must_change_password = false;
    }
    if (data.niveles_educacionales !== undefined) {
      updateData.niveles_educacionales = ordenarNivelesEducador(data.niveles_educacionales);
    }
    if (data.especialidad !== undefined) {
      updateData.especialidad = data.especialidad;
    }
    const updated = await prisma.usuario.update({
      where: { id: userId },
      data: updateData,
      select: usuarioEquipoSelect
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
          ip_address: sanitizeAuditIp(req.ip)
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
