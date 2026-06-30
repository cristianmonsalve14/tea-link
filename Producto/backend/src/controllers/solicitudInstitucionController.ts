import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { perfilEstaOperativo } from '../utils/perfilConsentimiento';
import {
  adminPuedeGestionarColaboracion,
  puedeInvitarInstituciones,
  ROLES_ASIGNABLES_COLABORACION,
  tipoInstitucionPuedeRecibirInvitacion,
  tiposInstitucionInvitablesPorSolicitante
} from '../utils/solicitudInstitucionRules';
import { vincularUsuarioAPerfil } from '../utils/perfilAccess';
import {
  educadorAtiendeNivelPerfil,
  mensajeEducadorSinNivelPerfil
} from '../utils/educadorEquipo';
import {
  filtrarYPaginarInstitucionesRed,
  institucionContactoSelect,
  institucionesInvitablesQuerySchema,
  institucionesRedQuerySchema,
  mapInstitucionContacto
} from '../utils/institucionContacto';
import { puedeListarInstitucionesInvitables } from '../utils/institucionInvitable';

const prisma = new PrismaClient();

async function getInstitucionAdmin(admin: AuthRequest['user']) {
  if (!admin?.institucion_id) return null;
  return prisma.institucion.findUnique({
    where: { id: admin.institucion_id },
    select: institucionContactoSelect
  });
}

async function assertPerfilPropioAdmin(admin: AuthRequest['user'], perfilId: number) {
  if (!admin?.institucion_id) {
    return { error: 'Administrador sin institución', status: 400 as const };
  }
  const perfil = await prisma.perfil.findFirst({
    where: { id: perfilId, institucion_id: admin.institucion_id },
    include: { institucion: { select: { nombre: true } } }
  });
  if (!perfil) {
    return { error: 'Perfil no encontrado en su institución', status: 404 as const };
  }
  if (!perfilEstaOperativo(perfil.consentimiento_estado)) {
    return {
      error:
        'El perfil debe tener consentimiento aceptado (por tutor o titular) antes de invitar a otras instituciones.',
      status: 403 as const
    };
  }
  return { perfil };
}

async function assertSolicitudAceptada(institucionId: number, perfilId: number) {
  const solicitud = await prisma.solicitudInstitucionPerfil.findFirst({
    where: {
      perfil_id: perfilId,
      institucion_invitada_id: institucionId,
      estado: 'ACEPTADA'
    }
  });
  return !!solicitud;
}

