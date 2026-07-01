import { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl } from '../config/api';
import { useNavigate } from "react-router-dom";
import { FaHandshake, FaList, FaSearch, FaUserMd, FaUserPlus } from "react-icons/fa";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { ScrollableTable } from "./ui/ScrollableTable";
import { dataTable, filterFieldMinWidth } from "./ui/dataTable";
import { TableActionButton } from "./ui/TableActionButton";
import { cn } from "../theme/cn";
import { getSectionTheme } from "../theme/roleTheme";
import { useRoleTheme } from "../context/RoleThemeContext";
import { AsignarEquipoPerfilModal } from "./AsignarEquipoPerfilModal";
import { adminPuedeAsignarEquipoPerfil } from "../utils/perfilEquipoAsignacion";
import { MiInstitucionContactoSection } from "./instituciones/MiInstitucionContactoSection";
import { InstitucionesRedSection } from "./instituciones/InstitucionesRedSection";
import { InstitucionContactoCard } from "./instituciones/InstitucionContactoCard";
import type { InstitucionContacto } from "../utils/institucionContacto";
import {
  etiquetaNivelEducacional,
  NIVEL_EDUCACIONAL_GRUPOS,
  type NivelEducacional
} from "../utils/nivelEducacional";
import { etiquetaEstadoConsentimientoPendiente } from "../utils/perfilConsentimiento";

type Solicitud = {
  id: number;
  estado: "PENDIENTE" | "ACEPTADA" | "RECHAZADA";
  created_at: string;
  perfil: { id: number; nombre: string; edad?: number | null };
  institucion_solicitante: InstitucionContacto;
};

type PerfilVista = {
  id: number;
  nombre: string;
  edad?: number | null;
  nivel_educacional?: NivelEducacional | null;
  diagnostico_clinico?: string | null;
  es_propio?: boolean;
  consentimiento_estado?: string;
  consentimiento_sujeto?: "TUTOR_LEGAL" | "TITULAR";
  institucion_duena?: { id: number; nombre: string; tipo: string } | null;
  colaboraciones?: Array<{
    institucion_id: number;
    nombre: string;
    estado: "PENDIENTE" | "ACEPTADA" | "RECHAZADA";
    direccion: "ENVIADA" | "RECIBIDA";
  }>;
  institucion_origen?: string;
  solicitud_id?: number;
};

type ResumenPerfiles = {
  total: number;
  propios: number;
  compartidos: number;
  filtrados?: number;
};

type Paginacion = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

const ESTADO_LABEL: Record<Solicitud["estado"], string> = {
  PENDIENTE: "Pendiente",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada"
};

const COLAB_ESTADO: Record<"PENDIENTE" | "ACEPTADA" | "RECHAZADA", string> = {
  PENDIENTE: "pendiente",
  ACEPTADA: "activa",
  RECHAZADA: "rechazada"
};

function institucionesTexto(p: PerfilVista): string {
  const partes: string[] = [];
  const duenaId = p.institucion_duena?.id;
  if (p.es_propio === false && p.institucion_duena) {
    partes.push(`${p.institucion_duena.nombre} (dueño)`);
  } else if (p.institucion_origen) {
    partes.push(`${p.institucion_origen} (dueño)`);
  }
  for (const c of p.colaboraciones ?? []) {
    if (duenaId && c.institucion_id === duenaId) continue;
    const pref = c.direccion === "RECIBIDA" ? "Colabora con" : "Invitó a";
    partes.push(`${pref} ${c.nombre} (${COLAB_ESTADO[c.estado]})`);
  }
  return partes.length > 0 ? partes.join(" · ") : "Sin otras instituciones";
}

