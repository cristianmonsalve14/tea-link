import { useCallback, useEffect, useMemo, useState } from "react";
import { FaChalkboardTeacher, FaEdit, FaEye, FaKey, FaPlus, FaSearch } from "react-icons/fa";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { Modal } from "./ui/Modal";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { ScrollableTable } from "./ui/ScrollableTable";
import { TableActionButton } from "./ui/TableActionButton";
import { dataTable } from "./ui/dataTable";
import { cn } from "../theme/cn";
import { getSectionTheme } from "../theme/roleTheme";
import { useRoleTheme } from "../context/RoleThemeContext";
import { validarNombreCompletoConApellido } from "../utils/nombrePersona";
import { validarEmail } from "../utils/formValidation";
import {
  NIVEL_EDUCACIONAL_GRUPOS,
  etiquetaNivelEducacionalCorta,
  resumenNivelesEducador
} from "../utils/nivelEducacional";
import type { NivelEducacional } from "../utils/nivelEducacional";
import type { EspecialidadEducador } from "../utils/especialidadEducador";
import {
  ESPECIALIDADES_EDUCADOR,
  ESPECIALIDAD_EDUCADOR_LABEL,
  etiquetaEspecialidadEducador
} from "../utils/especialidadEducador";
import { EducadorDetalleModal } from "./EducadorDetalleModal";
import {
  descripcionRegistroEquipo,
  etiquetaMiembroEquipo,
  etiquetaRolEquipo
} from "../utils/institucionEquipo";
import {
  etiquetaProfesionProfesional,
  requiereProfesionEquipo,
  type ProfesionProfesional
} from "../utils/profesionProfesional";
import { ProfesionProfesionalSelect } from "./equipo/ProfesionProfesionalSelect";

type Educador = {
  id: number;
  email: string;
  nombre_completo: string;
  rol: string;
  niveles_educacionales?: NivelEducacional[];
  especialidad?: EspecialidadEducador | ProfesionProfesional | null;
};

type ConfigEquipo = {
  rolesPermitidos: string[];
  etiquetaEquipo: string;
  tipoInstitucion: string;
  institucionNombre?: string;
};

type ModalMode = "create" | "edit";

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

function toggleNivel(
  niveles: NivelEducacional[],
  nivel: NivelEducacional
): NivelEducacional[] {
  return niveles.includes(nivel)
    ? niveles.filter(n => n !== nivel)
    : [...niveles, nivel];
}

