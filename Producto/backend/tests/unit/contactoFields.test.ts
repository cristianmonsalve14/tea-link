import { describe, it, expect } from 'vitest';
import {
  direccionSchema,
  emailContactoSchema,
  esTelefonoChileValido,
  telefonoChileSchema
} from '../../src/utils/contactoFields';

describe('contactoFields', () => {
  it('acepta teléfonos móviles y fijos chilenos', () => {
    expect(esTelefonoChileValido('+56 9 1234 5678')).toBe(true);
    expect(esTelefonoChileValido('912345678')).toBe(true);
    expect(esTelefonoChileValido('2 2123 4567')).toBe(true);
    expect(esTelefonoChileValido('+56 2 2345 6789')).toBe(true);
  });

  it('rechaza teléfonos inválidos', () => {
    expect(esTelefonoChileValido('123')).toBe(false);
    expect(esTelefonoChileValido('abc')).toBe(false);
    expect(telefonoChileSchema.safeParse('').success).toBe(false);
  });

  it('valida dirección y correo obligatorios', () => {
    expect(direccionSchema.safeParse('Av. Central 100').success).toBe(true);
    expect(direccionSchema.safeParse('1234').success).toBe(false);
    expect(emailContactoSchema.safeParse('contacto@demo.cl').success).toBe(true);
    expect(emailContactoSchema.safeParse('no-es-email').success).toBe(false);
  });
});
