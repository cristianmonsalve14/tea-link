import crypto from 'crypto';
import { Response } from 'express';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  crearPerfilSchema,
  actualizarPerfilSchema,
  consentimientoPerfilSchema
} from '../utils/perfilSchemas';
import {
  vincularUsuarioAPerfil,
  rolEnPerfilParaConsentimiento,
  puedeGestionarConsentimientoPerfil
} from '../utils/perfilAccess';
import {
  CONSENTIMIENTO_VERSION,
  determinarSujetoConsentimiento,
  institucionPuedeCrearPerfilMenor,
  institucionRequiereResponsableConsentimiento,
  mensajeBloqueoConsentimiento,
  mensajeResponsableConsentimientoRequerido,
  perfilEstaOperativo,
  textoConsentimientoPerfil
} from '../utils/perfilConsentimiento';
import { enriquecerPerfilesParaAdmin } from '../utils/perfilAdminView';
import {
  ejecutarCesionCustodiaPerfil,
  ErrorCesionCustodia
} from '../utils/perfilCustodia';
import { construirDetallePerfilAdmin } from '../utils/perfilDetalleAdmin';
import { construirDetallePerfilOperativo } from '../utils/perfilDetalleOperativo';
import {
  listarPerfilesAdminPaginado,
  listarPerfilesOperativoPaginado,
  perfilListQuerySchema,
  perfilOperativoListQuerySchema
} from '../utils/perfilListQuery';
import { normalizeEmail } from '../utils/email';
import { institucionRequiereNivelEducacional } from '../utils/nivelEducacional';
import {
  educadorAtiendeNivelPerfil,
  mensajeEducadorSinNivelPerfil
} from '../utils/educadorEquipo';
import { resolverEdadPerfilDesdeFecha } from '../utils/edadDesdeFechaNacimiento';
import type { consentimiento_sujeto_enum } from '@prisma/client';
import {
  contarApoderadosPerfil,
  puedeInvitarApoderado,
  MAX_APODERADOS_POR_PERFIL
} from '../utils/apoderadoPerfil';
import { nombreCompletoConApellidoSchema } from '../utils/nombrePersona';
import { normalizarRutChileno, formatearRutChileno } from '../utils/rutChileno';

const prisma = new PrismaClient();

async function registrarResponsableConsentimientoEnPerfil(
  perfilId: number,
  email: string,
  nombre: string,
  sujeto: consentimiento_sujeto_enum,
  options?: { esPrincipal?: boolean; institucionIdTutor?: number | null }
) {
  const normalized = normalizeEmail(email);
  const existing = await prisma.usuario.findFirst({
    where: { email: { equals: normalized, mode: 'insensitive' } }
  });

  const rolPerfil = rolEnPerfilParaConsentimiento(sujeto);
  const etiqueta = sujeto === 'TITULAR' ? 'estudiante titular' : 'tutor';
  const apoderadosActuales = await contarApoderadosPerfil(perfilId);
  const esPrincipal =
    options?.esPrincipal === true || apoderadosActuales === 0;

  if (existing) {
    if (existing.rol !== 'FAMILIA') {
      throw new Error(
        `El correo ya está registrado como ${existing.rol}. Use otro correo para el ${etiqueta}.`
      );
    }
    await vincularUsuarioAPerfil(perfilId, existing.id, 'FAMILIA', rolPerfil, {
      puedeEditar: esPrincipal
    });
    return { usuario: existing, tempPassword: undefined as string | undefined, created: false };
  }

  const tempPassword = crypto.randomBytes(8).toString('base64url');
  const password_hash = await bcrypt.hash(tempPassword, 10);
  const usuario = await prisma.usuario.create({
    data: {
      email: normalized,
      nombre_completo: nombre.trim(),
      rol: 'FAMILIA',
      password_hash,
      must_change_password: true,
      institucion_id: options?.institucionIdTutor ?? null
    }
  });
  await vincularUsuarioAPerfil(perfilId, usuario.id, 'FAMILIA', rolPerfil, {
    puedeEditar: esPrincipal
  });
  return { usuario, tempPassword, created: true };
}

