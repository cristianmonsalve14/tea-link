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
    typeof fecha === "string" ? parseFechaNacimientoLocal(fecha) : new Date(fecha);
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

export function formatearEdadDetallada(edad: EdadDetallada | null): string {
  if (!edad) return "—";
  const { años, meses } = edad;
  if (años === 0 && meses === 0) return "Recién nacido";
  const partes: string[] = [];
  if (años > 0) partes.push(`${años} año${años !== 1 ? "s" : ""}`);
  if (meses > 0) partes.push(`${meses} mes${meses !== 1 ? "es" : ""}`);
  return partes.join(" y ");
}

export function normalizarFechaNacimientoInput(
  fecha?: string | Date | null
): string | null {
  if (!fecha) return null;
  if (typeof fecha === "string") {
    return fecha.length >= 10 ? fecha.slice(0, 10) : fecha;
  }
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Texto legible para listados y fichas. */
export function formatearEdadPerfil(
  fechaNacimiento?: string | Date | null,
  edadAnios?: number | null
): string {
  const fecha = normalizarFechaNacimientoInput(fechaNacimiento);
  if (fecha) {
    const det = calcularEdadDetallada(fecha);
    if (det) return formatearEdadDetallada(det);
  }
  if (edadAnios != null) {
    return `${edadAnios} año${edadAnios !== 1 ? "s" : ""}`;
  }
  return "—";
}

export function calcularEdadDesdeFechaNacimiento(
  fecha: string | Date,
  referencia: Date = new Date()
): number | null {
  const det = calcularEdadDetallada(fecha, referencia);
  return det ? det.años : null;
}

/** Valor máximo para input type=date (hoy en zona local). */
export function fechaHoyInput(): string {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, "0");
  const d = String(hoy.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
