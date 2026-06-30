import { useCallback, useEffect, useMemo, useState } from "react";
import { FaDownload, FaEye, FaFileAlt, FaSyncAlt, FaTrash } from "react-icons/fa";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { Modal } from "./ui/Modal";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { PerfilSelector } from "./perfiles/PerfilSelector";
import { useRoleTheme } from "../context/RoleThemeContext";
import { cn } from "../theme/cn";
import { CATEGORIA_INFO } from "../config/observacionUi";
import type { CategoriaObs } from "../config/rolPanelConfig";
import {
  validarRangoFechas,
  validarTituloReporte
} from "../utils/formValidation";

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

type ReporteDetalleObs = {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  fecha_evento: string;
  perfil: { nombre: string };
  autor: { nombre_completo: string; rol: string };
};

type ReporteDetalle = {
  id: number;
  titulo: string;
  fecha_inicio: string;
  fecha_fin: string;
  formato: string;
  created_at: string;
  creador: { nombre_completo: string; email?: string | null };
  observaciones: Array<{ observacion: ReporteDetalleObs }>;
};

function categoriaLabel(cat: string) {
  const key = cat.toUpperCase() as CategoriaObs;
  return CATEGORIA_INFO[key]?.label ?? cat;
}

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
  const theme = useRoleTheme();
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
  const [fieldErrors, setFieldErrors] = useState<{
    perfil?: string;
    titulo?: string;
    fechas?: string;
    observaciones?: string;
  }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [misReportes, setMisReportes] = useState<ReporteItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [descargandoId, setDescargandoId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [verDetalle, setVerDetalle] = useState<ReporteDetalle | null>(null);
  const [cargandoDetalleId, setCargandoDetalleId] = useState<number | null>(null);
  const [detalleError, setDetalleError] = useState<string | null>(null);

  const token = () => localStorage.getItem("token");

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
    fetchObservaciones();
  }, [fetchObservaciones]);

  useEffect(() => {
    fetchMisReportes();
  }, [fetchMisReportes]);

  const observacionesOrdenadas = useMemo(
    () =>
      [...observaciones].sort(
        (a, b) => new Date(b.fecha_evento).getTime() - new Date(a.fecha_evento).getTime()
      ),
    [observaciones]
  );

  const fueraDePeriodo = (obs: Observacion) => {
    const f = new Date(obs.fecha_evento);
    if (fechaDesde && f < new Date(fechaDesde)) return true;
    if (fechaHasta && f > new Date(fechaHasta + "T23:59:59")) return true;
    return false;
  };

  const toggleObs = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === observacionesOrdenadas.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(observacionesOrdenadas.map(o => o.id)));
    }
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setError(null);
    setSuccess(null);

    const errores = {
      perfil: !perfilId ? "Seleccione un perfil" : undefined,
      titulo: validarTituloReporte(tituloReporte) ?? undefined,
      fechas: validarRangoFechas(fechaDesde, fechaHasta) ?? undefined,
      observaciones: selectedIds.size === 0 ? "Seleccione al menos una observación" : undefined
    };
    setFieldErrors(errores);
    const primerError =
      errores.perfil ?? errores.titulo ?? errores.fechas ?? errores.observaciones ?? null;
    if (primerError) {
      setError(primerError);
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

  const handleVer = async (id: number) => {
    setDetalleError(null);
    setCargandoDetalleId(id);
    try {
      const res = await fetch(`http://localhost:3000/api/reportes/${id}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDetalleError(parseApiError(data, "Error al cargar el informe"));
        return;
      }
      const reporte = data.reporte as ReporteDetalle;
      reporte.observaciones.sort(
        (a, b) =>
          new Date(b.observacion.fecha_evento).getTime() -
          new Date(a.observacion.fecha_evento).getTime()
      );
      setVerDetalle(reporte);
    } catch {
      setDetalleError("Error de red al cargar el informe");
    } finally {
      setCargandoDetalleId(null);
    }
  };

  const handleDescargar = async (id: number, formatoReporte: string) => {
    setDownloadError(null);
    setDescargandoId(id);
    try {
      const authToken = token();
      if (!authToken) {
        setDownloadError("Sesión expirada. Vuelva a iniciar sesión.");
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
                ? "El backend devuelve texto en lugar de PDF. Reinicie el backend con npm run dev."
                : `Respuesta inválida (${preview.slice(0, 60)}...).`
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
      setDownloadError("No se pudo conectar con el servidor.");
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
      <Card
        title={
          <>
            <FaFileAlt /> Generar reporte
          </>
        }
      >
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Alert variant="info" className="mb-4">
          <strong>Crear informe</strong> guarda un resumen con las observaciones que elija, el
          periodo y el formato (PDF o Excel). Luego puede <strong>ver</strong> el contenido en
          pantalla o <strong>descargarlo</strong> desde &quot;Mis reportes&quot;.
        </Alert>

        <form onSubmit={handleCrear} className="space-y-4">
          <PerfilSelector
            label="Estudiante / perfil"
            value={perfilId}
            onChange={id => setPerfilId(id)}
            searchPlaceholder="Buscar por nombre o diagnóstico..."
            required
          />
          {submitAttempted && fieldErrors.perfil && (
            <p className="text-sm text-status-error -mt-2">{fieldErrors.perfil}</p>
          )}
          <Field
            label="Título del reporte"
            required
            error={submitAttempted ? fieldErrors.titulo : undefined}
          >
            <Input
              value={tituloReporte}
              onChange={e => setTituloReporte(e.target.value)}
              placeholder="Ej. Informe trimestral"
              required
              maxLength={200}
              error={submitAttempted && Boolean(fieldErrors.titulo)}
            />
          </Field>

          <div className="grid sm:grid-cols-3 gap-4">
            <Field
              label="Período desde"
              required
              error={submitAttempted ? fieldErrors.fechas : undefined}
            >
              <Input
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                required
                error={submitAttempted && Boolean(fieldErrors.fechas)}
              />
            </Field>
            <Field label="Período hasta" required>
              <Input
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                required
                error={submitAttempted && Boolean(fieldErrors.fechas)}
              />
            </Field>
            <Field label="Formato">
              <Select
                value={formato}
                onChange={e => setFormato(e.target.value as "PDF" | "EXCEL")}
              >
                <option value="PDF">PDF</option>
                <option value="EXCEL">Excel (CSV)</option>
              </Select>
            </Field>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className={cn("text-sm font-semibold", theme.accentText)}>
                Observaciones a incluir *
              </span>
              {observacionesOrdenadas.length > 0 && (
                <button
                  type="button"
                  className={cn("text-sm font-medium", theme.link)}
                  onClick={toggleAll}
                >
                  {selectedIds.size === observacionesOrdenadas.length
                    ? "Desmarcar todas"
                    : "Marcar todas"}
                </button>
              )}
            </div>
            {submitAttempted && fieldErrors.observaciones && (
              <p className="text-sm text-status-error mb-2">{fieldErrors.observaciones}</p>
            )}
            {loadingObs ? (
              <p className="text-neutral-gray-medium text-sm">Cargando observaciones...</p>
            ) : observacionesOrdenadas.length === 0 ? (
              <p className="text-neutral-gray-medium text-sm py-4 text-center border rounded-lg bg-neutral-gray-light">
                No hay observaciones para este perfil. Registre observaciones en la pestaña
                anterior o elija otro estudiante.
              </p>
            ) : (
              <ul className="max-h-56 overflow-y-auto border border-neutral-gray-medium/30 rounded-lg divide-y">
                {observacionesOrdenadas.map(obs => {
                  const fuera = fueraDePeriodo(obs);
                  return (
                  <li
                    key={obs.id}
                    className={cn(
                      "flex items-start gap-3 px-3 py-2 hover:bg-neutral-gray-light",
                      fuera && "opacity-70"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 min-w-4 min-h-4"
                      checked={selectedIds.has(obs.id)}
                      onChange={() => toggleObs(obs.id)}
                    />
                    <div className="text-sm">
                      <span className="font-medium">{obs.titulo}</span>
                      <span className="text-neutral-gray-medium ml-2">
                        {obs.categoria} · {formatFecha(obs.fecha_evento)}
                      </span>
                      {fuera && fechaDesde && fechaHasta && (
                        <span className="block text-xs text-amber-700 mt-0.5">
                          Fuera del período indicado arriba
                        </span>
                      )}
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Button type="submit" disabled={creating || !perfilId || selectedIds.size === 0}>
            {creating ? "Generando..." : "Crear reporte"}
          </Button>
        </form>
      </Card>

      <Card
        title="Mis reportes"
        action={
          <button
            type="button"
            onClick={() => fetchMisReportes()}
            className={cn("flex items-center gap-1 text-sm font-medium", theme.link)}
          >
            <FaSyncAlt /> Actualizar
          </button>
        }
      >
        {downloadError && <Alert variant="error">{downloadError}</Alert>}
        {detalleError && <Alert variant="error">{detalleError}</Alert>}

        {loadingList ? (
          <p className="text-neutral-gray-medium">Cargando...</p>
        ) : misReportes.length === 0 ? (
          <p className="text-neutral-gray-medium text-center py-6">Aún no ha creado reportes.</p>
        ) : (
          <ul className="space-y-3">
            {misReportes.map(r => (
              <li
                key={r.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-2 border rounded-xl p-4",
                  theme.accentBorder,
                  theme.accentBgMuted
                )}
              >
                <div>
                  <p className="font-semibold">{r.titulo}</p>
                  <p className="text-sm text-neutral-gray-medium">
                    {formatFecha(r.fecha_inicio)} – {formatFecha(r.fecha_fin)} · {r.formato} ·{" "}
                    {r._count.observaciones} observación(es)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={cargandoDetalleId === r.id}
                    onClick={() => handleVer(r.id)}
                  >
                    <FaEye />
                    {cargandoDetalleId === r.id ? "..." : "Ver"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={descargandoId === r.id}
                    onClick={() => handleDescargar(r.id, r.formato)}
                  >
                    <FaDownload />
                    {descargandoId === r.id ? "..." : "Descargar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={eliminandoId === r.id}
                    onClick={() => handleEliminar(r.id, r.titulo)}
                  >
                    <FaTrash /> Eliminar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={!!verDetalle}
        onClose={() => setVerDetalle(null)}
        title={verDetalle?.titulo ?? "Informe"}
        size="lg"
        footer={
          verDetalle && (
            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="secondary" onClick={() => setVerDetalle(null)}>
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  handleDescargar(verDetalle.id, verDetalle.formato);
                }}
                disabled={descargandoId === verDetalle.id}
              >
                <FaDownload /> Descargar {verDetalle.formato}
              </Button>
            </div>
          )
        }
      >
        {verDetalle && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <p>
                <span className="text-neutral-gray-medium">Periodo: </span>
                {formatFecha(verDetalle.fecha_inicio)} – {formatFecha(verDetalle.fecha_fin)}
              </p>
              <p>
                <span className="text-neutral-gray-medium">Formato: </span>
                {verDetalle.formato}
              </p>
              <p>
                <span className="text-neutral-gray-medium">Creado: </span>
                {formatFecha(verDetalle.created_at)}
              </p>
              <p>
                <span className="text-neutral-gray-medium">Por: </span>
                {verDetalle.creador.nombre_completo}
              </p>
              {verDetalle.observaciones[0]?.observacion.perfil && (
                <p className="sm:col-span-2">
                  <span className="text-neutral-gray-medium">Perfil: </span>
                  {verDetalle.observaciones[0].observacion.perfil.nombre}
                </p>
              )}
            </div>

            <div>
              <p className={cn("text-sm font-semibold mb-2", theme.accentText)}>
                Observaciones incluidas ({verDetalle.observaciones.length})
              </p>
              <ul className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {verDetalle.observaciones.map(({ observacion: obs }, i) => (
                  <li
                    key={obs.id}
                    className={cn(
                      "border rounded-xl p-4 text-sm",
                      theme.accentBorder,
                      theme.accentBgMuted
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs text-neutral-gray-medium">#{i + 1}</span>
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          theme.accentBgSubtle,
                          theme.accentText
                        )}
                      >
                        {categoriaLabel(obs.categoria)}
                      </span>
                    </div>
                    <h4 className="font-semibold text-neutral-gray">{obs.titulo}</h4>
                    <p className="text-neutral-gray-medium mt-2 whitespace-pre-wrap">
                      {obs.descripcion}
                    </p>
                    <p className="text-xs text-neutral-gray-medium mt-2 pt-2 border-t border-neutral-gray-medium/20">
                      {formatFecha(obs.fecha_evento)} · {obs.autor.nombre_completo}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
