import fs from 'fs';
import path from 'path';
import { createExtractorFromData } from 'node-unrar-js';
import { PrismaClient } from '@prisma/client';

import {
  inferirAmbitoSalud,
  inferirDependenciaMineduc,
  inferirTipoOficialEducacion,
  inferirTipoOficialSalud,
  normalizarTextoBusqueda,
  parseCsvSemicolon,
  repararTextoCatalogo
} from '../src/utils/catalogoEstablecimiento';
import { normalizarComuna } from '../src/utils/ubicacionChile';
import { regionDesdeCodigoDeis, regionDesdeNombreOficial } from '../src/utils/regionCatalogo';

const prisma = new PrismaClient();

const DEIS_CSV_URL =
  process.env.CATALOG_DEIS_URL ??
  'https://datos.gob.cl/dataset/3bf4cf7c-f638-4735-9a01-f65faae4beca/resource/2c44d782-3365-44e3-aefb-2c8b8363a1bc/download/establecimientos_20260428.csv';

const DEIS_CSV_URL_FALLBACK =
  'https://deis.minsal.cl/wp-content/uploads/2024/12/Establecimientos-2024.csv';

const MINEDUC_RAR_URL =
  process.env.CATALOG_MINEDUC_RAR_URL ??
  'https://datosabiertos.mineduc.cl/wp-content/uploads/2024/11/Directorio-Oficial-EE-2024-.rar';

const MINEDUC_CSV_NAME = '20240912_Directorio_Oficial_EE_2024_20240430_WEB.csv';

type CatalogoRow = {
  fuente: 'MINEDUC_ESCOLAR' | 'DEIS_SALUD';
  ambito: 'EDUCACION' | 'SALUD' | 'TERAPEUTICO';
  codigo_externo: string;
  nombre: string;
  nombre_busqueda: string;
  tipo_oficial: string | null;
  region: ReturnType<typeof regionDesdeNombreOficial>;
  comuna: string | null;
  localidad: string | null;
  direccion: string | null;
  dependencia: string | null;
  sostenedor: string | null;
  tiene_pie: boolean;
  es_escuela_especial: boolean;
  vigente: boolean;
  metadata: Record<string, unknown> | null;
};

function bufferToArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

async function descargar(url: string, destino: string, intentos = 3): Promise<void> {
  let ultimoError: Error | null = null;
  for (let i = 0; i < intentos; i += 1) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`No se pudo descargar ${url} (${res.status})`);
      }
      const arrayBuffer = await res.arrayBuffer();
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      fs.writeFileSync(destino, Buffer.from(arrayBuffer));
      return;
    } catch (err) {
      ultimoError = err instanceof Error ? err : new Error(String(err));
      if (i < intentos - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
      }
    }
  }
  throw ultimoError ?? new Error(`No se pudo descargar ${url}`);
}

async function extraerCsvMineducDesdeRar(rarPath: string): Promise<string> {
  const wasmPath = path.join(__dirname, '../node_modules/node-unrar-js/esm/js/unrar.wasm');
  const wasmBinary = bufferToArrayBuffer(fs.readFileSync(wasmPath));
  const rarBinary = bufferToArrayBuffer(fs.readFileSync(rarPath));
  const extractor = await createExtractorFromData({ wasmBinary, data: rarBinary });

  for (const file of extractor.extract({ files: [MINEDUC_CSV_NAME] }).files) {
    if (!file.fileHeader.flags.directory) {
      const buf = Buffer.from(file.extraction ?? new Uint8Array());
      let csv = buf.toString('utf8');
      if (/Ã.|Â./u.test(csv)) {
        csv = buf.toString('latin1');
      }
      return csv;
    }
  }
  throw new Error(`No se encontró ${MINEDUC_CSV_NAME} dentro del RAR MINEDUC`);
}

function tieneEspecialidadMineduc(row: Record<string, string>): boolean {
  for (let i = 1; i <= 11; i += 1) {
    const key = `ESPE_${String(i).padStart(2, '0')}`;
    if (row[key] === '1') return true;
  }
  return false;
}

