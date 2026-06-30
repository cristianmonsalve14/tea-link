import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEye, FaSyncAlt, FaTrash } from "react-icons/fa";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Modal } from "../ui/Modal";
import { Select } from "../ui/Select";
import { ScrollableTable } from "../ui/ScrollableTable";
import { dataTable } from "../ui/dataTable";
import { TableActionButton } from "../ui/TableActionButton";
import { cn } from "../../theme/cn";
import { etiquetaTipoInstitucion } from "../../utils/institucionContacto";
import { etiquetaDiagnosticoClinico } from "../../utils/diagnosticoPerfil";
import { etiquetaNivelEducacional } from "../../utils/nivelEducacional";
import { formatearEdadPerfil } from "../../utils/edadDesdeFechaNacimiento";
import {
  etiquetaEstadoConsentimientoPendiente,
  type ConsentimientoSujeto
} from "../../utils/perfilConsentimiento";
import { formatearRutChileno } from "../../utils/rutChileno";
import { parseApiError } from "../../utils/parseApiError";
import type { RegionChile } from "../../utils/regionChile";
import { RegionChileSelect } from "../instituciones/RegionChileSelect";
import { SuperadminPageHeader } from "./SuperadminPageHeader";
import { SuperadminFilterBar, type FilterChip } from "./SuperadminFilterBar";
import { SuperadminBadge } from "./SuperadminBadge";
import { useSuperadminInstituciones } from "./SuperadminInstitucionesContext";

type PerfilRegistroRow = {
  id: number;
  rut: string | null;
  rut_formateado: string | null;
  nombre: string;
  edad: number | null;
  fecha_nacimiento: string | null;
  diagnostico_clinico: string;
  nivel_educacional: string | null;
  consentimiento_estado: "PENDIENTE" | "ACEPTADO" | "RECHAZADO";
  consentimiento_sujeto: ConsentimientoSujeto;
  consentimiento_aceptado_at: string | null;
  created_at: string;
  institucion_custodia: {
    id: number;
    nombre: string;
    tipo: string;
    tipo_label: string;
    region_label: string | null;
    ubicacion_label: string | null;
  };
};

type PerfilDetalle = PerfilRegistroRow & {
  diagnostico_secundario?: string | null;
  notas?: string | null;
  resumen: {
    observaciones: number;
    vinculos_equipo: number;
    solicitudes_colaboracion: number;
  };
  colaboraciones_activas: Array<{
    id: number;
    institucion_solicitante: { id: number; nombre: string; tipo_label: string };
    institucion_invitada: { id: number; nombre: string; tipo_label: string };
  }>;
};

type Paginacion = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const CONSENT_LABEL: Record<PerfilRegistroRow["consentimiento_estado"], string> = {
  PENDIENTE: "Pendiente",
  ACEPTADO: "Autorizado",
  RECHAZADO: "Rechazado"
};

function etiquetaConsentimiento(perfil: Pick<PerfilRegistroRow, "consentimiento_estado" | "consentimiento_sujeto">) {
  if (perfil.consentimiento_estado === "PENDIENTE") {
    return etiquetaEstadoConsentimientoPendiente(perfil.consentimiento_sujeto);
  }
  return CONSENT_LABEL[perfil.consentimiento_estado];
}

function consentBadgeTone(
  estado: PerfilRegistroRow["consentimiento_estado"]
): "warning" | "success" | "neutral" {
  if (estado === "ACEPTADO") return "success";
  if (estado === "RECHAZADO") return "neutral";
  return "warning";
}

function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

type TipoInstitucionCustodia =
  | "CENTRO_EDUCACIONAL"
  | "CENTRO_MEDICO"
  | "CENTRO_PROFESIONAL";

const TIPOS_CUSTODIA_FILTRO: Array<{ value: TipoInstitucionCustodia | ""; label: string }> = [
  { value: "", label: "Todos los tipos con custodia" },
  { value: "CENTRO_EDUCACIONAL", label: "Centro educacional" },
  { value: "CENTRO_MEDICO", label: "Centro médico" },
  { value: "CENTRO_PROFESIONAL", label: "Centro terapéutico" }
];

