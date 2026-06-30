import { beforeAll } from 'vitest';
import { seedTestDatabase } from '../../prisma/seed-test';
import { integrationEnabled } from '../setup';

if (integrationEnabled()) {
  beforeAll(async () => {
    await seedTestDatabase();
  }, 120_000);
}
