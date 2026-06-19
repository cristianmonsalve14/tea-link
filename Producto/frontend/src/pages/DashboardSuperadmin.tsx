import { useState, useEffect } from "react";
import { UsuariosAdminSection } from "../components/UsuariosAdminSection";
import { ReportesSection } from "../components/ReportesSection";
import { SuperadminShell } from "../components/layout/SuperadminShell";
import { useRoleTheme } from "../context/RoleThemeContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Label } from "../components/ui/Label";
import { Alert } from "../components/ui/Alert";
import { Modal } from "../components/ui/Modal";
import { Field } from "../components/ui/Field";
import { cn } from "../theme/cn";
import { getSectionTheme } from "../theme/roleTheme";
import {
  FaChartBar,
  FaUniversity,
  FaUsers,
  FaFileAlt,
  FaShieldAlt,
  FaSyncAlt,
  FaFilter,
  FaUserCircle
} from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ==================== TIPOS AUDITORÍA ====================
type AuditoriaApiRow = {
  id: number;
  admin_id: number;
  accion: string;
  entidad: string | null;
  entidad_id: number | null;
  detalles: string | null;
  ip_address: string | null;
  created_at: string;
  admin: {
    email: string;
    nombre_completo: string;
    rol: string;
  };
};

type AuditoriaRegistro = {
  id: number;
  actorLabel: string;
  accion: string;
  entidadLabel: string;
  timestamp: string;
  ip: string;
};

function mapAuditoriaRow(row: AuditoriaApiRow): AuditoriaRegistro {
  const entidadPartes = [row.entidad, row.entidad_id != null ? `#${row.entidad_id}` : null]
    .filter(Boolean)
    .join(" ");
  const entidadLabel = row.detalles?.trim()
    ? `${entidadPartes || "—"} — ${row.detalles}`
    : entidadPartes || "—";

  return {
    id: row.id,
    actorLabel: `${row.admin.nombre_completo} (${row.admin.email})`,
    accion: row.accion,
    entidadLabel,
    timestamp: row.created_at,
    ip: row.ip_address?.trim() || "—"
  };
}

type AuditoriaChartData = {
  accion: string;
  cantidad: number;
};

