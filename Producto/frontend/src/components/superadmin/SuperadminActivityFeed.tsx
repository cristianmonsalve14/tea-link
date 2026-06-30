import { Link } from "react-router-dom";
import { FaArrowRight, FaShieldAlt } from "react-icons/fa";
import { cn } from "../../theme/cn";
import { SUPERADMIN_BASE } from "./nav";

export type ActividadItem = {
  id: number;
  accion: string;
  detalles: string | null;
  entidad: string | null;
  entidad_id: number | null;
  created_at: string;
  admin: {
    nombre_completo: string;
    email: string;
    rol: string;
  };
};

function etiquetaAccion(accion: string): string {
  const map: Record<string, string> = {
    CREAR_INSTITUCION: "Institución creada",
    EDITAR_INSTITUCION: "Institución editada",
    ELIMINAR_INSTITUCION: "Institución eliminada",
    CREAR_ADMINISTRADOR: "Admin creado",
    EDITAR_ADMINISTRADOR: "Admin editado",
    ELIMINAR_ADMINISTRADOR: "Admin eliminado",
    RESET_PASSWORD_ADMIN: "Clave reseteada"
  };
  return map[accion] ?? accion.replace(/_/g, " ").toLowerCase();
}

function colorAccion(accion: string): string {
  if (accion.includes("ELIMINAR")) return "bg-red-100 text-red-700";
  if (accion.includes("CREAR")) return "bg-emerald-100 text-emerald-800";
  if (accion.includes("RESET")) return "bg-amber-100 text-amber-800";
  return "bg-indigo-100 text-indigo-800";
}

type Props = {
  items: ActividadItem[];
  loading?: boolean;
  className?: string;
};

export function SuperadminActivityFeed({ items, loading, className }: Props) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <FaShieldAlt size={16} />
          </span>
          <div>
            <h2 className="font-semibold text-slate-900">Actividad reciente</h2>
            <p className="text-xs text-slate-500">Últimas acciones administrativas</p>
          </div>
        </div>
        <Link
          to={`${SUPERADMIN_BASE}/auditoria`}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
        >
          Ver todo <FaArrowRight size={10} />
        </Link>
      </div>

      <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
        {loading && (
          <p className="p-6 text-sm text-slate-500 text-center">Cargando actividad...</p>
        )}
        {!loading && items.length === 0 && (
          <p className="p-6 text-sm text-slate-500 text-center">
            Aún no hay acciones registradas en auditoría.
          </p>
        )}
        {!loading &&
          items.map(item => (
            <article key={item.id} className="px-5 py-3.5 hover:bg-slate-50/80 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                        colorAccion(item.accion)
                      )}
                    >
                      {etiquetaAccion(item.accion)}
                    </span>
                    <time className="text-[10px] text-slate-400 tabular-nums">
                      {new Date(item.created_at).toLocaleString("es-CL")}
                    </time>
                  </div>
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {item.admin.nombre_completo}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {item.detalles?.trim() ||
                      [item.entidad, item.entidad_id != null ? `#${item.entidad_id}` : null]
                        .filter(Boolean)
                        .join(" ") ||
                      "—"}
                  </p>
                </div>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}
