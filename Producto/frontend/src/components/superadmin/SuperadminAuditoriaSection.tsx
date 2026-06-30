import { useEffect, useMemo, useState } from "react";
import { FaEye, FaSyncAlt } from "react-icons/fa";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Modal } from "../ui/Modal";
import { Select } from "../ui/Select";
import { ScrollableTable } from "../ui/ScrollableTable";
import { dataTable } from "../ui/dataTable";
import { cn } from "../../theme/cn";
import { SuperadminPageHeader } from "./SuperadminPageHeader";
import { SuperadminFilterBar, type FilterChip } from "./SuperadminFilterBar";
import { SuperadminBadge } from "./SuperadminBadge";
import { buildAuditoriaEntidadLabel } from "../../utils/auditoriaEntidadLabel";

type AuditoriaApiRow = {
  id: number;
  admin_id: number;
  accion: string;
  entidad: string | null;
  entidad_id: number | null;
  entidad_label?: string | null;
  detalles: string | null;
  ip_address: string | null;
  created_at: string;
  admin: { email: string; nombre_completo: string; rol: string };
};

type AuditoriaRegistro = {
  id: number;
  actorLabel: string;
  actorEmail: string;
  actorRol: string;
  accion: string;
  entidad: string | null;
  entidadId: number | null;
  entidadLabel: string;
  detalles: string | null;
  timestamp: string;
  ip: string;
};

function textoDetalleVisible(detalles: string | null): string {
  return detalles?.trim() || "—";
}

function mapAuditoriaRow(row: AuditoriaApiRow): AuditoriaRegistro {
  return {
    id: row.id,
    actorLabel: row.admin.nombre_completo,
    actorEmail: row.admin.email,
    actorRol: row.admin.rol,
    accion: row.accion,
    entidad: row.entidad,
    entidadId: row.entidad_id,
    entidadLabel: buildAuditoriaEntidadLabel(
      row.entidad,
      row.entidad_id,
      row.detalles,
      row.entidad_label
    ),
    detalles: row.detalles,
    timestamp: row.created_at,
    ip: row.ip_address?.trim() || "—"
  };
}

function localDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type AuditoriaVista = "admin" | "observaciones";

type AuditoriaObsApiRow = {
  id: number;
  accion: string;
  privacidad: string | null;
  observacion_id: number | null;
  perfil_id: number | null;
  reporte_id: number | null;
  observacion_titulo: string | null;
  perfil_nombre: string | null;
  detalles: string | null;
  ip_address: string | null;
  created_at: string;
  usuario: { email: string; nombre_completo: string; rol: string };
};

function mapAuditoriaObsRow(row: AuditoriaObsApiRow): AuditoriaRegistro {
  const entidadParts: string[] = [];
  if (row.perfil_nombre) entidadParts.push(`Perfil: ${row.perfil_nombre}`);
  if (row.observacion_titulo) entidadParts.push(`Obs: ${row.observacion_titulo}`);
  if (row.privacidad) entidadParts.push(row.privacidad);
  return {
    id: row.id,
    actorLabel: row.usuario.nombre_completo,
    actorEmail: row.usuario.email,
    actorRol: row.usuario.rol,
    accion: row.accion,
    entidad: row.privacidad,
    entidadId: row.observacion_id,
    entidadLabel: entidadParts.length ? entidadParts.join(" · ") : "Observación sensible",
    detalles: row.detalles,
    timestamp: row.created_at,
    ip: row.ip_address?.trim() || "—"
  };
}

