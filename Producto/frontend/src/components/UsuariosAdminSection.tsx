import { useCallback, useEffect, useState } from "react";
import { FaKey, FaUserPlus, FaUsers } from "react-icons/fa";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { Modal } from "./ui/Modal";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { useRoleTheme } from "../context/RoleThemeContext";
import { cn } from "../theme/cn";

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
  const theme = useRoleTheme();
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
    <Card
      title={
        <>
          <FaUsers /> Administradores de institución
        </>
      }
      description="Los administradores gestionan usuarios y perfiles solo dentro de su institución."
      action={
        <Button
          onClick={abrirCrear}
          disabled={instituciones.length === 0}
          title={instituciones.length === 0 ? "Crea una institución primero" : undefined}
        >
          <FaUserPlus /> Nuevo administrador
        </Button>
      }
    >
      {error && <Alert variant="error">{error}</Alert>}

      {instituciones.length === 0 && (
        <Alert variant="warning">
          Debes crear al menos una institución (no Sistema) antes de asignar administradores.
        </Alert>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className={theme.tableHead}>
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
                  className={cn("border-b last:border-none", theme.tableRowHover)}
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
                      className={cn(theme.link, "mr-2 text-sm font-medium")}
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
                      <FaKey />
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

      <Modal
        open={modalOpen}
        onClose={cerrarModal}
        title={modalMode === "edit" ? "Editar administrador" : "Nuevo administrador"}
        footer={
          <>
            <Button variant="secondary" onClick={cerrarModal} disabled={formLoading}>
              Cancelar
            </Button>
            <Button type="submit" form="admin-form" disabled={formLoading}>
              {formLoading ? "Guardando..." : modalMode === "edit" ? "Guardar" : "Crear"}
            </Button>
          </>
        }
      >
        <form id="admin-form" onSubmit={handleGuardar} className="space-y-4">
          <Field label="Email" required={modalMode === "create"}>
            <Input
              type="email"
              value={formEmail}
              onChange={e => setFormEmail(e.target.value)}
              disabled={modalMode === "edit"}
              required={modalMode === "create"}
            />
          </Field>
          <Field label="Nombre completo" required>
            <Input
              value={formNombre}
              onChange={e => setFormNombre(e.target.value)}
              required
            />
          </Field>
          <Field label="Institución" required>
            <Select
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
            </Select>
          </Field>
          {formError && <Alert variant="error" className="mb-0">{formError}</Alert>}
        </form>
      </Modal>

      <Modal
        open={!!tempPasswordModal}
        onClose={() => setTempPasswordModal(null)}
        title="Contraseña temporal"
        size="sm"
        footer={
          <Button fullWidth onClick={() => setTempPasswordModal(null)}>
            Entendido
          </Button>
        }
      >
        <p className="text-sm whitespace-pre-wrap font-mono bg-neutral-gray-light p-4 rounded-lg border">
          {tempPasswordModal}
        </p>
      </Modal>
    </Card>
  );
}
