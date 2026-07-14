/** Zona horaria oficial de Chile continental. */
export const TIMEZONE_CHILE = 'America/Santiago';

/** Fecha corta en horario de Chile, ej. "07 jul 2026". */
export function formatFechaChile(d: Date): string {
  try {
    return d.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: TIMEZONE_CHILE
    });
  } catch {
    return fechaISOChile(d);
  }
}

/** Fecha y hora en horario de Chile, ej. "07-07-2026 21:45". */
export function formatFechaHoraChile(d: Date): string {
  try {
    return d.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: TIMEZONE_CHILE
    });
  } catch {
    return d.toISOString();
  }
}

/** Fecha ISO (YYYY-MM-DD) calculada en horario de Chile, para CSV/Excel. */
export function fechaISOChile(d: Date): string {
  try {
    // en-CA entrega el formato YYYY-MM-DD.
    return d.toLocaleDateString('en-CA', { timeZone: TIMEZONE_CHILE });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}
