export type InstitucionContacto = {
  id: number;
  nombre: string;
  tipo: string;
  tipo_label?: string;
  region?: string | null;
  region_label?: string | null;
  comuna?: string | null;
  localidad?: string | null;
  ubicacion_label?: string | null;
  direccion?: string | null;
  email_contacto?: string | null;
  telefono_contacto?: string | null;
};

export function etiquetaTipoInstitucion(tipo: string): string {
  const labels: Record<string, string> = {
    FAMILIA: "Familia",
    CENTRO_EDUCACIONAL: "Centro educacional",
    CENTRO_MEDICO: "Centro médico",
    CENTRO_PROFESIONAL: "Centro terapéutico",
    SISTEMA: "Sistema"
  };
  return labels[tipo] ?? tipo.replace(/_/g, " ");
}

export function tieneDatosContacto(inst: InstitucionContacto): boolean {
  return Boolean(
    inst.ubicacion_label ||
      inst.direccion ||
      inst.email_contacto ||
      inst.telefono_contacto
  );
}

export const TIPOS_INSTITUCION_RED = [
  "CENTRO_EDUCACIONAL",
  "CENTRO_MEDICO",
  "CENTRO_PROFESIONAL",
  "FAMILIA"
] as const;

export type TipoInstitucionRed = (typeof TIPOS_INSTITUCION_RED)[number];

export const TIPOS_INSTITUCION_INVITABLES = [
  "CENTRO_EDUCACIONAL",
  "CENTRO_MEDICO",
  "CENTRO_PROFESIONAL"
] as const;

export type TipoInstitucionInvitable = (typeof TIPOS_INSTITUCION_INVITABLES)[number];

export function tiposInstitucionInvitablesPorSolicitante(tipo: string): TipoInstitucionInvitable[] {
  if (tipo === "CENTRO_EDUCACIONAL") {
    return ["CENTRO_MEDICO", "CENTRO_PROFESIONAL"];
  }
  if (tipo === "CENTRO_MEDICO") {
    return ["CENTRO_EDUCACIONAL", "CENTRO_PROFESIONAL"];
  }
  return [];
}

/** Tipos que pueden tener un usuario ADMINISTRADOR institucional. */
export const TIPOS_INSTITUCION_CON_ADMIN = [
  "CENTRO_EDUCACIONAL",
  "CENTRO_MEDICO",
  "CENTRO_PROFESIONAL"
] as const;

export const TIPOS_INSTITUCION_ADMIN_FILTRO = [
  { value: "", label: "Todos los tipos" },
  { value: "CENTRO_EDUCACIONAL", label: "Centro educacional" },
  { value: "CENTRO_MEDICO", label: "Centro médico" },
  { value: "CENTRO_PROFESIONAL", label: "Centro profesional" }
] as const;

export function institucionAdmiteAdministrador(tipo: string | undefined | null): boolean {
  return tipo !== "FAMILIA" && tipo !== "SISTEMA";
}
