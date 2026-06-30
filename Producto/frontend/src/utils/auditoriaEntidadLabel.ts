const TIPO_ENTIDAD_LABEL: Record<string, string> = {
  perfil: "Perfil",
  institucion: "Institución",
  usuario: "Usuario",
  reporte: "Reporte",
  solicitud_institucion: "Solicitud de institución",
  "solo-medico": "Ruta médico",
  protegida: "Ruta protegida",
  "solo-familia": "Ruta familia",
  "solo-educador": "Ruta educador",
  "solo-profesional": "Ruta profesional",
  "solo-admin": "Ruta administrador"
};

function etiquetaTipo(entidad: string | null | undefined): string {
  if (!entidad) return "Registro";
  return TIPO_ENTIDAD_LABEL[entidad] ?? entidad.replace(/_/g, " ");
}

function extraerNombreDesdeDetalles(
  detalles: string | null | undefined,
  entidad: string | null
): string | null {
  const texto = detalles?.trim();
  if (!texto || !entidad) return null;

  if (entidad === "perfil") {
    const patrones = [
      /^Perfil\s+(.+?)\s+creado\b/i,
      /^Perfil\s+(.+?)\s+actualizado/i,
      /^Perfil\s+(.+?)\s+eliminado/i,
      /\bal perfil\s+(.+)$/i,
      /\basignado a\s+(.+)$/i,
      /\bpara perfil\s+(.+)$/i,
      /\ben\s+(.+)$/i
    ];
    for (const p of patrones) {
      const m = texto.match(p);
      if (m?.[1]) return m[1].trim();
    }
  }

  if (entidad === "institucion") {
    const m = texto.match(/Nombre:\s*([^,]+)/i);
    if (m?.[1]) return m[1].trim();
  }

  if (entidad === "usuario") {
    const m =
      texto.match(/(?:creado|editado|eliminado|reseteado|reasignado)[:\s]+([^\s,(]+@[^\s,(]+)/i) ??
      texto.match(/email:\s*([^\s,]+@[^\s,]+)/i);
    if (m?.[1]) return m[1].trim();
    const email = texto.match(/[\w.+-]+@[\w.-]+\.\w+/);
    if (email?.[0]) return email[0];
    const admin = texto.match(/administrador eliminado:\s*([^\s]+@[^\s]+)/i);
    if (admin?.[1]) return admin[1].trim();
    const reset = texto.match(/reseteado para(?:\s+\w+)?\s+([^\s]+@[^\s]+)/i);
    if (reset?.[1]) return reset[1].trim();
  }

  if (entidad === "reporte") {
    const m = texto.match(/Reporte\s+(?:actualizado|eliminado):\s*(.+)$/i);
    if (m?.[1]) return m[1].trim();
  }

  if (entidad === "solicitud_institucion") {
    const m = texto.match(/para perfil\s+(.+)$/i) ?? texto.match(/en\s+(.+)$/i);
    if (m?.[1]) return m[1].trim();
  }

  return null;
}

/** Etiqueta legible cuando el API no envía entidad_label (o como respaldo). */
export function buildAuditoriaEntidadLabel(
  entidad: string | null,
  entidadId: number | null,
  detalles: string | null,
  entidadLabelApi?: string | null
): string {
  const fromApi = entidadLabelApi?.trim();
  if (fromApi && fromApi !== "—") return fromApi;

  if (!entidad && entidadId == null) return "—";

  const tipo = etiquetaTipo(entidad);
  const nombre = extraerNombreDesdeDetalles(detalles, entidad);

  if (nombre && entidadId != null) return `${tipo}: ${nombre} (#${entidadId})`;
  if (nombre) return `${tipo}: ${nombre}`;
  if (entidadId != null) return `${tipo} #${entidadId}`;
  return tipo;
}
