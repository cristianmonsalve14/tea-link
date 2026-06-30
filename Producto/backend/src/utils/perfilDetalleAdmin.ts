import { PrismaClient } from '@prisma/client';
import { enriquecerPerfilesParaAdmin } from './perfilAdminView';
import { adminTieneAccesoPerfil } from './perfilListQuery';
import { institucionContactoSelect, mapInstitucionContacto } from './institucionContacto';

const prisma = new PrismaClient();

const ROL_LABEL: Record<string, string> = {
  TUTOR: 'Tutor / Familia',
  TITULAR: 'Estudiante titular',
  EDUCADOR: 'Educador',
  MEDICO: 'Médico',
  PROFESIONAL: 'Profesional terapéutico'
};

export async function construirDetallePerfilAdmin(
  perfilId: number,
  institucionId: number,
  tipoInstitucion: string
) {
  const tieneAcceso = await adminTieneAccesoPerfil(institucionId, tipoInstitucion, perfilId);
  if (!tieneAcceso) return null;

  const perfil = await prisma.perfil.findUnique({
    where: { id: perfilId },
    include: {
      institucion: { select: institucionContactoSelect }
    }
  });
  if (!perfil) return null;

  const [solicitudes, miembros, enriquecido] = await Promise.all([
    prisma.solicitudInstitucionPerfil.findMany({
      where: { perfil_id: perfilId },
      orderBy: { created_at: 'desc' },
      include: {
        institucion_solicitante: { select: institucionContactoSelect },
        institucion_invitada: { select: institucionContactoSelect }
      }
    }),
    prisma.perfilUsuario.findMany({
      where: { perfil_id: perfilId },
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombre_completo: true,
            rol: true,
            institucion: { select: institucionContactoSelect }
          }
        }
      },
      orderBy: { usuario: { nombre_completo: 'asc' } }
    }),
    enriquecerPerfilesParaAdmin([perfil], institucionId)
  ]);

  const meta = enriquecido[0];

  const instituciones_vinculadas = solicitudes.map(s => ({
    id: s.id,
    estado: s.estado,
    solicitante: mapInstitucionContacto(s.institucion_solicitante),
    invitada: mapInstitucionContacto(s.institucion_invitada),
    created_at: s.created_at,
    respondido_at: s.respondido_at
  }));

  const equipo = miembros.map(m => ({
    id: m.usuario.id,
    email: m.usuario.email,
    nombre_completo: m.usuario.nombre_completo,
    rol_sistema: m.usuario.rol,
    rol_en_perfil: m.rol_en_perfil,
    rol_en_perfil_label: ROL_LABEL[m.rol_en_perfil] ?? m.rol_en_perfil,
    institucion: m.usuario.institucion
      ? mapInstitucionContacto(m.usuario.institucion)
      : null
  }));

  const equipoPorRol = {
    familia: equipo.filter(e => e.rol_en_perfil === 'TUTOR' || e.rol_en_perfil === 'TITULAR'),
    educadores: equipo.filter(e => e.rol_en_perfil === 'EDUCADOR'),
    medicos: equipo.filter(e => e.rol_en_perfil === 'MEDICO'),
    profesionales: equipo.filter(e => e.rol_en_perfil === 'PROFESIONAL')
  };

  return {
    perfil: {
      id: perfil.id,
      nombre: perfil.nombre,
      edad: perfil.edad,
      diagnostico_clinico: perfil.diagnostico_clinico,
      diagnostico_secundario: perfil.diagnostico_secundario,
      causa_discapacidad: perfil.causa_discapacidad,
      grado_discapacidad: perfil.grado_discapacidad,
      porcentaje_rnd: perfil.porcentaje_rnd,
      tiene_credencial_rnd: perfil.tiene_credencial_rnd,
      fecha_nacimiento: perfil.fecha_nacimiento,
      notas: perfil.notas,
      consentimiento_estado: perfil.consentimiento_estado,
      consentimiento_sujeto: perfil.consentimiento_sujeto,
      consentimiento_aceptado_at: perfil.consentimiento_aceptado_at,
      created_at: perfil.created_at,
      updated_at: perfil.updated_at
    },
    es_propio: meta.es_propio,
    institucion_duena: meta.institucion_duena,
    colaboraciones: meta.colaboraciones,
    instituciones_vinculadas,
    equipo,
    equipo_por_rol: equipoPorRol,
    estadisticas: {
      total_instituciones: new Set(
        solicitudes.flatMap(s => [s.institucion_solicitante_id, s.institucion_invitada_id])
      ).size + 1,
      total_miembros: equipo.length,
      colaboraciones_activas: solicitudes.filter(s => s.estado === 'ACEPTADA').length
    }
  };
}
