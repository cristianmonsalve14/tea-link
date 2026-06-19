import { useCallback, useEffect, useState } from "react";
import { FaPlus, FaUserGraduate, FaUsers } from "react-icons/fa";
import { AdminEquipoSection } from "./AdminEquipoSection";
import { Tabs } from "./ui/Tabs";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { Modal } from "./ui/Modal";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { useRoleTheme } from "../context/RoleThemeContext";
import { cn } from "../theme/cn";
import { getSectionTheme } from "../theme/roleTheme";

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
  const theme = useRoleTheme();
  const section = getSectionTheme("default");
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
    <div className="w-full">
      <p className="text-sm text-neutral-gray-medium mb-6 max-w-2xl">
        Gestiona los <strong>perfiles de estudiantes</strong> y el <strong>equipo de educadores</strong> de{" "}
        <strong>{institucionNombre || "tu institución"}</strong>. Las observaciones las registran los educadores.
      </p>

      <Tabs
        variant="pills"
        active={tab}
        onChange={setTab}
        items={[
          { id: "perfiles", label: "Perfiles", icon: <FaUserGraduate /> },
          { id: "equipo", label: "Educadores", icon: <FaUsers /> }
        ]}
      />

      {tab === "equipo" && <AdminEquipoSection />}

      {tab === "perfiles" && (
        <Card
          title={
            <>
              <FaUserGraduate /> Perfiles de estudiantes
            </>
          }
          description="Registra los perfiles de niños/as o estudiantes. Cada perfil concentrará sus observaciones."
          action={
            <Button onClick={abrirCrear}>
              <FaPlus /> Nuevo perfil
            </Button>
          }
        >
          {error && <Alert variant="error">{error}</Alert>}

          {loading ? (
            <p className="text-neutral-gray-medium">Cargando perfiles...</p>
          ) : perfiles.length === 0 ? (
            <div
              className={cn(
                "text-center py-10 rounded-xl border border-dashed",
                section.accentBgEmpty,
                section.accentBorderDashed
              )}
            >
              <p className="text-neutral-gray-medium mb-3">
                Aún no hay perfiles en esta institución.
              </p>
              <Button onClick={abrirCrear}>Crear el primer perfil</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className={section.tableHead}>
                    <th className="px-3 py-2 text-left font-semibold">Nombre</th>
                    <th className="px-3 py-2 text-left font-semibold">Edad</th>
                    <th className="px-3 py-2 text-left font-semibold">Diagnóstico</th>
                    <th className="px-3 py-2 text-left font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {perfiles.map(p => (
                    <tr key={p.id} className={cn("border-b", section.tableRowHover)}>
                      <td className="px-3 py-2 font-medium">{p.nombre}</td>
                      <td className="px-3 py-2">{p.edad ?? "—"}</td>
                      <td className="px-3 py-2 max-w-xs truncate">{p.diagnostico ?? "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          type="button"
                          className={cn(theme.link, "mr-3 text-sm font-medium")}
                          onClick={() => abrirEditar(p)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="text-status-error text-sm font-medium hover:underline disabled:opacity-50"
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
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={cerrarModal}
        title={modalMode === "edit" ? "Editar perfil" : "Nuevo perfil"}
        footer={
          <>
            <Button variant="secondary" onClick={cerrarModal} disabled={formLoading}>
              Cancelar
            </Button>
            <Button type="submit" form="perfil-form" disabled={formLoading}>
              {formLoading ? "Guardando..." : "Guardar"}
            </Button>
          </>
        }
      >
        <form id="perfil-form" onSubmit={handleGuardar} className="space-y-4">
          <Field label="Nombre" required>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} required />
          </Field>
          <Field label="Edad">
            <Input
              type="number"
              min={1}
              max={120}
              value={edad}
              onChange={e => setEdad(e.target.value)}
            />
          </Field>
          <Field label="Fecha de nacimiento">
            <Input
              type="date"
              value={fechaNacimiento}
              onChange={e => setFechaNacimiento(e.target.value)}
            />
          </Field>
          <Field label="Diagnóstico">
            <Input
              value={diagnostico}
              onChange={e => setDiagnostico(e.target.value)}
              maxLength={500}
            />
          </Field>
          <Field label="Notas">
            <Textarea rows={3} value={notas} onChange={e => setNotas(e.target.value)} />
          </Field>
          {formError && <Alert variant="error" className="mb-0">{formError}</Alert>}
        </form>
      </Modal>
    </div>
  );
}
