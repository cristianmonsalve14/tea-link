import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaPlus, FaSearch, FaTrash } from "react-icons/fa";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { Label } from "../ui/Label";
import { Select } from "../ui/Select";
import { ScrollableTable } from "../ui/ScrollableTable";
import { dataTable, filterFieldMinWidth } from "../ui/dataTable";
import { cn } from "../../theme/cn";
import { getSectionTheme } from "../../theme/roleTheme";
import { etiquetaTipoInstitucion } from "../../utils/institucionContacto";
import { parseApiError } from "../../utils/parseApiError";
import { RegionChileSelect } from "../instituciones/RegionChileSelect";
import { ComunaChileSelect } from "../instituciones/ComunaChileSelect";
import type { RegionChile } from "../../utils/regionChile";
import { SuperadminPageHeader } from "./SuperadminPageHeader";
import { SuperadminFilterBar, type FilterChip } from "./SuperadminFilterBar";
import { SuperadminBadge } from "./SuperadminBadge";
import { useSuperadminInstituciones, type SuperadminInstitucion } from "./SuperadminInstitucionesContext";
import { SUPERADMIN_BASE } from "./nav";

const TIPOS_INSTITUCION_FILTRO = [
  { value: "", label: "Todos los tipos" },
  { value: "FAMILIA", label: "Familia" },
  { value: "CENTRO_EDUCACIONAL", label: "Centro educacional" },
  { value: "CENTRO_MEDICO", label: "Centro médico" },
  { value: "CENTRO_PROFESIONAL", label: "Centro profesional" },
  { value: "SISTEMA", label: "Sistema" }
] as const;

const ORIGEN_INSTITUCION_FILTRO = [
  { value: "", label: "Todos los orígenes" },
  { value: "oficial", label: "Catálogo oficial" },
  { value: "manual", label: "Ingreso manual" }
] as const;

