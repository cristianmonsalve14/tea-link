import { useMemo, useState } from "react";
import {
  FaChalkboardTeacher,
  FaEdit,
  FaHome,
  FaHandsHelping,
  FaSearch,
  FaStethoscope,
  FaUser,
  FaPlus
} from "react-icons/fa";
import { CATEGORIA_INFO, PRIVACIDAD_INFO } from "../config/observacionUi";
import type { CategoriaObs } from "../config/rolPanelConfig";
import { useRoleTheme } from "../context/RoleThemeContext";
import { cn } from "../theme/cn";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

export type ObservacionBitacora = {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  fecha_evento: string;
  privacidad: string;
  autor_id: number;
  autor: { id: number; nombre_completo: string; rol: string };
};

const ROL_ORDEN = ["FAMILIA", "EDUCADOR", "PROFESIONAL", "MEDICO"] as const;

const ROL_SECCION: Record<
  string,
  { label: string; descripcion: string; icon: React.ReactNode }
> = {
  FAMILIA: {
    label: "Familia",
    descripcion: "Aportes desde el hogar",
    icon: <FaHome aria-hidden />
  },
  EDUCADOR: {
    label: "Educadores",
    descripcion: "Seguimiento en el aula y el colegio",
    icon: <FaChalkboardTeacher aria-hidden />
  },
  PROFESIONAL: {
    label: "Profesionales",
    descripcion: "Intervención terapéutica y apoyo",
    icon: <FaHandsHelping aria-hidden />
  },
  MEDICO: {
    label: "Equipo médico",
    descripcion: "Notas clínicas y seguimiento de salud",
    icon: <FaStethoscope aria-hidden />
  }
};

const FILTROS_ROL = [
  { id: "TODAS", label: "Todas" },
  { id: "MIO", label: "Mis registros" },
  { id: "FAMILIA", label: "Familia" },
  { id: "EDUCADOR", label: "Educadores" },
  { id: "PROFESIONAL", label: "Profesionales" },
  { id: "MEDICO", label: "Médicos" }
] as const;

type VistaModo = "rol" | "cronologico";
type FiltroRol = (typeof FILTROS_ROL)[number]["id"];

