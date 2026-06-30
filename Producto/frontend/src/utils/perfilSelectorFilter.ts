export type PerfilBusqueda = {
  id: number;
  nombre: string;
  edad?: number | null;
  diagnostico_clinico?: string | null;
  diagnostico_secundario?: string | null;
  notas?: string | null;
};

import { etiquetaDiagnosticoClinico } from "./diagnosticoPerfil";

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/** Coincide si todas las palabras del término aparecen en nombre, diagnóstico o notas. */
export function filtrarPerfilesPorBusqueda(
  perfiles: PerfilBusqueda[],
  termino: string
): PerfilBusqueda[] {
  const q = termino.trim();
  if (!q) return perfiles;

  const palabras = normalizar(q).split(/\s+/).filter(Boolean);

  return perfiles.filter(p => {
    const texto = normalizar(
      [
        p.nombre,
        p.diagnostico_clinico ? etiquetaDiagnosticoClinico(p.diagnostico_clinico) : null,
        p.diagnostico_secundario ? etiquetaDiagnosticoClinico(p.diagnostico_secundario) : null,
        p.notas,
        p.edad != null ? String(p.edad) : null
      ]
        .filter(Boolean)
        .join(" ")
    );
    return palabras.every(palabra => texto.includes(palabra));
  });
}