const MAX_INSTITUCIONES_EN_SELECT = 200;

type FiltrosPerfiles = {
  q: string;
  institucion: string;
  region: RegionChile | "";
  tipoInstitucion: TipoInstitucionCustodia | "";
  consentimiento: string;
  desde: string;
  hasta: string;
};

const FILTROS_VACIOS: FiltrosPerfiles = {
  q: "",
  institucion: "",
  region: "",
  tipoInstitucion: "",
  consentimiento: "",
  desde: "",
  hasta: ""
};

function patchFiltros(
  prev: FiltrosPerfiles,
  patch: Partial<FiltrosPerfiles>
): FiltrosPerfiles {
  return { ...prev, ...patch };
}
function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function SuperadminRegistroPerfilesSection() {
  const { institucionesOperativas } = useSuperadminInstituciones();

  const [perfiles, setPerfiles] = useState<PerfilRegistroRow[]>([]);
  const [paginacion, setPaginacion] = useState<Paginacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState<FiltrosPerfiles>(FILTROS_VACIOS);
  const [filtros, setFiltros] = useState<FiltrosPerfiles>(FILTROS_VACIOS);
  const [instBusqueda, setInstBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalle, setDetalle] = useState<PerfilDetalle | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  const institucionesCustodiaBase = useMemo(() => {
    return institucionesOperativas.filter(i => {
      if (i.tipo === "FAMILIA" || i.tipo === "SISTEMA") return false;
      if (draft.region && i.region !== draft.region) return false;
      if (draft.tipoInstitucion && i.tipo !== draft.tipoInstitucion) return false;
      return true;
    });
  }, [institucionesOperativas, draft.region, draft.tipoInstitucion]);

  const institucionesSelect = useMemo(() => {
    const q = instBusqueda.trim().toLowerCase();
    let base = institucionesCustodiaBase;
    if (q) {
      base = base.filter(i => {
        const haystack = [
          i.nombre,
          i.comuna,
          i.localidad,
          i.ubicacion_label,
          String(i.id)
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    return [...base]
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
      .slice(0, MAX_INSTITUCIONES_EN_SELECT);
  }, [institucionesCustodiaBase, instBusqueda]);

  const hayFiltros = Boolean(
    filtros.q ||
      filtros.institucion ||
      filtros.region ||
      filtros.tipoInstitucion ||
      filtros.consentimiento ||
      filtros.desde ||
      filtros.hasta
  );

  const chips = useMemo((): FilterChip[] => {
    const list: FilterChip[] = [];
    if (filtros.q) list.push({ key: "q", label: `Búsqueda: ${filtros.q}` });
    if (filtros.institucion) {
      const inst = institucionesOperativas.find(i => String(i.id) === filtros.institucion);
      if (inst) list.push({ key: "inst", label: inst.nombre });
    }
    if (filtros.region) list.push({ key: "region", label: `Región: ${filtros.region}` });
    if (filtros.tipoInstitucion) {
      const t = TIPOS_CUSTODIA_FILTRO.find(x => x.value === filtros.tipoInstitucion);
      if (t) list.push({ key: "tipo", label: t.label });
    }
    if (filtros.consentimiento) list.push({ key: "consent", label: filtros.consentimiento });
    if (filtros.desde || filtros.hasta) {
      list.push({ key: "fecha", label: `${filtros.desde || "…"} – ${filtros.hasta || "…"}` });
    }
    return list;
  }, [filtros, institucionesOperativas]);

  const fetchPerfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(pagina));
      params.set("limit", "25");
      if (filtros.q) params.set("q", filtros.q);
      if (filtros.institucion) params.set("institucion", filtros.institucion);
      if (filtros.region) params.set("region", filtros.region);
      if (filtros.tipoInstitucion) params.set("tipo_institucion", filtros.tipoInstitucion);
      if (filtros.consentimiento) params.set("consentimiento", filtros.consentimiento);
      if (filtros.desde) params.set("desde", filtros.desde);
      if (filtros.hasta) params.set("hasta", filtros.hasta);

      const res = await fetch(
        `http://localhost:3000/api/auth/superadmin/perfiles?${params.toString()}`,
        { headers: authHeaders() }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(parseApiError(data, "No se pudo cargar el registro de perfiles"));
      }
      const data = await res.json();
      setPerfiles(data.perfiles ?? []);
      setPaginacion(data.paginacion ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar perfiles");
      setPerfiles([]);
      setPaginacion(null);
    } finally {
      setLoading(false);
    }
  }, [pagina, filtros]);

  useEffect(() => {
    void fetchPerfiles();
  }, [fetchPerfiles]);

  const aplicarFiltros = () => {
    setFiltros({ ...draft });
    setPagina(1);
  };

  const limpiarFiltros = () => {
    setDraft(FILTROS_VACIOS);
    setFiltros(FILTROS_VACIOS);
    setInstBusqueda("");
    setPagina(1);
  };

  const abrirDetalle = async (id: number) => {
    setDetalleOpen(true);
    setDetalleLoading(true);
    setDetalle(null);
    try {
      const res = await fetch(`http://localhost:3000/api/auth/superadmin/perfiles/${id}`, {
        headers: authHeaders()
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(parseApiError(data, "No se pudo cargar el detalle"));
      }
      const data = await res.json();
      setDetalle(data.perfil ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar detalle");
      setDetalleOpen(false);
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleEliminar = async (p: PerfilRegistroRow) => {
    if (
      !window.confirm(
        `¿Eliminar del registro de perfiles a "${p.nombre}" (RUT ${p.rut_formateado ?? "sin RUT"})?\n\nEsta acción es irreversible y solo debe usarse en casos excepcionales.`
      )
    ) {
      return;
    }
    setEliminandoId(p.id);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3000/api/perfiles/${p.id}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(parseApiError(data, "Error al eliminar perfil"));
      }
      if (detalle?.id === p.id) {
        setDetalleOpen(false);
        setDetalle(null);
      }
      await fetchPerfiles();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <>
      <SuperadminPageHeader
        title="Registro perfiles"
        description="Consulta de estudiantes por RUT, institución custodia y estado de consentimiento en TEA Link."
      />

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <SuperadminFilterBar
        className="mb-6"
        search={draft.q}
        onSearchChange={value => setDraft(prev => patchFiltros(prev, { q: value }))}
        searchPlaceholder="Buscar por RUT o nombre..."
        chips={chips}
        onRemoveChip={key => {
          const next = { ...filtros };
          if (key === "q") next.q = "";
          if (key === "inst") next.institucion = "";
          if (key === "region") next.region = "";
          if (key === "tipo") next.tipoInstitucion = "";
          if (key === "consent") next.consentimiento = "";
          if (key === "fecha") {
            next.desde = "";
            next.hasta = "";
          }
          setDraft(next);
          setFiltros(next);
          setPagina(1);
        }}
        onClearAll={limpiarFiltros}
        filteredCount={paginacion?.total}
        totalCount={paginacion?.total}
        entityLabel="perfiles"
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => void fetchPerfiles()}
              disabled={loading}
            >
              <FaSyncAlt /> {loading ? "Cargando..." : "Actualizar"}
            </Button>
            <Button type="button" onClick={aplicarFiltros} disabled={loading}>
              Aplicar filtros
            </Button>
          </>
        }
        advanced={
          <>
            <RegionChileSelect
              label="Región (custodia)"
              value={draft.region}
              onChange={value =>
                setDraft(prev =>
                  patchFiltros(prev, { region: value, institucion: "" })
                )
              }
            />
            <div>
              <Label className="text-xs mb-1 text-slate-600">Tipo de institución custodia</Label>
              <Select
                value={draft.tipoInstitucion}
                onChange={e =>
                  setDraft(prev =>
                    patchFiltros(prev, {
                      tipoInstitucion: e.target.value as TipoInstitucionCustodia | "",
                      institucion: ""
                    })
                  )
                }
              >
                {TIPOS_CUSTODIA_FILTRO.map(t => (
                  <option key={t.value || "all"} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Solo centros que pueden custodiar perfiles (educacional, médico o terapéutico).
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs mb-1 text-slate-600">Institución custodia</Label>
              <Input
                value={instBusqueda}
                onChange={e => setInstBusqueda(e.target.value)}
                placeholder="Buscar por nombre, comuna o ID..."
                className="mb-2"
              />
              <Select
                value={draft.institucion}
                onChange={e =>
                  setDraft(prev => patchFiltros(prev, { institucion: e.target.value }))
                }
              >
                <option value="">
                  {institucionesCustodiaBase.length === 0
                    ? "Sin instituciones para este criterio"
                    : "Todas las instituciones del criterio"}
                </option>
                {institucionesSelect.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.nombre}
                    {i.comuna ? ` — ${i.comuna}` : ""}
                    {` (${etiquetaTipoInstitucion(i.tipo)})`}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                {institucionesCustodiaBase.length.toLocaleString("es-CL")} instituciones
                {draft.region || draft.tipoInstitucion ? " con el criterio actual" : " con custodia"}
                {institucionesCustodiaBase.length > MAX_INSTITUCIONES_EN_SELECT &&
                !instBusqueda.trim()
                  ? `. Mostrando las primeras ${MAX_INSTITUCIONES_EN_SELECT}; use la búsqueda o acote por región y tipo.`
                  : instBusqueda.trim() && institucionesSelect.length === 0
                    ? ". Ninguna coincide con la búsqueda."
                    : "."}
              </p>
            </div>
            <div>
              <Label className="text-xs mb-1 text-slate-600">Consentimiento</Label>
              <Select
                value={draft.consentimiento}
                onChange={e =>
                  setDraft(prev => patchFiltros(prev, { consentimiento: e.target.value }))
                }
              >
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="ACEPTADO">Autorizado</option>
                <option value="RECHAZADO">Rechazado</option>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 text-slate-600">Alta desde</Label>
              <Input
                type="date"
                value={draft.desde}
                onChange={e => setDraft(prev => patchFiltros(prev, { desde: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 text-slate-600">Alta hasta</Label>
              <Input
                type="date"
                value={draft.hasta}
                onChange={e => setDraft(prev => patchFiltros(prev, { hasta: e.target.value }))}
              />
            </div>
          </>
        }
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Perfiles registrados</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {paginacion
                ? `${paginacion.total.toLocaleString("es-CL")} perfiles registrados${hayFiltros ? " (filtrados)" : ""}`
                : "Cargando..."}
            </p>
          </div>
        </div>

        {loading && perfiles.length === 0 ? (
          <p className="p-8 text-center text-slate-500 text-sm">Cargando perfiles...</p>
        ) : perfiles.length === 0 ? (
          <p className="p-8 text-center text-slate-500 text-sm">
            No hay perfiles que coincidan con los filtros.
          </p>
        ) : (
          <ScrollableTable>
            <table className={dataTable.table}>
              <thead>
                <tr className="bg-slate-50">
                  <th className={dataTable.th}>RUT</th>
                  <th className={dataTable.th}>Nombre</th>
                  <th className={cn(dataTable.th, "min-w-[10rem]")}>Institución custodia</th>
                  <th className={cn(dataTable.th, "min-w-[8rem]")}>Región</th>
                  <th className={cn(dataTable.th, "min-w-[8rem]")}>Consentimiento</th>
                  <th className={cn(dataTable.th, "whitespace-nowrap")}>Alta</th>
                  <th className={cn(dataTable.th, "min-w-[8rem]")}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {perfiles.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className={cn(dataTable.td, "whitespace-nowrap font-mono text-sm")}>
                      {p.rut_formateado ?? (p.rut ? formatearRutChileno(p.rut) : "—")}
                    </td>
                    <td className={dataTable.tdMedium}>{p.nombre}</td>
                    <td className={dataTable.td}>
                      <div className="text-sm font-medium text-slate-800">
                        {p.institucion_custodia.nombre}
                      </div>
                      <div className="text-xs text-slate-500">
                        {p.institucion_custodia.tipo_label}
                      </div>
                    </td>
                    <td className={dataTable.td}>
                      {p.institucion_custodia.region_label ?? "—"}
                    </td>
                    <td className={dataTable.td}>
                      <SuperadminBadge tone={consentBadgeTone(p.consentimiento_estado)}>
                        {etiquetaConsentimiento(p)}
                      </SuperadminBadge>
                    </td>
                    <td className={cn(dataTable.td, "whitespace-nowrap text-sm")}>
                      {formatearFecha(p.created_at)}
                    </td>
                    <td className={dataTable.td}>
                      <div className="flex flex-wrap gap-1">
                        <TableActionButton onClick={() => void abrirDetalle(p.id)}>
                          <FaEye size={12} />
                          Ver
                        </TableActionButton>
                        <TableActionButton
                          variant="danger"
                          onClick={() => void handleEliminar(p)}
                          disabled={eliminandoId === p.id}
                        >
                          <FaTrash size={12} />
                          {eliminandoId === p.id ? "..." : "Eliminar"}
                        </TableActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollableTable>
        )}

        {paginacion && paginacion.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagina <= 1 || loading}
              onClick={() => setPagina(p => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm text-slate-500">
              Página {paginacion.page} / {paginacion.totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagina >= paginacion.totalPages || loading}
              onClick={() => setPagina(p => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>

      <Modal
        open={detalleOpen}
        onClose={() => {
          setDetalleOpen(false);
          setDetalle(null);
        }}
        title={detalle ? `Perfil: ${detalle.nombre}` : "Detalle del perfil"}
        size="lg"
        footer={
          detalle ? (
            <>
              <Button variant="secondary" onClick={() => setDetalleOpen(false)}>
                Cerrar
              </Button>
              <Button
                variant="danger"
                onClick={() => void handleEliminar(detalle)}
                disabled={eliminandoId === detalle.id}
              >
                {eliminandoId === detalle.id ? "Eliminando..." : "Eliminar perfil"}
              </Button>
            </>
          ) : undefined
        }
      >
        {detalleLoading ? (
          <p className="text-sm text-slate-500 py-6 text-center">Cargando ficha...</p>
        ) : detalle ? (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">RUT</p>
                <p className="font-mono font-medium">
                  {detalle.rut_formateado ?? (detalle.rut ? formatearRutChileno(detalle.rut) : "—")}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Edad</p>
                <p>{formatearEdadPerfil(detalle.fecha_nacimiento, detalle.edad)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Diagnóstico</p>
                <p>{etiquetaDiagnosticoClinico(detalle.diagnostico_clinico as never)}</p>
              </div>
              {detalle.nivel_educacional && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Nivel educacional</p>
                  <p>{etiquetaNivelEducacional(detalle.nivel_educacional as never)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Consentimiento</p>
                <SuperadminBadge tone={consentBadgeTone(detalle.consentimiento_estado)}>
                  {etiquetaConsentimiento(detalle)}
                </SuperadminBadge>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Fecha de alta</p>
                <p>{formatearFecha(detalle.created_at)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Institución custodia
              </p>
              <p className="font-medium text-slate-900">{detalle.institucion_custodia.nombre}</p>
              <p className="text-slate-600">
                {etiquetaTipoInstitucion(detalle.institucion_custodia.tipo)}
                {detalle.institucion_custodia.ubicacion_label
                  ? ` · ${detalle.institucion_custodia.ubicacion_label}`
                  : ""}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 p-3 text-center">
                <p className="text-lg font-semibold text-slate-900">
                  {detalle.resumen.observaciones}
                </p>
                <p className="text-xs text-slate-500">Observaciones</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 text-center">
                <p className="text-lg font-semibold text-slate-900">
                  {detalle.resumen.vinculos_equipo}
                </p>
                <p className="text-xs text-slate-500">Vínculos equipo</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 text-center">
                <p className="text-lg font-semibold text-slate-900">
                  {detalle.resumen.solicitudes_colaboracion}
                </p>
                <p className="text-xs text-slate-500">Colaboraciones</p>
              </div>
            </div>

            {detalle.colaboraciones_activas.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Colaboraciones activas
                </p>
                <ul className="space-y-2">
                  {detalle.colaboraciones_activas.map(c => (
                    <li
                      key={c.id}
                      className="text-slate-700 border border-slate-100 rounded-lg px-3 py-2"
                    >
                      {c.institucion_solicitante.nombre} ↔ {c.institucion_invitada.nombre}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
