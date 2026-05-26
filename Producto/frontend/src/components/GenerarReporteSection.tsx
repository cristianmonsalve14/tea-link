import { useCallback, useEffect, useState } from "react";
import { FaDownload, FaFileAlt, FaSyncAlt, FaTrash } from "react-icons/fa";

type Perfil = { id: number; nombre: string };

type Observacion = {
  id: number;
  titulo: string;
  categoria: string;
  fecha_evento: string;
};

type ReporteItem = {
  id: number;
  titulo: string;
  fecha_inicio: string;
  fecha_fin: string;
  formato: "PDF" | "EXCEL";
  created_at: string;
  _count: { observaciones: number };
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
  return fallback;
}

function formatFecha(v: string) {
  try {
    return new Date(v).toLocaleDateString("es-CL");
  } catch {
    return v;
  }
}

export function GenerarReporteSection() {
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [perfilId, setPerfilId] = useState("");
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [tituloReporte, setTituloReporte] = useState("");
  const [formato, setFormato] = useState<"PDF" | "EXCEL">("PDF");
  const [loadingObs, setLoadingObs] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [misReportes, setMisReportes] = useState<ReporteItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [descargandoId, setDescargandoId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const token = () => localStorage.getItem("token");

  const fetchPerfiles = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3000/api/perfiles", {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = data.perfiles ?? [];
      setPerfiles(list);
      if (list.length > 0) setPerfilId(prev => prev || String(list[0].id));
    } catch {
      /* ignore */
    }
  }, []);

  const fetchObservaciones = useCallback(async () => {
    if (!perfilId) {
      setObservaciones([]);
      setSelectedIds(new Set());
      return;
    }
    setLoadingObs(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:3000/api/observaciones?perfil_id=${perfilId}`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(parseApiError(data, "Error al cargar observaciones"));
        setObservaciones([]);
        return;
      }
      const data = await res.json();
      setObservaciones(data.observaciones ?? []);
      setSelectedIds(new Set());
    } catch {
      setError("Error de red al cargar observaciones");
    } finally {
      setLoadingObs(false);
    }
  }, [perfilId]);

  const fetchMisReportes = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("http://localhost:3000/api/reportes/mis", {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(parseApiError(data, "Error al cargar reportes"));
        setMisReportes([]);
        return;
      }
      const data = await res.json();
      setMisReportes(Array.isArray(data.reportes) ? data.reportes : []);
    } catch {
      setError("Error de red al cargar reportes");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchPerfiles();
  }, [fetchPerfiles]);

  useEffect(() => {
    fetchObservaciones();
  }, [fetchObservaciones]);

  useEffect(() => {
    fetchMisReportes();
  }, [fetchMisReportes]);

  const observacionesFiltradas = observaciones.filter(obs => {
    const f = new Date(obs.fecha_evento);
    if (fechaDesde && f < new Date(fechaDesde)) return false;
    if (fechaHasta && f > new Date(fechaHasta + "T23:59:59")) return false;
    return true;
  });

  const toggleObs = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === observacionesFiltradas.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(observacionesFiltradas.map(o => o.id)));
    }
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!perfilId) {
      setError("Seleccione un perfil");
      return;
    }
    if (!tituloReporte.trim()) {
      setError("Ingrese un título para el reporte");
      return;
    }
    if (!fechaDesde || !fechaHasta) {
      setError("Indique el período del reporte (desde / hasta)");
      return;
    }
    if (selectedIds.size === 0) {
      setError("Seleccione al menos una observación");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("http://localhost:3000/api/reportes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          titulo: tituloReporte.trim(),
          fecha_inicio: fechaDesde,
          fecha_fin: fechaHasta,
          formato,
          perfil_id: Number(perfilId),
          observacion_ids: Array.from(selectedIds)
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiError(data, "Error al crear reporte"));
        return;
      }
      setSuccess("Reporte creado correctamente");
      setTituloReporte("");
      setSelectedIds(new Set());
      await fetchMisReportes();
    } catch {
      setError("Error de red al crear reporte");
    } finally {
      setCreating(false);
    }
  };

  const handleDescargar = async (id: number, formatoReporte: string) => {
    setDownloadError(null);
    setDescargandoId(id);
    try {
      const authToken = token();
      if (!authToken) {
        setDownloadError("Sesion expirada. Vuelva a iniciar sesion.");
        return;
      }

      const res = await fetch(`http://localhost:3000/api/reportes/${id}/export`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      const data = await res.arrayBuffer();

      if (!res.ok) {
        try {
          const json = JSON.parse(new TextDecoder().decode(data));
          setDownloadError(parseApiError(json, "Error al descargar"));
        } catch {
          setDownloadError(`Error al descargar (${res.status})`);
        }
        return;
      }

      const esPdf = formatoReporte.toUpperCase() === "PDF";
      if (esPdf) {
        const header = new TextDecoder().decode(new Uint8Array(data.slice(0, 8)));
        if (!header.startsWith("%PDF")) {
          const preview = new TextDecoder().decode(data.slice(0, 120)).trim();
          const pareceJson = preview.startsWith("{");
          setDownloadError(
            pareceJson
              ? `Error del servidor: ${preview}`
              : preview.startsWith("TEA-LINK")
                ? "El backend en el puerto 3000 es una version antigua (devuelve texto). Cierre ese proceso, ejecute npm run dev en Producto/backend y vuelva a intentar."
                : `Respuesta invalida (${preview.slice(0, 60)}...). Verifique que Producto/backend este corriendo con npm run dev.`
          );
          return;
        }
      }

      const mime = esPdf ? "application/pdf" : "text/csv;charset=utf-8";
      const blob = new Blob([data], { type: mime });
      const cd = res.headers.get("Content-Disposition");
      const match = cd?.match(/filename="?([^";\n]+)"?/i);
      const ext = esPdf ? "pdf" : "csv";
      const filename = match?.[1] ?? `reporte-${id}.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      setDownloadError(
        "No se pudo conectar al servidor. Verifique que el backend este en ejecucion (npm run dev)."
      );
    } finally {
      setDescargandoId(null);
    }
  };

  const handleEliminar = async (id: number, titulo: string) => {
    if (!window.confirm(`¿Eliminar reporte "${titulo}"?`)) return;
    setEliminandoId(id);
    try {
      const res = await fetch(`http://localhost:3000/api/reportes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(parseApiError(data, "Error al eliminar"));
        return;
      }
      await fetchMisReportes();
    } catch {
      setError("Error de red al eliminar");
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
        <h2 className="text-xl font-semibold text-blue-700 flex items-center gap-2 mb-4">
          <FaFileAlt /> Generar reporte
        </h2>

        {error && (
          <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            {success}
          </div>
        )}

        <form onSubmit={handleCrear} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-blue-700 mb-1">
                Estudiante / perfil
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={perfilId}
                onChange={e => setPerfilId(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {perfiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-700 mb-1">
                Título del reporte *
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={tituloReporte}
                onChange={e => setTituloReporte(e.target.value)}
                placeholder="Ej. Informe trimestral"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Período desde *</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Período hasta *</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Formato</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={formato}
                onChange={e => setFormato(e.target.value as "PDF" | "EXCEL")}
              >
                <option value="PDF">PDF</option>
                <option value="EXCEL">Excel (CSV)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-blue-700">
                Observaciones a incluir *
              </label>
              {observacionesFiltradas.length > 0 && (
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:underline"
                  onClick={toggleAll}
                >
                  {selectedIds.size === observacionesFiltradas.length
                    ? "Desmarcar todas"
                    : "Marcar todas"}
                </button>
              )}
            </div>
            {loadingObs ? (
              <p className="text-gray-500 text-sm">Cargando observaciones...</p>
            ) : observacionesFiltradas.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center border rounded-lg bg-gray-50">
                No hay observaciones para este perfil en el rango seleccionado.
              </p>
            ) : (
              <ul className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                {observacionesFiltradas.map(obs => (
                  <li key={obs.id} className="flex items-start gap-3 px-3 py-2 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedIds.has(obs.id)}
                      onChange={() => toggleObs(obs.id)}
                    />
                    <div className="text-sm">
                      <span className="font-medium">{obs.titulo}</span>
                      <span className="text-gray-500 ml-2">
                        {obs.categoria} · {formatFecha(obs.fecha_evento)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="submit"
            disabled={creating || !perfilId || selectedIds.size === 0}
            className="px-5 py-2 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50"
          >
            {creating ? "Generando..." : "Crear reporte"}
          </button>
        </form>
      </section>

      <section className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-700">Mis reportes</h2>
          <button
            type="button"
            onClick={() => fetchMisReportes()}
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <FaSyncAlt /> Actualizar
          </button>
        </div>

        {downloadError && (
          <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {downloadError}
          </div>
        )}

        {loadingList ? (
          <p className="text-gray-500">Cargando...</p>
        ) : misReportes.length === 0 ? (
          <p className="text-gray-500 text-center py-6">Aún no ha creado reportes.</p>
        ) : (
          <ul className="space-y-3">
            {misReportes.map(r => (
              <li
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border rounded-xl p-4 bg-gray-50"
              >
                <div>
                  <p className="font-semibold text-gray-900">{r.titulo}</p>
                  <p className="text-sm text-gray-600">
                    {formatFecha(r.fecha_inicio)} – {formatFecha(r.fecha_fin)} · {r.formato} ·{" "}
                    {r._count.observaciones} observación(es)
                  </p>
                  <p className="text-xs text-gray-400">
                    Creado: {formatFecha(r.created_at)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={descargandoId === r.id}
                    onClick={() => handleDescargar(r.id, r.formato)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-100 text-green-800 text-sm font-medium hover:bg-green-200 disabled:opacity-50"
                  >
                    <FaDownload />{" "}
                    {descargandoId === r.id ? "Descargando..." : "Descargar"}
                  </button>
                  <button
                    type="button"
                    disabled={eliminandoId === r.id}
                    onClick={() => handleEliminar(r.id, r.titulo)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm hover:bg-red-200 disabled:opacity-50"
                  >
                    <FaTrash /> Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
