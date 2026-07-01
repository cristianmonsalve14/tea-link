import { describe, expect, it } from 'vitest';

import { integrationEnabled, isProductionDatabaseUrl } from '../setup';

describe('integration guard', () => {
  it('detecta URLs de Neon como producción', () => {
    expect(
      isProductionDatabaseUrl('postgresql://user:pass@ep-rough-snow.aws.neon.tech/neondb')
    ).toBe(true);
  });

  it('permite BD local de prueba', () => {
    expect(isProductionDatabaseUrl('postgresql://postgres:pass@localhost:5432/tea_link_test')).toBe(
      false
    );
  });

  it('omite integración si DATABASE_URL es Neon y no hay override', () => {
    const prevUrl = process.env.DATABASE_URL;
    const prevAllow = process.env.ALLOW_PRODUCTION_INTEGRATION_TESTS;
    const prevSkip = process.env.SKIP_INTEGRATION_TESTS;

    process.env.SKIP_INTEGRATION_TESTS = '0';
    delete process.env.ALLOW_PRODUCTION_INTEGRATION_TESTS;
    process.env.DATABASE_URL =
      'postgresql://user:pass@ep-rough-snow.ap-southeast-1.aws.neon.tech/neondb';

    expect(integrationEnabled()).toBe(false);

    process.env.DATABASE_URL = prevUrl;
    if (prevAllow !== undefined) process.env.ALLOW_PRODUCTION_INTEGRATION_TESTS = prevAllow;
    else delete process.env.ALLOW_PRODUCTION_INTEGRATION_TESTS;
    if (prevSkip !== undefined) process.env.SKIP_INTEGRATION_TESTS = prevSkip;
    else delete process.env.SKIP_INTEGRATION_TESTS;
  });
});