export function AdminColaboracionSection({ modo }: { modo: "receptor" | "emisor" }) {
  const esReceptor = modo === "receptor";
  const navigate = useNavigate();
  const theme = useRoleTheme();
  const section = getSectionTheme("default");
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [todosPerfiles, setTodosPerfiles] = useState<PerfilVista[]>([]);
  const [resumen, setResumen] = useState<ResumenPerfiles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [respondiendoId, setRespondiendoId] = useState<number | null>(null);
  const [asignarPerfil, setAsignarPerfil] = useState<{
    id: number;
    nombre: string;
    nivel_educacional?: NivelEducacional | null;
  } | null>(null);
  const tipoInstitucion = localStorage.getItem("institucion_tipo") ?? "";
  const esColegio = tipoInstitucion === "CENTRO_EDUCACIONAL";
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "propios" | "compartidos">("todos");
  const [filtroNivel, setFiltroNivel] = useState<NivelEducacional | "sin_nivel" | "">("");
  const [paginacion, setPaginacion] = useState<Paginacion | null>(null);

  const etiquetas = useMemo(
    () => ({
      tituloLista: esColegio ? "Alumnos en TEA Link" : "Perfiles en TEA Link",
      colPersona: esColegio ? "Alumno" : "Nombre",
      vacioLista: esColegio
        ? "No hay alumnos que coincidan con la búsqueda."
        : "No hay perfiles que coincidan con la búsqueda.",
      descLista: esColegio
        ? "Alumnos de su colegio en la red TEA Link y centros médicos o terapéuticos vinculados. Use el buscador para asignar equipo con rapidez."
        : "Perfiles que su institución atiende y con qué otras instituciones están vinculados."
    }),
    [esColegio]
  );

  const token = () => localStorage.getItem("token");

  const api = (path: string, options?: RequestInit) =>
    fetch(apiUrl(`/api/perfiles${path}`), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
        ...options?.headers
      }
    });

  const fetchPerfiles = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(pagina),
      limit: "20",
      sort: esColegio ? "nivel_educacional" : "nombre",
      order: "asc",
      tipo: filtroTipo
    });
    if (busqueda.trim()) params.set("q", busqueda.trim());
    if (esColegio && filtroNivel) params.set("nivel", filtroNivel);

    const resTodos = await api(`?${params.toString()}`);
    const dataTodos = await resTodos.json().catch(() => ({}));
    if (!resTodos.ok) {
      throw new Error(parseApiError(dataTodos, "Error al cargar perfiles"));
    }
    setTodosPerfiles(dataTodos.perfiles ?? []);
    setResumen(dataTodos.resumen ?? null);
    setPaginacion(dataTodos.paginacion ?? null);
  }, [busqueda, pagina, filtroTipo, filtroNivel, esColegio]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchPerfiles();

      if (esReceptor) {
        const resSol = await api("/solicitudes-recibidas");
        const dataSol = await resSol.json().catch(() => ({}));
        if (!resSol.ok) {
          setError(parseApiError(dataSol, "Error al cargar solicitudes"));
          return;
        }
        setSolicitudes(dataSol.solicitudes ?? []);
      } else {
        setSolicitudes([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }, [esReceptor, fetchPerfiles]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setBusqueda(busquedaInput);
      setPagina(1);
    }, 350);
    return () => window.clearTimeout(t);
  }, [busquedaInput]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const responder = async (solicitudId: number, aceptar: boolean) => {
    setRespondiendoId(solicitudId);
    setMensaje(null);
    try {
      const res = await api(`/solicitudes-institucion/${solicitudId}/responder`, {
        method: "POST",
        body: JSON.stringify({ aceptar })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiError(data, "No se pudo responder la solicitud"));
        return;
      }
      setMensaje(typeof data.message === "string" ? data.message : "Solicitud actualizada");
      await fetchData();
    } catch {
      setError("Error de red al responder");
    } finally {
      setRespondiendoId(null);
    }
  };

  const pendientes = solicitudes.filter(s => s.estado === "PENDIENTE");
  const compartidos = todosPerfiles.filter(p => p.es_propio === false);

  const accionesPerfil = (p: PerfilVista) => (
    <div className="flex flex-wrap gap-1.5">
      <TableActionButton onClick={() => navigate(`/admin/perfiles/${p.id}`)}>
        Ver ficha
      </TableActionButton>
      {adminPuedeAsignarEquipoPerfil(p, tipoInstitucion) ? (
        <TableActionButton onClick={() => setAsignarPerfil({
          id: p.id,
          nombre: p.nombre,
          nivel_educacional: p.nivel_educacional
        })}>
          <FaUserPlus />
          Asignar equipo
        </TableActionButton>
      ) : (
        <span className="inline-flex items-center px-2.5 py-1 text-xs text-neutral-gray-medium">
          {p.consentimiento_estado === "PENDIENTE"
            ? etiquetaEstadoConsentimientoPendiente(p.consentimiento_sujeto ?? "TUTOR_LEGAL")
            : "—"}
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <MiInstitucionContactoSection />
      <InstitucionesRedSection />

      <p className="text-sm text-neutral-gray-medium max-w-2xl">
        Datos de contacto de su institución, instituciones vinculadas en TEA Link y seguimiento de
        perfiles en la red.{" "}
        {esReceptor
          ? "Puede aceptar invitaciones y asignar profesionales a perfiles compartidos."
          : "Para invitar un centro médico o terapéutico, use Invitar centro en la ficha de cada perfil (pestaña Perfiles)."}
      </p>

      {error && <Alert variant="error">{error}</Alert>}
      {mensaje && <Alert variant="success">{mensaje}</Alert>}

      <Card
        title={
          <>
            <FaList /> {etiquetas.tituloLista}
            {resumen && resumen.total > 0 && (
              <span className="ml-2 text-sm font-normal text-neutral-gray-medium">
                — {resumen.total} en total
                {resumen.propios > 0 && ` · ${resumen.propios} propio${resumen.propios > 1 ? "s" : ""}`}
                {resumen.compartidos > 0 &&
                  ` · ${resumen.compartidos} compartido${resumen.compartidos > 1 ? "s" : ""}`}
                {resumen.filtrados != null &&
                  (busqueda.trim() || filtroTipo !== "todos" || filtroNivel) &&
                  ` · ${resumen.filtrados} mostrado${resumen.filtrados !== 1 ? "s" : ""}`}
              </span>
            )}
          </>
        }
        description={etiquetas.descLista}
      >
        <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(12rem,1fr)_repeat(auto-fit,minmax(11rem,12.5rem))] xl:items-end">
          <div className="sm:col-span-2 lg:col-span-1 min-w-0">
            <Field label="Buscar">
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-gray-medium pointer-events-none"
                  aria-hidden
                >
                  <FaSearch />
                </span>
                <Input
                  type="search"
                  placeholder={esColegio ? "Nombre del alumno..." : "Nombre del perfil..."}
                  value={busquedaInput}
                  onChange={e => setBusquedaInput(e.target.value)}
                  className="pl-10"
                  aria-label="Buscar en la red"
                />
              </div>
            </Field>
          </div>
          {esColegio && (
            <div className={filterFieldMinWidth.nivel}>
              <Field label="Nivel">
                <Select
                  value={filtroNivel}
                  onChange={e => {
                    setFiltroNivel(e.target.value as typeof filtroNivel);
                    setPagina(1);
                  }}
                >
                  <option value="">Todos los niveles</option>
                  <option value="sin_nivel">Sin nivel asignado</option>
                  {NIVEL_EDUCACIONAL_GRUPOS.map(grupo => (
                    <optgroup key={grupo.label} label={grupo.label}>
                      {grupo.niveles.map(n => (
                        <option key={n} value={n}>
                          {etiquetaNivelEducacional(n)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </Field>
            </div>
          )}
          <div className={filterFieldMinWidth.tipo}>
            <Field label="Origen">
              <Select
                value={filtroTipo}
                onChange={e => {
                  setFiltroTipo(e.target.value as typeof filtroTipo);
                  setPagina(1);
                }}
              >
                <option value="todos">Todos</option>
                <option value="propios">{esColegio ? "Del colegio" : "Propios"}</option>
                <option value="compartidos">Compartidos</option>
              </Select>
            </Field>
          </div>
        </div>

        {loading ? (
          <p className="text-neutral-gray-medium">Cargando...</p>
        ) : todosPerfiles.length === 0 ? (
          <p className="text-neutral-gray-medium text-sm">{etiquetas.vacioLista}</p>
        ) : (
          <ScrollableTable>
            <table className={dataTable.table}>
              <thead>
                <tr className={section.tableHead}>
                  <th className={dataTable.th}>{etiquetas.colPersona}</th>
                  <th className={dataTable.th}>Tipo</th>
                  <th className={dataTable.th}>Instituciones vinculadas</th>
                  <th className={dataTable.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {todosPerfiles.map(p => (
                  <tr key={p.id} className={cn("border-b", section.tableRowHover)}>
                    <td className={dataTable.tdMedium}>
                      <button
                        type="button"
                        className={cn(theme.link, "font-medium")}
                        onClick={() => navigate(`/admin/perfiles/${p.id}`)}
                      >
                        {p.nombre}
                      </button>
                    </td>
                    <td className={dataTable.td}>
                      {p.es_propio === false ? "Compartido" : "Propio"}
                    </td>
                    <td className={cn(dataTable.td, "max-w-md")}>{institucionesTexto(p)}</td>
                    <td className={dataTable.td}>{accionesPerfil(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollableTable>
        )}

        {paginacion && paginacion.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagina <= 1 || loading}
              onClick={() => setPagina(p => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm text-neutral-gray-medium">
              Página {paginacion.page} de {paginacion.totalPages}
              {paginacion.total > 0 && ` · ${paginacion.total} resultado${paginacion.total !== 1 ? "s" : ""}`}
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
      </Card>

      {esReceptor && (
        <Card
          title={
            <>
              <FaHandshake /> Invitaciones recibidas
            </>
          }
          description="Solicitudes pendientes de otras instituciones."
        >
        {loading ? (
          <p className="text-neutral-gray-medium">Cargando...</p>
        ) : pendientes.length === 0 ? (
          <p className="text-neutral-gray-medium text-sm">No hay invitaciones pendientes.</p>
        ) : (
          <ScrollableTable>
            <table className={dataTable.table}>
              <thead>
                <tr className={section.tableHead}>
                  <th className={dataTable.th}>{etiquetas.colPersona}</th>
                  <th className={dataTable.th}>Institución solicitante</th>
                  <th className={dataTable.th}>Fecha</th>
                  <th className={dataTable.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map(s => (
                  <tr key={s.id} className={cn("border-b", section.tableRowHover)}>
                    <td className={dataTable.tdMedium}>{s.perfil.nombre}</td>
                    <td className={dataTable.td}>
                      <InstitucionContactoCard
                        institucion={s.institucion_solicitante}
                        showTipo={false}
                      />
                    </td>
                    <td className={dataTable.td}>
                      {new Date(s.created_at).toLocaleDateString("es-CL")}
                    </td>
                    <td className={cn(dataTable.td, "whitespace-nowrap space-x-2")}>
                      <Button
                        size="sm"
                        disabled={respondiendoId === s.id}
                        onClick={() => responder(s.id, true)}
                      >
                        Aceptar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={respondiendoId === s.id}
                        onClick={() => responder(s.id, false)}
                      >
                        Rechazar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollableTable>
        )}
      </Card>
      )}

      {esReceptor && compartidos.length > 0 && (
        <Card
          title={
            <>
              <FaUserMd /> Perfiles compartidos activos
            </>
          }
          description="Menores de otras instituciones con colaboración aceptada."
        >
          <ScrollableTable>
            <table className={dataTable.table}>
              <thead>
                <tr className={section.tableHead}>
                  <th className={dataTable.th}>{etiquetas.colPersona}</th>
                  <th className={dataTable.th}>Institución dueña</th>
                  <th className={dataTable.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {compartidos.map(p => (
                  <tr key={p.id} className={cn("border-b", section.tableRowHover)}>
                    <td className={dataTable.tdMedium}>
                      <button
                        type="button"
                        className={cn(theme.link, "font-medium")}
                        onClick={() => navigate(`/admin/perfiles/${p.id}`)}
                      >
                        {p.nombre}
                      </button>
                    </td>
                    <td className={dataTable.td}>
                      {p.institucion_duena?.nombre ?? p.institucion_origen ?? "—"}
                    </td>
                    <td className={dataTable.td}>{accionesPerfil(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollableTable>
        </Card>
      )}

      {esReceptor && solicitudes.some(s => s.estado !== "PENDIENTE") && (
        <Card title="Historial de invitaciones">
          <ScrollableTable>
            <table className={dataTable.table}>
              <thead>
                <tr className={section.tableHead}>
                  <th className={dataTable.th}>{etiquetas.colPersona}</th>
                  <th className={dataTable.th}>Solicitante</th>
                  <th className={dataTable.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes
                  .filter(s => s.estado !== "PENDIENTE")
                  .map(s => (
                    <tr key={s.id} className={cn("border-b", section.tableRowHover)}>
                      <td className={dataTable.td}>{s.perfil.nombre}</td>
                      <td className={dataTable.td}>{s.institucion_solicitante.nombre}</td>
                      <td className={dataTable.td}>{ESTADO_LABEL[s.estado]}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </ScrollableTable>
        </Card>
      )}

      <AsignarEquipoPerfilModal
        open={asignarPerfil != null}
        perfilId={asignarPerfil?.id ?? null}
        perfilNombre={asignarPerfil?.nombre ?? ""}
        perfilNivelEducacional={asignarPerfil?.nivel_educacional}
        tipoInstitucion={tipoInstitucion}
        onClose={() => setAsignarPerfil(null)}
        onAsignado={() => {
          setMensaje("Equipo actualizado correctamente.");
          fetchData();
        }}
      />
    </div>
  );
}
