import { describe, expect, it } from 'vitest';
import {
  MIN_BUSQUEDA_INVITABLE_CHARS,
  puedeListarInstitucionesInvitables,
  rangoPaginaInvitables,
  UMBRAL_CATALOGO_INVITABLE_LISTADO
} from '../../src/utils/institucionInvitable';

describe('institucionInvitable', () => {
  it('permite listar catálogos pequeños sin búsqueda', () => {
    expect(puedeListarInstitucionesInvitables(2, '')).toBe(true);
    expect(puedeListarInstitucionesInvitables(UMBRAL_CATALOGO_INVITABLE_LISTADO, '')).toBe(true);
  });

  it('exige búsqueda en catálogos grandes', () => {
    expect(puedeListarInstitucionesInvitables(800, '')).toBe(false);
    expect(puedeListarInstitucionesInvitables(800, 'a')).toBe(false);
    expect(puedeListarInstitucionesInvitables(800, 'ab')).toBe(true);
    expect(puedeListarInstitucionesInvitables(800, '  norte  ')).toBe(true);
  });

  it('calcula rango de página', () => {
    expect(rangoPaginaInvitables(1, 10, 342)).toEqual({ desde: 1, hasta: 10 });
    expect(rangoPaginaInvitables(35, 10, 342)).toEqual({ desde: 341, hasta: 342 });
    expect(rangoPaginaInvitables(1, 10, 0)).toBeNull();
  });

  it('usa mínimo de dos caracteres', () => {
    expect(MIN_BUSQUEDA_INVITABLE_CHARS).toBe(2);
  });
});
