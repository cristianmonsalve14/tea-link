export type ReportesListWhere = {
  formato?: 'PDF' | 'EXCEL';
  AND?: Array<{
    fecha_inicio?: { gte?: Date };
    fecha_fin?: { lte?: Date };
  }>;
};

export function parseFormatoReporte(
  value: unknown
): 'PDF' | 'EXCEL' | undefined {
  if (value === 'PDF' || value === 'EXCEL') return value;
  return undefined;
}

export function buildReportesListWhere(query: {
  formato?: unknown;
  desde?: unknown;
  hasta?: unknown;
}): ReportesListWhere {
  const where: ReportesListWhere = {};
  const formato = parseFormatoReporte(query.formato);
  if (formato) where.formato = formato;

  const desde = typeof query.desde === 'string' ? query.desde : '';
  const hasta = typeof query.hasta === 'string' ? query.hasta : '';

  if (desde || hasta) {
    const rango: {
      fecha_inicio?: { gte?: Date };
      fecha_fin?: { lte?: Date };
    } = {};
    if (desde) rango.fecha_inicio = { gte: new Date(desde) };
    if (hasta) rango.fecha_fin = { lte: new Date(hasta) };
    where.AND = [rango];
  }

  return where;
}
