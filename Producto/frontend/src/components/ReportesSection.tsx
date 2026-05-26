import { useCallback, useEffect, useState } from "react";
import { FaEye, FaFileAlt, FaFilter, FaSyncAlt } from "react-icons/fa";

type FormatoReporte = "PDF" | "EXCEL";

type ReporteListItem = {
  id: number;
  titulo: string;
  fecha_inicio: string;
  fecha_fin: string;
  formato: FormatoReporte;
  url_archivo: string | null;
  created_at: string;
  creador: {
    id: number;
    nombre_completo: string;
    email: string;
    institucion?: { nombre: string } | null;
  };
  _count: { observaciones: number };
};

type ObservacionEnReporte = {
  observacion: {
    id: number;
    titulo: string;
    categoria: string;
    fecha_evento: string;
    perfil: { nombre: string };
  };
};

type ReporteDetalle = ReporteListItem & {
  observaciones: ObservacionEnReporte[];
};

function parseApiError(errorData: Record<string, unknown>, fallback: string): string {
  if (Array.isArray(errorData?.error)) {
    return (
      errorData.error
        .map((i: { message?: string }) => i.message)
        .filter(Boolean)
        .join(". ") || fallback
    );
  }
  if (typeof errorData?.error === "string") return errorData.error;
  if (typeof errorData?.message === "string") return errorData.message;
  return fallback;
}

function formatFecha(value: string) {
  try {
    return new Date(value).toLocaleDateString("es-CL");
  } catch {
    return value;
  }
}

