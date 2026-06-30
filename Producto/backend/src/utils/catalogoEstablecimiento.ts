import { catalogo_ambito_enum, tipo_institucion_enum } from '@prisma/client';

export function normalizarTextoBusqueda(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Corrige texto UTF-8 leído como Latin-1 (común en CSV MINEDUC). */
export function repararTextoCatalogo(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  if (/Ã.|Â./u.test(v)) {
    try {
      const reparado = Buffer.from(v, 'latin1').toString('utf8').trim();
      return reparado || v;
    } catch {
      return v;
    }
  }
  return v;
}

export function parseCsvSemicolon(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].replace(/^\uFEFF/, '').split(';').map(h => h.trim());
  const rows: Record<string, string>[] = [];

  for (const line of lines.slice(1)) {
    const cols = line.split(';');
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cols[index]?.trim() ?? '';
    });
    rows.push(row);
  }

  return rows;
}

export function inferirTipoOficialEducacion(nombre: string): string {
  const n = normalizarTextoBusqueda(nombre);
  if (n.includes('UNIVERSIDAD')) return 'universidad';
  if (n.includes('INSTITUTO PROFESIONAL') || n.includes('INSTITUTO PROF')) {
    return 'instituto_profesional';
  }
  if (n.includes('CFT') || n.includes('FORMACION TECNICA')) return 'formacion_tecnica';
  if (n.startsWith('LICEO') || n.includes(' LICEO')) return 'liceo';
  if (n.includes('JARDIN INFANTIL') || n.includes('JARDIN')) return 'jardin_infantil';
  if (n.includes('ESCUELA ESPECIAL') || n.includes('ESC ESP') || n.includes('ESC. ESP')) {
    return 'escuela_especial';
  }
  if (n.includes('ESCUELA')) return 'escuela';
  if (n.includes('COLEGIO')) return 'colegio';
  if (n.includes('CORPORACION') || n.includes('FUNDACION')) return 'corporacion';
  if (n.includes('CENTRO') || n.includes('CTRO')) return 'centro_educacional';
  return 'establecimiento_educacional';
}

export function inferirDependenciaMineduc(codDepe2: string, codDepe: string): string {
  const code = codDepe2 || codDepe;
  switch (code) {
    case '1':
      return 'Municipal';
    case '2':
      return 'Particular subvencionado';
    case '3':
      return 'Particular pagado';
    case '4':
      return 'Corporación de derecho privado';
    case '5':
      return 'Servicio local de educación';
    case '6':
      return 'Administración delegada';
    default:
      return 'Otra';
  }
}

export function inferirAmbitoSalud(tipoEstablecimiento: string, nombre: string): catalogo_ambito_enum {
  const texto = normalizarTextoBusqueda(`${tipoEstablecimiento} ${nombre}`);
  const terapeutico =
    texto.includes('REHABILIT') ||
    texto.includes('TERAPIA') ||
    texto.includes('KINESIO') ||
    texto.includes('FONOAUDIO') ||
    texto.includes('PSICOLOG') ||
    texto.includes('SALUD MENTAL') ||
    texto.includes('CENTRO DE RECURSOS');
  return terapeutico ? 'TERAPEUTICO' : 'SALUD';
}

export function inferirTipoOficialSalud(tipoEstablecimiento: string, nombre: string): string {
  const texto = normalizarTextoBusqueda(`${tipoEstablecimiento} ${nombre}`);
  if (texto.includes('HOSPITAL')) return 'hospital';
  if (texto.includes('CLINICA')) return 'clinica';
  if (texto.includes('CESFAM') || texto.includes('CONSULTORIO')) return 'consultorio_aps';
  if (texto.includes('SAPU') || texto.includes('URGENCIA')) return 'urgencia';
  if (texto.includes('LABORATORIO')) return 'laboratorio';
  if (texto.includes('REHABILIT') || texto.includes('TERAPIA')) return 'centro_terapeutico';
  if (texto.includes('CENTRO MEDICO') || texto.includes('CENTRO DE SALUD')) return 'centro_medico';
  return 'establecimiento_salud';
}

export function sugerirTipoInstitucionTeaLink(ambito: catalogo_ambito_enum): tipo_institucion_enum {
  switch (ambito) {
    case 'EDUCACION':
      return 'CENTRO_EDUCACIONAL';
    case 'SALUD':
      return 'CENTRO_MEDICO';
    case 'TERAPEUTICO':
      return 'CENTRO_PROFESIONAL';
    default:
      return 'CENTRO_EDUCACIONAL';
  }
}

export const TIPOS_OFICIALES_EDUCACION = [
  'colegio',
  'liceo',
  'escuela',
  'escuela_especial',
  'jardin_infantil',
  'universidad',
  'instituto_profesional',
  'formacion_tecnica',
  'centro_educacional',
  'corporacion',
  'establecimiento_educacional'
] as const;

export const TIPOS_OFICIALES_SALUD = [
  'hospital',
  'clinica',
  'centro_medico',
  'consultorio_aps',
  'urgencia',
  'laboratorio',
  'centro_terapeutico',
  'establecimiento_salud'
] as const;

export function etiquetaTipoOficial(tipo: string | null | undefined): string {
  if (!tipo) return '—';
  const labels: Record<string, string> = {
    colegio: 'Colegio',
    liceo: 'Liceo',
    escuela: 'Escuela',
    escuela_especial: 'Escuela especial',
    jardin_infantil: 'Jardín infantil',
    universidad: 'Universidad',
    instituto_profesional: 'Instituto profesional',
    formacion_tecnica: 'Formación técnica (CFT/IP)',
    centro_educacional: 'Centro educacional',
    corporacion: 'Corporación / fundación',
    establecimiento_educacional: 'Establecimiento educacional',
    hospital: 'Hospital',
    clinica: 'Clínica',
    centro_medico: 'Centro médico',
    consultorio_aps: 'Consultorio / CESFAM',
    urgencia: 'Urgencia / SAPU',
    laboratorio: 'Laboratorio',
    centro_terapeutico: 'Centro terapéutico / rehabilitación',
    establecimiento_salud: 'Establecimiento de salud'
  };
  return labels[tipo] ?? tipo.replace(/_/g, ' ');
}

export function etiquetaAmbitoCatalogo(ambito: catalogo_ambito_enum): string {
  switch (ambito) {
    case 'EDUCACION':
      return 'Educación';
    case 'SALUD':
      return 'Salud';
    case 'TERAPEUTICO':
      return 'Terapéutico / rehabilitación';
    default:
      return ambito;
  }
}

export function etiquetaCodigoCatalogo(fuente: string, codigo: string): string {
  if (fuente === 'MINEDUC_ESCOLAR') return `RBD ${codigo}`;
  if (fuente === 'DEIS_SALUD') return `Código salud ${codigo}`;
  return codigo;
}
