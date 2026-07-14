import type { Response } from 'express';

import { formatFechaChile, formatFechaHoraChile } from './fechaChile';

// require evita fallos de import con ts-node en Windows
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');

type ObservacionExport = {
  categoria: string;
  titulo: string;
  descripcion: string;
  fecha_evento: Date;
  autor: { nombre_completo: string };
};

export type ReportePdfInput = {
  id: number;
  titulo: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  emitidoEn: Date;
  observacionIds: number[];
  creador: {
    id: number;
    nombre_completo: string;
    rol: string;
    email?: string | null;
  };
  institucionNombre?: string | null;
  perfilNombre: string;
  observaciones: ObservacionExport[];
};

const COLORS = {
  primary: '#4A90E2',
  primaryDark: '#2563EB',
  primaryLight: '#DBEAFE',
  text: '#1F2937',
  textMuted: '#6B7280',
  textSoft: '#4B5563',
  border: '#E5E7EB',
  cardBg: '#F9FAFB',
  white: '#FFFFFF',
  accent: '#7ED321'
} as const;

const FOOTER_RESERVE = 42;

const CATEGORIA_STYLE: Record<string, { label: string; bg: string; text: string; stripe: string }> = {
  CONDUCTA: { label: 'Conducta', bg: '#FEF3C7', text: '#92400E', stripe: '#F59E0B' },
  COMUNICACION: { label: 'Comunicación', bg: '#DBEAFE', text: '#1E40AF', stripe: '#3B82F6' },
  SOCIAL: { label: 'Social', bg: '#D1FAE5', text: '#065F46', stripe: '#10B981' },
  ACADEMICO: { label: 'Académico', bg: '#E0E7FF', text: '#3730A3', stripe: '#6366F1' },
  SENSORIAL: { label: 'Sensorial', bg: '#FCE7F3', text: '#9D174D', stripe: '#EC4899' },
  MOTOR: { label: 'Motor', bg: '#FFEDD5', text: '#9A3412', stripe: '#F97316' },
  CLINICO: { label: 'Clínico', bg: '#CCFBF1', text: '#115E59', stripe: '#14B8A6' },
  OTRO: { label: 'Otro', bg: '#F3F4F6', text: '#374151', stripe: '#9CA3AF' }
};

const DEFAULT_CATEGORIA = CATEGORIA_STYLE.OTRO;

const ROL_EMISOR: Record<string, string> = {
  PROFESIONAL: 'Profesional de apoyo',
  MEDICO: 'Equipo médico',
  EDUCADOR: 'Educador/a',
  FAMILIA: 'Representante familiar'
};

const ROLES_BLOQUE_EMISOR = new Set(['PROFESIONAL', 'MEDICO', 'EDUCADOR']);

function fmtFecha(d: Date) {
  return formatFechaChile(d);
}

function pdfText(value: string): string {
  return value
    .normalize('NFC')
    .replace(/\u00a0/g, ' ')
    .replace(/[^\t\n\r\x20-\x7E\u00A1-\u00FF]/g, '?');
}

function categoriaStyle(cat: string) {
  const key = cat.toUpperCase().replace(/\s/g, '_');
  return CATEGORIA_STYLE[key] ?? { ...DEFAULT_CATEGORIA, label: cat };
}

type PdfDoc = InstanceType<typeof PDFDocument>;

function pageContentWidth(doc: PdfDoc) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function contentBottom(doc: PdfDoc) {
  return doc.page.height - doc.page.margins.bottom - FOOTER_RESERVE;
}

function setCursor(doc: PdfDoc, y: number) {
  doc.x = doc.page.margins.left;
  doc.y = y;
}

/** Texto de una línea o etiqueta corta */
function textAt(
  doc: PdfDoc,
  str: string,
  x: number,
  y: number,
  opts: { width: number; font?: string; size?: number; color?: string; bold?: boolean }
) {
  const font = opts.bold ? 'Helvetica-Bold' : opts.font ?? 'Helvetica';
  doc.font(font).fontSize(opts.size ?? 10).fillColor(opts.color ?? COLORS.text);
  doc.text(pdfText(str), x, y, {
    width: opts.width,
    lineBreak: false
  });
}

