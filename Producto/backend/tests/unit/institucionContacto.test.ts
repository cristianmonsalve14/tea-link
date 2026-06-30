import { describe, it, expect } from 'vitest';
import { filtrarYPaginarInstitucionesRed } from '../../src/utils/institucionContacto';

const muestra = [
  {
    id: 1,
    nombre: 'Centro Médico Norte',
    tipo: 'CENTRO_MEDICO',
    region: 'METROPOLITANA',
    comuna: 'Providencia',
    localidad: 'Centro',
    email_contacto: 'contacto@norte.cl',
    telefono_contacto: '+56 2 1111 2222',
    direccion: 'Av. Providencia 100',
    vinculos: 2
  },
  {
    id: 2,
    nombre: 'Centro Terapéutico Sur',
    tipo: 'CENTRO_PROFESIONAL',
    region: 'BIOBIO',
    comuna: 'Concepción',
    localidad: 'Centro',
    email_contacto: 'info@surt.cl',
    telefono_contacto: null,
    direccion: null,
    vinculos: 1
  }
];

describe('filtrarYPaginarInstitucionesRed', () => {
  it('filtra por texto en nombre o contacto', () => {
    const r = filtrarYPaginarInstitucionesRed(muestra, { page: 1, limit: 10, q: 'norte' });
    expect(r.instituciones).toHaveLength(1);
    expect(r.instituciones[0].nombre).toContain('Norte');
  });

  it('filtra por tipo de institución', () => {
    const r = filtrarYPaginarInstitucionesRed(muestra, {
      page: 1,
      limit: 10,
      tipo: 'CENTRO_PROFESIONAL'
    });
    expect(r.instituciones).toHaveLength(1);
    expect(r.instituciones[0].tipo).toBe('CENTRO_PROFESIONAL');
  });

  it('filtra por región', () => {
    const r = filtrarYPaginarInstitucionesRed(muestra, {
      page: 1,
      limit: 10,
      region: 'BIOBIO'
    });
    expect(r.instituciones).toHaveLength(1);
    expect(r.instituciones[0].region).toBe('BIOBIO');
  });

  it('filtra por comuna', () => {
    const r = filtrarYPaginarInstitucionesRed(muestra, {
      page: 1,
      limit: 10,
      comuna: 'Providencia'
    });
    expect(r.instituciones).toHaveLength(1);
    expect(r.instituciones[0].comuna).toBe('Providencia');
  });

  it('pagina resultados', () => {
    const r = filtrarYPaginarInstitucionesRed(muestra, { page: 2, limit: 1 });
    expect(r.instituciones).toHaveLength(1);
    expect(r.paginacion.page).toBe(2);
    expect(r.paginacion.totalPages).toBe(2);
  });
});