export function SuperadminAuditoriaSection() {
  const [vista, setVista] = useState<AuditoriaVista>("admin");
  const [data, setData] = useState<AuditoriaRegistro[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [accionFiltro, setAccionFiltro] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [detalleSeleccionado, setDetalleSeleccionado] = useState<AuditoriaRegistro | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const url =
        vista === "admin"
          ? "http://localhost:3000/api/auth/superadmin/auditoria"
          : "http://localhost:3000/api/auth/superadmin/auditoria-observaciones";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error al obtener auditoría");
      const json = (await res.json()) as { acciones?: AuditoriaApiRow[] | AuditoriaObsApiRow[] };
      const rows = Array.isArray(json.acciones) ? json.acciones : [];
      setData(
        vista === "admin"
          ? (rows as AuditoriaApiRow[]).map(mapAuditoriaRow)
          : (rows as AuditoriaObsApiRow[]).map(mapAuditoriaObsRow)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [vista]);

  const accionesUnicas = useMemo(
    () => Array.from(new Set(data.map(r => r.accion))).sort(),
    [data]
  );

  const q = busqueda.trim().toLowerCase();

  const filtrada = useMemo(() => {
    return data.filter(r => {
      if (accionFiltro && r.accion !== accionFiltro) return false;
      if (fechaFiltro && localDateKey(r.timestamp) !== fechaFiltro) return false;
      if (!q) return true;
      return [
        r.actorLabel,
        r.actorEmail,
        r.accion,
        r.entidadLabel,
        r.detalles,
        r.ip
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [data, accionFiltro, fechaFiltro, q]);

  const chartData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of filtrada) {
      counts.set(r.accion, (counts.get(r.accion) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([accion, cantidad]) => ({ accion, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [filtrada]);

  const chips = useMemo((): FilterChip[] => {
    const list: FilterChip[] = [];
    if (accionFiltro) list.push({ key: "accion", label: accionFiltro });
    if (fechaFiltro) list.push({ key: "fecha", label: `Fecha: ${fechaFiltro}` });
    return list;
  }, [accionFiltro, fechaFiltro]);

  const limpiar = () => {
    setBusqueda("");
    setAccionFiltro("");
    setFechaFiltro("");
  };

  return (
    <>
      <SuperadminPageHeader
        title="Auditoría del sistema"
        description={
          vista === "admin"
            ? "Trazabilidad de acciones administrativas: instituciones, perfiles, usuarios y credenciales."
            : "Trazabilidad de acceso a observaciones MULTINIVEL y PRIVADA: consultas, cambios y exportación en reportes."
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  vista === "admin"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
                onClick={() => setVista("admin")}
              >
                Administración
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  vista === "observaciones"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
                onClick={() => setVista("observaciones")}
              >
                Observaciones sensibles
              </button>
            </div>
            <Button type="button" variant="outline" onClick={() => void reload()} disabled={loading}>
              <FaSyncAlt className={loading ? "animate-spin" : ""} /> Actualizar
            </Button>
          </div>
        }
      />

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <SuperadminFilterBar
        className="mb-6"
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar por usuario, acción o detalle..."
        chips={chips}
        onRemoveChip={key => {
          if (key === "accion") setAccionFiltro("");
          if (key === "fecha") setFechaFiltro("");
        }}
        onClearAll={limpiar}
        filteredCount={filtrada.length}
        totalCount={data.length}
        entityLabel="registros"
        advanced={
          <>
            <div>
              <Label className="text-xs mb-1 text-slate-600">Tipo de acción</Label>
              <Select value={accionFiltro} onChange={e => setAccionFiltro(e.target.value)}>
                <option value="">Todas las acciones</option>
                {accionesUnicas.map(a => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 text-slate-600">Fecha</Label>
              <Input type="date" value={fechaFiltro} onChange={e => setFechaFiltro(e.target.value)} />
            </div>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-1 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Distribución por acción</h3>
          <p className="text-xs text-slate-500 mb-4">Según filtros aplicados</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="accion"
                interval={0}
                angle={-35}
                textAnchor="end"
                height={64}
                tick={{ fontSize: 9, fill: "#64748b" }}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  fontSize: 12
                }}
              />
              <Bar dataKey="cantidad" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <ScrollableTable>
            <table className={dataTable.table}>
              <thead>
                <tr className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wide">
                  <th className={dataTable.th}>Usuario</th>
                  <th className={dataTable.th}>Acción</th>
                  <th className={cn(dataTable.th, "min-w-[12rem]")}>Entidad</th>
                  <th className={dataTable.th}>Detalle</th>
                  <th className={dataTable.th}>Fecha</th>
                  <th className={dataTable.th}>IP</th>
                  <th className={cn(dataTable.th, "w-20 text-center")}>Ver</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-sm text-slate-400">
                      Cargando auditoría...
                    </td>
                  </tr>
                ) : filtrada.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-sm text-slate-400">
                      No hay registros que coincidan.
                    </td>
                  </tr>
                ) : (
                  filtrada.map(r => {
                    const detalleTexto = textoDetalleVisible(r.detalles);
                    return (
                    <tr key={r.id} className="border-b border-slate-100 last:border-none hover:bg-slate-50/80">
                      <td className={cn(dataTable.td, "align-top")}>
                        <div className="font-medium text-slate-800">{r.actorLabel}</div>
                        <div className="text-xs text-slate-500 mt-0.5 break-all">{r.actorEmail}</div>
                      </td>
                      <td className={cn(dataTable.td, "align-top")}>
                        <SuperadminBadge tone="info">{r.accion}</SuperadminBadge>
                      </td>
                      <td className={cn(dataTable.td, "align-top min-w-[10rem] max-w-xs")}>
                        <p className="text-sm font-medium text-slate-800 break-words leading-snug">
                          {r.entidadLabel}
                        </p>
                      </td>
                      <td className={cn(dataTable.td, "align-top text-slate-600 min-w-[12rem] max-w-md")}>
                        {detalleTexto !== "—" ? (
                          <p className="text-sm break-words line-clamp-2 leading-relaxed">{detalleTexto}</p>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className={cn(dataTable.td, "align-top whitespace-nowrap text-slate-500 text-xs")}>
                        {new Date(r.timestamp).toLocaleString("es-CL")}
                      </td>
                      <td className={cn(dataTable.td, "align-top font-mono text-xs text-slate-400")}>{r.ip}</td>
                      <td className={cn(dataTable.td, "align-top text-center")}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDetalleSeleccionado(r)}
                          aria-label={`Ver detalle de ${r.accion}`}
                        >
                          <FaEye aria-hidden />
                          <span className="sr-only sm:not-sr-only sm:ml-1.5">Ver</span>
                        </Button>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </ScrollableTable>
        </div>
      </div>

      <Modal
        open={detalleSeleccionado != null}
        onClose={() => setDetalleSeleccionado(null)}
        title="Detalle de auditoría"
        size="lg"
        footer={
          <Button type="button" variant="secondary" onClick={() => setDetalleSeleccionado(null)}>
            Cerrar
          </Button>
        }
      >
        {detalleSeleccionado && (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Usuario</dt>
              <dd className="mt-1 font-medium text-slate-900">{detalleSeleccionado.actorLabel}</dd>
              <dd className="text-slate-600 break-all">{detalleSeleccionado.actorEmail}</dd>
              <dd className="text-xs text-slate-500 mt-1">{detalleSeleccionado.actorRol}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Acción</dt>
              <dd className="mt-1">
                <SuperadminBadge tone="info">{detalleSeleccionado.accion}</SuperadminBadge>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha y hora</dt>
              <dd className="mt-1 text-slate-800">
                {new Date(detalleSeleccionado.timestamp).toLocaleString("es-CL")}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Entidad</dt>
              <dd className="mt-1 text-slate-800 break-words font-medium">
                {detalleSeleccionado.entidadLabel}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dirección IP</dt>
              <dd className="mt-1 font-mono text-slate-800">{detalleSeleccionado.ip}</dd>
              <dd className="text-xs text-slate-500 mt-1 leading-relaxed">
                IP del cliente al momento de registrar la acción (en desarrollo local suele ser{" "}
                <span className="font-mono">::1</span> o <span className="font-mono">127.0.0.1</span>).
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Detalle de la acción
              </dt>
              <dd className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-800 whitespace-pre-wrap break-words leading-relaxed">
                {textoDetalleVisible(detalleSeleccionado.detalles)}
              </dd>
            </div>
            <div className="sm:col-span-2 text-xs text-slate-400">
              Registro #{detalleSeleccionado.id}
            </div>
          </dl>
        )}
      </Modal>
    </>
  );
}