/** Texto multilínea (descripciones largas) */
function textBlockAt(
  doc: PdfDoc,
  str: string,
  x: number,
  y: number,
  opts: { width: number; font?: string; size?: number; color?: string; bold?: boolean }
) {
  const font = opts.bold ? 'Helvetica-Bold' : opts.font ?? 'Helvetica';
  doc.font(font).fontSize(opts.size ?? 10).fillColor(opts.color ?? COLORS.text);
  doc.text(pdfText(str), x, y, {
    width: opts.width,
    lineGap: 3
  });
}

function ensureSpace(doc: PdfDoc, needed: number) {
  if (doc.y + needed > contentBottom(doc)) {
    doc.addPage();
    setCursor(doc, doc.page.margins.top);
  }
}

function drawTeaLogo(doc: PdfDoc, x: number, y: number, size: number) {
  const s = size / 80;
  doc.save();
  doc.roundedRect(x + 10 * s, y + 10 * s, 60 * s, 60 * s, 18 * s).fill('#4A90E2');
  doc.circle(x + 40 * s, y + 10 * s, 10 * s).fill('#7ED321');
  doc.circle(x + 70 * s, y + 40 * s, 10 * s).fill('#6AA8F0');
  doc.circle(x + 40 * s, y + 70 * s, 10 * s).fill('#F5A623');
  doc.circle(x + 10 * s, y + 40 * s, 10 * s).fill('#96E03F');
  doc.restore();
}

function drawHeader(doc: PdfDoc, reporte: ReportePdfInput) {
  const left = doc.page.margins.left;
  const width = pageContentWidth(doc);
  const headerH = 92;
  const y0 = doc.page.margins.top;
  const logoSize = 52;
  const textX = left + 16 + logoSize + 12;
  const textW = width - (textX - left) - 16;

  doc.save();
  doc.rect(left, y0, width, headerH).fill(COLORS.primaryDark);
  doc.rect(left, y0 + headerH - 6, width, 6).fill(COLORS.accent);
  doc.restore();

  drawTeaLogo(doc, left + 16, y0 + 18, logoSize);

  textAt(doc, 'TEA Link', textX, y0 + 20, { width: textW, size: 20, color: COLORS.white, bold: true });
  textAt(doc, 'Informe de seguimiento', textX, y0 + 44, {
    width: textW,
    size: 10,
    color: '#E0E7FF'
  });
  textAt(doc, reporte.titulo, textX, y0 + 60, {
    width: textW,
    size: 12,
    color: COLORS.white,
    bold: true
  });

  setCursor(doc, y0 + headerH + 18);
}

function drawMetaCard(doc: PdfDoc, reporte: ReportePdfInput) {
  const left = doc.page.margins.left;
  const width = pageContentWidth(doc);
  const pad = 14;
  const rowH = 18;
  const cardH = pad * 2 + 4 * rowH + 8;

  ensureSpace(doc, cardH + 50);
  const y0 = doc.y;

  doc.save();
  doc.roundedRect(left, y0, width, cardH, 8).fill(COLORS.cardBg);
  doc.roundedRect(left, y0, width, cardH, 8).lineWidth(1).strokeColor(COLORS.border).stroke();
  doc.restore();

  const meta: [string, string][] = [
    ['Perfil', reporte.perfilNombre],
    ['Periodo', `${fmtFecha(reporte.fecha_inicio)} — ${fmtFecha(reporte.fecha_fin)}`],
    ['Generado por', reporte.creador.nombre_completo],
    ['Fecha de emisión', formatFechaHoraChile(reporte.emitidoEn)]
  ];

  let y = y0 + pad;
  meta.forEach(([label, value]) => {
    textAt(doc, label, left + pad, y, { width: 88, size: 9, color: COLORS.textMuted, bold: true });
    textAt(doc, value, left + pad + 92, y, { width: width - pad * 2 - 92, size: 10 });
    y += rowH;
  });

  y = y0 + cardH + 18;
  textAt(doc, 'Observaciones incluidas', left, y, {
    width,
    size: 12,
    color: COLORS.primaryDark,
    bold: true
  });
  y += 18;
  const total = reporte.observaciones.length;
  textAt(
    doc,
    total === 0
      ? 'No hay registros en este periodo.'
      : `${total} registro${total === 1 ? '' : 's'} en el informe`,
    left,
    y,
    { width, size: 10, color: COLORS.textMuted }
  );

  setCursor(doc, y + 22);
}