export const buscarPerfilPorRut = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores pueden consultar el registro por RUT.' });
    }
    const rut = normalizarRutChileno(String(req.query.rut ?? ''));
    if (!rut) {
      return res.status(400).json({ error: 'RUT inválido' });
    }
    const perfil = await prisma.perfil.findUnique({
      where: { rut },
      select: {
        id: true,
        nombre: true,
        institucion: { select: { id: true, nombre: true, tipo: true } }
      }
    });
    if (!perfil) {
      return res.json({ encontrado: false, rut: formatearRutChileno(rut) });
    }
    return res.json({
      encontrado: true,
      rut: formatearRutChileno(rut),
      perfil
    });
  } catch {
    return res.status(500).json({ error: 'Error al buscar por RUT' });
  }
};

export const crearPerfil = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores pueden crear perfiles de estudiantes.' });
    }

    const data = crearPerfilSchema.parse(req.body);
    const institucion_id = req.user?.institucion_id;
    const userId = req.user?.userId;

    if (!institucion_id || !userId) {
      return res.status(400).json({ error: 'Institución no encontrada' });
    }

    const institucion = await prisma.institucion.findUnique({
      where: { id: institucion_id },
      select: { tipo: true, nombre: true }
    });
    if (!institucion) {
      return res.status(404).json({ error: 'Institución no encontrada' });
    }
    if (!institucionPuedeCrearPerfilMenor(institucion.tipo)) {
      return res.status(403).json({
        error: 'Su tipo de institución no puede crear perfiles de menores en la plataforma.'
      });
    }

    if (institucionRequiereResponsableConsentimiento(institucion.tipo)) {
      if (!data.fecha_nacimiento) {
        return res.status(400).json({
          error: 'Debe indicar la fecha de nacimiento para determinar quién acepta el consentimiento.'
        });
      }
    }

    const { tutor_email, tutor_nombre_completo, ...perfilDataRaw } = data;
    const perfilData = resolverEdadPerfilDesdeFecha(perfilDataRaw);
    const sujetoConsentimiento = determinarSujetoConsentimiento(
      perfilData.edad,
      perfilData.fecha_nacimiento
    );

    if (institucionRequiereResponsableConsentimiento(institucion.tipo)) {
      if (!tutor_email || !tutor_nombre_completo?.trim()) {
        return res.status(400).json({
          error: mensajeResponsableConsentimientoRequerido(sujetoConsentimiento)
        });
      }
    }

    if (institucionRequiereNivelEducacional(institucion.tipo) && !data.nivel_educacional) {
      return res.status(400).json({
        error: 'Debe indicar el nivel educacional del estudiante (curso o programa).'
      });
    }

    const existenteRut = await prisma.perfil.findUnique({
      where: { rut: data.rut },
      select: {
        id: true,
        nombre: true,
        institucion: { select: { id: true, nombre: true, tipo: true } }
      }
    });
    if (existenteRut) {
      return res.status(409).json({
        error: `Ya existe un registro nacional para el RUT ${formatearRutChileno(data.rut)} (${existenteRut.nombre}).`,
        codigo: 'RUT_DUPLICADO',
        perfil: {
          id: existenteRut.id,
          nombre: existenteRut.nombre,
          institucion: existenteRut.institucion
        },
        message:
          'En TEA Link cada estudiante tiene un único RUT en el registro nacional. Si ya fue dado de alta, solicite vínculo con la institución que lo custodia.'
      });
    }

    const perfil = await prisma.perfil.create({
      data: {
        ...perfilData,
        fecha_nacimiento: perfilData.fecha_nacimiento
          ? new Date(perfilData.fecha_nacimiento)
          : undefined,
        institucion_id,
        consentimiento_estado: 'PENDIENTE',
        consentimiento_sujeto: sujetoConsentimiento
      }
    });

    let responsableInfo: {
      email: string;
      nombre_completo: string;
      tempPassword?: string;
      created: boolean;
      sujeto: consentimiento_sujeto_enum;
    } | null = null;

    if (tutor_email && tutor_nombre_completo) {
      try {
        const result = await registrarResponsableConsentimientoEnPerfil(
          perfil.id,
          tutor_email,
          tutor_nombre_completo,
          sujetoConsentimiento,
          { esPrincipal: true }
        );
        responsableInfo = {
          email: result.usuario.email,
          nombre_completo: result.usuario.nombre_completo,
          tempPassword: result.tempPassword,
          created: result.created,
          sujeto: sujetoConsentimiento
        };
      } catch (err) {
        await prisma.perfil.delete({ where: { id: perfil.id } });
        return res.status(409).json({
          error:
            err instanceof Error
              ? err.message
              : 'No se pudo registrar al responsable del consentimiento'
        });
      }
    }

    await prisma.auditoriaAdmin.create({
      data: {
        admin_id: userId,
        accion: 'Crear perfil',
        entidad: 'perfil',
        entidad_id: perfil.id,
        detalles: `Perfil ${perfil.nombre} creado (consentimiento PENDIENTE)`,
        ip_address: req.ip || null
      }
    });

    return res.status(201).json({
      perfil,
      tutor: responsableInfo,
      responsable: responsableInfo,
      message: responsableInfo
        ? responsableInfo.sujeto === 'TITULAR'
          ? 'Perfil creado. Comparta las credenciales al estudiante; debe aceptar el consentimiento de su propio perfil al ingresar.'
          : 'Perfil creado. Comparta las credenciales temporales al tutor; debe aceptar el consentimiento al ingresar.'
        : 'Perfil creado en estado pendiente de consentimiento.'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al crear perfil' });
  }
};

