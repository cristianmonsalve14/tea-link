/** Parsea YYYY-MM-DD en fecha local (evita desfase UTC). */
export function parseFechaNacimientoLocal(fecha: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export type EdadDetallada = { años: number; meses: number };

/** Edad en años y meses cumplidos (meses 0–11). */
export function calcularEdadDetallada(
  fecha: string | Date,
  referencia: Date = new Date()
): EdadDetallada | null {
  const birth =
    typeof fecha === 'string' ? parseFechaNacimientoLocal(fecha) : new Date(fecha);
  if (!birth || Number.isNaN(birth.getTime())) return null;

  const ref = new Date(referencia);
  if (birth > ref) return null;

  let años = ref.getFullYear() - birth.getFullYear();
  let meses = ref.getMonth() - birth.getMonth();
  if (ref.getDate() < birth.getDate()) {
    meses -= 1;
  }
  if (meses < 0) {
    años -= 1;
    meses += 12;
  }
  if (años < 0) return null;
  return { años, meses };
}

/** Edad en años cumplidos a la fecha de referencia (por defecto hoy). */
export function calcularEdadDesdeFechaNacimiento(
  fecha: string | Date,
  referencia: Date = new Date()
): number | null {
  const det = calcularEdadDetallada(fecha, referencia);
  return det ? det.años : null;
}

export function resolverEdadPerfilDesdeFecha<T extends { edad?: number; fecha_nacimiento?: string }>(
  data: T
): T {
  if (!data.fecha_nacimiento) return data;
  const edad = calcularEdadDesdeFechaNacimiento(data.fecha_nacimiento);
  if (edad == null) return data;
  return { ...data, edad };
}
