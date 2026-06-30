import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const raw = JSON.parse(
  readFileSync(join(__dirname, '../src/data/regiones-comunas-chile.json'), 'utf8')
) as Array<{ region: string; comunas: Array<{ name: string }> }>;

const map: Record<string, string> = {
  'Arica y Parinacota': 'ARICA_PARINACOTA',
  Tarapacá: 'TARAPACA',
  Antofagasta: 'ANTOFAGASTA',
  Atacama: 'ATACAMA',
  Coquimbo: 'COQUIMBO',
  Valparaíso: 'VALPARAISO',
  "Región del Libertador Gral. Bernardo O'Higgins": 'OHIGGINS',
  'Región del Maule': 'MAULE',
  'Región de Ñuble': 'NUBLE',
  'Región del Biobío': 'BIOBIO',
  'Región de la Araucanía': 'ARAUCANIA',
  'Región de los Ríos': 'LOS_RIOS',
  'Región de los Lagos': 'LOS_LAGOS',
  'Región Aisén del Gral. Carlos Ibañez del Campo': 'AYSEN',
  'Región de Magallanes y de la Antártica Chilena': 'MAGALLANES',
  'Región Metropolitana de Santiago': 'METROPOLITANA'
};

const out: Record<string, string[]> = {};

for (const r of raw) {
  const key = map[r.region];
  if (!key) {
    console.error('Región sin mapeo:', r.region);
    process.exit(1);
  }
  out[key] = r.comunas
    .map(c => (c.name === 'Coihaique' ? 'Coyhaique' : c.name))
    .sort((a, b) => a.localeCompare(b, 'es'));
}

const body = Object.entries(out)
  .map(([k, v]) => `  ${k}: ${JSON.stringify(v, null, 2).replace(/\n/g, '\n  ')}`)
  .join(',\n');

const content = `/** Generado desde regiones-comunas-chile.json — no editar a mano */
import type { region_chile_enum } from '@prisma/client';

export const COMUNAS_POR_REGION: Record<region_chile_enum, string[]> = {
${body}
};
`;

writeFileSync(join(__dirname, '../src/data/comunasPorRegion.generated.ts'), content);
console.log(
  'OK:',
  Object.keys(out).length,
  'regiones,',
  Object.values(out).flat().length,
  'comunas'
);
