import { describe, it, expect } from 'vitest';
import {
  camposDiagnosticoPerfilSchema,
  etiquetaDiagnosticoClinico,
  validarPorcentajeRnd
} from '../../src/utils/diagnosticoPerfil';

describe('diagnosticoPerfil', () => {
  it('etiqueta diagnóstico clínico', () => {
    expect(etiquetaDiagnosticoClinico('TEA')).toContain('espectro autista');
  });

  it('exige causa y grado con credencial RND', () => {
    expect(() =>
      camposDiagnosticoPerfilSchema.parse({
        diagnostico_clinico: 'TEA',
        tiene_credencial_rnd: true,
        grado_discapacidad: 'NO_CALIFICADO'
      })
    ).toThrow();
  });

  it('valida rango de porcentaje por grado', () => {
    expect(validarPorcentajeRnd('LEVE', 10)).toBeNull();
    expect(validarPorcentajeRnd('LEVE', 40)).toMatch(/entre 5% y 24%/);
  });
});
