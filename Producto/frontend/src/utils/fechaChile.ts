/** Zona horaria oficial de Chile continental. */
export const TIMEZONE_CHILE = "America/Santiago";

type ChileParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function partsFromDate(d: Date, timeZone: string): ChileParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find(p => p.type === type)?.value ?? 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute")
  };
}

function partsToUtcMs(parts: ChileParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
}

function partsMatch(a: ChileParts, b: ChileParts): boolean {
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day &&
    a.hour === b.hour &&
    a.minute === b.minute
  );
}

/** Fecha y hora en horario de Chile, ej. "8 jul 2026, 13:30". */
export function formatFechaHoraChile(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIMEZONE_CHILE
  });
}

/** Fecha corta en horario de Chile. */
export function formatFechaChile(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("es-CL", {
    dateStyle: "medium",
    timeZone: TIMEZONE_CHILE
  });
}

/** Valor para `<input type="datetime-local">` interpretado como hora de Chile. */
export function toDatetimeLocalChile(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return nowDatetimeLocalChile();
  const p = partsFromDate(d, TIMEZONE_CHILE);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** Convierte un datetime-local (hora Chile) a ISO UTC para la API. */
export function datetimeLocalChileToISO(localValue: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(localValue);
  if (!match) return new Date().toISOString();

  const target: ChileParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5])
  };

  let utcMs = partsToUtcMs(target);

  for (let i = 0; i < 4; i++) {
    const actual = partsFromDate(new Date(utcMs), TIMEZONE_CHILE);
    if (partsMatch(actual, target)) break;
    utcMs += partsToUtcMs(target) - partsToUtcMs(actual);
  }

  return new Date(utcMs).toISOString();
}

/** Ahora en Chile, listo para datetime-local. */
export function nowDatetimeLocalChile(): string {
  return toDatetimeLocalChile(new Date());
}

/** Formatea un valor datetime-local de Chile para vista previa. */
export function formatDatetimeLocalChile(localValue: string): string {
  if (!localValue) return "";
  try {
    return formatFechaHoraChile(datetimeLocalChileToISO(localValue));
  } catch {
    return localValue;
  }
}
