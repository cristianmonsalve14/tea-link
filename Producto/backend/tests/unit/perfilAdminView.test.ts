import { describe, it, expect } from 'vitest';
import { resumenPerfilesAdmin } from '../../src/utils/perfilAdminView';

describe('resumenPerfilesAdmin', () => {
  it('cuenta propios y compartidos', () => {
    const perfiles = [
      { es_propio: true },
      { es_propio: false }
    ] as Parameters<typeof resumenPerfilesAdmin>[0];

    expect(resumenPerfilesAdmin(perfiles)).toEqual({
      total: 2,
      propios: 1,
      compartidos: 1
    });
  });
});