function parseMineducRows(rows: Record<string, string>[]): CatalogoRow[] {
  const out: CatalogoRow[] = [];

  for (const row of rows) {
    const rbd = row.RBD?.trim();
    const nombre = repararTextoCatalogo(row.NOM_RBD?.trim());
    if (!rbd || !nombre) continue;

    const estado = row.ESTADO_ESTAB?.trim();
    const vigente = !estado || estado === '1';
    const tipoOficial = inferirTipoOficialEducacion(nombre);
    const esEspecial =
      tipoOficial === 'escuela_especial' ||
      tieneEspecialidadMineduc(row) ||
      normalizarTextoBusqueda(nombre).includes('ESPECIAL');

    const region =
      regionDesdeNombreOficial(repararTextoCatalogo(row.NOM_REG_RBD_A)) ??
      regionDesdeNombreOficial(repararTextoCatalogo(row.NOM_DEPROV_RBD));
    const comunaRaw = repararTextoCatalogo(row.NOM_COM_RBD?.trim());
    const comuna =
      region && comunaRaw ? (normalizarComuna(region, comunaRaw) ?? comunaRaw) : comunaRaw;

    out.push({
      fuente: 'MINEDUC_ESCOLAR',
      ambito: 'EDUCACION',
      codigo_externo: rbd,
      nombre,
      nombre_busqueda: normalizarTextoBusqueda(nombre),
      tipo_oficial: tipoOficial,
      region,
      comuna,
      localidad: comuna,
      direccion: null,
      dependencia: inferirDependenciaMineduc(row.COD_DEPE2 ?? '', row.COD_DEPE ?? ''),
      sostenedor: row.RUT_SOSTENEDOR?.trim() ? `RUT ${row.RUT_SOSTENEDOR.trim()}` : null,
      tiene_pie: row.CONVENIO_PIE === '1',
      es_escuela_especial: esEspecial,
      vigente,
      metadata: {
        agno: row.AGNO,
        dgv_rbd: row.DGV_RBD,
        rural: row.RURAL_RBD,
        matricula: row.MAT_TOTAL
      }
    });
  }

  return out;
}

function parseDeisRows(rows: Record<string, string>[]): CatalogoRow[] {
  const out: CatalogoRow[] = [];

  for (const row of rows) {
    const codigo = (row.EstablecimientoCodigo ?? row.establecimientoCodigo ?? '').trim();
    const nombre = (row.EstablecimientoGlosa ?? row.establecimientoGlosa ?? '').trim();
    if (!codigo || !nombre) continue;

    const tipoEst = row.TipoEstablecimientoGlosa?.trim() ?? '';
    const ambito = inferirAmbitoSalud(tipoEst, nombre);
    const estado = row.EstadoFuncionamiento?.trim() ?? '';
    const vigente =
      !estado ||
      estado.toLowerCase().includes('vigente') ||
      !estado.toLowerCase().includes('cerr');

    const via = row.NombreVia?.trim();
    const numero = row.Numero?.trim();
    const direccion = [via, numero].filter(Boolean).join(' ').trim() || null;

    out.push({
      fuente: 'DEIS_SALUD',
      ambito,
      codigo_externo: codigo,
      nombre,
      nombre_busqueda: normalizarTextoBusqueda(nombre),
      tipo_oficial: inferirTipoOficialSalud(tipoEst, nombre),
      region:
        regionDesdeCodigoDeis(row.RegionCodigo) ?? regionDesdeNombreOficial(row.RegionGlosa),
      comuna: row.ComunaGlosa?.trim() || null,
      localidad: row.ComunaGlosa?.trim() || null,
      direccion,
      dependencia: row.DependenciaAdministrativa?.trim() || row.TipoPertenenciaEstabGlosa?.trim() || null,
      sostenedor: row.SeremiSaludGlosa_ServicioDeSaludGlosa?.trim() || null,
      tiene_pie: false,
      es_escuela_especial: false,
      vigente,
      metadata: {
        tipo_establecimiento: tipoEst,
        nivel_atencion: row.NivelAtencionEstabglosa,
        sistema_salud: row.TipoSistemaSaludGlosa
      }
    });
  }

  return out;
}