/** Catálogo de instituciones invitables (creadas por superadmin). */
export const listInstitucionesInvitables = async (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user;
    if (!admin?.institucion_id || admin.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores institucionales.' });
    }
    const miInst = await getInstitucionAdmin(admin);
    if (!miInst || !puedeInvitarInstituciones(miInst.tipo)) {
      return res.status(403).json({
        error: 'Su tipo de institución no puede enviar invitaciones de colaboración.'
      });
    }

    const query = institucionesInvitablesQuerySchema.parse(req.query);

    if (query.perfil_id) {
      const check = await assertPerfilPropioAdmin(admin, query.perfil_id);
      if (!('perfil' in check)) {
        return res.status(check.status).json({ error: check.error });
      }
    }

    const yaInvitadas = query.perfil_id
      ? await prisma.solicitudInstitucionPerfil.findMany({
          where: {
            perfil_id: query.perfil_id,
            estado: { in: ['PENDIENTE', 'ACEPTADA'] }
          },
          select: { institucion_invitada_id: true }
        })
      : [];

    const tiposInvitables = tiposInstitucionInvitablesPorSolicitante(miInst.tipo);
    const excluirIds = [miInst.id, ...yaInvitadas.map(s => s.institucion_invitada_id)];
    const q = query.q?.trim();

    const where = {
      id: { notIn: excluirIds },
      tipo: query.tipo ?? { in: tiposInvitables },
      ...(query.region ? { region: query.region } : {}),
      ...(query.comuna
        ? {
            comuna: {
              equals: query.comuna,
              mode: 'insensitive' as const
            }
          }
        : {}),
      ...(q
        ? {
            OR: [
              { nombre: { contains: q, mode: 'insensitive' as const } },
              { comuna: { contains: q, mode: 'insensitive' as const } },
              { localidad: { contains: q, mode: 'insensitive' as const } },
              { direccion: { contains: q, mode: 'insensitive' as const } },
              { email_contacto: { contains: q, mode: 'insensitive' as const } },
              { telefono_contacto: { contains: q, mode: 'insensitive' as const } }
            ]
          }
        : {})
    };

    const [totalCatalogo, totalFiltrado] = await Promise.all([
      prisma.institucion.count({
        where: {
          id: { not: miInst.id },
          tipo: { in: tiposInvitables }
        }
      }),
      prisma.institucion.count({ where })
    ]);

    const requiereBusqueda = !puedeListarInstitucionesInvitables(totalFiltrado, q);

    if (requiereBusqueda) {
      return res.json({
        instituciones: [],
        paginacion: {
          page: 1,
          limit: query.limit,
          total: totalFiltrado,
          totalPages: 0
        },
        resumen: {
          total: totalCatalogo,
          filtrados: totalFiltrado,
          excluidas_por_invitacion: yaInvitadas.length,
          requiere_busqueda: true
        }
      });
    }

    const instituciones = await prisma.institucion.findMany({
      where,
      orderBy: { nombre: 'asc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: institucionContactoSelect
    });

    const totalPages = Math.ceil(totalFiltrado / query.limit) || 0;

    return res.json({
      instituciones: instituciones.map(mapInstitucionContacto),
      paginacion: {
        page: totalPages > 0 ? Math.min(query.page, totalPages) : 1,
        limit: query.limit,
        total: totalFiltrado,
        totalPages
      },
      resumen: {
        total: totalCatalogo,
        filtrados: totalFiltrado,
        excluidas_por_invitacion: yaInvitadas.length,
        requiere_busqueda: false
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al listar instituciones' });
  }
};

/** Invitaciones enviadas para un perfil (admin dueño del perfil). */
export const listSolicitudesEnviadasPerfil = async (req: AuthRequest, res: Response) => {
  try {
    const perfilId = Number(req.params.id);
    if (isNaN(perfilId)) return res.status(400).json({ error: 'ID inválido' });

    const check = await assertPerfilPropioAdmin(req.user, perfilId);
    if ('error' in check && !('perfil' in check)) {
      return res.status(check.status).json({ error: check.error });
    }

    const solicitudes = await prisma.solicitudInstitucionPerfil.findMany({
      where: { perfil_id: perfilId },
      orderBy: { created_at: 'desc' },
      include: {
        institucion_invitada: { select: institucionContactoSelect }
      }
    });

    return res.json({ solicitudes });
  } catch {
    return res.status(500).json({ error: 'Error al listar solicitudes' });
  }
};

const crearSolicitudSchema = z.object({
  institucion_invitada_id: z.coerce.number().int().positive()
});

/** Colegio (u dueño del perfil) invita a otra institución del catálogo. */
export const crearSolicitudInstitucion = async (req: AuthRequest, res: Response) => {
  try {
    const perfilId = Number(req.params.id);
    if (isNaN(perfilId)) return res.status(400).json({ error: 'ID inválido' });

    const admin = req.user;
    if (!admin?.userId || admin.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores.' });
    }

    const check = await assertPerfilPropioAdmin(admin, perfilId);
    if (!('perfil' in check)) {
      return res.status(check.status).json({ error: check.error });
    }

    const miInst = await getInstitucionAdmin(admin);
    if (!miInst || !puedeInvitarInstituciones(miInst.tipo)) {
      return res.status(403).json({ error: 'No puede enviar invitaciones.' });
    }

    const data = crearSolicitudSchema.parse(req.body);
    if (data.institucion_invitada_id === miInst.id) {
      return res.status(400).json({ error: 'No puede invitar a su propia institución.' });
    }

    const invitada = await prisma.institucion.findUnique({
      where: { id: data.institucion_invitada_id }
    });
    if (!invitada || !tipoInstitucionPuedeRecibirInvitacion(invitada.tipo, miInst.tipo)) {
      return res.status(400).json({
        error: 'La institución invitada no existe o no puede recibir este tipo de invitación.'
      });
    }

    const existente = await prisma.solicitudInstitucionPerfil.findUnique({
      where: {
        perfil_id_institucion_invitada_id: {
          perfil_id: perfilId,
          institucion_invitada_id: data.institucion_invitada_id
        }
      }
    });
    if (existente) {
      if (existente.estado === 'RECHAZADA') {
        const actualizada = await prisma.solicitudInstitucionPerfil.update({
          where: { id: existente.id },
          data: {
            estado: 'PENDIENTE',
            solicitado_por_id: admin.userId,
            respondido_por_id: null,
            respondido_at: null
          },
          include: {
            institucion_invitada: { select: institucionContactoSelect }
          }
        });
        return res.status(201).json({
          message: 'Invitación reenviada.',
          solicitud: actualizada
        });
      }
      return res.status(409).json({
        error: `Ya existe una invitación ${existente.estado.toLowerCase()} para esa institución.`
      });
    }

    const solicitud = await prisma.solicitudInstitucionPerfil.create({
      data: {
        perfil_id: perfilId,
        institucion_solicitante_id: miInst.id,
        institucion_invitada_id: data.institucion_invitada_id,
        solicitado_por_id: admin.userId
      },
      include: {
        institucion_invitada: { select: institucionContactoSelect },
        perfil: { select: { id: true, nombre: true } }
      }
    });

    await prisma.auditoriaAdmin.create({
      data: {
        admin_id: admin.userId,
        accion: 'INVITAR_INSTITUCION_PERFIL',
        entidad: 'solicitud_institucion',
        entidad_id: solicitud.id,
        detalles: `Invitación a ${invitada.nombre} para perfil ${solicitud.perfil.nombre}`,
        ip_address: req.ip || null
      }
    });

    return res.status(201).json({
      message: `Invitación enviada a ${invitada.nombre}. Esperando aceptación de su administrador.`,
      solicitud
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al crear invitación' });
  }
};

/** Solicitudes recibidas por la institución del admin (pendientes y recientes). */
export const listSolicitudesRecibidas = async (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user;
    if (!admin?.institucion_id || admin.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores.' });
    }

    const miInst = await getInstitucionAdmin(admin);
    if (!miInst || !adminPuedeGestionarColaboracion(miInst.tipo)) {
      return res.status(403).json({
        error: 'Su institución no recibe invitaciones de colaboración por este canal.'
      });
    }

    const solicitudes = await prisma.solicitudInstitucionPerfil.findMany({
      where: { institucion_invitada_id: miInst.id },
      orderBy: [{ estado: 'asc' }, { created_at: 'desc' }],
      include: {
        perfil: {
          select: {
            id: true,
            nombre: true,
            edad: true,
            consentimiento_estado: true
          }
        },
        institucion_solicitante: { select: institucionContactoSelect }
      }
    });

    return res.json({ solicitudes });
  } catch {
    return res.status(500).json({ error: 'Error al listar solicitudes recibidas' });
  }
};

const responderSchema = z.object({
  aceptar: z.boolean()
});

/** Admin del centro invitado acepta o rechaza la colaboración en el perfil. */
export const responderSolicitudInstitucion = async (req: AuthRequest, res: Response) => {
  try {
    const solicitudId = Number(req.params.solicitudId);
    if (isNaN(solicitudId)) return res.status(400).json({ error: 'ID inválido' });

    const admin = req.user;
    if (!admin?.userId || !admin.institucion_id || admin.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores.' });
    }

    const data = responderSchema.parse(req.body);

    const solicitud = await prisma.solicitudInstitucionPerfil.findFirst({
      where: {
        id: solicitudId,
        institucion_invitada_id: admin.institucion_id
      },
      include: {
        perfil: { select: { id: true, nombre: true } },
        institucion_solicitante: { select: institucionContactoSelect }
      }
    });

    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }
    if (solicitud.estado !== 'PENDIENTE') {
      return res.status(400).json({ error: 'La solicitud ya fue respondida.' });
    }

    const actualizada = await prisma.solicitudInstitucionPerfil.update({
      where: { id: solicitudId },
      data: {
        estado: data.aceptar ? 'ACEPTADA' : 'RECHAZADA',
        respondido_por_id: admin.userId,
        respondido_at: new Date()
      },
      include: {
        perfil: { select: { id: true, nombre: true } },
        institucion_solicitante: { select: institucionContactoSelect }
      }
    });

    await prisma.auditoriaAdmin.create({
      data: {
        admin_id: admin.userId,
        accion: data.aceptar ? 'ACEPTAR_INVITACION_PERFIL' : 'RECHAZAR_INVITACION_PERFIL',
        entidad: 'solicitud_institucion',
        entidad_id: solicitudId,
        detalles: `${data.aceptar ? 'Aceptada' : 'Rechazada'} colaboración en ${solicitud.perfil.nombre}`,
        ip_address: req.ip || null
      }
    });

    return res.json({
      message: data.aceptar
        ? `Colaboración aceptada. Asigne profesionales de su institución al perfil ${solicitud.perfil.nombre}.`
        : 'Invitación rechazada.',
      solicitud: actualizada
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al responder solicitud' });
  }
};

/** Perfiles compartidos con colaboración ACEPTADA (admin centro médico/terapéutico). */
export const listPerfilesCompartidos = async (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user;
    if (!admin?.institucion_id || admin.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores.' });
    }

    const miInst = await getInstitucionAdmin(admin);
    if (!miInst || !adminPuedeGestionarColaboracion(miInst.tipo)) {
      return res.status(403).json({ error: 'No autorizado.' });
    }

    const solicitudes = await prisma.solicitudInstitucionPerfil.findMany({
      where: {
        institucion_invitada_id: miInst.id,
        estado: 'ACEPTADA'
      },
      include: {
        perfil: {
          select: {
            id: true,
            nombre: true,
            edad: true,
            diagnostico_clinico: true,
            diagnostico_secundario: true,
            institucion: { select: { nombre: true } }
          }
        },
        institucion_solicitante: { select: institucionContactoSelect }
      },
      orderBy: { respondido_at: 'desc' }
    });

    const perfiles = solicitudes.map(s => ({
      ...s.perfil,
      institucion_origen: s.institucion_solicitante.nombre,
      solicitud_id: s.id
    }));

    return res.json({ perfiles });
  } catch {
    return res.status(500).json({ error: 'Error al listar perfiles compartidos' });
  }
};

/** Miembros del equipo ya asignados a un perfil compartido. */
export const listMiembrosAsignadosPerfil = async (req: AuthRequest, res: Response) => {
  try {
    const perfilId = Number(req.params.id);
    if (isNaN(perfilId)) return res.status(400).json({ error: 'ID inválido' });

    const admin = req.user;
    if (!admin?.institucion_id || admin.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores.' });
    }

    const esPropio = await prisma.perfil.findFirst({
      where: { id: perfilId, institucion_id: admin.institucion_id }
    });
    const colabora = await assertSolicitudAceptada(admin.institucion_id, perfilId);
    if (!esPropio && !colabora) {
      return res.status(403).json({ error: 'Sin acceso a gestionar este perfil.' });
    }

    const miembros = await prisma.perfilUsuario.findMany({
      where: { perfil_id: perfilId },
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombre_completo: true,
            rol: true,
            institucion_id: true
          }
        }
      }
    });

    const miInstId = admin.institucion_id;
    const filtrados = miembros.filter(
      m => m.usuario.institucion_id === miInstId || m.usuario.rol === 'FAMILIA'
    );

    return res.json({ miembros: filtrados });
  } catch {
    return res.status(500).json({ error: 'Error al listar miembros' });
  }
};

const asignarSchema = z.object({
  usuario_id: z.coerce.number().int().positive()
});

/** Admin del centro invitado asigna un médico/profesional de SU plantilla al perfil. */
export const asignarMiembroColaboracion = async (req: AuthRequest, res: Response) => {
  try {
    const perfilId = Number(req.params.id);
    if (isNaN(perfilId)) return res.status(400).json({ error: 'ID inválido' });

    const admin = req.user;
    if (!admin?.userId || !admin.institucion_id || admin.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores.' });
    }

    const miInst = await getInstitucionAdmin(admin);
    if (!miInst) {
      return res.status(400).json({ error: 'Sin institución' });
    }

    const perfil = await prisma.perfil.findUnique({
      where: { id: perfilId },
      select: {
        id: true,
        nombre: true,
        consentimiento_estado: true,
        institucion_id: true,
        nivel_educacional: true
      }
    });
    if (!perfil) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }
    if (!perfilEstaOperativo(perfil.consentimiento_estado)) {
      return res.status(403).json({ error: 'El perfil no está autorizado por la familia.' });
    }

    const esDueno = perfil.institucion_id === miInst.id;
    const colaboracionAceptada = await assertSolicitudAceptada(miInst.id, perfilId);

    if (!esDueno && !colaboracionAceptada) {
      return res.status(403).json({
        error:
          'Debe aceptar la invitación de colaboración antes de asignar profesionales a este perfil.'
      });
    }

    const data = asignarSchema.parse(req.body);
    const usuario = await prisma.usuario.findFirst({
      where: { id: data.usuario_id, institucion_id: miInst.id },
      select: {
        id: true,
        email: true,
        nombre_completo: true,
        rol: true,
        niveles_educacionales: true
      }
    });

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado en su institución.'
      });
    }

    if (esDueno) {
      if (usuario.rol === 'FAMILIA') {
        return res.status(400).json({ error: 'Use el alta de tutor al crear el perfil.' });
      }
      if (!['EDUCADOR', 'MEDICO', 'PROFESIONAL'].includes(usuario.rol)) {
        return res.status(400).json({ error: 'Rol no asignable a este perfil.' });
      }
    } else {
      if (
        !ROLES_ASIGNABLES_COLABORACION.includes(
          usuario.rol as (typeof ROLES_ASIGNABLES_COLABORACION)[number]
        )
      ) {
        return res.status(400).json({
          error: 'Solo puede asignar médicos o profesionales de su institución.'
        });
      }
    }

    if (
      miInst.tipo === 'CENTRO_EDUCACIONAL' &&
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
        accion: 'ASIGNAR_MIEMBRO_PERFIL',
        entidad: 'perfil',
        entidad_id: perfilId,
        detalles: `${usuario.rol} ${usuario.email} asignado a ${perfil.nombre}`,
        ip_address: req.ip || null
      }
    });

    return res.status(201).json({
      message: `${usuario.nombre_completo} puede acceder al perfil ${perfil.nombre}.`,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre_completo: usuario.nombre_completo,
        rol: usuario.rol
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al asignar miembro' });
  }
};