export function AdminEquipoSection() {
  const theme = useRoleTheme();
  const section = getSectionTheme("team");
  const [educadores, setEducadores] = useState<Educador[]>([]);
  const [config, setConfig] = useState<ConfigEquipo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingUser, setEditingUser] = useState<Educador | null>(null);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [rolNuevo, setRolNuevo] = useState("EDUCADOR");
  const [nivelesSeleccionados, setNivelesSeleccionados] = useState<NivelEducacional[]>([]);
  const [especialidad, setEspecialidad] = useState<EspecialidadEducador | ProfesionProfesional | "">("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [tempPasswordModal, setTempPasswordModal] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [reseteandoId, setReseteandoId] = useState<number | null>(null);
  const [verEducadorId, setVerEducadorId] = useState<number | null>(null);

  const esColegio = config?.tipoInstitucion === "CENTRO_EDUCACIONAL";
  const esCentroTerapeutico = config?.tipoInstitucion === "CENTRO_PROFESIONAL";
  const rolFormulario =
    modalMode === "edit" ? (editingUser?.rol ?? rolNuevo) : rolNuevo;
  const muestraCamposEducador = esColegio;
  const muestraProfesion = requiereProfesionEquipo(
    rolFormulario,
    config?.tipoInstitucion ?? ""
  );
  const muestraColumnaRol = Boolean(config && !esColegio && !esCentroTerapeutico);
  const muestraColumnaProfesion = esCentroTerapeutico || config?.tipoInstitucion === "CENTRO_MEDICO";
  const etiquetaMiembros = etiquetaMiembroEquipo(config?.tipoInstitucion);

  const token = () => localStorage.getItem("token");

  const resetForm = useCallback(() => {
    setEmail("");
    setNombre("");
    setNivelesSeleccionados([]);
    setEspecialidad("");
    setEditingUser(null);
    setModalMode("create");
    setFormError(null);
    if (config?.rolesPermitidos?.length) setRolNuevo(config.rolesPermitidos[0]);
  }, [config?.rolesPermitidos]);

  const abrirCrear = () => {
    resetForm();
    setModalMode("create");
    setModalOpen(true);
  };

  const abrirEditar = (u: Educador) => {
    setEditingUser(u);
    setModalMode("edit");
    setEmail(u.email);
    setNombre(u.nombre_completo);
    setNivelesSeleccionados(u.niveles_educacionales ?? []);
    setEspecialidad((u.especialidad as EspecialidadEducador | ProfesionProfesional) ?? "");
    setFormError(null);
    setModalOpen(true);
  };

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

  const educadoresFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return educadores;
    return educadores.filter(u => {
      const niveles = resumenNivelesEducador(u.niveles_educacionales).toLowerCase();
      const cargo = muestraColumnaProfesion && u.rol === "PROFESIONAL"
        ? etiquetaProfesionProfesional(u.especialidad).toLowerCase()
        : etiquetaEspecialidadEducador(u.especialidad).toLowerCase();
      return (
        u.nombre_completo.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        cargo.includes(q) ||
        niveles.includes(q)
      );
    });
  }, [busqueda, educadores]);

  const validarFormulario = (): string | null => {
    if (!nombre.trim()) return "Complete el nombre completo";
    const errorNombre = validarNombreCompletoConApellido(nombre);
    if (errorNombre) return errorNombre;
    if (modalMode === "create") {
      if (!email.trim()) return "Complete el email";
      const errorEmail = validarEmail(email);
      if (errorEmail) return errorEmail;
    }
    if (muestraCamposEducador && nivelesSeleccionados.length === 0) {
      return "Seleccione al menos un nivel educacional";
    }
    if (muestraCamposEducador && !especialidad) {
      return "Seleccione especialidad o cargo";
    }
    if (muestraProfesion && !especialidad) {
      return "Seleccione la profesión del usuario";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validarFormulario();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      if (modalMode === "edit" && editingUser) {
        const body: Record<string, unknown> = {
          nombre_completo: nombre.trim()
        };
        if (muestraCamposEducador) {
          body.niveles_educacionales = nivelesSeleccionados;
        }
        if (muestraCamposEducador || muestraProfesion) {
          body.especialidad = especialidad;
        }
        const res = await fetch(
          `http://localhost:3000/api/auth/usuario/${editingUser.id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token()}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setFormError(parseApiError(data, "Error al actualizar usuario"));
          return;
        }
        setModalOpen(false);
        resetForm();
        await fetchEducadores();
        return;
      }

      const esSoloEducador =
        esColegio ||
        (config?.rolesPermitidos?.length === 1 && config.rolesPermitidos[0] === "EDUCADOR");
      const url = esSoloEducador
        ? "http://localhost:3000/api/auth/educadores"
        : "http://localhost:3000/api/auth/register";
      const emailNorm = email.trim().toLowerCase();
      const body: Record<string, unknown> = esSoloEducador
        ? { email: emailNorm, nombre_completo: nombre.trim() }
        : {
            email: emailNorm,
            nombre_completo: nombre.trim(),
            rol: rolNuevo
          };
        if (muestraCamposEducador) {
          body.niveles_educacionales = nivelesSeleccionados;
        }
        if (muestraCamposEducador || muestraProfesion) {
          body.especialidad = especialidad;
        }

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
      resetForm();
      if (data.tempPassword) {
        setTempPasswordModal(
          `Usuario creado.\n\nEmail: ${emailNorm}\nRol: ${esSoloEducador ? etiquetaRolEquipo("EDUCADOR") : etiquetaRolEquipo(rolNuevo)}\nContraseña temporal: ${data.tempPassword}\n\nComparta estas credenciales de forma segura.\n\nEn su primer ingreso deberá elegir una contraseña propia.`
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
        description={descripcionRegistroEquipo(config?.tipoInstitucion)}
        action={
          <Button
            className={cn(section.btnPrimary, section.btnPrimaryHover)}
            onClick={abrirCrear}
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
          <p className="text-neutral-gray-medium">Cargando {etiquetaMiembros}...</p>
        ) : educadores.length === 0 ? (
          <div
            className={cn(
              "text-center py-8 rounded-xl border border-dashed",
              section.accentBgEmpty,
              section.accentBorderDashed
            )}
          >
            <p className="text-neutral-gray-medium mb-3">
              Aún no hay {etiquetaMiembros} registrados.
            </p>
            <Button
              className={cn(section.btnPrimary, section.btnPrimaryHover)}
              onClick={abrirCrear}
            >
              Agregar primer usuario
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 relative max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-gray-medium pointer-events-none">
                <FaSearch aria-hidden />
              </span>
              <Input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, email, nivel o especialidad..."
                className="pl-9"
              />
            </div>
            {educadoresFiltrados.length === 0 ? (
              <p className="text-neutral-gray-medium text-sm py-4">
                No hay resultados para «{busqueda}».
              </p>
            ) : (
              <ScrollableTable>
                <table className={dataTable.table}>
                  <thead>
                    <tr className={section.tableHead}>
                      <th className={dataTable.th}>Nombre</th>
                      <th className={dataTable.th}>Email</th>
                      {muestraColumnaRol && <th className={dataTable.th}>Rol</th>}
                      {muestraColumnaProfesion && (
                        <th className={dataTable.th}>Profesión</th>
                      )}
                      {muestraCamposEducador && (
                        <>
                          <th className={dataTable.th}>Niveles</th>
                          <th className={dataTable.th}>Especialidad</th>
                        </>
                      )}
                      <th className={dataTable.th}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {educadoresFiltrados.map(u => (
                      <tr key={u.id} className={cn("border-b", section.tableRowHover)}>
                        <td className={dataTable.td}>{u.nombre_completo}</td>
                        <td className={dataTable.td}>{u.email}</td>
                        {muestraColumnaRol && (
                          <td className={dataTable.td}>{etiquetaRolEquipo(u.rol)}</td>
                        )}
                        {muestraColumnaProfesion && (
                          <td className={dataTable.td}>
                            {u.rol === "PROFESIONAL" || esCentroTerapeutico
                              ? etiquetaProfesionProfesional(u.especialidad)
                              : "—"}
                          </td>
                        )}
                        {muestraCamposEducador && (
                          <>
                            <td className={cn(dataTable.td, "max-w-[220px] text-sm")}>
                              {resumenNivelesEducador(u.niveles_educacionales)}
                            </td>
                            <td className={dataTable.td}>
                              {etiquetaEspecialidadEducador(u.especialidad)}
                            </td>
                          </>
                        )}
                        <td className={cn(dataTable.td, "whitespace-nowrap")}>
                          <div className="flex flex-wrap gap-2">
                            <TableActionButton
                              onClick={() => setVerEducadorId(u.id)}
                              title="Ver ficha del educador"
                            >
                              <FaEye aria-hidden />
                              Ver
                            </TableActionButton>
                            <TableActionButton
                              onClick={() => abrirEditar(u)}
                              title="Editar datos del educador"
                            >
                              <FaEdit aria-hidden />
                              Editar
                            </TableActionButton>
                            <TableActionButton
                              onClick={() => handleResetPassword(u)}
                              disabled={reseteandoId === u.id}
                              title="Generar contraseña temporal"
                            >
                              <FaKey aria-hidden />
                              {reseteandoId === u.id ? "..." : "Clave"}
                            </TableActionButton>
                            <TableActionButton
                              variant="danger"
                              onClick={() => handleEliminar(u)}
                              disabled={eliminandoId === u.id}
                            >
                              {eliminandoId === u.id ? "Eliminando..." : "Eliminar"}
                            </TableActionButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollableTable>
            )}
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={
          modalMode === "edit"
            ? esColegio
              ? "Editar educador"
              : "Editar usuario"
            : esColegio
              ? "Nuevo educador"
              : config?.tipoInstitucion === "FAMILIA"
                ? "Nueva cuenta de familia"
                : "Nuevo usuario del equipo"
        }
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="educador-form"
              className={cn(section.btnPrimary, section.btnPrimaryHover)}
              disabled={formLoading}
            >
              {formLoading
                ? modalMode === "edit"
                  ? "Guardando..."
                  : "Creando..."
                : modalMode === "edit"
                  ? "Guardar cambios"
                  : "Crear usuario"}
            </Button>
          </>
        }
      >
        <form id="educador-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nombre completo" required>
            <Input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez González"
              required
            />
            <p className="text-xs text-neutral-gray-medium mt-1">
              Nombre, primer apellido y segundo apellido son obligatorios.
            </p>
          </Field>
          {!esColegio && config && config.rolesPermitidos.length > 1 && modalMode === "create" && (
            <Field label="Rol" required>
              <Select
                value={rolNuevo}
                onChange={e => {
                  setRolNuevo(e.target.value);
                  if (e.target.value !== "PROFESIONAL") setEspecialidad("");
                }}
              >
                {config.rolesPermitidos.map(r => (
                  <option key={r} value={r}>
                    {etiquetaRolEquipo(r)}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {!esColegio && config && config.rolesPermitidos.length === 1 && modalMode === "create" && (
            <p className="text-xs text-neutral-gray-medium">
              Rol a registrar: <strong>{etiquetaRolEquipo(config.rolesPermitidos[0])}</strong>
            </p>
          )}
          <Field label="Email" required={modalMode === "create"}>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required={modalMode === "create"}
              disabled={modalMode === "edit"}
              className={modalMode === "edit" ? "bg-neutral-gray-light" : undefined}
            />
            {modalMode === "edit" && (
              <p className="text-xs text-neutral-gray-medium mt-1">
                El correo no se puede cambiar. Para otro email, elimine y vuelva a registrar.
              </p>
            )}
          </Field>

          {muestraProfesion && (
            <ProfesionProfesionalSelect
              value={(especialidad || "") as ProfesionProfesional | ""}
              onChange={setEspecialidad}
              required
            />
          )}

          {muestraCamposEducador && (
            <>
              <Field label="Niveles que atiende" required>
                <div className="space-y-3 rounded-lg border border-gray-200 p-3 max-h-52 overflow-y-auto bg-neutral-gray-light/40">
                  {NIVEL_EDUCACIONAL_GRUPOS.map(grupo => (
                    <div key={grupo.label}>
                      <p className="text-xs font-semibold text-neutral-gray-medium mb-1.5">
                        {grupo.label}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {grupo.niveles.map(nivel => {
                          const checked = nivelesSeleccionados.includes(nivel);
                          return (
                            <label
                              key={nivel}
                              className={cn(
                                "inline-flex items-center gap-1.5 text-sm px-2 py-1 rounded-md border cursor-pointer select-none",
                                checked
                                  ? cn(section.accentBgEmpty, section.accentBorder, "font-medium")
                                  : "border-gray-200 bg-white hover:bg-gray-50"
                              )}
                            >
                              <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={checked}
                                onChange={() =>
                                  setNivelesSeleccionados(prev => toggleNivel(prev, nivel))
                                }
                              />
                              {etiquetaNivelEducacionalCorta(nivel)}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-neutral-gray-medium mt-1">
                  Puede seleccionar varios niveles si el educador atiende más de un curso.
                </p>
              </Field>
              <Field label="Especialidad o cargo" required>
                <Select
                  value={especialidad}
                  onChange={e =>
                    setEspecialidad(e.target.value as EspecialidadEducador | "")
                  }
                  required
                >
                  <option value="">Seleccione un cargo...</option>
                  {ESPECIALIDADES_EDUCADOR.map(cargo => (
                    <option key={cargo} value={cargo}>
                      {ESPECIALIDAD_EDUCADOR_LABEL[cargo]}
                    </option>
                  ))}
                </Select>
              </Field>
            </>
          )}

          {modalMode === "create" && (
            <p className="text-xs text-neutral-gray-medium">
              Se generará una contraseña temporal para el primer inicio de sesión.
            </p>
          )}
          {formError && <Alert variant="error" className="mb-0">{formError}</Alert>}
        </form>
      </Modal>

      <EducadorDetalleModal
        open={verEducadorId !== null}
        usuarioId={verEducadorId}
        muestraCamposEducador={muestraCamposEducador}
        muestraProfesion={muestraColumnaProfesion}
        onClose={() => setVerEducadorId(null)}
      />

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
