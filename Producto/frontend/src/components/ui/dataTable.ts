/** Clases compartidas para tablas de datos en paneles admin y listados. */
export const dataTable = {
  table: "min-w-full text-sm leading-relaxed",
  th: "px-3 py-2.5 text-left text-sm font-semibold",
  td: "px-3 py-2.5 text-sm",
  tdMedium: "px-3 py-2.5 text-sm font-medium",
  tdMuted: "px-3 py-2.5 text-sm text-neutral-gray-medium"
} as const;

/** Anchos mínimos útiles para columnas de filtros con Select. */
export const filterFieldMinWidth = {
  sort: "min-w-[12.5rem]",
  nivel: "min-w-[11.5rem]",
  direction: "min-w-[9.5rem]",
  tipo: "min-w-[10rem]"
} as const;
