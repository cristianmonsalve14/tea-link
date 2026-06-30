import { describe, it, expect } from 'vitest';
import { MAX_APODERADOS_POR_PERFIL, esRolApoderado } from '../../src/utils/apoderadoPerfil';

describe('apoderadoPerfil', () => {
  it('define máximo de apoderados por perfil', () => {
    expect(MAX_APODERADOS_POR_PERFIL).toBe(3);
  });

  it('reconoce roles de apoderado', () => {
    expect(esRolApoderado('TUTOR')).toBe(true);
    expect(esRolApoderado('TITULAR')).toBe(true);
    expect(esRolApoderado('EDUCADOR')).toBe(false);
  });
});
