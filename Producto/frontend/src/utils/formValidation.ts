export const MENSAJE_TELEFONO_CHILE =
  "Ingrese un teléfono válido de Chile (ej.: +56 9 1234 5678 o 2 2123 4567)";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function digitosTelefonoChile(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("56")) digits = digits.slice(2);
  return digits;
}

export function esTelefonoChileValido(value: string): boolean {
  const digits = digitosTelefonoChile(value);
  if (digits.length === 9 && digits.startsWith("9")) return true;
  if (digits.length >= 8 && digits.length <= 9 && /^[2-7]/.test(digits)) return true;
  return false;
}

export function validarEmail(value: string, required = true): string | null {
  const trimmed = value.trim();
  if (!trimmed) return required ? "El correo es obligatorio" : null;
  if (!EMAIL_RE.test(trimmed)) return "Correo electrónico inválido";
  if (trimmed.length > 255) return "El correo no puede superar 255 caracteres";
  return null;
}

export function validarTelefonoChile(value: string, required = true): string | null {
  const trimmed = value.trim();
  if (!trimmed) return required ? "El teléfono es obligatorio" : null;
  if (trimmed.length > 50) return "El teléfono no puede superar 50 caracteres";
  if (!esTelefonoChileValido(trimmed)) return MENSAJE_TELEFONO_CHILE;
  return null;
}

export function validarDireccion(value: string, required = true): string | null {
  const trimmed = value.trim();
  if (!trimmed) return required ? "La dirección es obligatoria" : null;
  if (trimmed.length < 5) return "La dirección debe tener al menos 5 caracteres";
  if (trimmed.length > 255) return "La dirección no puede superar 255 caracteres";
  return null;
}

export function validarTextoRequerido(
  value: string,
  label: string,
  min = 1,
  max = 255
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `${label} es obligatorio`;
  if (trimmed.length < min) {
    return min === 1
      ? `${label} es obligatorio`
      : `${label} debe tener al menos ${min} caracteres`;
  }
  if (trimmed.length > max) return `${label} no puede superar ${max} caracteres`;
  return null;
}

export function validarTituloObservacion(value: string): string | null {
  return validarTextoRequerido(value, "El título", 3, 120);
}

export function validarTituloReporte(value: string): string | null {
  return validarTextoRequerido(value, "El título del reporte", 2, 200);
}

export function validarPasswordNueva(value: string, min = 8): string | null {
  if (!value) return "La nueva contraseña es obligatoria";
  if (value.length < min) return `La contraseña debe tener al menos ${min} caracteres`;
  return null;
}

export function validarConfirmacionPassword(
  nueva: string,
  confirmar: string
): string | null {
  if (!confirmar) return "Debe confirmar la nueva contraseña";
  if (nueva !== confirmar) return "La confirmación no coincide con la nueva contraseña";
  return null;
}

export function validarRangoFechas(desde: string, hasta: string): string | null {
  if (!desde) return "Indique la fecha de inicio del período";
  if (!hasta) return "Indique la fecha de término del período";
  if (desde > hasta) return "La fecha de inicio no puede ser posterior a la de término";
  return null;
}

export function validarFechaEvento(value: string): string | null {
  if (!value) return "La fecha y hora del evento son obligatorias";
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return "Fecha u hora inválida";
  return null;
}

export function primerErrorCampo(errors: Record<string, string | null | undefined>): string | null {
  for (const value of Object.values(errors)) {
    if (value) return value;
  }
  return null;
}
