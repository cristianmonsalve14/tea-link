import { describe, it, expect } from 'vitest';
import {
  perfilPuedeCederCustodia,
  receptorCustodiaColaboracion
} from '../../src/utils/perfilCustodia';

describe('perfilCustodia (frontend)', () => {
  it('detecta receptor educacional o médico con colaboración aceptada', () => {
    const receptor = receptorCustodiaColaboracion([
      {
        institucion_id: 12,
        nombre: 'Centro Médico Demo',
        tipo: 'CENTRO_MEDICO',
        estado: 'ACEPTADA'
      },
      {
        institucion_id: 15,
        nombre: 'Centro terapeutico',
        tipo: 'CENTRO_PROFESIONAL',
        estado: 'ACEPTADA'
      }
    ]);
    expect(receptor?.institucion_id).toBe(12);
  });

  it('perfil propio con colaboración creadora puede ceder custodia', () => {
    expect(
      perfilPuedeCederCustodia({
        es_propio: true,
        colaboraciones: [
          {
            institucion_id: 14,
            nombre: 'Colegio AltaVida',
            tipo: 'CENTRO_EDUCACIONAL',
            estado: 'ACEPTADA'
          }
        ]
      })
    ).toBe(true);
  });

  it('sin colaboración aceptada con creador no puede ceder', () => {
    expect(
      perfilPuedeCederCustodia({
        es_propio: true,
        colaboraciones: []
      })
    ).toBe(false);
  });
});
