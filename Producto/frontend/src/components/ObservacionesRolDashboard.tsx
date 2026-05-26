import { useCallback, useEffect, useState } from "react";
import { FaClipboardList, FaFileAlt, FaPlus } from "react-icons/fa";
import { GenerarReporteSection } from "./GenerarReporteSection";

type Perfil = { id: number; nombre: string };

type Observacion = {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  fecha_evento: string;
  privacidad: string;
  autor_id: number;
  perfil_id: number;
  autor: { id: number; nombre_completo: string; rol: string };
  perfil: { id: number; nombre: string };
};

const CATEGORIAS = [
  "CONDUCTA",
  "COMUNICACION",
  "SOCIAL",
  "ACADEMICO",
  "SENSORIAL",
  "MOTOR",
  "CLINICO",
  "OTRO"
] as const;

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

function formatFecha(v: string) {
  try {
    return new Date(v).toLocaleString("es-CL");
  } catch {
    return v;
  }
}

const ROL_TITULO: Record<string, string> = {
  EDUCADOR: "Panel de Educador",
  FAMILIA: "Panel de Familia",
  PROFESIONAL: "Panel de Profesional",
  MEDICO: "Panel de Médico"
};

type Props = {
  rol: string;
  institucionNombre: string | null;
};

export function ObservacionesRolDashboard({ rol, institucionNombre }: Props) {
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [perfilId, setPerfilId] = useState<string>("");
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<string>("CONDUCTA");
  const [fechaEvento, setFechaEvento] = useState(
    () => new Date().toISOString().slice(0, 16)
  );
  const [privacidad, setPrivacidad] = useState("PUBLICA");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [tab, setTab] = useState<"observaciones" | "reportes">("observaciones");

  const token = () => localStorage.getItem("token");

  useEffect(() => {
    try {
      const t = token();
      if (!t) return;
      const payload = JSON.parse(atob(t.split(".")[1]));
      setUserId(payload.userId ?? null);
    } catch {
      setUserId(null);
    }
  }, []);

  const fetchPerfiles = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3000/api/perfiles", {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = data.perfiles ?? [];
      setPerfiles(list);
      if (list.length > 0 && !perfilId) {
        setPerfilId(String(list[0].id));
      }
    } catch {
      /* ignore */
    }
  }, [perfilId]);

  const fetchObservaciones = useCallback(async () => {
    if (!perfilId) {
      setObservaciones([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:3000/api/observaciones?perfil_id=${perfilId}`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(parseApiError(data, "Error al cargar observaciones"));
        setObservaciones([]);
        return;
      }
      const data = await res.json();
      setObservaciones(data.observaciones ?? []);
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }, [perfilId]);

  useEffect(() => {
    fetchPerfiles();
  }, [fetchPerfiles]);

  useEffect(() => {
    fetchObservaciones();
  }, [fetchObservaciones]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfilId) {
      setFormError("Seleccione un perfil");
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria,
        fecha_evento: new Date(fechaEvento).toISOString(),
        perfil_id: Number(perfilId)
      };
      if (rol === "MEDICO") body.privacidad = privacidad;

      const res = await fetch("http://localhost:3000/api/observaciones", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(parseApiError(data, "Error al crear observación"));
        return;
      }
      setModalOpen(false);
      setTitulo("");
      setDescripcion("");
      await fetchObservaciones();
    } catch {
      setFormError("Error de red");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEliminar = async (obs: Observacion) => {
    if (obs.autor_id !== userId) return;
    if (!window.confirm(`¿Eliminar observación "${obs.titulo}"?`)) return;
    try {
      const res = await fetch(`http://localhost:3000/api/observaciones/${obs.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(parseApiError(data, "Error al eliminar"));
        return;
      }
      await fetchObservaciones();
    } catch {
      setError("Error de red");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-blue-800">
        {ROL_TITULO[rol] ?? "Panel de usuario"}
      </h1>
      <p className="text-lg mb-4 text-gray-700">
        Institución:{" "}
        <span className="font-semibold text-blue-700">
          {institucionNombre || "—"}
        </span>
      </p>

      <div className="flex gap-2 mb-6 border-b border-blue-100">
        <button
          type="button"
          onClick={() => setTab("observaciones")}
          className={`flex items-center gap-2 px-4 py-2 font-semibold border-b-2 -mb-px ${
            tab === "observaciones"
              ? "border-blue-500 text-blue-700"
              : "border-transparent text-gray-500 hover:text-blue-600"
          }`}
        >
          <FaClipboardList /> Observaciones
        </button>
        <button
          type="button"
          onClick={() => setTab("reportes")}
          className={`flex items-center gap-2 px-4 py-2 font-semibold border-b-2 -mb-px ${
            tab === "reportes"
              ? "border-blue-500 text-blue-700"
              : "border-transparent text-gray-500 hover:text-blue-600"
          }`}
        >
          <FaFileAlt /> Reportes
        </button>
      </div>

      {tab === "reportes" ? (
        <GenerarReporteSection />
      ) : (
        <>
      <section className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 mb-4">
        <label className="block text-sm font-semibold text-blue-700 mb-2">
          Estudiante / perfil
        </label>
        <select
          className="w-full max-w-md border rounded-lg px-3 py-2"
          value={perfilId}
          onChange={e => setPerfilId(e.target.value)}
        >
          <option value="">Seleccionar perfil...</option>
          {perfiles.map(p => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        {perfiles.length === 0 && (
          <p className="text-sm text-amber-600 mt-2">
            No hay perfiles. El administrador debe registrarlos primero.
          </p>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold text-blue-700 flex items-center gap-2">
            <FaClipboardList /> Observaciones
          </h2>
          <button
            type="button"
            disabled={!perfilId}
            onClick={() => {
              setFormError(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50"
          >
            <FaPlus /> Nueva observación
          </button>
        </div>

        {error && (
          <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : observaciones.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay observaciones para este perfil.
          </p>
        ) : (
          <ul className="space-y-3">
            {observaciones.map(obs => (
              <li
                key={obs.id}
                className="border border-gray-100 rounded-xl p-4 bg-gray-50"
              >
                <div className="flex justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{obs.titulo}</h3>
                    <p className="text-sm text-gray-600 mt-1">{obs.descripcion}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {obs.categoria} · {formatFecha(obs.fecha_evento)} ·{" "}
                      {obs.privacidad} · por {obs.autor.nombre_completo}
                    </p>
                  </div>
                  {obs.autor_id === userId && (
                    <button
                      type="button"
                      className="text-red-600 text-sm hover:underline shrink-0"
                      onClick={() => handleEliminar(obs)}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

        </>
      )}

      {tab === "observaciones" && modalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-blue-700 mb-4">Nueva observación</h3>
            <form onSubmit={handleCrear} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Título *</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción *</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  rows={4}
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                >
                  {CATEGORIAS.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha del evento</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-lg px-3 py-2"
                  value={fechaEvento}
                  onChange={e => setFechaEvento(e.target.value)}
                  required
                />
              </div>
              {rol === "MEDICO" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Privacidad</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={privacidad}
                    onChange={e => setPrivacidad(e.target.value)}
                  >
                    <option value="PUBLICA">Pública</option>
                    <option value="PRIVADA">Privada</option>
                    <option value="MULTINIVEL">Multinivel (profesionales/médico)</option>
                  </select>
                </div>
              )}
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-100"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold disabled:opacity-50"
                >
                  {formLoading ? "Guardando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
