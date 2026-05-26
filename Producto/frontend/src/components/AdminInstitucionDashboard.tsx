import { useCallback, useEffect, useState } from "react";
import { FaPlus, FaUserGraduate, FaUsers } from "react-icons/fa";
import { AdminEquipoSection } from "./AdminEquipoSection";

type Perfil = {
  id: number;
  nombre: string;
  edad?: number | null;
  diagnostico?: string | null;
  fecha_nacimiento?: string | null;
  notas?: string | null;
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
  return fallback;
}

type Props = {
  institucionNombre: string | null;
};

export function AdminInstitucionDashboard({ institucionNombre }: Props) {
  const [tab, setTab] = useState<"perfiles" | "equipo">("perfiles");
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [notas, setNotas] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  const api = (path: string, options?: RequestInit) =>
    fetch(`http://localhost:3000/api/perfiles${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        ...options?.headers
      }
    });

  const fetchPerfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api("");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(parseApiError(data, "No se pudieron cargar los perfiles"));
        setPerfiles([]);
        return;
      }
      const data = await res.json();
      setPerfiles(data.perfiles ?? []);
    } catch {
      setError("Error de red al cargar perfiles");
      setPerfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerfiles();
  }, [fetchPerfiles]);

  const resetForm = () => {
    setNombre("");
    setEdad("");
    setDiagnostico("");
    setFechaNacimiento("");
    setNotas("");
    setFormError(null);
    setEditingId(null);
  };

  const abrirCrear = () => {
    resetForm();
    setModalMode("create");
    setModalOpen(true);
  };

  const abrirEditar = (p: Perfil) => {
    setModalMode("edit");
    setEditingId(p.id);
    setNombre(p.nombre);
    setEdad(p.edad != null ? String(p.edad) : "");
    setDiagnostico(p.diagnostico ?? "");
    setFechaNacimiento(
      p.fecha_nacimiento ? p.fecha_nacimiento.toString().slice(0, 10) : ""
    );
    setNotas(p.notas ?? "");
    setFormError(null);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setFormError("El nombre es obligatorio");
      return;
    }
    setFormLoading(true);
    setFormError(null);
    const body: Record<string, unknown> = {
      nombre: nombre.trim(),
      diagnostico: diagnostico.trim() || undefined,
      notas: notas.trim() || undefined,
      fecha_nacimiento: fechaNacimiento || undefined
    };
    if (edad.trim()) body.edad = Number(edad);

    try {
      const isEdit = modalMode === "edit" && editingId != null;
      const res = await api(isEdit ? `/${editingId}` : "", {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(parseApiError(data, "Error al guardar perfil"));
        return;
      }
      cerrarModal();
      await fetchPerfiles();
    } catch {
      setFormError("Error de red al guardar");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEliminar = async (p: Perfil) => {
    if (!window.confirm(`¿Eliminar el perfil de "${p.nombre}"?`)) return;
    setEliminandoId(p.id);
    try {
      const res = await api(`/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(parseApiError(data, "Error al eliminar perfil"));
        return;
      }
      await fetchPerfiles();
    } catch {
      setError("Error de red al eliminar");
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-blue-800">Panel de Administrador</h1>
      <p className="text-lg mb-4 text-gray-700">
        Institución:{" "}
        <span className="font-semibold text-blue-700">
          {institucionNombre || "(sin institución)"}
        </span>
      </p>

      <p className="text-sm text-gray-500 mb-4">
        Como administrador del <strong>colegio</strong> gestionas los{" "}
        <strong>perfiles de tus alumnos</strong> y los <strong>educadores</strong> de tu
        institución. Las observaciones las registran los educadores; tú no las creas ni las ves.
      </p>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab("perfiles")}
          className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 ${
            tab === "perfiles"
              ? "bg-blue-500 text-white"
              : "bg-white text-blue-700 border border-blue-200"
          }`}
        >
          <FaUserGraduate /> Perfiles
        </button>
        <button
          type="button"
          onClick={() => setTab("equipo")}
          className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 ${
            tab === "equipo"
              ? "bg-green-500 text-white"
              : "bg-white text-green-700 border border-green-200"
          }`}
        >
          <FaUsers /> Educadores
        </button>
      </div>

      {tab === "equipo" && <AdminEquipoSection />}

      {tab === "perfiles" && (
      <section className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold text-blue-700 flex items-center gap-2">
            <FaUserGraduate /> Perfiles de estudiantes
          </h2>
          <button
            type="button"
            onClick={abrirCrear}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600"
          >
            <FaPlus /> Nuevo perfil
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Registra aquí los perfiles de niños/as o estudiantes de tu institución. Cada perfil
          concentrará sus observaciones.
        </p>

        {error && (
          <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Cargando perfiles...</p>
        ) : perfiles.length === 0 ? (
          <div className="text-center py-10 bg-blue-50 rounded-xl border border-dashed border-blue-200">
            <p className="text-gray-600 mb-3">Aún no hay perfiles en esta institución.</p>
            <button
              type="button"
              onClick={abrirCrear}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600"
            >
              Crear el primer perfil
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-blue-50 text-blue-800">
                  <th className="px-3 py-2 text-left">Nombre</th>
                  <th className="px-3 py-2 text-left">Edad</th>
                  <th className="px-3 py-2 text-left">Diagnóstico</th>
                  <th className="px-3 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {perfiles.map(p => (
                  <tr key={p.id} className="border-b hover:bg-blue-50/50">
                    <td className="px-3 py-2 font-medium">{p.nombre}</td>
                    <td className="px-3 py-2">{p.edad ?? "—"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{p.diagnostico ?? "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        type="button"
                        className="text-blue-600 hover:underline mr-2"
                        onClick={() => abrirEditar(p)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:underline disabled:opacity-50"
                        onClick={() => handleEliminar(p)}
                        disabled={eliminandoId === p.id}
                      >
                        {eliminandoId === p.id ? "..." : "Eliminar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}

      {tab === "perfiles" && modalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-blue-700 mb-4">
              {modalMode === "edit" ? "Editar perfil" : "Nuevo perfil"}
            </h3>
            <form onSubmit={handleGuardar} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Edad</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  className="w-full border rounded-lg px-3 py-2"
                  value={edad}
                  onChange={e => setEdad(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha de nacimiento</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2"
                  value={fechaNacimiento}
                  onChange={e => setFechaNacimiento(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Diagnóstico</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={diagnostico}
                  onChange={e => setDiagnostico(e.target.value)}
                  maxLength={500}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                />
              </div>
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                  onClick={cerrarModal}
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50"
                  disabled={formLoading}
                >
                  {formLoading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
