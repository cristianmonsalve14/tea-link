import { useCallback, useEffect, useState } from "react";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { UbicacionInstitucionFields } from "./UbicacionInstitucionFields";
import type { RegionChile } from "../../utils/regionChile";
import { parseApiError } from "../../utils/parseApiError";
import { cn } from "../../theme/cn";

const API_BASE = "http://localhost:3000/api/catalogos";
export type CatalogoEstablecimientoItem = {
  id: number;
  fuente: string;
  ambito: "EDUCACION" | "SALUD" | "TERAPEUTICO";
  ambito_label: string;
  codigo_externo: string;
  codigo_label: string;
  nombre: string;
  tipo_oficial: string | null;
  tipo_oficial_label: string;
  region: RegionChile | null;
  comuna: string | null;
  localidad: string | null;
  direccion: string | null;
  dependencia: string | null;
  sostenedor: string | null;
  tiene_pie: boolean;
  es_escuela_especial: boolean;
  ya_incorporado: boolean;
  tipo_sugerido: string;
};

type Props = {
  onSeleccionar: (item: CatalogoEstablecimientoItem) => void;
  seleccionadoId?: number | null;
  layout?: "modal" | "page";
};

function mensajeErrorCatalogo(res: Response, data: Record<string, unknown>): string {
  if (res.status === 401 || res.status === 403) {
    return "Sesión expirada o sin permisos de superadmin. Vuelva a iniciar sesión.";
  }
  if (res.status === 404) {
    return "El servidor no expone el catálogo. Reinicie el backend (npm run dev) tras aplicar migraciones.";
  }
  if (res.status >= 500) {
    return parseApiError(data, "Error del servidor al consultar el catálogo.");
  }
  return parseApiError(data, "Catálogo no disponible. Ejecute npm run catalog:import en el backend.");
}
const TIPOS_EDUCACION = [
  { value: "", label: "Todos (educación escolar)" },
  { value: "colegio", label: "Colegio" },
  { value: "liceo", label: "Liceo" },
  { value: "escuela", label: "Escuela" },
  { value: "escuela_especial", label: "Escuela especial" },
  { value: "jardin_infantil", label: "Jardín infantil" },
  { value: "centro_educacional", label: "Centro educacional" },
  { value: "corporacion", label: "Corporación / fundación" },
  { value: "universidad", label: "Universidad (pocos en directorio escolar)" },
  { value: "instituto_profesional", label: "Instituto profesional (casi no en RBD escolar)" },
  { value: "formacion_tecnica", label: "Formación técnica / CFT (casi no en RBD escolar)" }
];

const TIPOS_IES_ESCOLAR = new Set(["universidad", "instituto_profesional", "formacion_tecnica"]);

const TIPOS_SALUD = [
  { value: "", label: "Todos (salud)" },
  { value: "hospital", label: "Hospital" },
  { value: "clinica", label: "Clínica" },
  { value: "centro_medico", label: "Centro médico" },
  { value: "consultorio_aps", label: "Consultorio / CESFAM" },
  { value: "urgencia", label: "Urgencia / SAPU" },
  { value: "laboratorio", label: "Laboratorio" },
  { value: "centro_terapeutico", label: "Centro terapéutico" },
  { value: "establecimiento_salud", label: "Otro establecimiento de salud" }
];