function drawCategoryBadge(doc: PdfDoc, x: number, y: number, categoria: string) {
  const style = categoriaStyle(categoria);
  const label = pdfText(style.label);
  doc.font('Helvetica-Bold').fontSize(8);
  const textW = doc.widthOfString(label);
  const padX = 8;
  const badgeW = textW + padX * 2;
  const badgeH = 16;

  doc.save();
  doc.roundedRect(x, y, badgeW, badgeH, 4).fill(style.bg);
  textAt(doc, style.label, x + padX, y + 3, {
    width: textW + 4,
    size: 8,
    color: style.text,
    bold: true
  });
  doc.restore();
}

function measureBlock(doc: PdfDoc, text: string, width: number, font: string, size: number) {
  doc.font(font).fontSize(size);
  return doc.heightOfString(pdfText(text), { width });
}

function drawObservacionCard(doc: PdfDoc, obs: ObservacionExport, index: number) {
  const left = doc.page.margins.left;
  const width = pageContentWidth(doc);
  const pad = 14;
  const stripeW = 4;
  const style = categoriaStyle(obs.categoria);
  const contentX = left + pad + stripeW + 4;
  const contentW = width - pad * 2 - stripeW - 8;

  const titulo = obs.titulo;
  const meta = `${fmtFecha(obs.fecha_evento)}  ·  ${obs.autor.nombre_completo}`;
  const desc = obs.descripcion;

  const tituloH = measureBlock(doc, titulo, contentW, 'Helvetica-Bold', 11);
  const metaH = measureBlock(doc, meta, contentW, 'Helvetica', 9);
  const descH = measureBlock(doc, desc, contentW, 'Helvetica', 10);
  const cardH = Math.max(pad + 22 + tituloH + metaH + 8 + descH + pad, 72);

  ensureSpace(doc, cardH + 14);
  const y0 = doc.y;

  doc.save();
  doc.roundedRect(left, y0, width, cardH, 6).fill(COLORS.white);
  doc.roundedRect(left, y0, width, cardH, 6).lineWidth(1).strokeColor(COLORS.border).stroke();
  doc.rect(left, y0 + 4, stripeW, cardH - 8).fill(style.stripe);
  doc.restore();

  const headerY = y0 + pad;
  textAt(doc, `Registro ${index + 1}`, contentX, headerY, {
    width: 72,
    size: 8,
    color: COLORS.textMuted,
    bold: true
  });
  drawCategoryBadge(doc, contentX + 76, headerY - 2, obs.categoria);

  let y = headerY + 22;
  textBlockAt(doc, titulo, contentX, y, { width: contentW, size: 11, bold: true });
  y += tituloH + 4;
  textAt(doc, meta, contentX, y, { width: contentW, size: 9, color: COLORS.textMuted });
  y += metaH + 6;
  textBlockAt(doc, desc, contentX, y, { width: contentW, size: 10, color: COLORS.textSoft });

  setCursor(doc, y0 + cardH + 10);
}

