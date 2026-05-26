import { useCallback, useEffect, useState } from "react";
import { FaKey, FaUserPlus, FaUsers } from "react-icons/fa";

type InstitucionOption = { id: number; nombre: string; tipo?: string };

type Administrador = {
  id: number;
  email: string;
  nombre_completo: string;
  institucion_id: number | null;
  institucion?: { id: number; nombre: string; tipo?: string } | null;
  created_at?: string;
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

type Props = {
  instituciones: InstitucionOption[];
};

export function UsuariosAdminSection({ instituciones }: Props) {
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formEmail, setFormEmail] = useState("");
  const [formNombre, setFormNombre] = useState("");
  const [formInstitucionId, setFormInstitucionId] = useState<string>("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [reseteandoId, setReseteandoId] = useState<number | null>(null);
  const [tempPasswordModal, setTempPasswordModal] = useState<string | null>(null);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json"
  });

  const fetchAdministradores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:3000/api/auth/superadmin/administradores", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(parseApiError(data, "Error al cargar administradores"));
        setAdministradores([]);
        return;
      }
      const data = await res.json();
      setAdministradores(Array.isArray(data.administradores) ? data.administradores : []);
    } catch {
      setError("Error de red al cargar administradores");
      setAdministradores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdministradores();
  }, [fetchAdministradores]);

  const abrirCrear = () => {
    setModalMode("create");
    setEditingId(null);
    setFormEmail("");
    setFormNombre("");
    setFormInstitucionId(instituciones[0] ? String(instituciones[0].id) : "");
    setFormError(null);
    setModalOpen(true);
  };

  const abrirEditar = (admin: Administrador) => {
    setModalMode("edit");
    setEditingId(admin.id);
    setFormEmail(admin.email);
    setFormNombre(admin.nombre_completo);
    setFormInstitucionId(
      String(admin.institucion_id ?? admin.institucion?.id ?? "")
    );
    setFormError(null);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setFormError(null);
    setEditingId(null);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formNombre.trim()) {
      setFormError("El nombre es obligatorio");
      return;
    }
    if (!formInstitucionId) {
      setFormError("Selecciona una institución");
      return;
    }
    if (modalMode === "create" && !formEmail.trim()) {
      setFormError("El email es obligatorio");
      return;
    }

    setFormLoading(true);
    try {
      const isEdit = modalMode === "edit" && editingId != null;
      const url = isEdit
        ? `http://localhost:3000/api/auth/superadmin/administrador/${editingId}`
        : "http://localhost:3000/api/auth/superadmin/administrador";
      const body = isEdit
        ? { nombre_completo: formNombre.trim(), institucion_id: Number(formInstitucionId) }
        : {
            email: formEmail.trim(),
            nombre_completo: formNombre.trim(),
            institucion_id: Number(formInstitucionId)
          };

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(body)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(parseApiError(data, isEdit ? "Error al actualizar" : "Error al crear administrador"));
        return;
      }

      if (!isEdit && data.tempPassword) {
        setTempPasswordModal(
          `Administrador creado.\n\nContraseña temporal (compártela con el usuario):\n${data.tempPassword}`
        );
      }

      cerrarModal();
      await fetchAdministradores();
    } catch {
      setFormError("Error de red o servidor");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEliminar = async (admin: Administrador) => {
    if (
      !window.confirm(
        `¿Eliminar al administrador "${admin.nombre_completo}" (${admin.email})?`
      )
    ) {
      return;
    }
    setEliminandoId(admin.id);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:3000/api/auth/superadmin/administrador/${admin.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(parseApiError(data, "Error al eliminar administrador"));
        return;
      }
      await fetchAdministradores();
    } catch {
      setError("Error de red al eliminar");
    } finally {
      setEliminandoId(null);
    }
  };

  const handleResetPassword = async (admin: Administrador) => {
    if (!window.confirm(`¿Generar nueva contraseña temporal para ${admin.email}?`)) {
      return;
    }
    setReseteandoId(admin.id);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:3000/api/auth/superadmin/administrador/${admin.id}/reset-password`,
        { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiError(data, "Error al resetear contraseña"));
        return;
      }
      setTempPasswordModal(
        `Nueva contraseña temporal para ${admin.email}:\n${data.tempPassword}`
      );
    } catch {
      setError("Error de red al resetear contraseña");
    } finally {
      setReseteandoId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
          <FaUsers /> Administradores de institución
        </h2>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all shadow disabled:opacity-50"
          onClick={abrirCrear}
          disabled={instituciones.length === 0}
          title={instituciones.length === 0 ? "Crea una institución primero" : undefined}
        >
          <FaUserPlus /> Nuevo administrador
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Los administradores gestionan usuarios y perfiles solo dentro de su institución.
      </p>

      {error && (
        <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {instituciones.length === 0 && (
        <div className="mb-4 text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Debes crear al menos una institución (no Sistema) antes de asignar administradores.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-blue-50 text-blue-700">
              <th className="px-3 py-2 text-left font-semibold">ID</th>
              <th className="px-3 py-2 text-left font-semibold">Nombre</th>
              <th className="px-3 py-2 text-left font-semibold">Email</th>
              <th className="px-3 py-2 text-left font-semibold">Institución</th>
              <th className="px-3 py-2 text-left font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-400">
                  Cargando administradores...
                </td>
              </tr>
            ) : administradores.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-400">
                  No hay administradores registrados.
                </td>
              </tr>
            ) : (
              administradores.map(admin => (
                <tr
                  key={admin.id}
                  className="border-b last:border-none hover:bg-blue-50 transition-all"
                >
                  <td className="px-3 py-2">{admin.id}</td>
                  <td className="px-3 py-2">{admin.nombre_completo}</td>
                  <td className="px-3 py-2">{admin.email}</td>
                  <td className="px-3 py-2">
                    {admin.institucion?.nombre ?? "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      type="button"
                      className="text-blue-600 hover:underline mr-2"
                      onClick={() => abrirEditar(admin)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="text-amber-600 hover:underline mr-2 disabled:opacity-50"
                      onClick={() => handleResetPassword(admin)}
                      disabled={reseteandoId === admin.id}
                      title="Generar contraseña temporal"
                    >
                      <FaKey className="inline mr-0.5" />
                      {reseteandoId === admin.id ? "..." : "Clave"}
                    </button>
                    <button
                      type="button"
                      className="text-red-600 hover:underline disabled:opacity-50"
                      onClick={() => handleEliminar(admin)}
                      disabled={eliminandoId === admin.id}
                    >
                      {eliminandoId === admin.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
            <button
              type="button"
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl font-bold"
              onClick={cerrarModal}
              aria-label="Cerrar"
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-4 text-blue-700">
              {modalMode === "edit" ? "Editar administrador" : "Nuevo administrador"}
            </h3>
            <form onSubmit={handleGuardar} className="space-y-4">
              {modalMode === "create" && (
                <div>
                  <label className="block text-sm font-semibold mb-1 text-blue-700">Email</label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    required
                  />
                </div>
              )}
              {modalMode === "edit" && (
                <div>
                  <label className="block text-sm font-semibold mb-1 text-blue-700">Email</label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-gray-100"
                    value={formEmail}
                    disabled
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold mb-1 text-blue-700">
                  Nombre completo
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                  value={formNombre}
                  onChange={e => setFormNombre(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-blue-700">Institución</label>
                <select
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                  value={formInstitucionId}
                  onChange={e => setFormInstitucionId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {instituciones.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {formError && <div className="text-red-500 text-sm">{formError}</div>}
              <div className="flex gap-2 justify-end mt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
                  onClick={cerrarModal}
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600"
                  disabled={formLoading}
                >
                  {formLoading ? "Guardando..." : modalMode === "edit" ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tempPasswordModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h3 className="text-lg font-bold text-green-700 mb-3">Contraseña temporal</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4 font-mono bg-gray-50 p-3 rounded-lg">
              {tempPasswordModal}
            </p>
            <button
              type="button"
              className="w-full px-4 py-2 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600"
              onClick={() => setTempPasswordModal(null)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
