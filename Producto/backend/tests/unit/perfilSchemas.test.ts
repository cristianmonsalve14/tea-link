import { describe, it, expect } from 'vitest';

import { crearPerfilSchema, parseCrearPerfilBody } from '../../src/utils/perfilSchemas';



describe('perfilSchemas', () => {

  it('crearPerfilSchema exige nombre', () => {

    expect(() =>

      crearPerfilSchema.parse({

        nombre: '',

        rut: '11.111.111-1',

        diagnostico_clinico: 'TEA'

      })

    ).toThrow();

  });



  it('crearPerfilSchema acepta diagnóstico estructurado', () => {

    const data = crearPerfilSchema.parse({

      nombre: 'Matías Test',

      rut: '11.111.111-1',

      diagnostico_clinico: 'TEA'

    });

    expect(data.diagnostico_clinico).toBe('TEA');
    expect(data.rut).toBe('11111111-1');

  });



  it('crearPerfilSchema coerce edad', () => {

    const data = crearPerfilSchema.parse({

      nombre: 'Niño',

      rut: '22.222.222-2',

      edad: '10',

      diagnostico_clinico: 'TDAH'

    });

    expect(data.edad).toBe(10);

  });



  it('parseCrearPerfilBody valida cuerpo completo', () => {

    const data = parseCrearPerfilBody({

      nombre: 'Perfil EV3',

      rut: '33.333.333-3',

      diagnostico_clinico: 'TEA'

    });

    expect(data.diagnostico_clinico).toBe('TEA');

  });



  it('exige apellido en nombre del tutor', () => {

    expect(() =>

      crearPerfilSchema.parse({

        nombre: 'Niño',

        rut: '44.444.444-4',

        diagnostico_clinico: 'TEA',

        tutor_email: 'tutor@test.com',

        tutor_nombre_completo: 'SoloNombre'

      })

    ).toThrow();

    const ok = crearPerfilSchema.parse({

      nombre: 'Niño',

      rut: '55.555.555-5',

      diagnostico_clinico: 'TEA',

      tutor_email: 'tutor@test.com',

      tutor_nombre_completo: 'María González López'

    });

    expect(ok.tutor_nombre_completo).toBe('María González López');

  });

});