function drawBloqueEmisor(doc: PdfDoc, reporte: ReportePdfInput) {
  const rol = reporte.creador.rol?.toUpperCase() ?? '';
  if (!ROLES_BLOQUE_EMISOR.has(rol)) return;

  const left = doc.page.margins.left;
  const width = pageContentWidth(doc);
  const pad = 16;
  const rolLabel = ROL_EMISOR[rol] ?? rol;
  const institucion = reporte.institucionNombre?.trim();
  const textW = width - pad * 2 - 58;

  let lineCount = 2;
  if (institucion) lineCount++;
  if (reporte.creador.email) lineCount++;
  const blockH = Math.max(pad * 2 + lineCount * 16 + 12, 96);

  ensureSpace(doc, blockH + 16);
  const y0 = doc.y + 4;

  doc.save();
  doc.roundedRect(left, y0, width, blockH, 8).fill('#F8FAFC');
  doc.roundedRect(left, y0, width, blockH, 8).lineWidth(1.5).strokeColor(COLORS.primary).stroke();
  doc.restore();

  const selloX = left + width - pad - 48;
  const selloY = y0 + 16;
  doc.save();
  doc.circle(selloX + 24, selloY + 24, 24).lineWidth(1.5).strokeColor(COLORS.primary).stroke();
  doc.circle(selloX + 24, selloY + 24, 22).lineWidth(0.5).strokeColor(COLORS.accent).stroke();
  drawTeaLogo(doc, selloX + 4, selloY + 4, 40);
  doc.restore();

  let y = y0 + pad;
  textAt(doc, 'Emisor', left + pad, y, {
    width: textW,
    size: 10,
    color: COLORS.primaryDark,
    bold: true
  });
  y += 18;

  const nombreConCargo = `${reporte.creador.nombre_completo} (${rolLabel})`;
  textAt(doc, nombreConCargo, left + pad, y, {
    width: textW,
    size: 12,
    font: 'Helvetica-Oblique',
    color: COLORS.text
  });
  y += 20;

  doc
    .moveTo(left + pad, y)
    .lineTo(left + pad + 160, y)
    .lineWidth(0.5)
    .strokeColor(COLORS.border)
    .stroke();
  y += 10;

  if (institucion) {
    textAt(doc, institucion, left + pad, y, { width: textW, size: 9, color: COLORS.textSoft });
    y += 14;
  }

  if (reporte.creador.email) {
    textAt(doc, reporte.creador.email, left + pad, y, {
      width: textW,
      size: 9,
      color: COLORS.textSoft
    });
  }

  setCursor(doc, y0 + blockH + 14);
}

function drawFooters(doc: PdfDoc, reporte: ReportePdfInput) {
  const range = doc.bufferedPageRange();
  const total = range.count;
  const left = doc.page.margins.left;
  const width = pageContentWidth(doc);
  const footerY = doc.page.height - doc.page.margins.bottom - 22;
  const leftLabel = `TEA Link · Informe N° ${reporte.id}`;

  for (let i = range.start; i < range.start + total; i++) {
    doc.switchToPage(i);
    setCursor(doc, footerY);

    doc.save();
    doc
      .moveTo(left, footerY - 10)
      .lineTo(left + width, footerY - 10)
      .lineWidth(0.5)
      .strokeColor(COLORS.border)
      .stroke();
    doc.restore();

    textAt(doc, leftLabel, left, footerY, {
      width: width * 0.68,
      size: 8,
      color: COLORS.textMuted
    });
    textAt(doc, `Página ${i - range.start + 1} de ${total}`, left + width * 0.68, footerY, {
      width: width * 0.32,
      size: 8,
      color: COLORS.textMuted
    });
  }

  doc.switchToPage(range.start + total - 1);
  setCursor(doc, doc.page.margins.top);
}

function escribirContenido(doc: PdfDoc, reporte: ReportePdfInput): void {
  setCursor(doc, doc.page.margins.top);
  drawHeader(doc, reporte);
  drawMetaCard(doc, reporte);

  if (reporte.observaciones.length === 0) {
    const left = doc.page.margins.left;
    const width = pageContentWidth(doc);
    ensureSpace(doc, 56);
    const y0 = doc.y;
    doc.save();
    doc.roundedRect(left, y0, width, 48, 6).fill(COLORS.primaryLight);
    doc.restore();
    textAt(
      doc,
      'Sin observaciones en el periodo seleccionado.',
      left + 16,
      y0 + 16,
      { width: width - 32, size: 11, color: COLORS.primaryDark }
    );
    setCursor(doc, y0 + 56);
    drawBloqueEmisor(doc, reporte);
    return;
  }

  reporte.observaciones.forEach((obs, i) => {
    drawObservacionCard(doc, obs, i);
  });

  drawBloqueEmisor(doc, reporte);
}

export function enviarReportePdf(res: Response, reporte: ReportePdfInput): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      autoFirstPage: true,
      bufferPages: true
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reporte-${reporte.id}.pdf"`
    );

    doc.pipe(res);
    doc.on('end', () => resolve());
    doc.on('error', reject);

    try {
      escribirContenido(doc, reporte);
      drawFooters(doc, reporte);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
