import dotenv from 'dotenv';
import path from 'path';

// Base local; .env.test tiene prioridad si existe.
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });

if (process.env.INTEGRATION_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.INTEGRATION_DATABASE_URL;
}

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.NODE_ENV = 'test';

function databaseUrlForIntegration(): string | undefined {
  return process.env.INTEGRATION_DATABASE_URL || process.env.DATABASE_URL;
}

/** Evita ejecutar integración contra Neon/producción por accidente. */
export function isProductionDatabaseUrl(url: string): boolean {
  const normalized = url.toLowerCase();
  if (normalized.includes('tea_link_test') || normalized.includes('/test')) return false;
  if (normalized.includes('localhost') || normalized.includes('127.0.0.1')) return false;
  return normalized.includes('neon.tech') || normalized.includes('render.com');
}

export function integrationEnabled(): boolean {
  if (process.env.SKIP_INTEGRATION_TESTS === '1') return false;

  const url = databaseUrlForIntegration();
  if (!url) return false;

  if (
    process.env.ALLOW_PRODUCTION_INTEGRATION_TESTS !== '1' &&
    isProductionDatabaseUrl(url)
  ) {
    console.warn(
      '[tests] Integración omitida: DATABASE_URL apunta a producción. ' +
        'Use .env.test con BD local o INTEGRATION_DATABASE_URL.'
    );
    return false;
  }

  return true;
}
