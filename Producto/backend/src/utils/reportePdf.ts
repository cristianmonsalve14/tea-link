import type { Response } from 'express';

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
  creador: { nombre_completo: string };
  perfilNombre: string;
  observaciones: ObservacionExport[];
};

function fmtFecha(d: Date) {
  return d.toISOString().slice(0, 10);
}

function pdfText(value: string): string {
  return value
    .normalize('NFC')
    .replace(/\u00a0/g, ' ')
    .replace(/[^\t\n\r\x20-\x7E\u00A1-\u00FF]/g, '?');
}

function escribirContenido(
  doc: InstanceType<typeof PDFDocument>,
  reporte: ReportePdfInput
): void {
  const ancho = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc.fontSize(22).fillColor('#1e3a8a').text(pdfText('TEA-LINK'), { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(16).fillColor('#111827').text(pdfText(reporte.titulo), { align: 'center' });
  doc.moveDown(1);

  doc.fontSize(11).fillColor('#374151');
  doc.text(pdfText(`Estudiante: ${reporte.perfilNombre}`));
  doc.text(
    pdfText(`Periodo: ${fmtFecha(reporte.fecha_inicio)} a ${fmtFecha(reporte.fecha_fin)}`)
  );
  doc.text(pdfText(`Generado por: ${reporte.creador.nombre_completo}`));
  doc.text(pdfText(`Fecha: ${new Date().toLocaleDateString('es-CL')}`));
  doc.moveDown(1);

  doc.fontSize(13).fillColor('#1e40af').text('Observaciones', { underline: true });
  doc.moveDown(0.5);

  if (reporte.observaciones.length === 0) {
    doc.fontSize(11).fillColor('#6b7280').text('Sin observaciones asociadas.');
    return;
  }

  reporte.observaciones.forEach((obs, i) => {
    if (doc.y > doc.page.height - 100) doc.addPage();

    doc
      .fontSize(12)
      .fillColor('#111827')
      .text(pdfText(`${i + 1}. [${obs.categoria}] ${obs.titulo}`), { width: ancho });

    doc
      .fontSize(10)
      .fillColor('#4b5563')
      .text(
        pdfText(
          `Fecha: ${fmtFecha(obs.fecha_evento)} - Autor: ${obs.autor.nombre_completo}`
        ),
        { width: ancho }
      );

    doc.fontSize(10).fillColor('#374151').text(pdfText(obs.descripcion), { width: ancho });
    doc.moveDown(0.8);
  });
}

/** Envía el PDF directo al response HTTP (evita corrupción del buffer). */
export function enviarReportePdf(res: Response, reporte: ReportePdfInput): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true });

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
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
