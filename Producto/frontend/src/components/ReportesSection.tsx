import { useCallback, useEffect, useState } from "react";
import { FaEye, FaFileAlt, FaFilter, FaSyncAlt } from "react-icons/fa";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { cn } from "../theme/cn";
import { getSectionTheme } from "../theme/roleTheme";
import { useRoleTheme } from "../context/RoleThemeContext";

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
  const theme = useRoleTheme();
  const section = getSectionTheme("reports");
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
    <Card
      className={cn("border", section.accentBorder)}
      title={
        <span className={cn("flex items-center gap-2", section.accentText)}>
          <FaFileAlt /> Reportes del sistema
        </span>
      }
      description="Reportes generados por usuarios (PDF/Excel) y sus observaciones asociadas."
      action={
        <Button variant="outline" onClick={fetchReportes}>
          <FaSyncAlt /> Actualizar
        </Button>
      }
    >
      <div className="flex flex-wrap gap-3 mb-4 p-4 bg-neutral-gray-light rounded-xl border border-gray-100 items-end">
        <span className={cn("mb-2.5", section.accentText)}>
          <FaFilter />
        </span>
        <Select
          className="max-w-[180px]"
          value={filtroFormato}
          onChange={e => setFiltroFormato(e.target.value)}
        >
          <option value="">Todos los formatos</option>
          <option value="PDF">PDF</option>
          <option value="EXCEL">Excel</option>
        </Select>
        <Input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} />
        <Input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} />
        <Button
          className={cn(section.btnPrimary, section.btnPrimaryHover)}
          onClick={fetchReportes}
        >
          Filtrar
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className={section.tableHead}>
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
                <tr key={r.id} className={cn("border-b last:border-none", section.tableRowHover)}>
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
                      className={cn(theme.link, "mr-2 text-sm font-medium")}
                      onClick={() => verDetalle(r.id)}
                    >
                      <FaEye /> Ver
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

      <Modal
        open={detalleLoading || !!detalle}
        onClose={() => setDetalle(null)}
        title={detalle?.titulo ?? "Detalle del reporte"}
        size="lg"
      >
        {detalleLoading ? (
          <p className="text-neutral-gray-medium">Cargando detalle...</p>
        ) : detalle ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-neutral-gray mb-4">
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
                        className={theme.link}
                      >
                        Descargar archivo
                      </a>
                    </p>
                  )}
                </div>
            <h4 className={cn("font-semibold mb-2", theme.accentTextStrong)}>
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
      </Modal>
    </Card>
  );
}
