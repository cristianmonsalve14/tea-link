import type { NivelEducacional } from "./nivelEducacional";

type UsuarioAsignable = {
  rol: string;
  niveles_educacionales?: NivelEducacional[] | null;
};

/** Roles asignables al perfil según tipo de institución del administrador. */
export function rolesAsignablesPorInstitucion(tipoInstitucion: string): string[] {
  if (tipoInstitucion === "CENTRO_EDUCACIONAL") return ["EDUCADOR"];
  if (tipoInstitucion === "CENTRO_MEDICO" || tipoInstitucion === "CENTRO_PROFESIONAL") {
    return ["MEDICO", "PROFESIONAL"];
  }
  return [];
}

/** En colegios, un educador solo puede asignarse a alumnos de su mismo nivel. */
export function educadorCompatibleConPerfil(
  usuario: UsuarioAsignable,
  nivelPerfil: NivelEducacional | null | undefined,
  tipoInstitucion: string
): boolean {
  if (tipoInstitucion !== "CENTRO_EDUCACIONAL" || usuario.rol !== "EDUCADOR") {
    return true;
  }
  if (!nivelPerfil) return true;
  return (usuario.niveles_educacionales ?? []).includes(nivelPerfil);
}

export function filtrarStaffAsignablePorNivel<T extends UsuarioAsignable>(
  staff: T[],
  nivelPerfil: NivelEducacional | null | undefined,
  tipoInstitucion: string
): T[] {
  return staff.filter(u => educadorCompatibleConPerfil(u, nivelPerfil, tipoInstitucion));
}

export function adminPuedeAsignarEquipoPerfil(
  perfil: { es_propio?: boolean; consentimiento_estado?: string },
  tipoInstitucion: string
): boolean {
  if (perfil.consentimiento_estado !== "ACEPTADO") return false;
  if (rolesAsignablesPorInstitucion(tipoInstitucion).length === 0) return false;
  if (perfil.es_propio !== false) return true;
  return tipoInstitucion === "CENTRO_MEDICO" || tipoInstitucion === "CENTRO_PROFESIONAL";
}

export function etiquetaRolesAsignables(tipoInstitucion: string): string {
  const roles = rolesAsignablesPorInstitucion(tipoInstitucion);
  if (roles.includes("EDUCADOR")) return "educadores";
  if (roles.includes("MEDICO") && roles.includes("PROFESIONAL")) {
    return "médicos o profesionales";
  }
  return "profesionales";
}
