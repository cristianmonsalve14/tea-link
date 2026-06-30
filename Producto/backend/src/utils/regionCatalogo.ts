import { region_chile_enum } from '@prisma/client';

import { REGION_CHILE_LABEL, REGIONES_CHILE } from './regionChile';

function sinDiacriticos(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().trim();
}

const ALIAS_REGION: Record<string, region_chile_enum> = {
  AYP: 'ARICA_PARINACOTA',
  'ARICA Y PARINACOTA': 'ARICA_PARINACOTA',
  TARAPACA: 'TARAPACA',
  ANTOFAGASTA: 'ANTOFAGASTA',
  ATACAMA: 'ATACAMA',
  COQUIMBO: 'COQUIMBO',
  VALPO: 'VALPARAISO',
  VALPARAISO: 'VALPARAISO',
  'REGION METROPOLITANA': 'METROPOLITANA',
  METROPOLITANA: 'METROPOLITANA',
  RM: 'METROPOLITANA',
  OHIGGINS: 'OHIGGINS',
  "O'HIGGINS": 'OHIGGINS',
  MAULE: 'MAULE',
  NUBLE: 'NUBLE',
  BIOBIO: 'BIOBIO',
  'BIO BIO': 'BIOBIO',
  ARAUCANIA: 'ARAUCANIA',
  'LA ARAUCANIA': 'ARAUCANIA',
  'LOS RIOS': 'LOS_RIOS',
  'LOS LAGOS': 'LOS_LAGOS',
  AYSEN: 'AYSEN',
  MAGALLANES: 'MAGALLANES',
  'MAGALLANES Y LA ANTARTICA CHILENA': 'MAGALLANES'
};

export function regionDesdeNombreOficial(
  nombre: string | null | undefined
): region_chile_enum | null {
  if (!nombre?.trim()) return null;
  const n = sinDiacriticos(nombre);
  if (ALIAS_REGION[n]) return ALIAS_REGION[n];

  for (const region of REGIONES_CHILE) {
    const label = sinDiacriticos(REGION_CHILE_LABEL[region]);
    if (n === label || n.includes(label) || label.includes(n)) {
      return region;
    }
  }

  for (const [alias, region] of Object.entries(ALIAS_REGION)) {
    if (n.includes(alias) || alias.includes(n)) return region;
  }

  return null;
}

const DEIS_CODIGO_REGION: Record<string, region_chile_enum> = {
  '01': 'TARAPACA',
  '02': 'ANTOFAGASTA',
  '03': 'ATACAMA',
  '04': 'COQUIMBO',
  '05': 'VALPARAISO',
  '06': 'OHIGGINS',
  '07': 'MAULE',
  '08': 'BIOBIO',
  '09': 'ARAUCANIA',
  '10': 'LOS_LAGOS',
  '11': 'AYSEN',
  '12': 'MAGALLANES',
  '13': 'METROPOLITANA',
  '14': 'LOS_RIOS',
  '15': 'ARICA_PARINACOTA',
  '16': 'NUBLE'
};

export function regionDesdeCodigoDeis(codigo: string | null | undefined): region_chile_enum | null {
  if (!codigo?.trim()) return null;
  const key = codigo.trim().padStart(2, '0');
  return DEIS_CODIGO_REGION[key] ?? null;
}
