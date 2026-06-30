import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFileAlt,
  FaPlus,
  FaUniversity,
  FaUsers,
  FaUserShield
} from "react-icons/fa";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Select } from "../../components/ui/Select";
import { SuperadminPageHeader } from "../../components/superadmin/SuperadminPageHeader";
import { SuperadminKpiCard } from "../../components/superadmin/SuperadminKpiCard";
import { SuperadminActivityFeed, type ActividadItem } from "../../components/superadmin/SuperadminActivityFeed";
import { SuperadminFilterBar } from "../../components/superadmin/SuperadminFilterBar";
import { useSuperadminInstituciones } from "../../components/superadmin/SuperadminInstitucionesContext";
import { SUPERADMIN_BASE } from "../../components/superadmin/nav";

type Overview = {
  kpis: { usuarios: number; perfiles: number; observaciones: number; instituciones: number };
  totales: { usuarios: number; perfiles: number; observaciones: number; instituciones: number };
  usuariosPorRol: { rol: string; cantidad: number }[];
  actividadReciente: ActividadItem[];
};

const ROLES_FILTRO = [
  "FAMILIA",
  "EDUCADOR",
  "PROFESIONAL",
  "ADMINISTRADOR",
  "MEDICO",
  "SUPERADMIN"
] as const;

const CHART_COLORS = ["#4f46e5", "#7c3aed", "#0891b2", "#059669", "#d97706", "#64748b"];

const QUICK_ACTIONS = [
  {
    label: "Nueva institución",
    icon: FaUniversity,
    path: `${SUPERADMIN_BASE}/instituciones/nueva`,
    tone: "bg-indigo-600 hover:bg-indigo-700"
  },
  {
    label: "Administradores",
    icon: FaUsers,
    path: `${SUPERADMIN_BASE}/usuarios`,
    tone: "bg-violet-600 hover:bg-violet-700"
  },
  {
    label: "Auditoría",
    icon: FaUserShield,
    path: `${SUPERADMIN_BASE}/auditoria`,
    tone: "bg-slate-700 hover:bg-slate-800"
  }
] as const;

export default function SuperadminDashboardPage() {
  const navigate = useNavigate();
  const { institucionesOperativas } = useSuperadminInstituciones();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [rol, setRol] = useState("");
  const [institucion, setInstitucion] = useState("");
  const [instBusqueda, setInstBusqueda] = useState("");

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      if (rol) params.set("rol", rol);
      if (institucion) params.set("institucion", institucion);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/api/auth/superadmin/overview?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("No se pudo cargar el resumen");
      setOverview(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar datos");
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [desde, hasta, rol, institucion]);

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  const hayFiltros = Boolean(desde || hasta || rol || institucion);

  const institucionesSelect = useMemo(() => {
    const q = instBusqueda.trim().toLowerCase();
    const base = institucionesOperativas;
    if (!q) return base.slice(0, 150);
    return base.filter(i => i.nombre.toLowerCase().includes(q)).slice(0, 150);
  }, [institucionesOperativas, instBusqueda]);

  const subtitleKpi = (filtered: number, total: number) =>
    hayFiltros && filtered !== total ? `de ${total.toLocaleString("es-CL")} en total` : undefined;

  return (
    <>
      <SuperadminPageHeader
        title="Panel ejecutivo"
        description="Visión global de usuarios, perfiles, observaciones e instituciones en la plataforma TEA Link."
      />

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.path}
            type="button"
            onClick={() => navigate(action.path)}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-sm transition-colors ${action.tone}`}
          >
            <action.icon size={16} />
            {action.label}
          </button>
        ))}
      </div>

      <SuperadminFilterBar
        className="mb-6"
        chips={hayFiltros ? [{ key: "periodo", label: "Filtros de período activos" }] : []}
        onRemoveChip={() => {
          setDesde("");
          setHasta("");
          setRol("");
          setInstitucion("");
          setInstBusqueda("");
        }}
        onClearAll={() => {
          setDesde("");
          setHasta("");
          setRol("");
          setInstitucion("");
          setInstBusqueda("");
        }}
        actions={
          <Button type="button" onClick={() => void fetchOverview()} disabled={loading}>
            {loading ? "Actualizando..." : "Aplicar filtros"}
          </Button>
        }
        advanced={
          <>
            <div>
              <Label className="text-xs mb-1 text-slate-600">Desde</Label>
              <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 text-slate-600">Hasta</Label>
              <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 text-slate-600">Rol</Label>
              <Select value={rol} onChange={e => setRol(e.target.value)}>
                <option value="">Todos los roles</option>
                {ROLES_FILTRO.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs mb-1 text-slate-600">Buscar institución</Label>
              <Input
                value={instBusqueda}
                onChange={e => setInstBusqueda(e.target.value)}
                placeholder="Nombre de la institución..."
                className="mb-2"
              />
              <Select value={institucion} onChange={e => setInstitucion(e.target.value)}>
                <option value="">Todas las instituciones</option>
                {institucionesSelect.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.nombre}
                  </option>
                ))}
              </Select>
            </div>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <SuperadminKpiCard
          label="Usuarios"
          value={overview?.kpis.usuarios ?? 0}
          loading={loading}
          accent="indigo"
          subtitle={overview ? subtitleKpi(overview.kpis.usuarios, overview.totales.usuarios) : undefined}
          icon={<FaUsers size={22} />}
          onClick={() => navigate(`${SUPERADMIN_BASE}/usuarios`)}
        />
        <SuperadminKpiCard
          label="Perfiles TEA"
          value={overview?.kpis.perfiles ?? 0}
          loading={loading}
          accent="violet"
          subtitle={overview ? subtitleKpi(overview.kpis.perfiles, overview.totales.perfiles) : undefined}
          icon={<FaUserShield size={22} />}
          onClick={() => navigate(`${SUPERADMIN_BASE}/perfiles`)}
        />
        <SuperadminKpiCard
          label="Observaciones"
          value={overview?.kpis.observaciones ?? 0}
          loading={loading}
          accent="amber"
          subtitle={
            overview ? subtitleKpi(overview.kpis.observaciones, overview.totales.observaciones) : undefined
          }
          icon={<FaFileAlt size={22} />}
        />
        <SuperadminKpiCard
          label="Instituciones"
          value={overview?.kpis.instituciones ?? 0}
          loading={loading}
          accent="emerald"
          subtitle={
            overview ? subtitleKpi(overview.kpis.instituciones, overview.totales.instituciones) : undefined
          }
          icon={<FaUniversity size={22} />}
          onClick={() => navigate(`${SUPERADMIN_BASE}/instituciones`)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-semibold text-slate-900">Usuarios por rol</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {hayFiltros ? "Con filtros de período e institución aplicados" : "Distribución actual del sistema"}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => navigate(`${SUPERADMIN_BASE}/instituciones/nueva`)}>
              <FaPlus /> Alta rápida
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={overview?.usuariosPorRol ?? []}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis
                type="category"
                dataKey="rol"
                width={110}
                tick={{ fontSize: 11, fill: "#334155" }}
              />
              <Tooltip
                formatter={(v: number) => [v.toLocaleString("es-CL"), "Usuarios"]}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Bar dataKey="cantidad" radius={[0, 6, 6, 0]} barSize={22}>
                {(overview?.usuariosPorRol ?? []).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="xl:col-span-2">
          <SuperadminActivityFeed
            items={overview?.actividadReciente ?? []}
            loading={loading}
            className="h-full"
          />
        </div>
      </div>
    </>
  );
}
