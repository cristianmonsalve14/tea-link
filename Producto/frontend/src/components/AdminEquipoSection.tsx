import { useCallback, useEffect, useState } from "react";
import { FaChalkboardTeacher, FaKey, FaPlus } from "react-icons/fa";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { Modal } from "./ui/Modal";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { cn } from "../theme/cn";
import { getSectionTheme } from "../theme/roleTheme";
import { useRoleTheme } from "../context/RoleThemeContext";

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
  const theme = useRoleTheme();
  const section = getSectionTheme("team");
  const [educadores, setEducadores] = useState<Educador[]>([]);
  const [config, setConfig] = useState<ConfigEquipo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [rolNuevo, setRolNuevo] = useState("EDUCADOR");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [tempPasswordModal, setTempPasswordModal] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [reseteandoId, setReseteandoId] = useState<number | null>(null);

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
        const roles = data.configuracion.rolesPermitidos as string[] | undefined;
        if (roles?.length) setRolNuevo(roles[0]);
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
      const esSoloEducador =
        esColegio || (config?.rolesPermitidos?.length === 1 && config.rolesPermitidos[0] === "EDUCADOR");
      const url = esSoloEducador
        ? "http://localhost:3000/api/auth/educadores"
        : "http://localhost:3000/api/auth/register";
      const emailNorm = email.trim().toLowerCase();
      const body = esSoloEducador
        ? { email: emailNorm, nombre_completo: nombre.trim() }
        : {
            email: emailNorm,
            nombre_completo: nombre.trim(),
            rol: rolNuevo
          };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(parseApiError(data, "Error al crear usuario"));
        return;
      }
      setModalOpen(false);
      setEmail("");
      setNombre("");
      if (data.tempPassword) {
        setTempPasswordModal(
          `Usuario creado.\n\nEmail: ${emailNorm}\nRol: ${esSoloEducador ? "EDUCADOR" : rolNuevo}\nContraseña temporal: ${data.tempPassword}\n\nComparta estas credenciales de forma segura.\n\nEn su primer ingreso deberá elegir una contraseña propia.`
        );
      }
      await fetchEducadores();
    } catch {
      setFormError("Error de red");
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetPassword = async (u: Educador) => {
    if (
      !window.confirm(
        `¿Generar nueva contraseña temporal para ${u.nombre_completo} (${u.email})?\n\nEl usuario deberá cambiarla en su próximo ingreso.`
      )
    ) {
      return;
    }
    setReseteandoId(u.id);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:3000/api/auth/usuario/${u.id}/reset-password`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token()}` }
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiError(data, "Error al resetear contraseña"));
        return;
      }
      setTempPasswordModal(
        `Nueva contraseña temporal para ${u.email}:\n${data.tempPassword}\n\nCompártela de forma segura.\n\nEn su próximo ingreso deberá elegir una contraseña propia.`
      );
    } catch {
      setError("Error de red al resetear contraseña");
    } finally {
      setReseteandoId(null);
    }
  };

  const handleEliminar = async (u: Educador) => {
    if (
      !window.confirm(
        `¿Eliminar a ${u.nombre_completo}?\n\nSe borrarán también sus observaciones y reportes asociados. Luego podrá volver a registrar el mismo correo.`
      )
    ) {
      return;
    }
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
    <>
      <Card
        className={cn("border", section.accentBorder)}
        title={
          <span className={cn("flex items-center gap-2", section.accentText)}>
            <FaChalkboardTeacher /> {tituloSeccion}
          </span>
        }
        description={
          esColegio
            ? "Registra educadores de tu colegio. Ellos crearán las observaciones de cada estudiante."
            : "Registra usuarios del equipo según el tipo de tu institución."
        }
        action={
          <Button
            className={cn(section.btnPrimary, section.btnPrimaryHover)}
            onClick={() => {
              setModalOpen(true);
              setFormError(null);
            }}
          >
            <FaPlus /> Nuevo usuario
          </Button>
        }
      >
        {error && (
          <Alert variant="error">
            {error}
            <button
              type="button"
              className={cn("block mt-2 underline text-sm font-medium", theme.link)}
              onClick={fetchEducadores}
            >
              Reintentar
            </button>
          </Alert>
        )}

        {loading ? (
          <p className="text-neutral-gray-medium">Cargando educadores...</p>
        ) : educadores.length === 0 ? (
          <div
            className={cn(
              "text-center py-8 rounded-xl border border-dashed",
              section.accentBgEmpty,
              section.accentBorderDashed
            )}
          >
            <p className="text-neutral-gray-medium mb-3">Aún no hay educadores registrados.</p>
            <Button
              className={cn(section.btnPrimary, section.btnPrimaryHover)}
              onClick={() => setModalOpen(true)}
            >
              Agregar primer educador
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className={section.tableHead}>
                  <th className="px-3 py-2 text-left font-semibold">Nombre</th>
                  <th className="px-3 py-2 text-left font-semibold">Email</th>
                  <th className="px-3 py-2 text-left font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {educadores.map(u => (
                  <tr key={u.id} className={cn("border-b", section.tableRowHover)}>
                    <td className="px-3 py-2">{u.nombre_completo}</td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        type="button"
                        className="text-amber-600 text-sm font-medium hover:underline mr-3 disabled:opacity-50 inline-flex items-center gap-1"
                        onClick={() => handleResetPassword(u)}
                        disabled={reseteandoId === u.id}
                        title="Generar contraseña temporal"
                      >
                        <FaKey />
                        {reseteandoId === u.id ? "..." : "Clave"}
                      </button>
                      <button
                        type="button"
                        className="text-status-error text-sm font-medium hover:underline disabled:opacity-50"
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
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={esColegio ? "Nuevo educador" : "Nuevo usuario del equipo"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="educador-form"
              className={cn(section.btnPrimary, section.btnPrimaryHover)}
              disabled={formLoading}
            >
              {formLoading ? "Creando..." : "Crear usuario"}
            </Button>
          </>
        }
      >
        <form id="educador-form" onSubmit={handleCrear} className="space-y-4">
          <Field label="Nombre completo" required>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} required />
          </Field>
          {!esColegio && config && config.rolesPermitidos.length > 1 && (
            <Field label="Rol">
              <Select value={rolNuevo} onChange={e => setRolNuevo(e.target.value)}>
                {config.rolesPermitidos.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {!esColegio && config && config.rolesPermitidos.length === 1 && (
            <p className="text-xs text-neutral-gray-medium">
              Rol a registrar: <strong>{config.rolesPermitidos[0]}</strong>
            </p>
          )}
          <Field label="Email" required>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </Field>
          <p className="text-xs text-neutral-gray-medium">
            Se generará una contraseña temporal para el primer inicio de sesión.
          </p>
          {formError && <Alert variant="error" className="mb-0">{formError}</Alert>}
        </form>
      </Modal>

      <Modal
        open={!!tempPasswordModal}
        onClose={() => setTempPasswordModal(null)}
        title="Contraseña temporal"
        size="sm"
        footer={
          <Button
            fullWidth
            className={cn(section.btnPrimary, section.btnPrimaryHover)}
            onClick={() => setTempPasswordModal(null)}
          >
            Entendido
          </Button>
        }
      >
        <p className="text-sm whitespace-pre-wrap font-mono bg-neutral-gray-light p-4 rounded-lg border border-gray-200">
          {tempPasswordModal}
        </p>
      </Modal>
    </>
  );
}