/** Instituciones vinculadas por colaboración (datos de contacto para coordinación). */
export const listInstitucionesRed = async (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user;
    if (!admin?.institucion_id || admin.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Solo administradores institucionales.' });
    }

    const solicitudes = await prisma.solicitudInstitucionPerfil.findMany({
      where: {
        OR: [
          { institucion_solicitante_id: admin.institucion_id },
          { institucion_invitada_id: admin.institucion_id }
        ]
      },
      include: {
        institucion_solicitante: { select: institucionContactoSelect },
        institucion_invitada: { select: institucionContactoSelect }
      }
    });

    const map = new Map<
      number,
      ReturnType<typeof mapInstitucionContacto> & { vinculos: number }
    >();

    for (const s of solicitudes) {
      for (const inst of [s.institucion_solicitante, s.institucion_invitada]) {
        if (inst.id === admin.institucion_id) continue;
        const existing = map.get(inst.id);
        if (existing) {
          existing.vinculos += 1;
        } else {
          map.set(inst.id, { ...mapInstitucionContacto(inst), vinculos: 1 });
        }
      }
    }

    const instituciones = [...map.values()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es')
    );

    const query = institucionesRedQuerySchema.parse(req.query);
    const resultado = filtrarYPaginarInstitucionesRed(instituciones, query);

    return res.json(resultado);
  } catch {
    return res.status(500).json({ error: 'Error al listar instituciones vinculadas' });
  }
};
