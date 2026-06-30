export const DESCRIPCION_OBSERVACION_MIN = 10;

export function isDescripcionObservacionValida(text: string): boolean {
  return text.trim().length >= DESCRIPCION_OBSERVACION_MIN;
}

export function mensajeDescripcionCorta(): string {
  return `La descripción debe tener al menos ${DESCRIPCION_OBSERVACION_MIN} caracteres`;
}
