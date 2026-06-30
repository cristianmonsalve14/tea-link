import { describe, it, expect } from 'vitest';
import {
  extraerNombreDesdeDetalles,
  formatEntidadAuditoriaLabel,
  etiquetaTipoEntidadAuditoria
} from '../../src/utils/auditoriaEntidadLabel';

const mapsVacios = {
  perfiles: new Map<number, string>(),
  instituciones: new Map<number, string>(),
  usuarios: new Map<number, string>()
};

describe('auditoriaEntidadLabel', () => {
  it('etiqueta tipo entidad en español', () => {
    expect(etiquetaTipoEntidadAuditoria('perfil')).toBe('Perfil');
    expect(etiquetaTipoEntidadAuditoria('institucion')).toBe('Institución');
  });

  it('muestra nombre y id cuando existen en mapa', () => {
    const label = formatEntidadAuditoriaLabel(
      { entidad: 'perfil', entidad_id: 5, detalles: null },
      {
        ...mapsVacios,
        perfiles: new Map([[5, 'Matías Pérez']])
      }
    );
    expect(label).toBe('Perfil: Matías Pérez (#5)');
  });

  it('extrae nombre desde detalles si el perfil fue eliminado', () => {
    const label = formatEntidadAuditoriaLabel(
      {
        entidad: 'perfil',
        entidad_id: 9,
        detalles: 'Perfil Joaquín Sanchez creado (consentimiento PENDIENTE)'
      },
      mapsVacios
    );
    expect(label).toBe('Perfil: Joaquín Sanchez (#9)');
  });

  it('institución con nombre desde detalles', () => {
    const label = formatEntidadAuditoriaLabel(
      {
        entidad: 'institucion',
        entidad_id: 14,
        detalles: 'Nombre: Colegio AltaVida, Tipo: CENTRO_EDUCACIONAL'
      },
      mapsVacios
    );
    expect(label).toBe('Institución: Colegio AltaVida (#14)');
  });
});

describe('extraerNombreDesdeDetalles', () => {
  it('parsea email de usuario', () => {
    expect(
      extraerNombreDesdeDetalles('Admin creado para institución X (1), email: admin@tealink.com', 'usuario')
    ).toBe('admin@tealink.com');
  });
});
