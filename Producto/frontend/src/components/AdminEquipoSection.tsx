import { useCallback, useEffect, useState } from "react";
import { FaChalkboardTeacher, FaPlus } from "react-icons/fa";

type Educador = {
  id: number;
  email: string;
  nombre_completo: string;
  rol: string;
};

type ConfigEquipo = {
  rolesPermitidos: string[];
  etiquetaEquipo: string;
  tipoInstitucion: string;
  institucionNombre?: string;
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
  if (typeof errorData?.message === "string") return errorData.message;
  return fallback;
}

export function AdminEquipoSection() {
  const [educadores, setEducadores] = useState<Educador[]>([]);
  const [config, setConfig] = useState<ConfigEquipo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [tempPasswordModal, setTempPasswordModal] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  const esColegio =
    config?.tipoInstitucion === "CENTRO_EDUCACIONAL" || !config?.tipoInstitucion;

  const token = () => localStorage.getItem("token");

  const fetchEducadores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:3000/api/auth/usuarios", {
        headers: { Authorization: `Bearer ${token()}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          parseApiError(
            data,
            res.status === 404
              ? "Ruta no encontrada. Reinicia el backend (npm run dev)."
              : "Error al cargar educadores"
          )
        );
        setEducadores([]);
        return;
      }
      setEducadores(data.usuarios ?? []);
      if (data.configuracion) {
        setConfig(data.configuracion);
        if (data.configuracion.tipoInstitucion) {
          localStorage.setItem("institucion_tipo", data.configuracion.tipoInstitucion);
        }
      }
    } catch {
      setError("No se pudo conectar con el servidor. ¿Está el backend en marcha?");
      setEducadores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEducadores();
  }, [fetchEducadores]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !nombre.trim()) {
      setFormError("Complete email y nombre");
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      const headers = {
        Authorization: `Bearer ${token()}`,
        "Content-Type": "application/json"
      };
      const body = JSON.stringify({
        email: email.trim(),
        nombre_completo: nombre.trim(),
        rol: "EDUCADOR"
      });

      let res = await fetch("http://localhost:3000/api/auth/educadores", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: email.trim(),
          nombre_completo: nombre.trim()
        })
      });

      // Respaldo si el backend aún no tiene la ruta /educadores (servidor antiguo)
      if (res.status === 404) {
        res = await fetch("http://localhost:3000/api/auth/register", {
          method: "POST",
          headers,
          body
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(parseApiError(data, "Error al crear educador"));
        return;
      }
      if (data.tempPassword) {
        setTempPasswordModal(
          `Educador creado.\n\nContraseña temporal (compártela con el docente):\n${data.tempPassword}`
        );
      }
      setModalOpen(false);
      setEmail("");
      setNombre("");
      await fetchEducadores();
    } catch {
      setFormError("Error de red");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEliminar = async (u: Educador) => {
    if (!window.confirm(`¿Eliminar al educador ${u.nombre_completo}?`)) return;
    setEliminandoId(u.id);
    try {
      const res = await fetch(`http://localhost:3000/api/auth/usuario/${u.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(parseApiError(data, "Error al eliminar"));
        return;
      }
      await fetchEducadores();
    } catch {
      setError("Error de red al eliminar");
    } finally {
      setEliminandoId(null);
    }
  };

  const tituloSeccion = config?.etiquetaEquipo ?? "Educadores del colegio";

  return (
    <section className="bg-white rounded-2xl shadow-lg p-6 border border-green-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-green-700 flex items-center gap-2">
          <FaChalkboardTeacher /> {tituloSeccion}
        </h2>
        <button
          type="button"
          onClick={() => {
            setModalOpen(true);
            setFormError(null);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600"
        >
          <FaPlus /> Nuevo educador
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        {esColegio ? (
          <>
            Como administrador del <strong>colegio</strong>, solo registras{" "}
            <strong>educadores</strong> de tu institución y los{" "}
            <strong>perfiles de tus alumnos</strong>. Los educadores registrarán las
            observaciones de cada estudiante. No gestionas médicos ni profesionales de
            otras instituciones.
          </>
        ) : (
          <>
            Registra usuarios del equipo según el tipo de tu institución. Ellos
            registrarán observaciones sobre los perfiles.
          </>
        )}
      </p>

      {error && (
        <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
          <button
            type="button"
            className="block mt-2 text-blue-600 underline"
            onClick={fetchEducadores}
          >
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Cargando educadores...</p>
      ) : educadores.length === 0 ? (
        <div className="text-center py-8 bg-green-50 rounded-xl border border-dashed border-green-200">
          <p className="text-gray-600 mb-3">Aún no hay educadores en este colegio.</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-green-500 text-white font-semibold"
          >
            Agregar primer educador
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-green-50 text-green-800">
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {educadores.map(u => (
                <tr key={u.id} className="border-b hover:bg-green-50/50">
                  <td className="px-3 py-2">{u.nombre_completo}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-red-600 hover:underline disabled:opacity-50"
                      onClick={() => handleEliminar(u)}
                      disabled={eliminandoId === u.id}
                    >
                      {eliminandoId === u.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-green-700 mb-4">Nuevo educador</h3>
            <form onSubmit={handleCrear} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre completo *</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  className="w-full border rounded-lg px-3 py-2"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Se generará una contraseña temporal para que el educador inicie sesión.
              </p>
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-100"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-green-500 text-white font-semibold disabled:opacity-50"
                  disabled={formLoading}
                >
                  {formLoading ? "Creando..." : "Crear educador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tempPasswordModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <p className="text-sm whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded mb-4">
              {tempPasswordModal}
            </p>
            <button
              type="button"
              className="w-full py-2 rounded-lg bg-green-500 text-white font-semibold"
              onClick={() => setTempPasswordModal(null)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
