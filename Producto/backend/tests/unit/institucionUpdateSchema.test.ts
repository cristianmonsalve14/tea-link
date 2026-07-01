import { describe, expect, it } from 'vitest';

import { institucionAdminBodySchema } from '../../src/utils/institucionContacto';
import { parseUbicacionInstitucion } from '../../src/utils/ubicacionChile';

describe('institucionAdminBodySchema (update)', () => {
  const body = {
    tipo: 'CENTRO_PROFESIONAL' as const,
    region: 'VALPARAISO' as const,
    comuna: 'Valparaíso',
    localidad: null,
    direccion: 'Av. Argentina 123',
    email_contacto: 'contacto@centroterapeutico.cl',
    telefono_contacto: '+56951885433',
    nombre: 'Centro terapeutico',
    registro_manual: true
  };

  it('parsea el payload de edición en producción', () => {
    const data = institucionAdminBodySchema.parse(body);
    expect(data.region).toBe('VALPARAISO');
    expect(data.comuna).toBe('Valparaíso');
    expect(data.localidad).toBeNull();

    const ubicacion = parseUbicacionInstitucion({
      region: data.region!,
      comuna: data.comuna!,
      localidad: data.localidad
    });
    expect(ubicacion.comuna).toBe('Valparaíso');
    expect(ubicacion.localidad).toBeNull();

    const prismaData = {
      ...data,
      ...ubicacion,
      ...(data.tipo ? { tipo: data.tipo } : {})
    };
    expect(prismaData).not.toHaveProperty('registro_manual');
    expect(Object.keys(prismaData).sort()).toEqual(
      [
        'comuna',
        'direccion',
        'email_contacto',
        'localidad',
        'nombre',
        'region',
        'telefono_contacto',
        'tipo'
      ].sort()
    );
  });
});
