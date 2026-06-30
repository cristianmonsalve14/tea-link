import { describe, it, expect } from 'vitest';
import {
  validarDireccion,
  validarEmail,
  validarTelefonoChile,
  validarTituloObservacion,
  validarRangoFechas
} from '../../src/utils/formValidation';

describe('formValidation', () => {
  it('valida correo electrónico', () => {
    expect(validarEmail('')).toBe('El correo es obligatorio');
    expect(validarEmail('mal@')).toBe('Correo electrónico inválido');
    expect(validarEmail('ok@demo.cl')).toBeNull();
  });

  it('valida teléfono chileno', () => {
    expect(validarTelefonoChile('')).toBe('El teléfono es obligatorio');
    expect(validarTelefonoChile('123')).toMatch(/teléfono válido/);
    expect(validarTelefonoChile('+56 9 8765 4321')).toBeNull();
  });

  it('valida dirección', () => {
    expect(validarDireccion('')).toBe('La dirección es obligatoria');
    expect(validarDireccion('1234')).toMatch(/al menos 5/);
    expect(validarDireccion('Av. Libertad 100')).toBeNull();
  });

  it('valida título de observación y rango de fechas', () => {
    expect(validarTituloObservacion('ab')).toMatch(/al menos 3/);
    expect(validarTituloObservacion('Buen avance')).toBeNull();
    expect(validarRangoFechas('2026-06-10', '2026-06-01')).toMatch(/posterior/);
    expect(validarRangoFechas('2026-06-01', '2026-06-10')).toBeNull();
  });
});
