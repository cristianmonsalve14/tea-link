import { describe, it, expect } from 'vitest';
import { perfilListQuerySchema, perfilOperativoListQuerySchema } from '../../src/utils/perfilListQuery';

describe('perfilListQuerySchema', () => {
  it('aplica valores por defecto', () => {
    const q = perfilListQuerySchema.parse({});
    expect(q.page).toBe(1);
    expect(q.limit).toBe(20);
    expect(q.sort).toBe('nombre');
    expect(q.tipo).toBe('todos');
  });

  it('acepta búsqueda y paginación', () => {
    const q = perfilListQuerySchema.parse({
      q: 'joaquin',
      page: '2',
      limit: '50',
      sort: 'edad',
      order: 'desc',
      tipo: 'compartidos'
    });
    expect(q.q).toBe('joaquin');
    expect(q.page).toBe(2);
    expect(q.limit).toBe(50);
  });

  it('acepta filtro y orden por nivel educacional', () => {
    const q = perfilListQuerySchema.parse({
      sort: 'nivel_educacional',
      nivel: 'BASICO_4'
    });
    expect(q.sort).toBe('nivel_educacional');
    expect(q.nivel).toBe('BASICO_4');
    const sin = perfilListQuerySchema.parse({ nivel: 'sin_nivel' });
    expect(sin.nivel).toBe('sin_nivel');
  });
});

describe('perfilOperativoListQuerySchema', () => {
  it('aplica valores por defecto', () => {
    const q = perfilOperativoListQuerySchema.parse({});
    expect(q.page).toBe(1);
    expect(q.limit).toBe(20);
    expect(q.sort).toBe('nombre');
  });

  it('acepta búsqueda, include_id y all', () => {
    const q = perfilOperativoListQuerySchema.parse({
      q: 'ana',
      page: '2',
      include_id: '8',
      all: 'true'
    });
    expect(q.q).toBe('ana');
    expect(q.page).toBe(2);
    expect(q.include_id).toBe(8);
    expect(q.all).toBe(true);
  });
});