export const obtenerPerfiles = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const institucion_id = req.user?.institucion_id;
    const rol = req.user?.rol;

    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const rolesOperativos = ['EDUCADOR', 'FAMILIA', 'PROFESIONAL', 'MEDICO'];

    if (rol && rolesOperativos.includes(rol)) {
      const query = perfilOperativoListQuerySchema.parse(req.query);
      const listado = await listarPerfilesOperativoPaginado(
        userId,
        institucion_id,
        rol,
        query
      );
      return res.json({
        perfiles: listado.perfiles,
        paginacion: listado.paginacion,
        resumen: listado.resumen
      });
    }

    if (!institucion_id) {
      return res.status(400).json({ error: 'Institución no encontrada' });
    }
    const institucion = await prisma.institucion.findUnique({
      where: { id: institucion_id },
      select: { tipo: true }
    });
    if (!institucion) {
      return res.status(404).json({ error: 'Institución no encontrada' });
    }

    const query = perfilListQuerySchema.parse(req.query);
    const listado = await listarPerfilesAdminPaginado(
      institucion_id,
      institucion.tipo,
      query
    );
    const enriquecidos = await enriquecerPerfilesParaAdmin(
      listado.perfiles,
      institucion_id
    );

    return res.json({
      perfiles: enriquecidos,
      paginacion: listado.paginacion,
      resumen: listado.resumen
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al obtener perfiles' });
  }
};

/** Perfiles vinculados al tutor (FAMILIA) — incluye estado de consentimiento. */
export const listPerfilesTutorFamilia = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user?.userId || user.rol !== 'FAMILIA') {
      return res.status(403).json({ error: 'Solo cuentas de familia/tutor pueden acceder.' });
    }

    const vinculos = await prisma.perfilUsuario.findMany({
      where: { usuario_id: user.userId },
      include: {
        perfil: {
          select: {
            id: true,
            nombre: true,
            edad: true,
            diagnostico_clinico: true,
            diagnostico_secundario: true,
            grado_discapacidad: true,
            causa_discapacidad: true,
            porcentaje_rnd: true,
            tiene_credencial_rnd: true,
            consentimiento_estado: true,
            consentimiento_sujeto: true,
            consentimiento_aceptado_at: true,
            institucion: { select: { id: true, nombre: true, tipo: true } }
          }
        }
      },
      orderBy: { perfil: { nombre: 'asc' } }
    });

    const perfiles = vinculos.map(v => ({
      ...v.perfil,
      rol_en_perfil: v.rol_en_perfil
    }));

    return res.json({ perfiles });
  } catch {
    return res.status(500).json({ error: 'Error al listar perfiles del tutor' });
  }
};

