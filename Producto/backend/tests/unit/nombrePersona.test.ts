import { describe, it, expect } from 'vitest';
import {
  nombreCompletoConApellidoSchema,
  nombreIncluyeApellido
} from '../../src/utils/nombrePersona';

describe('nombreIncluyeApellido', () => {
  it('acepta nombre con dos apellidos', () => {
    expect(nombreIncluyeApellido('Juan Pérez González')).toBe(true);
    expect(nombreIncluyeApellido('María José López Soto')).toBe(true);
  });

  it('rechaza solo nombre o un apellido', () => {
    expect(nombreIncluyeApellido('Juan')).toBe(false);
    expect(nombreIncluyeApellido('Juan Pérez')).toBe(false);
  });

  it('rechaza partes de una letra', () => {
    expect(nombreIncluyeApellido('Juan P G')).toBe(false);
  });
});

describe('nombreCompletoConApellidoSchema', () => {
  it('valida con zod', () => {
    expect(nombreCompletoConApellidoSchema.parse('Pedro Muñoz Rojas')).toBe(
      'Pedro Muñoz Rojas'
    );
  });

  it('falla sin segundo apellido', () => {
    expect(() => nombreCompletoConApellidoSchema.parse('Pedro Muñoz')).toThrow();
  });
});
