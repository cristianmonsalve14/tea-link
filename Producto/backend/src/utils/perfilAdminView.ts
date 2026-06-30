import { PrismaClient, Perfil } from '@prisma/client';
import {
  institucionContactoSelect,
  mapInstitucionContacto
} from './institucionContacto';

const prisma = new PrismaClient();

export type ColaboracionPerfilAdmin = {
  institucion_id: number;
  nombre: string;
  tipo: string;
  tipo_label?: string;
  direccion_contacto?: string | null;
  email_contacto?: string | null;
  telefono_contacto?: string | null;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
  direccion: 'ENVIADA' | 'RECIBIDA';
};

export type InstitucionDuenaAdmin = ReturnType<typeof mapInstitucionContacto>;

export type PerfilAdminEnriquecido = Perfil & {
  es_propio: boolean;
  institucion_duena: InstitucionDuenaAdmin | null;
  colaboraciones: ColaboracionPerfilAdmin[];
};

export async function enriquecerPerfilesParaAdmin(
  perfiles: Perfil[],
  institucionId: number
): Promise<PerfilAdminEnriquecido[]> {
  if (perfiles.length === 0) return [];

  const ids = perfiles.map(p => p.id);

  const [solicitudes, duenas] = await Promise.all([
    prisma.solicitudInstitucionPerfil.findMany({
      where: {
        perfil_id: { in: ids },
        OR: [
          { institucion_solicitante_id: institucionId },
          { institucion_invitada_id: institucionId }
        ]
      },
      include: {
        institucion_solicitante: { select: institucionContactoSelect },
        institucion_invitada: { select: institucionContactoSelect }
      }
    }),
    prisma.perfil.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        institucion: { select: institucionContactoSelect }
      }
    })
  ]);

  const duenaMap = new Map(duenas.map(p => [p.id, p.institucion]));

  return perfiles.map(p => {
    const es_propio = p.institucion_id === institucionId;
    const colaboraciones: ColaboracionPerfilAdmin[] = solicitudes
      .filter(s => s.perfil_id === p.id)
      .map(s => {
        const enviamos = s.institucion_solicitante_id === institucionId;
        const otra = enviamos ? s.institucion_invitada : s.institucion_solicitante;
        const contacto = mapInstitucionContacto(otra);
        return {
          institucion_id: contacto.id,
          nombre: contacto.nombre,
          tipo: contacto.tipo,
          tipo_label: contacto.tipo_label,
          direccion_contacto: contacto.direccion,
          email_contacto: contacto.email_contacto,
          telefono_contacto: contacto.telefono_contacto,
          estado: s.estado,
          direccion: enviamos ? 'ENVIADA' : 'RECIBIDA'
        };
      });

    return {
      ...p,
      es_propio,
      institucion_duena: duenaMap.get(p.id)
        ? mapInstitucionContacto(duenaMap.get(p.id)!)
        : null,
      colaboraciones
    };
  });
}

export function resumenPerfilesAdmin(perfiles: PerfilAdminEnriquecido[]) {
  const propios = perfiles.filter(p => p.es_propio).length;
  const compartidos = perfiles.filter(p => !p.es_propio).length;
  return { total: perfiles.length, propios, compartidos };
}