export function CatalogoInstitucionBusqueda({
  onSeleccionar,
  seleccionadoId,
  layout = "modal"
}: Props) {  const [ambito, setAmbito] = useState<"EDUCACION" | "SALUD" | "TERAPEUTICO">("EDUCACION");
  const [q, setQ] = useState("");
  const [tipoOficial, setTipoOficial] = useState("");
  const [soloConCodigo, setSoloConCodigo] = useState(true);
  const [tienePie, setTienePie] = useState(false);
  const [esEspecial, setEsEspecial] = useState(false);
  const [ubicacion, setUbicacion] = useState<{
    region: RegionChile | "";
    comuna: string;
    localidad: string;
  }>({ region: "", comuna: "", localidad: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [totales, setTotales] = useState<{ educacion: number; salud: number; terapeutico: number } | null>(
    null
  );
  const [resultados, setResultados] = useState<CatalogoEstablecimientoItem[]>([]);
  const [paginacion, setPaginacion] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/meta`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMetaError(mensajeErrorCatalogo(res, data));
          return;
        }
        const tot = data.totales ?? null;
        setTotales(tot);
        const totalCargado =
          (tot?.educacion ?? 0) + (tot?.salud ?? 0) + (tot?.terapeutico ?? 0);
        if (totalCargado === 0) {
          setMetaError(
            "Catálogo vacío en la base de datos. En el backend ejecute: npm run catalog:import"
          );
        }
      })
      .catch(() => {
        setMetaError(
          "No se pudo conectar con el backend en localhost:3000. Verifique que npm run dev esté activo."
        );
      });
  }, []);
  const buscar = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams();
        params.set("ambito", ambito);
        params.set("page", String(page));
        params.set("limit", "20");
        params.set("excluir_incorporados", "true");
        if (q.trim()) params.set("q", q.trim());
        if (tipoOficial) params.set("tipo_oficial", tipoOficial);
        if (soloConCodigo) params.set("solo_con_codigo", "true");
        if (tienePie) params.set("tiene_pie", "true");
        if (esEspecial) params.set("es_escuela_especial", "true");
        if (ubicacion.region) params.set("region", ubicacion.region);
        if (ubicacion.comuna.trim()) params.set("comuna", ubicacion.comuna.trim());
        if (ubicacion.localidad.trim()) params.set("localidad", ubicacion.localidad.trim());

        const res = await fetch(`${API_BASE}/establecimientos?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(mensajeErrorCatalogo(res, data));          setResultados([]);
          return;
        }
        setResultados(data.resultados ?? []);
        setPaginacion(data.paginacion ?? { page: 1, totalPages: 1, total: 0 });
      } catch {
        setError("Error de red al buscar catálogo");
        setResultados([]);
      } finally {
        setLoading(false);
      }
    },
    [ambito, q, tipoOficial, soloConCodigo, tienePie, esEspecial, ubicacion]
  );

  useEffect(() => {
    void buscar(1);
  }, [ambito, buscar]);

  const tiposOptions = ambito === "EDUCACION" ? TIPOS_EDUCACION : TIPOS_SALUD;

  return (
    <div
      className={cn(
        "space-y-4 border border-primary/20 rounded-xl bg-primary/5",
        layout === "page" ? "p-5 sm:p-6 shadow-sm" : "p-4"
      )}
    >      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-gray">Catálogo oficial (MINEDUC / MINSAL-DEIS)</p>
          {totales && (
            <p className="text-xs text-neutral-gray-medium">
              Cargados: {totales.educacion.toLocaleString("es-CL")} educación ·{" "}
              {totales.salud.toLocaleString("es-CL")} salud ·{" "}
              {totales.terapeutico.toLocaleString("es-CL")} terapéutico
            </p>
          )}
        </div>
      </div>

      {metaError && <Alert variant="warning">{metaError}</Alert>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Ámbito">
          <Select
            value={ambito}
            onChange={e => {
              setAmbito(e.target.value as typeof ambito);
              setTipoOficial("");
            }}
            className="text-base"
          >
            <option value="EDUCACION">Educación (RBD)</option>
            <option value="SALUD">Salud (hospitales, clínicas…)</option>
            <option value="TERAPEUTICO">Terapéutico / rehabilitación</option>
          </Select>
        </Field>
        <Field label="Buscar (nombre, comuna, RBD o código)">
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Ej: Altavida, 14799, Hospital..."
            className="text-base"
          />
        </Field>
      </div>

      <Field label="Tipo de establecimiento">
        <Select
          value={tipoOficial}
          onChange={e => setTipoOficial(e.target.value)}
          className="text-base w-full"
          title={
            tiposOptions.find(t => t.value === tipoOficial)?.label ??
            tiposOptions[0]?.label
          }
        >
          {tiposOptions.map(t => (
            <option key={t.value || "all"} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        {ambito === "EDUCACION" && tipoOficial && TIPOS_IES_ESCOLAR.has(tipoOficial) && (
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            El directorio MINEDUC escolar (RBD) casi no incluye universidades, IP o CFT. Use
            colegio/liceo o el modo <strong>Ingreso manual</strong> para Duoc y otras IES.
          </p>
        )}
      </Field>

      <UbicacionInstitucionFields value={ubicacion} onChange={setUbicacion} />

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={soloConCodigo}
            onChange={e => setSoloConCodigo(e.target.checked)}
          />
          Solo con código oficial
        </label>
        {ambito === "EDUCACION" && (
          <>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={tienePie} onChange={e => setTienePie(e.target.checked)} />
              Con PIE
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={esEspecial}
                onChange={e => setEsEspecial(e.target.checked)}
              />
              Escuela especial
            </label>
          </>
        )}
      </div>

      <Button type="button" variant="secondary" onClick={() => void buscar(1)} disabled={loading}>
        {loading ? "Buscando..." : "Buscar en catálogo"}
      </Button>

      {error && <Alert variant="error">{error}</Alert>}

      <div
        className={cn(
          "overflow-y-auto space-y-2",
          layout === "page" ? "max-h-[min(70vh,42rem)]" : "max-h-64"
        )}
      >        {resultados.length === 0 && !loading && (
          <div className="text-sm text-neutral-gray-medium space-y-1">
            <p>Sin resultados con los filtros actuales.</p>
            {tipoOficial && TIPOS_IES_ESCOLAR.has(tipoOficial) && (
              <p>
                Las IES (universidad, IP, CFT) no están en el catálogo escolar RBD. Pruebe sin ese
                filtro o use ingreso manual.
              </p>
            )}
            {(ubicacion.comuna || tipoOficial) && (
              <p>Pruebe quitar comuna o tipo, o busque por nombre o RBD en el campo de texto.</p>
            )}
          </div>
        )}
        {resultados.map(item => (
          <button
            key={item.id}
            type="button"
            disabled={item.ya_incorporado}
            onClick={() => onSeleccionar(item)}
            className={cn(
              "w-full text-left rounded-lg border p-3 sm:p-4 transition-colors",
              seleccionadoId === item.id
                ? "border-primary bg-primary/10"
                : "border-neutral-gray-medium/25 hover:border-primary/40 hover:bg-white",
              item.ya_incorporado && "opacity-50 cursor-not-allowed"
            )}
          >
            <p className="font-semibold text-sm sm:text-base text-neutral-gray break-words leading-snug">
              {item.nombre}
            </p>
            <p className="text-xs sm:text-sm text-neutral-gray-medium mt-1.5 break-words leading-relaxed">
              {item.codigo_label} · {item.tipo_oficial_label} · {item.ambito_label}
            </p>
            <p className="text-xs sm:text-sm text-neutral-gray-medium mt-1 break-words leading-relaxed">
              {[item.comuna, item.region, item.dependencia].filter(Boolean).join(" · ")}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {item.tiene_pie && (
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-status-warning/15 text-status-warning">
                  PIE
                </span>
              )}
              {item.es_escuela_especial && (
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-secondary/15 text-secondary-dark">
                  Educación especial
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {paginacion.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading || paginacion.page <= 1}
            onClick={() => void buscar(paginacion.page - 1)}
          >
            Anterior
          </Button>
          <span>
            Página {paginacion.page} / {paginacion.totalPages} ({paginacion.total} resultados)
          </span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading || paginacion.page >= paginacion.totalPages}
            onClick={() => void buscar(paginacion.page + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
