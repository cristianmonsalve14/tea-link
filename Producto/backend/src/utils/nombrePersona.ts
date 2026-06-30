import { z } from 'zod';

export const MENSAJE_NOMBRE_CON_APELLIDO =
  'Ingrese nombre, primer apellido y segundo apellido (ej: Juan Pérez González)';

/** Requiere nombre + primer apellido + segundo apellido (mínimo 3 palabras de 2+ letras). */
export function nombreIncluyeApellido(nombre: string): boolean {
  const partes = nombre
    .trim()
    .split(/\s+/)
    .map(p => p.replace(/[.,]/g, '').trim())
    .filter(p => p.length > 0);

  if (partes.length < 3) return false;

  return partes.every(p => p.length >= 2);
}

export const nombreCompletoConApellidoSchema = z
  .string()
  .trim()
  .min(1, 'El nombre es obligatorio')
  .refine(nombreIncluyeApellido, { message: MENSAJE_NOMBRE_CON_APELLIDO });

export function parseNombreCompletoConApellido(nombre: unknown) {
  return nombreCompletoConApellidoSchema.parse(nombre);
}
