export const MENSAJE_NOMBRE_CON_APELLIDO =
  "Ingrese nombre, primer apellido y segundo apellido (ej: Juan Pérez González)";

export function nombreIncluyeApellido(nombre: string): boolean {
  const partes = nombre
    .trim()
    .split(/\s+/)
    .map(p => p.replace(/[.,]/g, "").trim())
    .filter(p => p.length > 0);

  if (partes.length < 3) return false;

  return partes.every(p => p.length >= 2);
}

export function validarNombreCompletoConApellido(nombre: string): string | null {
  const limpio = nombre.trim();
  if (!limpio) return "El nombre es obligatorio";
  if (!nombreIncluyeApellido(limpio)) return MENSAJE_NOMBRE_CON_APELLIDO;
  return null;
}
