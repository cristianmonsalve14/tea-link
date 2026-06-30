/** Etiquetas de rol para altas de equipo (admin institucional). */
export const ROL_EQUIPO_LABEL: Record<string, string> = {
  FAMILIA: "Familia / tutor",
  EDUCADOR: "Educador",
  PROFESIONAL: "Profesional de apoyo",
  MEDICO: "Médico"
};

export function etiquetaRolEquipo(rol: string): string {
  return ROL_EQUIPO_LABEL[rol] ?? rol;
}

export function descripcionRegistroEquipo(tipoInstitucion: string | undefined): string {
  switch (tipoInstitucion) {
    case "CENTRO_EDUCACIONAL":
      return "Registre educadores del colegio. Indique los niveles que atienden y su especialidad o cargo.";
    case "CENTRO_MEDICO":
      return "Registre médicos y profesionales de su centro de salud.";
    case "CENTRO_PROFESIONAL":
      return "Registre profesionales terapéuticos de su centro. Indique su profesión al dar de alta cada usuario.";
    case "FAMILIA":
      return "Registre cuentas de familia o tutores asociados a esta institución familiar.";
    default:
      return "Registre usuarios del equipo según el tipo de su institución.";
  }
}

export function etiquetaMiembroEquipo(tipoInstitucion: string | undefined): string {
  switch (tipoInstitucion) {
    case "CENTRO_EDUCACIONAL":
      return "educadores";
    case "CENTRO_MEDICO":
      return "usuarios del equipo médico";
    case "CENTRO_PROFESIONAL":
      return "profesionales";
    case "FAMILIA":
      return "familias";
    default:
      return "usuarios";
  }
}
