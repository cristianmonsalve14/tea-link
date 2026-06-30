import { tipo_institucion_enum } from '@prisma/client';

/** Instituciones que pueden crear perfiles y recibir o ceder custodia. */
export const TIPOS_INSTITUCION_CREADORAS_PERFIL: tipo_institucion_enum[] = [
  'CENTRO_EDUCACIONAL',
  'CENTRO_MEDICO'
];

export function esInstitucionCreadoraPerfil(tipo: tipo_institucion_enum): boolean {
  return TIPOS_INSTITUCION_CREADORAS_PERFIL.includes(tipo);
}

/** Instituciones que pueden recibir invitación a colaborar en un perfil. */
export const TIPOS_INSTITUCION_INVITABLES: tipo_institucion_enum[] = [
  'CENTRO_EDUCACIONAL',
  'CENTRO_MEDICO',
  'CENTRO_PROFESIONAL'
];

export function tiposInstitucionInvitablesPorSolicitante(
  tipo: tipo_institucion_enum
): tipo_institucion_enum[] {
  if (tipo === 'CENTRO_EDUCACIONAL') {
    return ['CENTRO_MEDICO', 'CENTRO_PROFESIONAL'];
  }
  if (tipo === 'CENTRO_MEDICO') {
    return ['CENTRO_EDUCACIONAL', 'CENTRO_PROFESIONAL'];
  }
  return [];
}

export function puedeInvitarInstituciones(tipo: tipo_institucion_enum): boolean {
  return esInstitucionCreadoraPerfil(tipo);
}

export function tipoInstitucionPuedeRecibirInvitacion(
  tipoInvitada: tipo_institucion_enum,
  tipoSolicitante?: tipo_institucion_enum
): boolean {
  if (tipoInvitada === 'FAMILIA' || tipoInvitada === 'SISTEMA') {
    return false;
  }
  if (tipoSolicitante) {
    return tiposInstitucionInvitablesPorSolicitante(tipoSolicitante).includes(tipoInvitada);
  }
  return TIPOS_INSTITUCION_INVITABLES.includes(tipoInvitada);
}

export function adminPuedeGestionarColaboracion(tipo: tipo_institucion_enum): boolean {
  return tipo === 'CENTRO_MEDICO' || tipo === 'CENTRO_PROFESIONAL';
}

/** Roles operativos que un admin de centro médico/terapéutico puede asignar a un perfil compartido. */
export const ROLES_ASIGNABLES_COLABORACION = ['MEDICO', 'PROFESIONAL'] as const;
