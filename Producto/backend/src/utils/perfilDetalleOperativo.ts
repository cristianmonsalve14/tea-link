import { PrismaClient } from '@prisma/client';
import { usuarioTieneAccesoPerfil } from './perfilAccess';

const prisma = new PrismaClient();

const ROL_LABEL: Record<string, string> = {
  TUTOR: 'Tutor / Familia',
  EDUCADOR: 'Educador',
  MEDICO: 'Médico',
  PROFESIONAL: 'Profesional terapéutico'
};

const TIPO_INSTITUCION_LABEL: Record<string, string> = {
  CENTRO_EDUCACIONAL: 'Centro educacional',
  CENTRO_MEDICO: 'Centro médico',
  CENTRO_PROFESIONAL: 'Centro terapéutico',
  OTRO: 'Institución'
};

type InstRef = { id: number; nombre: string; tipo: string };

function etiquetaTipoInstitucion(tipo: string): string {
  return TIPO_INSTITUCION_LABEL[tipo] ?? tipo;
}

export function resolverCentroEducacional(
  institucionDuena: InstRef | null,
  educadores: Array<{ institucion?: (InstRef & { tipo_label?: string }) | null }>,
  solicitudes: Array<{
    estado: string;
    institucion_solicitante: InstRef;
    institucion_invitada: InstRef;
  }>
): InstRef | null {
  if (institucionDuena?.tipo === 'CENTRO_EDUCACIONAL') {
    return institucionDuena;
  }

  for (const e of educadores) {
    if (e.institucion?.tipo === 'CENTRO_EDUCACIONAL') {
      return e.institucion;
    }
  }

  for (const s of solicitudes) {
    if (s.estado !== 'ACEPTADA') continue;
    if (s.institucion_solicitante.tipo === 'CENTRO_EDUCACIONAL') {
      return s.institucion_solicitante;
    }
    if (s.institucion_invitada.tipo === 'CENTRO_EDUCACIONAL') {
      return s.institucion_invitada;
    }
  }

  return null;
}

export async function construirDetallePerfilOperativo(
  perfilId: number,
  userId: number,
  institucionId: number | null | undefined,
  rol: string
) {
  const tieneAcceso = await usuarioTieneAccesoPerfil(userId, perfilId, institucionId, rol);
  if (!tieneAcceso) return null;

  const perfil = await prisma.perfil.findUnique({
    where: { id: perfilId, consentimiento_estado: 'ACEPTADO' },
    include: {
      institucion: { select: { id: true, nombre: true, tipo: true } }
    }
  });
  if (!perfil) return null;

  const [solicitudes, miembros] = await Promise.all([
    prisma.solicitudInstitucionPerfil.findMany({
      where: { perfil_id: perfilId, estado: 'ACEPTADA' },
      orderBy: { created_at: 'desc' },
      include: {
        institucion_solicitante: { select: { id: true, nombre: true, tipo: true } },
        institucion_invitada: { select: { id: true, nombre: true, tipo: true } }
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
            institucion: { select: { id: true, nombre: true, tipo: true } }
          }
        }
      },
      orderBy: { usuario: { nombre_completo: 'asc' } }
    })
  ]);

  const mapMiembro = (m: (typeof miembros)[number]) => ({
    nombre_completo: m.usuario.nombre_completo,
    email: m.usuario.email,
    rol_en_perfil_label: ROL_LABEL[m.rol_en_perfil] ?? m.rol_en_perfil,
    institucion: m.usuario.institucion
      ? {
          id: m.usuario.institucion.id,
          nombre: m.usuario.institucion.nombre,
          tipo: m.usuario.institucion.tipo,
          tipo_label: etiquetaTipoInstitucion(m.usuario.institucion.tipo)
        }
      : null
  });

  const equipoPorRol = {
    familia: miembros
      .filter(m => m.rol_en_perfil === 'TUTOR')
      .map(mapMiembro),
    educadores: miembros
      .filter(m => m.rol_en_perfil === 'EDUCADOR')
      .map(mapMiembro),
    medicos: miembros
      .filter(m => m.rol_en_perfil === 'MEDICO')
      .map(mapMiembro),
    profesionales: miembros
      .filter(m => m.rol_en_perfil === 'PROFESIONAL')
      .map(mapMiembro)
  };

  const institucionDuena = perfil.institucion;
  const centroEducacional = resolverCentroEducacional(
    institucionDuena,
    equipoPorRol.educadores,
    solicitudes
  );

  const instituciones_red = solicitudes.map(s => ({
    id: s.id,
    solicitante: {
      ...s.institucion_solicitante,
      tipo_label: etiquetaTipoInstitucion(s.institucion_solicitante.tipo)
    },
    invitada: {
      ...s.institucion_invitada,
      tipo_label: etiquetaTipoInstitucion(s.institucion_invitada.tipo)
    }
  }));

  return {
    modo: 'equipo' as const,
    perfil: {
      id: perfil.id,
      nombre: perfil.nombre,
      edad: perfil.edad,
      diagnostico_clinico: perfil.diagnostico_clinico,
      diagnostico_secundario: perfil.diagnostico_secundario,
      grado_discapacidad: perfil.grado_discapacidad,
      fecha_nacimiento: perfil.fecha_nacimiento,
      notas: perfil.notas
    },
    institucion_duena: institucionDuena
      ? {
          nombre: institucionDuena.nombre,
          tipo: institucionDuena.tipo,
          tipo_label: etiquetaTipoInstitucion(institucionDuena.tipo)
        }
      : null,
    centro_educacional: centroEducacional
      ? {
          nombre: centroEducacional.nombre,
          tipo: centroEducacional.tipo,
          tipo_label: etiquetaTipoInstitucion(centroEducacional.tipo)
        }
      : null,
    instituciones_vinculadas: instituciones_red,
    equipo_por_rol: equipoPorRol,
    estadisticas: {
      total_miembros: miembros.length,
      colaboraciones_activas: solicitudes.length
    }
  };
}
