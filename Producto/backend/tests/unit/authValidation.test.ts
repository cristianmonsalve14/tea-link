import { describe, it, expect } from 'vitest';
import { loginSchema, parseLoginBody } from '../../src/utils/authValidation';
import { normalizeEmail } from '../../src/utils/email';

describe('authValidation', () => {
  it('normalizeEmail recorta y minúsculas', () => {
    expect(normalizeEmail('  Usuario@Mail.COM ')).toBe('usuario@mail.com');
  });

  it('loginSchema normaliza email y valida password', () => {
    const data = loginSchema.parse({
      email: '  Test@Example.com ',
      password: '123456'
    });
    expect(data.email).toBe('test@example.com');
    expect(data.password).toBe('123456');
  });

  it('loginSchema rechaza password corta', () => {
    expect(() =>
      loginSchema.parse({ email: 'a@b.cl', password: '123' })
    ).toThrow();
  });

  it('parseLoginBody es alias de parse', () => {
    const data = parseLoginBody({ email: 'x@y.cl', password: 'abcdef' });
    expect(data.email).toBe('x@y.cl');
  });
});