export function ReportesSection() {
  const [reportes, setReportes] = useState<ReporteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroFormato, setFiltroFormato] = useState<string>("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");
  const [detalle, setDetalle] = useState<ReporteDetalle | null>(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  const token = () => localStorage.getItem("token");

  const fetchReportes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtroFormato) params.append("formato", filtroFormato);
      if (filtroDesde) params.append("desde", filtroDesde);
      if (filtroHasta) params.append("hasta", filtroHasta);

      const res = await fetch(
        `http://localhost:3000/api/reportes?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(parseApiError(data, "Error al cargar reportes"));
        setReportes([]);
        return;
      }
      const data = await res.json();
      setReportes(Array.isArray(data.reportes) ? data.reportes : []);
    } catch {
      setError("Error de red al cargar reportes");
      setReportes([]);
    } finally {
      setLoading(false);
    }
  }, [filtroFormato, filtroDesde, filtroHasta]);

  useEffect(() => {
    fetchReportes();
  }, [fetchReportes]);

  const verDetalle = async (id: number) => {
    setDetalleLoading(true);
    setDetalle(null);
    try {
      const res = await fetch(`http://localhost:3000/api/reportes/${id}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(parseApiError(data, "Error al cargar detalle"));
        return;
      }
      const data = await res.json();
      setDetalle(data.reporte);
    } catch {
      setError("Error de red al cargar detalle");
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleEliminar = async (reporte: ReporteListItem) => {
    if (!window.confirm(`¿Eliminar el reporte "${reporte.titulo}"?`)) return;
    setEliminandoId(reporte.id);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3000/api/reportes/${reporte.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(parseApiError(data, "Error al eliminar reporte"));
        return;
      }
      if (detalle?.id === reporte.id) setDetalle(null);
      await fetchReportes();
    } catch {
      setError("Error de red al eliminar");
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
          <FaFileAlt /> Reportes del sistema
        </h2>
        <button
          type="button"
          onClick={fetchReportes}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200"
        >
          <FaSyncAlt /> Actualizar
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Reportes generados por usuarios (PDF/Excel) y sus observaciones asociadas.
      </p>

      <div className="flex flex-wrap gap-3 mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <FaFilter className="text-gray-400 mt-2" />
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={filtroFormato}
          onChange={e => setFiltroFormato(e.target.value)}
        >
          <option value="">Todos los formatos</option>
          <option value="PDF">PDF</option>
          <option value="EXCEL">Excel</option>
        </select>
        <input
          type="date"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={filtroDesde}
          onChange={e => setFiltroDesde(e.target.value)}
          title="Desde"
        />
        <input
          type="date"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={filtroHasta}
          onChange={e => setFiltroHasta(e.target.value)}
          title="Hasta"
        />
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
          onClick={fetchReportes}
        >
          Filtrar
        </button>
      </div>

      {error && (
        <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-purple-50 text-purple-800">
              <th className="px-3 py-2 text-left font-semibold">ID</th>
              <th className="px-3 py-2 text-left font-semibold">Título</th>
              <th className="px-3 py-2 text-left font-semibold">Formato</th>
              <th className="px-3 py-2 text-left font-semibold">Período</th>
              <th className="px-3 py-2 text-left font-semibold">Creador</th>
              <th className="px-3 py-2 text-left font-semibold">Obs.</th>
              <th className="px-3 py-2 text-left font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-400">
                  Cargando reportes...
                </td>
              </tr>
            ) : reportes.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-400">
                  No hay reportes registrados.
                </td>
              </tr>
            ) : (
              reportes.map(r => (
                <tr key={r.id} className="border-b last:border-none hover:bg-purple-50/50">
                  <td className="px-3 py-2">{r.id}</td>
                  <td className="px-3 py-2 font-medium">{r.titulo}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        r.formato === "PDF"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {r.formato}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatFecha(r.fecha_inicio)} – {formatFecha(r.fecha_fin)}
                  </td>
                  <td className="px-3 py-2">
                    <div>{r.creador.nombre_completo}</div>
                    <div className="text-xs text-gray-500">
                      {r.creador.institucion?.nombre ?? "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">{r._count.observaciones}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      type="button"
                      className="text-blue-600 hover:underline mr-2"
                      onClick={() => verDetalle(r.id)}
                    >
                      <FaEye className="inline mr-0.5" /> Ver
                    </button>
                    {r.url_archivo && (
                      <a
                        href={r.url_archivo}
                        target="_blank"
                        rel="noreferrer"
                        className="text-green-600 hover:underline mr-2"
                      >
                        Archivo
                      </a>
                    )}
                    <button
                      type="button"
                      className="text-red-600 hover:underline disabled:opacity-50"
                      onClick={() => handleEliminar(r)}
                      disabled={eliminandoId === r.id}
                    >
                      {eliminandoId === r.id ? "..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(detalleLoading || detalle) && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button
              type="button"
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl font-bold"
              onClick={() => setDetalle(null)}
            >
              ×
            </button>
            {detalleLoading ? (
              <p className="text-gray-500">Cargando detalle...</p>
            ) : detalle ? (
              <>
                <h3 className="text-xl font-bold text-purple-800 mb-2">{detalle.titulo}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700 mb-4">
                  <p>
                    <span className="font-semibold">Formato:</span> {detalle.formato}
                  </p>
                  <p>
                    <span className="font-semibold">Período:</span>{" "}
                    {formatFecha(detalle.fecha_inicio)} – {formatFecha(detalle.fecha_fin)}
                  </p>
                  <p>
                    <span className="font-semibold">Creador:</span> {detalle.creador.nombre_completo}
                  </p>
                  <p>
                    <span className="font-semibold">Institución:</span>{" "}
                    {detalle.creador.institucion?.nombre ?? "—"}
                  </p>
                  <p>
                    <span className="font-semibold">Creado:</span>{" "}
                    {formatFecha(detalle.created_at)}
                  </p>
                  {detalle.url_archivo && (
                    <p className="sm:col-span-2">
                      <a
                        href={detalle.url_archivo}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Descargar archivo
                      </a>
                    </p>
                  )}
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  Observaciones incluidas ({detalle.observaciones.length})
                </h4>
                {detalle.observaciones.length === 0 ? (
                  <p className="text-gray-400 text-sm">Sin observaciones asociadas.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {detalle.observaciones.map(o => (
                      <li
                        key={o.observacion.id}
                        className="border border-gray-100 rounded-lg p-3 bg-gray-50"
                      >
                        <div className="font-medium">{o.observacion.titulo}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Perfil: {o.observacion.perfil.nombre} · {o.observacion.categoria} ·{" "}
                          {formatFecha(o.observacion.fecha_evento)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
