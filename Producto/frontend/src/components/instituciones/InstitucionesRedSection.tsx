import { useCallback, useEffect, useMemo, useState } from "react";
import { FaHandshake, FaSearch } from "react-icons/fa";
import { Card } from "../ui/Card";
import { Alert } from "../ui/Alert";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { filterFieldMinWidth } from "../ui/dataTable";
import { parseApiError } from "../../utils/parseApiError";
import {
  etiquetaTipoInstitucion,
  TIPOS_INSTITUCION_RED,
  type InstitucionContacto,
  type TipoInstitucionRed
} from "../../utils/institucionContacto";
import { InstitucionContactoCard } from "./InstitucionContactoCard";
import { RegionChileSelect } from "./RegionChileSelect";
import { ComunaChileSelect } from "./ComunaChileSelect";
import type { RegionChile } from "../../utils/regionChile";

type InstitucionRed = InstitucionContacto & { vinculos: number };

type Paginacion = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ResumenRed = {
  total: number;
  filtrados: number;
};

export function InstitucionesRedSection() {
  const [instituciones, setInstituciones] = useState<InstitucionRed[]>([]);
  const [paginacion, setPaginacion] = useState<Paginacion | null>(null);
  const [resumen, setResumen] = useState<ResumenRed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoInstitucionRed | "">("");
  const [filtroRegion, setFiltroRegion] = useState<RegionChile | "">("");
  const [filtroComuna, setFiltroComuna] = useState("");
  const [pagina, setPagina] = useState(1);

  const hayFiltros = Boolean(busqueda.trim() || filtroTipo || filtroRegion || filtroComuna);

  const tituloResumen = useMemo(() => {
    if (!resumen) return null;
    const partes = [`${resumen.total} en la red`];
    if (hayFiltros && resumen.filtrados !== resumen.total) {
      partes.push(`${resumen.filtrados} coinciden`);
    }
    return partes.join(" · ");
  }, [resumen, hayFiltros]);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pagina),
        limit: "12"
      });
      if (busqueda.trim()) params.set("q", busqueda.trim());
      if (filtroTipo) params.set("tipo", filtroTipo);
      if (filtroRegion) params.set("region", filtroRegion);
      if (filtroComuna) params.set("comuna", filtroComuna);

      const res = await fetch(
        `http://localhost:3000/api/perfiles/instituciones-red?${params.toString()}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiError(data, "No se pudieron cargar instituciones vinculadas"));
        return;
      }
      setInstituciones(data.instituciones ?? []);
      setPaginacion(data.paginacion ?? null);
      setResumen(data.resumen ?? null);
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }, [busqueda, filtroTipo, filtroRegion, filtroComuna, pagina]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setBusqueda(busquedaInput);
      setPagina(1);
    }, 350);
    return () => window.clearTimeout(t);
  }, [busquedaInput]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <Card
      title={
        <span className="flex items-center gap-2 flex-wrap">
          <FaHandshake />
          Instituciones vinculadas — contacto
          {tituloResumen && (
            <span className="text-sm font-normal text-neutral-gray-medium">
              — {tituloResumen}
            </span>
          )}
        </span>
      }
      description="Datos de contacto de otras instituciones con las que comparte perfiles en TEA Link. Filtre por región, comuna o busque por nombre."
    >
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <div className="min-w-0">
          <Field label="Buscar institución">
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-gray-medium pointer-events-none"
                aria-hidden
              >
                <FaSearch />
              </span>
              <Input
                type="search"
                placeholder="Nombre, email, teléfono o dirección..."
                value={busquedaInput}
                onChange={e => setBusquedaInput(e.target.value)}
                className="pl-10"
                aria-label="Buscar institución vinculada"
              />
            </div>
          </Field>
        </div>
        <div className={filterFieldMinWidth.tipo}>
          <Field label="Tipo">
            <Select
              value={filtroTipo}
              onChange={e => {
                setFiltroTipo(e.target.value as typeof filtroTipo);
                setPagina(1);
              }}
            >
              <option value="">Todos los tipos</option>
              {TIPOS_INSTITUCION_RED.map(t => (
                <option key={t} value={t}>
                  {etiquetaTipoInstitucion(t)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <RegionChileSelect
          value={filtroRegion}
          onChange={value => {
            setFiltroRegion(value);
            setFiltroComuna("");
            setPagina(1);
          }}
        />
        <ComunaChileSelect
          region={filtroRegion}
          value={filtroComuna}
          onChange={value => {
            setFiltroComuna(value);
            setPagina(1);
          }}
        />
      </div>

      {loading && <p className="text-sm text-neutral-gray-medium">Cargando...</p>}

      {!loading && (resumen?.total ?? 0) === 0 && (
        <p className="text-sm text-neutral-gray-medium">
          Aún no hay instituciones vinculadas por colaboración. Cuando invite o acepte
          colaboraciones, verá aquí sus datos de contacto.
        </p>
      )}

      {!loading && (resumen?.total ?? 0) > 0 && instituciones.length === 0 && (
        <p className="text-sm text-neutral-gray-medium">
          No hay instituciones que coincidan con la búsqueda o el filtro seleccionado.
        </p>
      )}

      {!loading && instituciones.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {instituciones.map(inst => (
            <div
              key={inst.id}
              className="rounded-xl border border-neutral-gray-medium/20 p-4 bg-neutral-gray-light/30"
            >
              <InstitucionContactoCard institucion={inst} />
              {inst.vinculos > 1 && (
                <p className="text-xs text-neutral-gray-medium mt-2">
                  {inst.vinculos} vínculos de colaboración
                </p>
              )}
            </div>
          ))}
        </div>
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
            {paginacion.total > 0 &&
              ` · ${paginacion.total} resultado${paginacion.total !== 1 ? "s" : ""}`}
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
  );
}
