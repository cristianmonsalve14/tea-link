import { z } from 'zod';

export const MENSAJE_TELEFONO_CHILE =
  'Ingrese un teléfono válido de Chile (ej.: +56 9 1234 5678 o 2 2123 4567)';

export function digitosTelefonoChile(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('56')) digits = digits.slice(2);
  return digits;
}

export function esTelefonoChileValido(value: string): boolean {
  const digits = digitosTelefonoChile(value);
  if (digits.length === 9 && digits.startsWith('9')) return true;
  if (digits.length >= 8 && digits.length <= 9 && /^[2-7]/.test(digits)) return true;
  return false;
}

export const telefonoChileSchema = z
  .string()
  .trim()
  .min(1, 'El teléfono es obligatorio')
  .max(50, 'El teléfono no puede superar 50 caracteres')
  .refine(esTelefonoChileValido, { message: MENSAJE_TELEFONO_CHILE });

export const direccionSchema = z
  .string()
  .trim()
  .min(5, 'La dirección debe tener al menos 5 caracteres')
  .max(255, 'La dirección no puede superar 255 caracteres');

export const emailContactoSchema = z
  .string()
  .trim()
  .min(1, 'El correo de contacto es obligatorio')
  .email('Email de contacto inválido')
  .max(255, 'El correo no puede superar 255 caracteres');

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'El correo es obligatorio')
  .email('Correo electrónico inválido')
  .max(255, 'El correo no puede superar 255 caracteres');