const AuditoriaSection: React.FC = () => {
  const theme = useRoleTheme();
  const [data, setData] = useState<AuditoriaRegistro[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accionFiltro, setAccionFiltro] = useState<string>("");
  const [usuarioFiltro, setUsuarioFiltro] = useState<string>("");
  const [fechaFiltro, setFechaFiltro] = useState<string>("");

  // Acciones únicas para filtro
  const accionesUnicas = Array.from(new Set(data.map(r => r.accion)));
  const usuariosUnicos = Array.from(new Set(data.map(r => r.actorLabel)));

  const reloadAuditoria = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/auth/superadmin/auditoria", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error al obtener auditoría");
      const json = (await res.json()) as { acciones?: AuditoriaApiRow[] };
      const rows = Array.isArray(json.acciones) ? json.acciones : [];
      setData(rows.map(mapAuditoriaRow));
    } catch (e: unknown) {
      if (typeof e === "object" && e && "message" in e) {
        setError((e as { message?: string }).message ?? "Error desconocido");
      } else {
        setError("Error desconocido");
      }
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch datos
  useEffect(() => {
    reloadAuditoria();
  }, []);

  // Filtros
  const dataFiltrada = data
    .filter(r => !accionFiltro || r.accion === accionFiltro)
    .filter(r => !usuarioFiltro || r.actorLabel === usuarioFiltro)
    .filter(r => !fechaFiltro || r.timestamp.startsWith(fechaFiltro));

  // Datos para gráfico
  const chartData: AuditoriaChartData[] = accionesUnicas.map(accion => ({
    accion,
    cantidad: dataFiltrada.filter(r => r.accion === accion).length
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className={cn("text-xl font-bold flex items-center gap-2", theme.accentText)}>
          <FaShieldAlt /> Auditoría del sistema
        </h2>
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1 bg-white rounded-xl shadow px-3 py-1">
            <FaFilter color="#60a5fa" size={18} />
            <select
              className={cn("bg-transparent outline-none", theme.accentText)}
              value={accionFiltro}
              onChange={e => setAccionFiltro(e.target.value)}
            >
              <option value="">Todas las acciones</option>
              {accionesUnicas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 bg-white rounded-xl shadow px-3 py-1">
            <FaUserCircle color="#60a5fa" size={18} />
            <select
              className={cn("bg-transparent outline-none", theme.accentText)}
              value={usuarioFiltro}
              onChange={e => setUsuarioFiltro(e.target.value)}
            >
              <option value="">Todos los usuarios</option>
              {usuariosUnicos.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <input
            type="date"
            className={cn("bg-white rounded-xl shadow px-3 py-1 outline-none", theme.accentText)}
            value={fechaFiltro}
            onChange={e => setFechaFiltro(e.target.value)}
          />
          <button
            className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-xl font-semibold transition-all shadow",
              theme.accentBgSubtle,
              theme.accentText,
              "hover:opacity-90"
            )}
            onClick={() => { setAccionFiltro(""); setUsuarioFiltro(""); setFechaFiltro(""); reloadAuditoria(); }}
            title="Limpiar filtros y recargar"
          >
            <FaSyncAlt /> Limpiar
          </button>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white rounded-2xl shadow-lg p-4 w-full max-w-2xl mx-auto">
        <h3 className={cn("font-semibold mb-2", theme.accentText)}>Acciones por tipo</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData ?? []} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="accion" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="cantidad" fill="#4F46E5" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-lg p-4 overflow-x-auto">
        <h3 className={cn("font-semibold mb-2", theme.accentText)}>Registros de auditoría</h3>
        {loading ? (
          <div className="text-blue-600 py-8 text-center">Cargando auditoría...</div>
        ) : error ? (
          <div className="text-red-500 py-8 text-center">{error}</div>
        ) : dataFiltrada.length === 0 ? (
          <div className="text-slate-500 py-8 text-center">
            No hay registros de auditoría. Las acciones administrativas (crear institución, reset de clave, etc.) aparecerán aquí.
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-blue-50 text-blue-700">
                <th className="px-3 py-2 text-left font-semibold">Usuario</th>
                <th className="px-3 py-2 text-left font-semibold">Acción</th>
                <th className="px-3 py-2 text-left font-semibold">Detalle</th>
                <th className="px-3 py-2 text-left font-semibold">Fecha</th>
                <th className="px-3 py-2 text-left font-semibold">IP</th>
              </tr>
            </thead>
            <tbody>
              {dataFiltrada
                .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                .map(r => (
                  <tr key={r.id} className="border-b last:border-none hover:bg-blue-50 transition-all">
                    <td className="px-3 py-2">{r.actorLabel}</td>
                    <td className="px-3 py-2">{r.accion}</td>
                    <td className="px-3 py-2 max-w-md truncate" title={r.entidadLabel}>{r.entidadLabel}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{new Date(r.timestamp).toLocaleString()}</td>
                    <td className="px-3 py-2">{r.ip}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>

  );
};


// ==================== TIPOS ====================
type Stats = {
  usuarios: number;
  perfiles: number;
  observaciones: number;
  instituciones: number;
};

type Rol = string;
type TipoInstitucion =
  | "FAMILIA"
  | "CENTRO_EDUCACIONAL"
  | "CENTRO_MEDICO"
  | "CENTRO_PROFESIONAL"
  | "SISTEMA";

type Institucion = { id: number; nombre: string; tipo?: TipoInstitucion };

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

const TIPOS_INSTITUCION: { value: TipoInstitucion; label: string }[] = [
  { value: "FAMILIA", label: "Familia" },
  { value: "CENTRO_EDUCACIONAL", label: "Centro educacional" },
  { value: "CENTRO_MEDICO", label: "Centro médico" },
  { value: "CENTRO_PROFESIONAL", label: "Centro profesional" },
];





const DashboardSuperadmin = () => {
  const theme = useRoleTheme();
  const instSection = getSectionTheme("institutions");

  const [section, setSection] = useState("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [desde, setDesde] = useState<string>("");
  const [hasta, setHasta] = useState<string>("");
  const [rol, setRol] = useState<string>("");
  const [institucion, setInstitucion] = useState<string>("");

  // Opciones de selects
  const [rolesDisponibles, setRolesDisponibles] = useState<Rol[]>([]);
  const [institucionesDisponibles, setInstitucionesDisponibles] = useState<Institucion[]>([]);

  // Modal y formulario para crear/editar institución
  const [showInstitucionModal, setShowInstitucionModal] = useState(false);
  const [institucionModalMode, setInstitucionModalMode] = useState<"create" | "edit">("create");
  const [editingInstitucionId, setEditingInstitucionId] = useState<number | null>(null);
  const [nuevaInstitucion, setNuevaInstitucion] = useState("");
  const [nuevoTipoInstitucion, setNuevoTipoInstitucion] =
    useState<TipoInstitucion>("CENTRO_EDUCACIONAL");
  const [institucionError, setInstitucionError] = useState<string | null>(null);
  const [institucionLoading, setInstitucionLoading] = useState(false);
  const [eliminandoInstitucionId, setEliminandoInstitucionId] = useState<number | null>(null);

  const abrirModalCrearInstitucion = () => {
    setInstitucionModalMode("create");
    setEditingInstitucionId(null);
    setNuevaInstitucion("");
    setNuevoTipoInstitucion("CENTRO_EDUCACIONAL");
    setInstitucionError(null);
    setShowInstitucionModal(true);
  };

  const abrirModalEditarInstitucion = (inst: Institucion) => {
    setInstitucionModalMode("edit");
    setEditingInstitucionId(inst.id);
    setNuevaInstitucion(inst.nombre);
    setNuevoTipoInstitucion(inst.tipo ?? "CENTRO_EDUCACIONAL");
    setInstitucionError(null);
    setShowInstitucionModal(true);
  };

  const cerrarModalInstitucion = () => {
    setShowInstitucionModal(false);
    setInstitucionError(null);
    setEditingInstitucionId(null);
  };

  // Fetch roles e instituciones para selects
  const fetchInstituciones = async () => {
    try {
      const token = localStorage.getItem("token");
      setRolesDisponibles([]);
      const resInst = await fetch("http://localhost:3000/api/auth/instituciones", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const instData = await resInst.ok ? await resInst.json() : [];
      console.log("[FRONTEND][INSTITUCIONES]", instData);
      const instituciones = Array.isArray(instData?.instituciones) ? instData.instituciones : [];
      setInstitucionesDisponibles(instituciones);
      if (instituciones.length === 0) {
        console.warn("No se recibieron instituciones desde el backend");
      }
    } catch (e) {
      setRolesDisponibles([]);
      setInstitucionesDisponibles([]);
      console.error("Error al obtener instituciones", e);
    }
  };
  useEffect(() => {
    fetchInstituciones();
    
  }, []);

  const handleGuardarInstitucion = async (e: React.FormEvent) => {
    e.preventDefault();
    setInstitucionError(null);
    if (!nuevaInstitucion.trim()) {
      setInstitucionError("El nombre es obligatorio");
      return;
    }
    setInstitucionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const body = {
        nombre: nuevaInstitucion.trim(),
        tipo: nuevoTipoInstitucion
      };
      const isEdit = institucionModalMode === "edit" && editingInstitucionId != null;
      const url = isEdit
        ? `http://localhost:3000/api/auth/institucion/${editingInstitucionId}`
        : "http://localhost:3000/api/auth/institucion";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setInstitucionError(
          parseApiError(
            errorData,
            isEdit ? "Error al actualizar institución" : "Error al crear institución"
          )
        );
        return;
      }
      cerrarModalInstitucion();
      await fetchInstituciones();
    } catch {
      setInstitucionError("Error de red o servidor");
    } finally {
      setInstitucionLoading(false);
    }
  };

  const handleEliminarInstitucion = async (inst: Institucion) => {
    if (inst.tipo === "SISTEMA") {
      alert("No se puede eliminar la institución del sistema.");
      return;
    }
    if (!window.confirm(`¿Eliminar la institución "${inst.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setEliminandoInstitucionId(inst.id);
    setInstitucionError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/api/auth/institucion/${inst.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setInstitucionError(parseApiError(errorData, "Error al eliminar institución"));
        return;
      }
      await fetchInstituciones();
    } catch {
      setInstitucionError("Error de red o servidor al eliminar");
    } finally {
      setEliminandoInstitucionId(null);
    }
  };

  // Fetch stats con filtros
  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (desde) params.append("desde", desde);
      if (hasta) params.append("hasta", hasta);
      if (rol) params.append("rol", rol);
      if (institucion) params.append("institucion", institucion);
      const url = `http://localhost:3000/api/auth/superadmin/stats?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data.kpis ?? null);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // Cargar stats al montar
  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: <FaChartBar size={20} /> },
    { key: "instituciones", label: "Instituciones", icon: <FaUniversity size={20} /> },
    { key: "usuarios", label: "Usuarios", icon: <FaUsers size={20} /> },
    { key: "reportes", label: "Reportes", icon: <FaFileAlt size={20} /> },
    { key: "auditoria", label: "Auditoría", icon: <FaShieldAlt size={20} /> }
  ];

  return (
    <SuperadminShell
      navItems={navItems}
      activeSection={section}
      onNavigate={setSection}
    >
        {section === "dashboard" && (
          <>
            <h1 className={cn("text-3xl md:text-4xl font-extrabold mb-4", theme.accentTextStrong)}>
              Dashboard global
            </h1>
            <form
              className="flex flex-wrap gap-3 items-end mb-6 bg-neutral-white rounded-2xl shadow-md p-4 border border-indigo-100"
              onSubmit={e => { e.preventDefault(); fetchStats(); }}
            >
              <div className="flex flex-col min-w-[140px]">
                <Label className="text-xs mb-1">Desde</Label>
                <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
              </div>
              <div className="flex flex-col min-w-[140px]">
                <Label className="text-xs mb-1">Hasta</Label>
                <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
              </div>
              <div className="flex flex-col min-w-[160px]">
                <Label className="text-xs mb-1">Rol</Label>
                <Select value={rol} onChange={e => setRol(e.target.value)}>
                  <option value="">Todos</option>
                  {rolesDisponibles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col min-w-[180px]">
                <Label className="text-xs mb-1">Institución</Label>
                <Select value={institucion} onChange={e => setInstitucion(e.target.value)}>
                  <option value="">Todas</option>
                  {institucionesDisponibles.map(i => (
                    <option key={i.id} value={i.id}>{i.nombre}</option>
                  ))}
                </Select>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Cargando..." : "Aplicar filtros"}
              </Button>
            </form>
            {/* CARDS KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex flex-col items-start bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm p-6">
                <div className="bg-indigo-600 text-white rounded-full p-3 mb-2">
                  <FaUsers size={28} />
                </div>
                <div className="text-4xl font-extrabold text-indigo-900">{stats?.usuarios ?? 0}</div>
                <div className="text-xs text-indigo-700 mt-1 font-medium">Usuarios</div>
              </div>
              <div className="flex flex-col items-start bg-primary/10 border border-primary/20 rounded-2xl shadow-sm p-6">
                <div className="bg-primary text-white rounded-full p-3 mb-2">
                  <FaShieldAlt size={28} />
                </div>
                <div className="text-4xl font-extrabold text-primary-dark">{stats?.perfiles ?? 0}</div>
                <div className="text-xs text-primary-dark mt-1 font-medium">Perfiles</div>
              </div>
              <div className="flex flex-col items-start bg-amber-50 border border-amber-100 rounded-2xl shadow-sm p-6">
                <div className="bg-status-warning text-white rounded-full p-3 mb-2">
                  <FaFileAlt size={28} />
                </div>
                <div className="text-4xl font-extrabold text-amber-900">{stats?.observaciones ?? 0}</div>
                <div className="text-xs text-amber-800 mt-1 font-medium">Observaciones</div>
              </div>
              <div className="flex flex-col items-start bg-secondary/15 border border-secondary/30 rounded-2xl shadow-sm p-6">
                <div className="bg-secondary text-white rounded-full p-3 mb-2">
                  <FaUniversity size={28} />
                </div>
                <div className="text-4xl font-extrabold text-secondary-dark">{stats?.instituciones ?? 0}</div>
                <div className="text-xs text-secondary-dark mt-1 font-medium">Instituciones</div>
              </div>
            </div>
            {/* Aquí puedes agregar más gráficos o cards, cada uno en su propia card visual */}
          </>
        )}
        {/* SECCIONES VACÍAS (para crecer tu sistema) */}
        {section === "instituciones" && (
          <div className="bg-neutral-white rounded-2xl shadow-lg p-8 border border-secondary/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className={cn("text-2xl font-bold flex items-center gap-2", instSection.accentText)}>
                <FaUniversity /> Gestión de instituciones
              </h2>
              <Button
                className={cn(instSection.btnPrimary, instSection.btnPrimaryHover)}
                onClick={abrirModalCrearInstitucion}
              >
                + Nueva institución
              </Button>
            </div>
            {institucionError && !showInstitucionModal && (
              <Alert variant="error">{institucionError}</Alert>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className={instSection.tableHead}>
                    <th className="px-3 py-2 text-left font-semibold">ID</th>
                    <th className="px-3 py-2 text-left font-semibold">Nombre</th>
                    <th className="px-3 py-2 text-left font-semibold">Tipo</th>
                    <th className="px-3 py-2 text-left font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {institucionesDisponibles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-gray-400">No hay instituciones registradas.</td>
                    </tr>
                  ) : (
                    institucionesDisponibles.map(inst => (
                      <tr key={inst.id} className={cn("border-b last:border-none", instSection.tableRowHover)}>
                        <td className="px-3 py-2">{inst.id}</td>
                        <td className="px-3 py-2">{inst.nombre}</td>
                        <td className="px-3 py-2">{inst.tipo?.replace(/_/g, " ") ?? "—"}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            className={cn(theme.link, "mr-2 text-sm font-medium disabled:opacity-50")}
                            onClick={() => abrirModalEditarInstitucion(inst)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="text-red-600 hover:underline disabled:opacity-50"
                            onClick={() => handleEliminarInstitucion(inst)}
                            disabled={eliminandoInstitucionId === inst.id || inst.tipo === "SISTEMA"}
                            title={inst.tipo === "SISTEMA" ? "No se puede eliminar la institución del sistema" : undefined}
                          >
                            {eliminandoInstitucionId === inst.id ? "Eliminando..." : "Eliminar"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Modal crear / editar institución */}
            <Modal
              open={showInstitucionModal}
              onClose={cerrarModalInstitucion}
              title={institucionModalMode === "edit" ? "Editar institución" : "Nueva institución"}
              footer={
                <>
                  <Button variant="secondary" onClick={cerrarModalInstitucion} disabled={institucionLoading}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    form="inst-form"
                    className={cn(instSection.btnPrimary, instSection.btnPrimaryHover)}
                    disabled={institucionLoading}
                  >
                    {institucionLoading
                      ? "Guardando..."
                      : institucionModalMode === "edit"
                        ? "Guardar cambios"
                        : "Crear"}
                  </Button>
                </>
              }
            >
              <form id="inst-form" onSubmit={handleGuardarInstitucion} className="space-y-4">
                <Field label="Nombre de la institución" required>
                  <Input
                    value={nuevaInstitucion}
                    onChange={e => setNuevaInstitucion(e.target.value)}
                    autoFocus
                    maxLength={100}
                    required
                  />
                </Field>
                <Field label="Tipo" required>
                  <Select
                    value={nuevoTipoInstitucion}
                    onChange={e => setNuevoTipoInstitucion(e.target.value as TipoInstitucion)}
                    required
                    disabled={nuevoTipoInstitucion === "SISTEMA"}
                  >
                    {(nuevoTipoInstitucion === "SISTEMA"
                      ? [{ value: "SISTEMA" as TipoInstitucion, label: "Sistema" }]
                      : TIPOS_INSTITUCION
                    ).map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </Select>
                  {nuevoTipoInstitucion === "SISTEMA" && (
                    <p className="text-xs text-neutral-gray-medium mt-1">
                      El tipo Sistema no se puede cambiar.
                    </p>
                  )}
                </Field>
                {institucionError && <Alert variant="error" className="mb-0">{institucionError}</Alert>}
              </form>
            </Modal>
          </div>
        )}
        {section === "usuarios" && (
          <UsuariosAdminSection
            instituciones={institucionesDisponibles.filter(i => i.tipo !== "SISTEMA")}
          />
        )}
        {section === "reportes" && <ReportesSection />}
        {section === "auditoria" && (
          <div className="bg-neutral-white rounded-2xl shadow-lg p-4 border border-indigo-100">
            <AuditoriaSection />
          </div>
        )}
    </SuperadminShell>
  );
};

export default DashboardSuperadmin;