export const obtenerConsentimientoPerfil = async (req: AuthRequest, res: Response) => {
  try {
    const perfilId = Number(req.params.id);
    if (isNaN(perfilId)) {
      return res.status(400).json({ error: 'ID de perfil inválido' });
    }
    const user = req.user;
    if (!user?.userId || user.rol !== 'FAMILIA') {
      return res.status(403).json({ error: 'Solo el tutor o titular del perfil puede consultar este consentimiento.' });
    }

    const vinculo = await prisma.perfilUsuario.findUnique({
      where: { perfil_id_usuario_id: { perfil_id: perfilId, usuario_id: user.userId } }
    });
    if (!vinculo || !puedeGestionarConsentimientoPerfil(vinculo.rol_en_perfil)) {
      return res.status(404).json({ error: 'No está autorizado sobre este perfil.' });
    }

    const perfil = await prisma.perfil.findUnique({
      where: { id: perfilId },
      select: {
        id: true,
        nombre: true,
        consentimiento_estado: true,
        consentimiento_sujeto: true,
        consentimiento_aceptado_at: true,
        institucion: { select: { nombre: true } }
      }
    });
    if (!perfil) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    const requiereAccion =
      perfil.consentimiento_estado === 'PENDIENTE' || !vinculo.consentimiento_aceptado_at;

    return res.json({
      perfil,
      version: CONSENTIMIENTO_VERSION,
      texto: textoConsentimientoPerfil(perfil.consentimiento_sujeto),
      requiere_accion: requiereAccion,
      es_apoderado_secundario:
        perfil.consentimiento_estado === 'ACEPTADO' && !vinculo.consentimiento_aceptado_at
    });
  } catch {
    return res.status(500).json({ error: 'Error al obtener consentimiento del perfil' });
  }
};

