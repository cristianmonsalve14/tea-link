import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.NODE_ENV = 'test';

export function integrationEnabled(): boolean {
  if (process.env.SKIP_INTEGRATION_TESTS === '1') return false;
  return Boolean(process.env.DATABASE_URL);
}
