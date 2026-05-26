import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession } from "../utils/auth";
import { UsuariosAdminSection } from "../components/UsuariosAdminSection";
import { ReportesSection } from "../components/ReportesSection";
import {
  FaChartBar,
  FaUniversity,
  FaUsers,
  FaFileAlt,
  FaShieldAlt,
  FaSignOutAlt,
  FaSyncAlt,
  FaFilter,
  FaUserCircle
} from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ==================== TIPOS AUDITORÍA ====================
type AuditoriaRegistro = {
  actor_usuario_id: string;
  accion: string;
  entidad: string;
  entidad_id: string;
  timestamp: string;
  ip: string;
};

type AuditoriaChartData = {
  accion: string;
  cantidad: number;
};

const AuditoriaSection: React.FC = () => {
  const [data, setData] = useState<AuditoriaRegistro[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accionFiltro, setAccionFiltro] = useState<string>("");
  const [usuarioFiltro, setUsuarioFiltro] = useState<string>("");
  const [fechaFiltro, setFechaFiltro] = useState<string>("");

  // Acciones únicas para filtro
  const accionesUnicas = Array.from(new Set(data.map(r => r.accion)));
  const usuariosUnicos = Array.from(new Set(data.map(r => r.actor_usuario_id)));

  // Fetch datos
  useEffect(() => {
    const fetchAuditoria = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/api/auth/superadmin/auditoria", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Error al obtener auditoría");
        const registros: AuditoriaRegistro[] = await res.json();
        setData(Array.isArray(registros) ? registros : []);
      } catch (e: unknown) {
        if (typeof e === "object" && e && "message" in e) {
          setError((e as { message?: string }).message ?? "Error desconocido");
        } else {
          setError("Error desconocido");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAuditoria();
  }, []);

  // Filtros
  const dataFiltrada = data
    .filter(r => !accionFiltro || r.accion === accionFiltro)
    .filter(r => !usuarioFiltro || r.actor_usuario_id === usuarioFiltro)
    .filter(r => !fechaFiltro || r.timestamp.startsWith(fechaFiltro));

  // Datos para gráfico
  const chartData: AuditoriaChartData[] = accionesUnicas.map(accion => ({
    accion,
    cantidad: dataFiltrada.filter(r => r.accion === accion).length
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2">
          <FaShieldAlt /> Auditoría del sistema
        </h2>
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1 bg-white rounded-xl shadow px-3 py-1">
            <FaFilter color="#60a5fa" size={18} />
            <select
              className="bg-transparent outline-none text-blue-700"
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
              className="bg-transparent outline-none text-blue-700"
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
            className="bg-white rounded-xl shadow px-3 py-1 text-blue-700 outline-none"
            value={fechaFiltro}
            onChange={e => setFechaFiltro(e.target.value)}
          />
          <button
            className="flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition-all shadow"
            onClick={() => { setAccionFiltro(""); setUsuarioFiltro(""); setFechaFiltro(""); }}
            title="Limpiar filtros"
          >
            <FaSyncAlt /> Limpiar
          </button>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white rounded-2xl shadow-lg p-4 w-full max-w-2xl mx-auto">
        <h3 className="font-semibold mb-2 text-blue-700">Acciones por tipo</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData ?? []} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="accion" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="cantidad" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-lg p-4 overflow-x-auto">
        <h3 className="font-semibold mb-2 text-blue-700">Registros de auditoría</h3>
        {loading ? (
          <div className="text-blue-600 py-8 text-center">Cargando auditoría...</div>
        ) : error ? (
          <div className="text-red-500 py-8 text-center">{error}</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-blue-50 text-blue-700">
                <th className="px-3 py-2 text-left font-semibold">Usuario</th>
                <th className="px-3 py-2 text-left font-semibold">Acción</th>
                <th className="px-3 py-2 text-left font-semibold">Entidad</th>
                <th className="px-3 py-2 text-left font-semibold">Fecha</th>
                <th className="px-3 py-2 text-left font-semibold">IP</th>
              </tr>
            </thead>
            <tbody>
              {dataFiltrada
                .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                .map((r, i) => (
                  <tr key={i} className="border-b last:border-none hover:bg-blue-50 transition-all">
                    <td className="px-3 py-2">{r.actor_usuario_id}</td>
                    <td className="px-3 py-2">{r.accion}</td>
                    <td className="px-3 py-2">{r.entidad}</td>
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
  const navigate = useNavigate();

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

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Fijo */}
      <aside className="w-64 min-h-screen bg-linear-to-b from-blue-50 via-white to-white shadow-xl rounded-r-2xl flex flex-col p-6 gap-2 border-r border-blue-100 sticky top-0">
        {/* Logo/Título */}
        <div className="flex items-center gap-3 mb-10 select-none">
          <div className="bg-blue-500 text-white rounded-full p-3 shadow-lg">
            <FaChartBar size={28} />
          </div>
          <span className="text-2xl font-extrabold text-blue-700 tracking-tight">TEA Link</span>
        </div>
        {/* Navegación */}
        <nav className="flex flex-col gap-1 flex-1">
          {([
            { key: "dashboard", label: "Dashboard", icon: <FaChartBar size={20} /> },
            { key: "instituciones", label: "Instituciones", icon: <FaUniversity size={20} /> },
            { key: "usuarios", label: "Usuarios", icon: <FaUsers size={20} /> },
            { key: "reportes", label: "Reportes", icon: <FaFileAlt size={20} /> },
            { key: "auditoria", label: "Auditoría", icon: <FaShieldAlt size={20} /> }
          ] as Array<{ key: string; label: string; icon: React.ReactNode }>).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`
                group flex items-center gap-3 px-3 py-2 rounded-xl font-semibold transition-all duration-300 cursor-pointer relative
                ${section === key ? "bg-blue-500 text-white shadow" : "text-blue-700 hover:bg-blue-100"}
              `}
            >
              <span className={`
                absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r bg-blue-500 transition-all duration-300
                ${section === key ? "opacity-100" : "opacity-0"}
              `} />
              <span className={`
                flex items-center justify-center rounded-full p-2
                ${section === key ? "bg-white text-blue-500" : "bg-blue-100 group-hover:bg-white group-hover:text-blue-500"}
                transition-all duration-300
              `}>
                {icon}
              </span>
              <span className="ml-1 text-base">{label}</span>
            </button>
          ))}
        </nav>
        {/* Logout fijo abajo */}
        <div className="mt-8 pt-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-all duration-300"
          >
            <span className="flex items-center justify-center rounded-full p-2 bg-red-100">
              <FaSignOutAlt size={20} />
            </span>
            <span className="ml-1">Cerrar sesión</span>
          </button>
        </div>
      </aside>
      {/* Contenido Principal */}
      <main className="flex-1 min-h-screen p-4 md:p-8 flex flex-col gap-8">
        {/* DASHBOARD */}
        {section === "dashboard" && (
          <>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-blue-800">Dashboard</h1>
            {/* FILTROS DASHBOARD */}
            <form
              className="flex flex-wrap gap-3 items-end mb-6 bg-white rounded-2xl shadow-md p-4"
              onSubmit={e => { e.preventDefault(); fetchStats(); }}
            >
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-blue-700 mb-1">Desde</label>
                <input
                  type="date"
                  className="rounded-xl border border-gray-200 px-3 py-2 shadow focus:outline-none"
                  value={desde}
                  onChange={e => setDesde(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-blue-700 mb-1">Hasta</label>
                <input
                  type="date"
                  className="rounded-xl border border-gray-200 px-3 py-2 shadow focus:outline-none"
                  value={hasta}
                  onChange={e => setHasta(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-blue-700 mb-1">Rol</label>
                <select
                  className="rounded-xl border border-gray-200 px-3 py-2 shadow focus:outline-none"
                  value={rol}
                  onChange={e => setRol(e.target.value)}
                >
                  <option value="">Todos</option>
                  {rolesDisponibles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-blue-700 mb-1">Institución</label>
                <select
                  className="rounded-xl border border-gray-200 px-3 py-2 shadow focus:outline-none"
                  value={institucion}
                  onChange={e => setInstitucion(e.target.value)}
                >
                  <option value="">Todas</option>
                  {institucionesDisponibles.map(i => (
                    <option key={i.id} value={i.id}>{i.nombre}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-all duration-300"
                disabled={loading}
              >
                {loading ? "Cargando..." : "Aplicar filtros"}
              </button>
            </form>
            {/* CARDS KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Usuarios */}
              <div className="flex flex-col items-start bg-linear-to-r from-blue-100 to-blue-300 rounded-2xl shadow-md p-6 hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer">
                <div className="bg-blue-500 text-white rounded-full p-3 mb-2 shadow">
                  <FaUsers size={32} />
                </div>
                <div className="text-4xl font-extrabold text-blue-800">
                  {stats?.usuarios ?? 0}
                </div>
                <div className="text-xs text-blue-700 mt-1">Usuarios</div>
              </div>
              {/* Perfiles */}
              <div className="flex flex-col items-start bg-linear-to-r from-cyan-100 to-indigo-200 rounded-2xl shadow-md p-6 hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer">
                <div className="bg-indigo-500 text-white rounded-full p-3 mb-2 shadow">
                  <FaShieldAlt size={32} />
                </div>
                <div className="text-4xl font-extrabold text-indigo-800">
                  {stats?.perfiles ?? 0}
                </div>
                <div className="text-xs text-indigo-700 mt-1">Perfiles</div>
              </div>
              {/* Observaciones */}
              <div className="flex flex-col items-start bg-linear-to-r from-yellow-100 to-yellow-300 rounded-2xl shadow-md p-6 hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer">
                <div className="bg-yellow-400 text-white rounded-full p-3 mb-2 shadow">
                  <FaFileAlt size={32} />
                </div>
                <div className="text-4xl font-extrabold text-yellow-700">
                  {stats?.observaciones ?? 0}
                </div>
                <div className="text-xs text-yellow-700 mt-1">Observaciones</div>
              </div>
              {/* Instituciones */}
              <div className="flex flex-col items-start bg-linear-to-r from-green-100 to-green-300 rounded-2xl shadow-md p-6 hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer">
                <div className="bg-green-500 text-white rounded-full p-3 mb-2 shadow">
                  <FaUniversity size={32} />
                </div>
                <div className="text-4xl font-extrabold text-green-800">
                  {stats?.instituciones ?? 0}
                </div>
                <div className="text-xs text-green-700 mt-1">Instituciones</div>
              </div>
            </div>
            {/* Aquí puedes agregar más gráficos o cards, cada uno en su propia card visual */}
          </>
        )}
        {/* SECCIONES VACÍAS (para crecer tu sistema) */}
        {section === "instituciones" && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
                <FaUniversity /> Gestión de instituciones
              </h2>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-all shadow"
                onClick={abrirModalCrearInstitucion}
              >
                + Nueva institución
              </button>
            </div>
            {institucionError && !showInstitucionModal && (
              <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {institucionError}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-green-50 text-green-700">
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
                      <tr key={inst.id} className="border-b last:border-none hover:bg-green-50 transition-all">
                        <td className="px-3 py-2">{inst.id}</td>
                        <td className="px-3 py-2">{inst.nombre}</td>
                        <td className="px-3 py-2">{inst.tipo?.replace(/_/g, " ") ?? "—"}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            className="text-blue-600 hover:underline mr-2 disabled:opacity-50"
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
            {showInstitucionModal && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative animate-fade-in">
                  <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl font-bold"
                    onClick={cerrarModalInstitucion}
                    aria-label="Cerrar"
                  >×</button>
                  <h3 className="text-xl font-bold mb-4 text-blue-700">
                    {institucionModalMode === "edit" ? "Editar institución" : "Nueva institución"}
                  </h3>
                  <form onSubmit={handleGuardarInstitucion} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-blue-700">Nombre de la institución</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 shadow focus:outline-none"
                        value={nuevaInstitucion}
                        onChange={e => setNuevaInstitucion(e.target.value)}
                        autoFocus
                        maxLength={100}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-blue-700">Tipo</label>
                      <select
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 shadow focus:outline-none disabled:bg-gray-100"
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
                      </select>
                      {nuevoTipoInstitucion === "SISTEMA" && (
                        <p className="text-xs text-gray-500 mt-1">El tipo Sistema no se puede cambiar.</p>
                      )}
                    </div>
                    {institucionError && <div className="text-red-500 text-sm">{institucionError}</div>}
                    <div className="flex gap-2 justify-end mt-4">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
                        onClick={cerrarModalInstitucion}
                        disabled={institucionLoading}
                      >Cancelar</button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-all shadow"
                        disabled={institucionLoading}
                      >
                        {institucionLoading
                          ? "Guardando..."
                          : institucionModalMode === "edit"
                            ? "Guardar cambios"
                            : "Crear"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
        {section === "usuarios" && (
          <UsuariosAdminSection
            instituciones={institucionesDisponibles.filter(i => i.tipo !== "SISTEMA")}
          />
        )}
        {section === "reportes" && <ReportesSection />}
        {section === "auditoria" && <div className="bg-white rounded-2xl shadow-lg p-4"><AuditoriaSection /></div>}
      </main>
    </div>
  );
};

export default DashboardSuperadmin;