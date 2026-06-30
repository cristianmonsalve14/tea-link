import { describe, it, expect } from 'vitest';
import { resolverCentroEducacional } from '../../src/utils/perfilDetalleOperativo';

describe('resolverCentroEducacional', () => {
  const colegio = { id: 1, nombre: 'Colegio AltaVida', tipo: 'CENTRO_EDUCACIONAL' };
  const clinica = { id: 2, nombre: 'Centro Médico TEA', tipo: 'CENTRO_MEDICO' };

  it('usa institución dueña si es colegio', () => {
    expect(resolverCentroEducacional(colegio, [], [])).toEqual(colegio);
  });

  it('usa institución del educador asignado', () => {
    expect(
      resolverCentroEducacional(clinica, [{ institucion: colegio }], [])
    ).toEqual(colegio);
  });

  it('usa colaboración activa con colegio', () => {
    expect(
      resolverCentroEducacional(clinica, [], [
        {
          estado: 'ACEPTADA',
          institucion_solicitante: colegio,
          institucion_invitada: clinica
        }
      ])
    ).toEqual(colegio);
  });
});