function formatFecha(v: string) {
  try {
    return new Date(v).toLocaleString("es-CL", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch {
    return v;
  }
}

function categoriaLabel(cat: string) {
  const key = cat.toUpperCase() as CategoriaObs;
  return CATEGORIA_INFO[key]?.label ?? cat;
}

function categoriaEmoji(cat: string) {
  const key = cat.toUpperCase() as CategoriaObs;
  return CATEGORIA_INFO[key]?.emoji ?? "📋";
}

type CardProps = {
  obs: ObservacionBitacora;
  rolViewer: string;
  userId: number | null;
  onEdit?: (id: number) => void;
  onEliminar?: (obs: ObservacionBitacora) => void;
  esPropia?: boolean;
  soloLectura?: boolean;
};

function ObservacionCard({
  obs,
  rolViewer,
  userId,
  onEdit,
  onEliminar,
  esPropia,
  soloLectura = false
}: CardProps) {
  const theme = useRoleTheme();
  const puedeEditar = !soloLectura && obs.autor_id === userId;
  const privKey = obs.privacidad as keyof typeof PRIVACIDAD_INFO;
  const privInfo = PRIVACIDAD_INFO[privKey];

  return (
    <li
      className={cn(
        "border rounded-xl p-4 transition-shadow hover:shadow-sm",
        esPropia ? cn(theme.accentBorder, theme.accentBgSubtle) : cn(theme.accentBorder, "bg-neutral-white")
      )}
    >
      <div className="flex justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-base" aria-hidden>
              {categoriaEmoji(obs.categoria)}
            </span>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full",
                theme.accentBgMuted,
                theme.accentText
              )}
            >
              {categoriaLabel(obs.categoria)}
            </span>
            {(rolViewer === "MEDICO" ||
              rolViewer === "PROFESIONAL" ||
              rolViewer === "ADMINISTRADOR") &&
              privInfo && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-gray-light text-neutral-gray-medium">
                {privInfo.label}
              </span>
            )}
            {esPropia && (
              <span className="text-[10px] font-semibold text-primary">Su registro</span>
            )}
          </div>
          <h3 className="font-semibold text-neutral-gray">{obs.titulo}</h3>
          <p className="text-sm text-neutral-gray-medium mt-1 whitespace-pre-wrap">
            {obs.descripcion}
          </p>
          <p className="text-xs text-neutral-gray-medium mt-2">
            {formatFecha(obs.fecha_evento)}
            {" · "}
            {obs.autor?.nombre_completo ?? "Autor desconocido"}
          </p>
        </div>
        {puedeEditar && onEdit && onEliminar && (
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 text-sm font-medium hover:underline",
                theme.accentText
              )}
              onClick={() => onEdit(obs.id)}
            >
              <FaEdit aria-hidden />
              Editar
            </button>
            <button
              type="button"
              className="text-status-error text-sm font-medium hover:underline"
              onClick={() => onEliminar(obs)}
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

type Props = {
  observaciones: ObservacionBitacora[];
  loading: boolean;
  emptyMessage: string;
  rolViewer: string;
  userId: number | null;
  perfilId?: string;
  nuevaLabel?: string;
  onEdit?: (id: number) => void;
  onEliminar?: (obs: ObservacionBitacora) => void;
  onNueva?: () => void;
  soloLectura?: boolean;
};

export function ObservacionesBitacoraView({
  observaciones,
  loading,
  emptyMessage,
  rolViewer,
  userId,
  perfilId = "",
  nuevaLabel = "Nueva observación",
  onEdit,
  onEliminar,
  onNueva,
  soloLectura = false
}: Props) {
  const theme = useRoleTheme();
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<FiltroRol>("TODAS");
  const [vista, setVista] = useState<VistaModo>("rol");

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return observaciones.filter(obs => {
      if (filtroRol === "MIO" && obs.autor_id !== userId) return false;
      if (
        filtroRol !== "TODAS" &&
        filtroRol !== "MIO" &&
        obs.autor?.rol !== filtroRol
      ) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        obs.titulo,
        obs.descripcion,
        obs.categoria,
        obs.autor?.nombre_completo,
        obs.autor?.rol,
        categoriaLabel(obs.categoria)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [observaciones, busqueda, filtroRol, userId]);

  const cronologicas = useMemo(
    () =>
      [...filtradas].sort(
        (a, b) => new Date(b.fecha_evento).getTime() - new Date(a.fecha_evento).getTime()
      ),
    [filtradas]
  );

  const porRol = useMemo(() => {
    const map = new Map<string, ObservacionBitacora[]>();
    for (const obs of filtradas) {
      const key = obs.autor?.rol ?? "OTRO";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(obs);
    }
    for (const lista of map.values()) {
      lista.sort(
        (a, b) => new Date(b.fecha_evento).getTime() - new Date(a.fecha_evento).getTime()
      );
    }
    const ordenadas: { rol: string; items: ObservacionBitacora[] }[] = [];
    for (const rol of ROL_ORDEN) {
      const items = map.get(rol);
      if (items?.length) ordenadas.push({ rol, items });
      map.delete(rol);
    }
    for (const [rol, items] of map) {
      if (items.length) ordenadas.push({ rol, items });
    }
    return ordenadas;
  }, [filtradas]);

  const resumen = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const obs of observaciones) {
      const r = obs.autor?.rol ?? "OTRO";
      counts[r] = (counts[r] ?? 0) + 1;
    }
    return counts;
  }, [observaciones]);

  if (loading) {
    return <p className="text-neutral-gray-medium">Cargando...</p>;
  }

  if (observaciones.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-neutral-gray-medium mb-4">{emptyMessage}</p>
        {!soloLectura && onNueva && (
          <Button disabled={!perfilId} onClick={onNueva}>
            <FaPlus /> {nuevaLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Resumen del equipo */}
      <div className="flex flex-wrap gap-2">
        <span
          className={cn(
            "text-xs font-semibold px-3 py-1 rounded-full",
            theme.accentBgSubtle,
            theme.accentText
          )}
        >
          {observaciones.length} en total
        </span>
        {ROL_ORDEN.map(r => {
          const n = resumen[r];
          if (!n) return null;
          const info = ROL_SECCION[r];
          return (
            <span
              key={r}
              className="text-xs px-3 py-1 rounded-full bg-neutral-gray-light text-neutral-gray-medium inline-flex items-center gap-1"
            >
              {info?.icon}
              {n} {info?.label.toLowerCase() ?? r}
            </span>
          );
        })}
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="space-y-3 pb-4 border-b border-neutral-gray-medium/20">
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-gray-medium pointer-events-none"
            aria-hidden
          >
            <FaSearch />
          </span>
          <Input
            type="search"
            placeholder="Buscar por título, descripción, autor o categoría..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="pl-10"
            aria-label="Buscar observaciones"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar por rol del autor">
            {FILTROS_ROL.map(f => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filtroRol === f.id}
                onClick={() => setFiltroRol(f.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                  filtroRol === f.id
                    ? cn(theme.btnPrimary, "text-white")
                    : "bg-neutral-gray-light text-neutral-gray-medium hover:bg-neutral-gray-medium/20"
                )}
              >
                {f.id === "MIO" && (
                  <span className="inline mr-1" aria-hidden>
                    <FaUser />
                  </span>
                )}
                {f.label}
              </button>
            ))}
          </div>

          <div
            className={cn(
              "inline-flex rounded-xl border overflow-hidden shrink-0",
              theme.accentBorder
            )}
          >
            <button
              type="button"
              onClick={() => setVista("rol")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold transition-colors",
                vista === "rol"
                  ? cn(theme.accentBgSubtle, theme.accentText)
                  : "text-neutral-gray-medium hover:bg-neutral-gray-light"
              )}
            >
              Por rol
            </button>
            <button
              type="button"
              onClick={() => setVista("cronologico")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold transition-colors border-l",
                theme.accentBorder,
                vista === "cronologico"
                  ? cn(theme.accentBgSubtle, theme.accentText)
                  : "text-neutral-gray-medium hover:bg-neutral-gray-light"
              )}
            >
              Cronológico
            </button>
          </div>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <p className="text-center text-neutral-gray-medium py-8">
          No hay observaciones que coincidan con la búsqueda o el filtro seleccionado.
        </p>
      ) : vista === "cronologico" ? (
        <ul className="space-y-3">
          {cronologicas.map(obs => (
            <ObservacionCard
              key={obs.id}
              obs={obs}
              rolViewer={rolViewer}
              userId={userId}
              onEdit={onEdit}
              onEliminar={onEliminar}
              esPropia={obs.autor_id === userId}
              soloLectura={soloLectura}
            />
          ))}
        </ul>
      ) : (
        <div className="space-y-6">
          {porRol.map(({ rol: rolAutor, items }) => {
            const info = ROL_SECCION[rolAutor] ?? {
              label: rolAutor,
              descripcion: "",
              icon: <FaUser aria-hidden />
            };
            return (
              <section key={rolAutor}>
                <div
                  className={cn(
                    "flex items-center gap-3 mb-3 pb-2 border-b",
                    theme.accentBorder
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-full",
                      theme.accentBgMuted,
                      theme.accentText
                    )}
                  >
                    {info.icon}
                  </span>
                  <div>
                    <h3 className={cn("font-bold text-sm", theme.accentTextStrong)}>
                      {info.label}
                      <span className="ml-2 font-normal text-neutral-gray-medium">
                        ({items.length})
                      </span>
                    </h3>
                    {info.descripcion && (
                      <p className="text-xs text-neutral-gray-medium">{info.descripcion}</p>
                    )}
                  </div>
                </div>
                <ul className="space-y-3">
                  {items.map(obs => (
                    <ObservacionCard
                      key={obs.id}
                      obs={obs}
                      rolViewer={rolViewer}
                      userId={userId}
                      onEdit={onEdit}
                      onEliminar={onEliminar}
                      esPropia={obs.autor_id === userId}
                      soloLectura={soloLectura}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
