const TIPO_ENTIDAD_LABEL: Record<string, string> = {
  perfil: 'Perfil',
  institucion: 'Institución',
  usuario: 'Usuario',
  reporte: 'Reporte',
  solicitud_institucion: 'Solicitud de institución',
  'solo-medico': 'Ruta médico',
  protegida: 'Ruta protegida',
  'solo-familia': 'Ruta familia',
  'solo-educador': 'Ruta educador',
  'solo-profesional': 'Ruta profesional',
  'solo-admin': 'Ruta administrador'
};

export function etiquetaTipoEntidadAuditoria(entidad: string | null | undefined): string {
  if (!entidad) return 'Registro';
  return TIPO_ENTIDAD_LABEL[entidad] ?? entidad.replace(/_/g, ' ');
}

type AuditoriaEntidadRow = {
  entidad: string | null;
  entidad_id: number | null;
  detalles?: string | null;
};

type NombreMaps = {
  perfiles: Map<number, string>;
  instituciones: Map<number, string>;
  usuarios: Map<number, string>;
};

export function formatEntidadAuditoriaLabel(
  row: AuditoriaEntidadRow,
  maps: NombreMaps
): string {
  const tipo = etiquetaTipoEntidadAuditoria(row.entidad);
  const id = row.entidad_id;

  if (!row.entidad && id == null) {
    return '—';
  }

  let nombre: string | null = null;
  if (row.entidad === 'perfil' && id != null) {
    nombre = maps.perfiles.get(id) ?? extraerNombreDesdeDetalles(row.detalles, 'perfil') ?? null;
  } else if (row.entidad === 'institucion' && id != null) {
    nombre =
      maps.instituciones.get(id) ?? extraerNombreDesdeDetalles(row.detalles, 'institucion') ?? null;
  } else if (row.entidad === 'usuario' && id != null) {
    nombre = maps.usuarios.get(id) ?? extraerNombreDesdeDetalles(row.detalles, 'usuario') ?? null;
  } else if (row.entidad === 'reporte' && id != null) {
    nombre = extraerNombreDesdeDetalles(row.detalles, 'reporte');
  } else if (row.entidad === 'solicitud_institucion') {
    nombre = extraerNombreDesdeDetalles(row.detalles, 'solicitud_institucion');
  }

  if (nombre && id != null) {
    return `${tipo}: ${nombre} (#${id})`;
  }
  if (nombre) {
    return `${tipo}: ${nombre}`;
  }
  if (id != null) {
    return `${tipo} #${id}`;
  }
  return tipo;
}

/** Respaldo cuando el registro ya no existe pero el detalle guardó el nombre. */
export function extraerNombreDesdeDetalles(
  detalles: string | null | undefined,
  entidad: string
): string | null {
  const texto = detalles?.trim();
  if (!texto) return null;

  if (entidad === 'perfil') {
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

  if (entidad === 'institucion') {
    const m = texto.match(/Nombre:\s*([^,]+)/i);
    if (m?.[1]) return m[1].trim();
  }

  if (entidad === 'usuario') {
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

  if (entidad === 'reporte') {
    const m = texto.match(/Reporte\s+(?:actualizado|eliminado):\s*(.+)$/i);
    if (m?.[1]) return m[1].trim();
  }

  if (entidad === 'solicitud_institucion') {
    const m = texto.match(/para perfil\s+(.+)$/i) ?? texto.match(/en\s+(.+)$/i);
    if (m?.[1]) return m[1].trim();
  }

  return null;
}

export function collectAuditoriaEntidadIds(rows: AuditoriaEntidadRow[]) {
  const perfilIds = new Set<number>();
  const institucionIds = new Set<number>();
  const usuarioIds = new Set<number>();

  for (const row of rows) {
    if (row.entidad_id == null) continue;
    if (row.entidad === 'perfil') perfilIds.add(row.entidad_id);
    else if (row.entidad === 'institucion') institucionIds.add(row.entidad_id);
    else if (row.entidad === 'usuario') usuarioIds.add(row.entidad_id);
  }

  return {
    perfilIds: [...perfilIds],
    institucionIds: [...institucionIds],
    usuarioIds: [...usuarioIds]
  };
}