function coincideBusquedaInstitucion(inst: SuperadminInstitucion, q: string): boolean {
  if (!q) return true;
  const tipoLabel = inst.tipo ? etiquetaTipoInstitucion(inst.tipo).toLowerCase() : "";
  const haystack = [
    inst.nombre,
    inst.tipo,
    tipoLabel,
    inst.codigo_externo,
    inst.catalogo_fuente,
    inst.ubicacion_label,
    inst.region_label,
    inst.comuna,
    inst.email_contacto,
    inst.telefono_contacto,
    String(inst.id)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function coincideUbicacionInst(
  inst: { region?: string | null; comuna?: string | null },
  region: string,
  comuna: string
): boolean {
  if (region && inst.region !== region) return false;
  if (comuna && inst.comuna !== comuna) return false;
  return true;
}

export function SuperadminInstitucionesSection() {
  const navigate = useNavigate();
  const instSection = getSectionTheme("institutions");
  const { instituciones, refresh } = useSuperadminInstituciones();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroOrigen, setFiltroOrigen] = useState("");
  const [filtroRegion, setFiltroRegion] = useState<RegionChile | "">("");
  const [filtroComuna, setFiltroComuna] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  const q = busqueda.trim().toLowerCase();

  const filtradas = useMemo(() => {
    return instituciones.filter(inst => {
      if (filtroTipo && inst.tipo !== filtroTipo) return false;
      if (filtroOrigen === "manual" && !inst.registro_manual) return false;
      if (filtroOrigen === "oficial" && inst.registro_manual) return false;
      if (!coincideUbicacionInst(inst, filtroRegion, filtroComuna)) return false;
      return coincideBusquedaInstitucion(inst, q);
    });
  }, [instituciones, filtroTipo, filtroOrigen, filtroRegion, filtroComuna, q]);

  const chips = useMemo((): FilterChip[] => {
    const list: FilterChip[] = [];
    if (filtroTipo) {
      const t = TIPOS_INSTITUCION_FILTRO.find(x => x.value === filtroTipo);
      if (t) list.push({ key: "tipo", label: t.label });
    }
    if (filtroOrigen) {
      const o = ORIGEN_INSTITUCION_FILTRO.find(x => x.value === filtroOrigen);
      if (o) list.push({ key: "origen", label: o.label });
    }
    if (filtroRegion) list.push({ key: "region", label: `Región: ${filtroRegion}` });
    if (filtroComuna) list.push({ key: "comuna", label: `Comuna: ${filtroComuna}` });
    return list;
  }, [filtroTipo, filtroOrigen, filtroRegion, filtroComuna]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroTipo("");
    setFiltroOrigen("");
    setFiltroRegion("");
    setFiltroComuna("");
  };

  const removeChip = (key: string) => {
    if (key === "tipo") setFiltroTipo("");
    if (key === "origen") setFiltroOrigen("");
    if (key === "region") {
      setFiltroRegion("");
      setFiltroComuna("");
    }
    if (key === "comuna") setFiltroComuna("");
  };

  const handleEliminar = async (inst: SuperadminInstitucion) => {
    if (inst.tipo === "SISTEMA") return;
    if (!window.confirm(`¿Eliminar la institución "${inst.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setEliminandoId(inst.id);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/api/auth/institucion/${inst.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(parseApiError(data, "Error al eliminar institución"));
        return;
      }
      await refresh();
    } catch {
      setError("Error de red al eliminar");
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <>
      <SuperadminPageHeader
        title="Instituciones"
        description="Directorio nacional de familias, centros educacionales, médicos y terapéuticos incorporados a TEA Link."
        action={
          <Button
            onClick={() => navigate(`${SUPERADMIN_BASE}/instituciones/nueva`)}
            className={cn(instSection.btnPrimary, instSection.btnPrimaryHover)}
          >
            <FaPlus /> Nueva institución
          </Button>
        }
      />

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <SuperadminFilterBar
        className="mb-6"
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar por nombre, RBD/código, ubicación o contacto..."
        chips={chips}
        onRemoveChip={removeChip}
        onClearAll={limpiarFiltros}
        filteredCount={filtradas.length}
        totalCount={instituciones.length}
        entityLabel="instituciones"
        advanced={
          <>
            <div className={filterFieldMinWidth.tipo}>
              <Label className="text-xs mb-1 text-slate-600">Tipo</Label>
              <Select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                {TIPOS_INSTITUCION_FILTRO.map(t => (
                  <option key={t.value || "all"} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className={filterFieldMinWidth.tipo}>
              <Label className="text-xs mb-1 text-slate-600">Origen</Label>
              <Select value={filtroOrigen} onChange={e => setFiltroOrigen(e.target.value)}>
                {ORIGEN_INSTITUCION_FILTRO.map(o => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <RegionChileSelect
              value={filtroRegion}
              onChange={value => {
                setFiltroRegion(value);
                setFiltroComuna("");
              }}
            />
            <ComunaChileSelect
              region={filtroRegion}
              value={filtroComuna}
              onChange={setFiltroComuna}
            />
          </>
        }
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <ScrollableTable>
          <table className={dataTable.table}>
            <thead>
              <tr className={cn(instSection.tableHead, "text-xs uppercase tracking-wide")}>
                <th className={dataTable.th}>Institución</th>
                <th className={dataTable.th}>Tipo</th>
                <th className={dataTable.th}>Ubicación</th>
                <th className={dataTable.th}>Contacto</th>
                <th className={cn(dataTable.th, "text-right")}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {instituciones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-slate-400">
                    No hay instituciones registradas.
                  </td>
                </tr>
              ) : filtradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-slate-400">
                    <FaSearch className="mx-auto mb-2 opacity-40" size={24} />
                    Sin resultados con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filtradas.map(inst => (
                  <tr
                    key={inst.id}
                    className={cn("border-b border-slate-100 last:border-none", instSection.tableRowHover)}
                  >
                    <td className={dataTable.td}>
                      <div className="font-medium text-slate-900">{inst.nombre}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-slate-400 font-mono">#{inst.id}</span>
                        {!inst.registro_manual && inst.codigo_externo && (
                          <SuperadminBadge tone="info">
                            {inst.catalogo_fuente === "MINEDUC_ESCOLAR" ? "RBD" : "DEIS"}{" "}
                            {inst.codigo_externo}
                          </SuperadminBadge>
                        )}
                        {inst.registro_manual && (
                          <SuperadminBadge tone="neutral">Ingreso manual</SuperadminBadge>
                        )}
                      </div>
                    </td>
                    <td className={dataTable.td}>
                      <SuperadminBadge tone="default">
                        {inst.tipo ? etiquetaTipoInstitucion(inst.tipo) : "—"}
                      </SuperadminBadge>
                    </td>
                    <td className={dataTable.td}>
                      <span className="text-sm text-slate-600">{inst.ubicacion_label ?? "—"}</span>
                    </td>
                    <td className={dataTable.td}>
                      <div className="text-xs text-slate-500 space-y-0.5">
                        {inst.email_contacto && <p>{inst.email_contacto}</p>}
                        {inst.telefono_contacto && <p>{inst.telefono_contacto}</p>}
                        {!inst.email_contacto && !inst.telefono_contacto && "—"}
                      </div>
                    </td>
                    <td className={cn(dataTable.td, "text-right whitespace-nowrap")}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`${SUPERADMIN_BASE}/instituciones/${inst.id}/editar`)}
                      >
                        <FaEdit /> Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleEliminar(inst)}
                        disabled={eliminandoId === inst.id || inst.tipo === "SISTEMA"}
                      >
                        <FaTrash />
                        {eliminandoId === inst.id ? "..." : "Eliminar"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollableTable>
      </div>
    </>
  );
}