async function persistirLote(rows: CatalogoRow[]): Promise<number> {
  if (rows.length === 0) return 0;
  const result = await prisma.catalogoEstablecimiento.createMany({
    data: rows,
    skipDuplicates: true
  });
  return result.count;
}

async function importarMineduc(cacheDir: string): Promise<number> {
  const rarPath = path.join(cacheDir, 'mineduc-2024.rar');
  if (!fs.existsSync(rarPath)) {
    console.log('Descargando directorio MINEDUC...');
    await descargar(MINEDUC_RAR_URL, rarPath);
  }
  console.log('Extrayendo CSV MINEDUC...');
  const csv = await extraerCsvMineducDesdeRar(rarPath);
  const rows = parseMineducRows(parseCsvSemicolon(csv));
  console.log(`MINEDUC: ${rows.length} registros parseados`);

  let insertados = 0;
  const lote = 400;
  for (let i = 0; i < rows.length; i += lote) {
    insertados += await persistirLote(rows.slice(i, i + lote));
    process.stdout.write(`\rMINEDUC insertados: ${insertados}`);
  }
  process.stdout.write('\n');
  return insertados;
}

async function importarDeis(cacheDir: string): Promise<number> {
  const csvPath = path.join(cacheDir, 'deis-salud.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('Descargando establecimientos DEIS/MINSAL...');
    try {
      await descargar(DEIS_CSV_URL, csvPath);
    } catch (primero) {
      console.warn(`Aviso: ${primero instanceof Error ? primero.message : primero}`);
      console.log('Reintentando con URL alternativa DEIS...');
      await descargar(DEIS_CSV_URL_FALLBACK, csvPath);
    }
  }
  const csv = fs.readFileSync(csvPath, 'latin1');
  const rows = parseDeisRows(parseCsvSemicolon(csv));
  console.log(`DEIS: ${rows.length} registros parseados`);

  let insertados = 0;
  const lote = 400;
  for (let i = 0; i < rows.length; i += lote) {
    insertados += await persistirLote(rows.slice(i, i + lote));
    process.stdout.write(`\rDEIS insertados: ${insertados}`);
  }
  process.stdout.write('\n');
  return insertados;
}

async function main() {
  const cacheDir = path.join(__dirname, '../data/catalogos/cache');
  fs.mkdirSync(cacheDir, { recursive: true });
  const only = process.env.CATALOG_ONLY?.toLowerCase();

  const existentes = await prisma.catalogoEstablecimiento.count();
  if (existentes > 0 && process.env.CATALOG_FORCE !== '1' && !only) {
    console.log(
      `Catálogo ya contiene ${existentes} registros. Use CATALOG_FORCE=1 para reimportar o CATALOG_ONLY=deis|mineduc para una fuente.`
    );
    return;
  }

  if (existentes > 0 && process.env.CATALOG_FORCE === '1') {
    console.log('Eliminando catálogo previo...');
    await prisma.catalogoEstablecimiento.deleteMany({});
  }

  let mineduc = 0;
  let deis = 0;

  if (!only || only === 'mineduc') {
    mineduc = await importarMineduc(cacheDir);
  }
  if (!only || only === 'deis') {
    try {
      deis = await importarDeis(cacheDir);
    } catch (err) {
      console.warn(
        `DEIS no importado: ${err instanceof Error ? err.message : err}. El catálogo educativo sigue disponible.`
      );
    }
  }

  const total = await prisma.catalogoEstablecimiento.count();
  console.log(`Importación finalizada. Nuevos: MINEDUC ${mineduc}, DEIS ${deis}. Total en BD: ${total}`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
