import dotenv from 'dotenv';
import path from 'path';

import { deleteTestData } from '../prisma/seed-test';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  console.log('Eliminando datos de prueba (@test-auto.tealink.cl y [TEST]*)...');
  await deleteTestData();
  console.log('Limpieza completada.');
}

main().catch(err => {
  console.error('[clean-test-data] Error', err);
  process.exit(1);
});