export const registrarConsentimientoPerfil = async (req: AuthRequest, res: Response) => {
  try {
    const perfilId = Number(req.params.id);
    if (isNaN(perfilId)) {
      return res.status(400).json({ error: 'ID de perfil inválido' });
    }
    const user = req.user;
    if (!user?.userId || user.rol !== 'FAMILIA') {
      return res.status(403).json({ error: 'Solo el tutor o titular del perfil puede registrar el consentimiento.' });
    }

    const data = consentimientoPerfilSchema.parse(req.body);
    if (data.version !== CONSENTIMIENTO_VERSION) {
      return res.status(400).json({
        error: 'Versión del consentimiento desactualizada. Recargue la página.'
      });
    }

    const vinculo = await prisma.perfilUsuario.findUnique({
      where: { perfil_id_usuario_id: { perfil_id: perfilId, usuario_id: user.userId } }
    });
    if (!vinculo || !puedeGestionarConsentimientoPerfil(vinculo.rol_en_perfil)) {
      return res.status(404).json({ error: 'No está autorizado sobre este perfil.' });
    }

    const perfil = await prisma.perfil.findUnique({ where: { id: perfilId } });
    if (!perfil) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    if (perfil.consentimiento_estado === 'ACEPTADO' && vinculo.consentimiento_aceptado_at) {
      return res.json({
        message: 'El consentimiento ya fue registrado.',
        perfil: { id: perfil.id, consentimiento_estado: perfil.consentimiento_estado }
      });
    }

    if (perfil.consentimiento_estado === 'ACEPTADO' && !vinculo.consentimiento_aceptado_at) {
      if (!data.acepto) {
        await prisma.perfilUsuario.delete({
          where: {
            perfil_id_usuario_id: { perfil_id: perfilId, usuario_id: user.userId }
          }
        });
        return res.json({
          message: 'Ha declinado participar como apoderado en este perfil.',
          perfil: { id: perfil.id, consentimiento_estado: perfil.consentimiento_estado }
        });
      }
      const aceptadoAt = new Date();
      await prisma.perfilUsuario.update({
        where: {
          perfil_id_usuario_id: { perfil_id: perfilId, usuario_id: user.userId }
        },
        data: { consentimiento_aceptado_at: aceptadoAt }
      });
      return res.json({
        message: 'Confirmación registrada. Ya puede participar en la bitácora de este perfil.',
        perfil: {
          id: perfil.id,
          consentimiento_estado: perfil.consentimiento_estado,
          consentimiento_aceptado_at: aceptadoAt
        }
      });
    }

    if (perfil.consentimiento_estado === 'ACEPTADO') {
      return res.json({
        message: 'El consentimiento ya fue registrado.',
        perfil: { id: perfil.id, consentimiento_estado: perfil.consentimiento_estado }
      });
    }

    if (!data.acepto) {
      const rechazado = await prisma.perfil.update({
        where: { id: perfilId },
        data: {
          consentimiento_estado: 'RECHAZADO',
          consentimiento_aceptado_at: null,
          consentimiento_version: null,
          consentimiento_por_usuario_id: user.userId
        },
        select: { id: true, nombre: true, consentimiento_estado: true }
      });
      return res.json({
        message:
          'Ha rechazado el consentimiento. No se registrarán observaciones sobre este perfil.',
        perfil: rechazado
      });
    }

    const aceptadoAt = new Date();
    const actualizado = await prisma.perfil.update({
      where: { id: perfilId },
      data: {
        consentimiento_estado: 'ACEPTADO',
        consentimiento_aceptado_at: aceptadoAt,
        consentimiento_version: CONSENTIMIENTO_VERSION,
        consentimiento_por_usuario_id: user.userId
      },
      select: {
        id: true,
        nombre: true,
        consentimiento_estado: true,
        consentimiento_aceptado_at: true
      }
    });
    await prisma.perfilUsuario.update({
      where: {
        perfil_id_usuario_id: { perfil_id: perfilId, usuario_id: user.userId }
      },
      data: { consentimiento_aceptado_at: aceptadoAt }
    });

    return res.json({
      message:
        'Consentimiento registrado. El equipo autorizado ya puede registrar observaciones sobre este perfil.',
      perfil: actualizado
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al registrar consentimiento' });
  }
};

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

/** Ficha del perfil: administradores (gestión) o equipo clínico/pedagógico (solo lectura). */
export const obtenerDetallePerfil = async (req: AuthRequest, res: Response) => {
  try {
    const perfilId = Number(req.params.id);
    if (isNaN(perfilId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const user = req.user;
    if (!user?.userId || !user.rol) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (user.rol === 'ADMINISTRADOR') {
      if (!user.institucion_id) {
        return res.status(400).json({ error: 'Institución no encontrada' });
      }
      const institucion = await prisma.institucion.findUnique({
        where: { id: user.institucion_id },
        select: { tipo: true }
      });
      if (!institucion) {
        return res.status(404).json({ error: 'Institución no encontrada' });
      }
      const detalle = await construirDetallePerfilAdmin(
        perfilId,
        user.institucion_id,
        institucion.tipo
      );
      if (!detalle) {
        return res.status(404).json({ error: 'Perfil no encontrado o sin acceso' });
      }
      return res.json({ ...detalle, modo: 'admin' });
    }

    const rolesEquipo = ['MEDICO', 'PROFESIONAL', 'EDUCADOR'];
    if (rolesEquipo.includes(user.rol)) {
      const detalle = await construirDetallePerfilOperativo(
        perfilId,
        user.userId,
        user.institucion_id,
        user.rol
      );
      if (!detalle) {
        return res.status(404).json({ error: 'Perfil no encontrado o sin acceso' });
      }
      return res.json(detalle);
    }

    return res.status(403).json({ error: 'No autorizado para ver esta ficha' });
  } catch {
    return res.status(500).json({ error: 'Error al obtener detalle del perfil' });
  }
};

/** @deprecated usar obtenerDetallePerfil */
export const obtenerDetallePerfilAdmin = obtenerDetallePerfil;

export const actualizarPerfil = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const institucion_id = req.user?.institucion_id;
    const userId = req.user?.userId;
    const userRol = req.user?.rol;
    const perfilActual = await prisma.perfil.findUnique({ where: { id } });
    if (!perfilActual) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }
    if (perfilActual.institucion_id !== institucion_id) {
      return res.status(403).json({ error: 'No puedes editar perfiles de otra institución' });
    }

    const institucion = institucion_id
      ? await prisma.institucion.findUnique({
          where: { id: institucion_id },
          select: { tipo: true }
        })
      : null;

    const parsed = actualizarPerfilSchema.parse(req.body);
    const parsedConEdad = resolverEdadPerfilDesdeFecha({
      ...parsed,
      fecha_nacimiento:
        typeof req.body.fecha_nacimiento === 'string'
          ? req.body.fecha_nacimiento
          : undefined
    });

    if (institucion && institucionRequiereNivelEducacional(institucion.tipo)) {
      const nivelFinal =
        parsedConEdad.nivel_educacional !== undefined
          ? parsedConEdad.nivel_educacional
          : perfilActual.nivel_educacional;
      if (!nivelFinal) {
        return res.status(400).json({
          error: 'Debe indicar el nivel educacional del estudiante (curso o programa).'
        });
      }
    }

    const perfil = await prisma.perfil.update({
      where: { id },
      data: {
        ...parsedConEdad,
        fecha_nacimiento: req.body.fecha_nacimiento
          ? new Date(req.body.fecha_nacimiento)
          : undefined
      }
    });
    if (userRol === 'ADMINISTRADOR' && userId) {
      await prisma.auditoriaAdmin.create({
        data: {
          admin_id: userId,
          accion: 'Actualizar perfil',
          entidad: 'perfil',
          entidad_id: perfil.id,
          detalles: `Perfil actualizado por ADMINISTRADOR (${req.user?.email})`,
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

export const eliminarPerfil = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.rol !== 'SUPERADMIN') {
      return res.status(403).json({
        error:
          'Solo el superadministrador puede eliminar perfiles del registro nacional. Las instituciones deben ceder custodia o mantener el vínculo.'
      });
    }
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const userId = req.user?.userId;
    const perfilActual = await prisma.perfil.findUnique({ where: { id } });
    if (!perfilActual) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    await prisma.perfil.delete({ where: { id } });
    if (userId) {
      await prisma.auditoriaAdmin.create({
        data: {
          admin_id: userId,
          accion: 'Eliminar perfil',
          entidad: 'perfil',
          entidad_id: id,
          detalles: `Perfil ${perfilActual.nombre} (RUT ${perfilActual.rut ?? 'sin RUT'}) eliminado por SUPERADMIN (${req.user?.email})`,
          ip_address: req.ip || null
        }
      });
    }
    return res.json({ message: 'Perfil eliminado correctamente' });
  } catch {
    return res.status(500).json({ error: 'Error al eliminar perfil' });
  }
};

export const cederCustodiaPerfil = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const admin = req.user;
    if (!admin?.userId || admin.rol !== 'ADMINISTRADOR' || !admin.institucion_id) {
      return res.status(403).json({ error: 'Solo administradores institucionales.' });
    }

    const receptor = await ejecutarCesionCustodiaPerfil(
      id,
      admin.institucion_id,
      admin.userId,
      req.ip
    );

    return res.json({
      message: `Custodia del perfil transferida a ${receptor.nombre}. Las observaciones se conservan; su equipo ya no administra este perfil.`,
      receptor: {
        id: receptor.id,
        nombre: receptor.nombre,
        tipo: receptor.tipo
      }
    });
  } catch (error) {
    if (error instanceof ErrorCesionCustodia) {
      const status =
        error.codigo === 'PERFIL_NO_ENCONTRADO'
          ? 404
          : error.codigo === 'NO_DUENO'
            ? 403
            : 400;
      return res.status(status).json({ error: error.message, codigo: error.codigo });
    }
    return res.status(500).json({ error: 'Error al ceder custodia del perfil' });
  }
};

const vincularMiembroSchema = z.object({
  email: z.string().email()
});

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
      where: { id: perfilId, institucion_id },
      select: { id: true, nombre: true, consentimiento_estado: true, nivel_educacional: true }
    });
    if (!perfil) {
      return res.status(404).json({ error: 'Perfil no encontrado en su institución' });
    }

    if (!perfilEstaOperativo(perfil.consentimiento_estado)) {
      return res.status(403).json({
        error: mensajeBloqueoConsentimiento(perfil.consentimiento_estado)
      });
    }

    const { email } = vincularMiembroSchema.parse(req.body);
    const usuario = await prisma.usuario.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        institucion_id
      },
      select: {
        id: true,
        email: true,
        nombre_completo: true,
        rol: true,
        institucion_id: true,
        niveles_educacionales: true
      }
    });
    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado con ese correo en su institución.'
      });
    }
    const rolesEquipo = ['FAMILIA', 'EDUCADOR', 'PROFESIONAL', 'MEDICO'];
    if (!rolesEquipo.includes(usuario.rol)) {
      return res.status(400).json({
        error: 'Solo se pueden vincular usuarios con rol FAMILIA, EDUCADOR, PROFESIONAL o MÉDICO'
      });
    }

    const institucion = await prisma.institucion.findUnique({
      where: { id: institucion_id },
      select: { tipo: true }
    });
    if (
      institucion?.tipo === 'CENTRO_EDUCACIONAL' &&
      usuario.rol === 'EDUCADOR' &&
      perfil.nivel_educacional &&
      !educadorAtiendeNivelPerfil(usuario.niveles_educacionales, perfil.nivel_educacional)
    ) {
      return res.status(400).json({
        error: mensajeEducadorSinNivelPerfil(perfil.nivel_educacional)
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
      message: `${usuario.nombre_completo} vinculado al perfil ${perfil.nombre}.`,
      usuario
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al vincular miembro del equipo' });
  }
};

const invitarApoderadoSchema = z.object({
  email: z.string().email(),
  nombre_completo: nombreCompletoConApellidoSchema
});

export const listApoderadosPerfil = async (req: AuthRequest, res: Response) => {
  try {
    const perfilId = Number(req.params.id);
    if (isNaN(perfilId)) {
      return res.status(400).json({ error: 'ID de perfil inválido' });
    }
    const user = req.user;
    if (!user?.userId || user.rol !== 'FAMILIA') {
      return res.status(403).json({ error: 'Solo apoderados pueden consultar este listado.' });
    }

    const vinculo = await prisma.perfilUsuario.findUnique({
      where: { perfil_id_usuario_id: { perfil_id: perfilId, usuario_id: user.userId } }
    });
    if (!vinculo || !puedeGestionarConsentimientoPerfil(vinculo.rol_en_perfil)) {
      return res.status(404).json({ error: 'No está autorizado sobre este perfil.' });
    }

    const apoderados = await prisma.perfilUsuario.findMany({
      where: {
        perfil_id: perfilId,
        rol_en_perfil: { in: ['TUTOR', 'TITULAR'] }
      },
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombre_completo: true
          }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    const esPrincipal = vinculo.puede_editar === true;
    const total = apoderados.length;

    return res.json({
      apoderados: apoderados.map(a => ({
        usuario_id: a.usuario_id,
        nombre_completo: a.usuario.nombre_completo,
        email: a.usuario.email,
        es_principal: a.puede_editar === true,
        consentimiento_aceptado: Boolean(a.consentimiento_aceptado_at),
        rol_en_perfil: a.rol_en_perfil
      })),
      es_principal: esPrincipal,
      puede_invitar: esPrincipal && total < MAX_APODERADOS_POR_PERFIL,
      total,
      maximo: MAX_APODERADOS_POR_PERFIL
    });
  } catch {
    return res.status(500).json({ error: 'Error al listar apoderados' });
  }
};

export const invitarApoderadoPerfil = async (req: AuthRequest, res: Response) => {
  try {
    const perfilId = Number(req.params.id);
    if (isNaN(perfilId)) {
      return res.status(400).json({ error: 'ID de perfil inválido' });
    }
    const user = req.user;
    if (!user?.userId || user.rol !== 'FAMILIA') {
      return res.status(403).json({ error: 'Solo apoderados pueden invitar a otros tutores.' });
    }

    const validacion = await puedeInvitarApoderado(user.userId, perfilId);
    if (!validacion.ok) {
      return res.status(403).json({ error: validacion.error });
    }

    const data = invitarApoderadoSchema.parse(req.body);
    const principal = await prisma.usuario.findUnique({
      where: { id: user.userId },
      select: { institucion_id: true }
    });

    const yaVinculado = await prisma.perfilUsuario.findFirst({
      where: {
        perfil_id: perfilId,
        usuario: { email: { equals: normalizeEmail(data.email), mode: 'insensitive' } }
      }
    });
    if (yaVinculado) {
      return res.status(409).json({ error: 'Esa persona ya está vinculada a este perfil.' });
    }

    const result = await registrarResponsableConsentimientoEnPerfil(
      perfilId,
      data.email,
      data.nombre_completo,
      'TUTOR_LEGAL',
      {
        esPrincipal: false,
        institucionIdTutor: principal?.institucion_id ?? null
      }
    );

    return res.status(201).json({
      message: result.created
        ? 'Apoderado invitado. Comparta las credenciales temporales; debe confirmar el consentimiento al ingresar.'
        : 'Apoderado vinculado. Debe ingresar y confirmar el consentimiento de este perfil.',
      apoderado: {
        email: result.usuario.email,
        nombre_completo: result.usuario.nombre_completo
      },
      tempPassword: result.tempPassword
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    if (error instanceof Error) {
      return res.status(409).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Error al invitar apoderado' });
  }
};
