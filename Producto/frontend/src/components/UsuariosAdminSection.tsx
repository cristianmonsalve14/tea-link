import { useCallback, useEffect, useMemo, useState } from "react";
import { FaKey, FaUserPlus, FaUsers } from "react-icons/fa";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { Modal } from "./ui/Modal";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { useRoleTheme } from "../context/RoleThemeContext";
import { ScrollableTable } from "./ui/ScrollableTable";
import { dataTable, filterFieldMinWidth } from "./ui/dataTable";
import { cn } from "../theme/cn";
import { validarNombreCompletoConApellido } from "../utils/nombrePersona";
import { validarEmail } from "../utils/formValidation";
import {
  etiquetaTipoInstitucion,
  institucionAdmiteAdministrador,
  TIPOS_INSTITUCION_ADMIN_FILTRO
} from "../utils/institucionContacto";
import { RegionChileSelect } from "./instituciones/RegionChileSelect";
import { ComunaChileSelect } from "./instituciones/ComunaChileSelect";
import type { RegionChile } from "../utils/regionChile";
import { Label } from "./ui/Label";
import { SuperadminFilterBar, type FilterChip } from "./superadmin/SuperadminFilterBar";
import { SuperadminBadge } from "./superadmin/SuperadminBadge";

function institucionOpcionAdmiteAdministrador(inst: InstitucionOption): boolean {
  return institucionAdmiteAdministrador(inst.tipo);
}

function coincideBusquedaAdmin(admin: Administrador, q: string): boolean {
  if (!q) return true;
  const tipoLabel = admin.institucion?.tipo
    ? etiquetaTipoInstitucion(admin.institucion.tipo).toLowerCase()
    : "";
  const haystack = [
    admin.nombre_completo,
    admin.email,
    admin.institucion?.nombre,
    admin.institucion?.tipo,
    tipoLabel,
    String(admin.id)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function filtrarInstitucionesOpciones(
  instituciones: InstitucionOption[],
  q: string,
  tipo: string,
  region: string,
  comuna: string
): InstitucionOption[] {
  const texto = q.trim().toLowerCase();
  return instituciones.filter(inst => {
    if (tipo && inst.tipo !== tipo) return false;
    if (region && inst.region !== region) return false;
    if (comuna && inst.comuna !== comuna) return false;
    if (!texto) return true;
    const tipoLabel = inst.tipo ? etiquetaTipoInstitucion(inst.tipo).toLowerCase() : "";
    return [inst.nombre, inst.tipo, tipoLabel, inst.comuna, inst.region_label, String(inst.id)].some(
      v => (v ?? "").toLowerCase().includes(texto)
    );
  });
}

function coincideUbicacionInst(
  inst: { region?: string | null; comuna?: string | null } | undefined,
  region: string,
  comuna: string
): boolean {
  if (!inst) return !region && !comuna;
  if (region && inst.region !== region) return false;
  if (comuna && inst.comuna !== comuna) return false;
  return true;
}

type InstitucionOption = {
  id: number;
  nombre: string;
  tipo?: string;
  region?: string | null;
  comuna?: string | null;
  region_label?: string | null;
};

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
  embedded?: boolean;
};

export function UsuariosAdminSection({ instituciones, embedded = false }: Props) {
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
  const [busqueda, setBusqueda] = useState("");
  const [filtroInstitucionId, setFiltroInstitucionId] = useState("");
  const [filtroTipoInstitucion, setFiltroTipoInstitucion] = useState("");
  const [busquedaInstModal, setBusquedaInstModal] = useState("");
  const [filtroTipoInstModal, setFiltroTipoInstModal] = useState("");
  const [filtroRegion, setFiltroRegion] = useState<RegionChile | "">("");
  const [filtroComuna, setFiltroComuna] = useState("");
  const [filtroRegionInstModal, setFiltroRegionInstModal] = useState<RegionChile | "">("");
  const [filtroComunaInstModal, setFiltroComunaInstModal] = useState("");

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

  const q = busqueda.trim().toLowerCase();

  const instPorId = useMemo(
    () => new Map(instituciones.map(inst => [inst.id, inst])),
    [instituciones]
  );

  const institucionesAsignables = useMemo(
    () => instituciones.filter(institucionOpcionAdmiteAdministrador),
    [instituciones]
  );

  const administradoresFiltrados = useMemo(() => {
    return administradores.filter(admin => {
      if (filtroInstitucionId && String(admin.institucion_id ?? admin.institucion?.id) !== filtroInstitucionId) {
        return false;
      }
      if (filtroTipoInstitucion && admin.institucion?.tipo !== filtroTipoInstitucion) {
        return false;
      }
      const instId = admin.institucion_id ?? admin.institucion?.id;
      const inst = instId != null ? instPorId.get(instId) : undefined;
      if (!coincideUbicacionInst(inst, filtroRegion, filtroComuna)) {
        return false;
      }
      return coincideBusquedaAdmin(admin, q);
    });
  }, [
    administradores,
    filtroInstitucionId,
    filtroTipoInstitucion,
    filtroRegion,
    filtroComuna,
    instPorId,
    q
  ]);

  const institucionesModal = useMemo(
    () =>
      filtrarInstitucionesOpciones(
        institucionesAsignables,
        busquedaInstModal,
        filtroTipoInstModal,
        filtroRegionInstModal,
        filtroComunaInstModal
      ),
    [
      institucionesAsignables,
      busquedaInstModal,
      filtroTipoInstModal,
      filtroRegionInstModal,
      filtroComunaInstModal
    ]
  );

  const institucionesEnFiltro = useMemo(
    () =>
      [...instituciones]
        .filter(inst => coincideUbicacionInst(inst, filtroRegion, filtroComuna))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    [instituciones, filtroRegion, filtroComuna]
  );

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroInstitucionId("");
    setFiltroTipoInstitucion("");
    setFiltroRegion("");
    setFiltroComuna("");
  };

  const hayFiltrosActivos = Boolean(
    busqueda.trim() || filtroInstitucionId || filtroTipoInstitucion || filtroRegion || filtroComuna
  );

  const filterChips = useMemo((): FilterChip[] => {
    const chips: FilterChip[] = [];
    if (filtroTipoInstitucion) {
      const t = TIPOS_INSTITUCION_ADMIN_FILTRO.find(x => x.value === filtroTipoInstitucion);
      if (t) chips.push({ key: "tipo", label: t.label });
    }
    if (filtroInstitucionId) {
      const inst = instituciones.find(i => String(i.id) === filtroInstitucionId);
      chips.push({ key: "inst", label: inst?.nombre ?? `Inst. #${filtroInstitucionId}` });
    }
    if (filtroRegion) chips.push({ key: "region", label: `Región: ${filtroRegion}` });
    if (filtroComuna) chips.push({ key: "comuna", label: `Comuna: ${filtroComuna}` });
    return chips;
  }, [filtroTipoInstitucion, filtroInstitucionId, filtroRegion, filtroComuna, instituciones]);

  const removeFilterChip = (key: string) => {
    if (key === "tipo") setFiltroTipoInstitucion("");
    if (key === "inst") setFiltroInstitucionId("");
    if (key === "region") {
      setFiltroRegion("");
      setFiltroComuna("");
    }
    if (key === "comuna") setFiltroComuna("");
  };

  const abrirCrear = () => {
    setModalMode("create");
    setEditingId(null);
    setFormEmail("");
    setFormNombre("");
    setBusquedaInstModal("");
    setFiltroTipoInstModal("");
    setFiltroRegionInstModal("");
    setFiltroComunaInstModal("");
    const primera = institucionesAsignables[0];
    setFormInstitucionId(primera ? String(primera.id) : "");
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
    const errorNombre = validarNombreCompletoConApellido(formNombre);
    if (errorNombre) {
      setFormError(errorNombre);
      return;
    }
    if (!formInstitucionId) {
      setFormError("Selecciona una institución");
      return;
    }
    const instSeleccionada = instPorId.get(Number(formInstitucionId));
    if (instSeleccionada && !institucionOpcionAdmiteAdministrador(instSeleccionada)) {
      setFormError(
        "Las instituciones tipo familia no tienen administrador. Los apoderados acceden con rol Familia tras la invitación del colegio o centro médico."
      );
      return;
    }
    if (modalMode === "create" && !formEmail.trim()) {
      setFormError("El email es obligatorio");
      return;
    }
    if (modalMode === "create") {
      const errorEmail = validarEmail(formEmail);
      if (errorEmail) {
        setFormError(errorEmail);
        return;
      }
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

  const inner = (
    <>
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {institucionesAsignables.length === 0 && (
        <Alert variant="warning" className="mb-4">
          Debes crear al menos una institución con panel administrativo (colegio, centro médico o
          centro profesional) antes de asignar administradores. Las instituciones tipo{" "}
          <strong>familia</strong> no admiten administrador.
        </Alert>
      )}

      {(embedded || administradores.length > 0) && (
        <SuperadminFilterBar
          className="mb-6"
          search={busqueda}
          onSearchChange={setBusqueda}
          searchPlaceholder="Buscar por nombre, email, institución o ID..."
          chips={filterChips}
          onRemoveChip={removeFilterChip}
          onClearAll={limpiarFiltros}
          filteredCount={administradoresFiltrados.length}
          totalCount={administradores.length}
          entityLabel="administradores"
          actions={
            <Button
              onClick={abrirCrear}
              disabled={institucionesAsignables.length === 0}
              title={
                institucionesAsignables.length === 0
                  ? "Crea una institución con panel administrativo primero"
                  : undefined
              }
            >
              <FaUserPlus /> Nuevo administrador
            </Button>
          }
          advanced={
            <div className="col-span-full space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className={cn(filterFieldMinWidth.tipo, "w-full min-w-0")}>
                  <Label className="text-xs mb-1.5 block text-slate-600">Tipo de institución</Label>
                  <Select
                    value={filtroTipoInstitucion}
                    onChange={e => setFiltroTipoInstitucion(e.target.value)}
                  >
                    {TIPOS_INSTITUCION_ADMIN_FILTRO.map(t => (
                      <option key={t.value || "all"} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-full min-w-0 sm:col-span-2 lg:col-span-2">
                  <Label className="text-xs mb-1.5 block text-slate-600">Institución</Label>
                  <Select
                    value={filtroInstitucionId}
                    onChange={e => setFiltroInstitucionId(e.target.value)}
                  >
                    <option value="">Todas las instituciones</option>
                    {institucionesEnFiltro.map(inst => (
                      <option key={inst.id} value={inst.id}>
                        {inst.nombre}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
                <div className="w-full min-w-0">
                  <RegionChileSelect
                    value={filtroRegion}
                    onChange={value => {
                      setFiltroRegion(value);
                      setFiltroComuna("");
                      setFiltroInstitucionId("");
                    }}
                  />
                </div>
                <div className="w-full min-w-0">
                  <ComunaChileSelect
                    region={filtroRegion}
                    value={filtroComuna}
                    onChange={value => {
                      setFiltroComuna(value);
                      setFiltroInstitucionId("");
                    }}
                  />
                </div>
              </div>
            </div>
          }
        />
      )}

      <div
        className={cn(
          embedded && "rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden"
        )}
      >
      <ScrollableTable>
        <table className={dataTable.table}>
          <thead>
            <tr className={theme.tableHead}>
              <th className={dataTable.th}>Administrador</th>
              <th className={dataTable.th}>Email</th>
              <th className={dataTable.th}>Institución</th>
              <th className={dataTable.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-sm text-gray-400">
                  Cargando administradores...
                </td>
              </tr>
            ) : administradoresFiltrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-sm text-gray-400">
                  {hayFiltrosActivos
                    ? "Sin resultados con los filtros actuales."
                    : "No hay administradores registrados."}
                </td>
              </tr>
            ) : (
              administradoresFiltrados.map(admin => (
                <tr
                  key={admin.id}
                  className={cn("border-b last:border-none", theme.tableRowHover)}
                >
                  <td className={dataTable.td}>
                    <div className="font-medium text-slate-900">{admin.nombre_completo}</div>
                    <span className="text-[10px] text-slate-400 font-mono">#{admin.id}</span>
                  </td>
                  <td className={dataTable.td}>{admin.email}</td>
                  <td className={dataTable.td}>
                    <div className="font-medium text-slate-800">{admin.institucion?.nombre ?? "—"}</div>
                    {admin.institucion?.tipo && (
                      <SuperadminBadge tone="neutral" className="mt-1">
                        {etiquetaTipoInstitucion(admin.institucion.tipo)}
                      </SuperadminBadge>
                    )}
                  </td>
                  <td className={cn(dataTable.td, "whitespace-nowrap")}>
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
      </ScrollableTable>

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
              placeholder="Ej: Juan Pérez González"
              required
            />
            <p className="text-xs text-neutral-gray-medium mt-1">
              Nombre, primer apellido y segundo apellido son obligatorios.
            </p>
          </Field>
          <Field label="Institución asignada" required>
            <p className="text-xs text-neutral-gray-medium mb-3">
              Solo colegios y centros de salud/terapia admiten administrador. Las familias acceden
              con rol <strong>Familia</strong> cuando el colegio o clínica los invita.
            </p>
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 sm:p-4 space-y-4 mb-4">
              <p className="text-xs font-semibold text-slate-600">Filtrar listado de instituciones</p>
              <Input
                value={busquedaInstModal}
                onChange={e => setBusquedaInstModal(e.target.value)}
                placeholder="Filtrar por nombre o tipo..."
              />
              <div>
                <Label className="text-xs mb-1.5 block text-slate-600">Tipo de institución</Label>
                <Select
                value={filtroTipoInstModal}
                onChange={e => setFiltroTipoInstModal(e.target.value)}
                aria-label="Tipo de institución"
              >
                {TIPOS_INSTITUCION_ADMIN_FILTRO.map(t => (
                  <option key={`modal-${t.value || "all"}`} value={t.value}>
                    {t.label}
                  </option>
                ))}
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <RegionChileSelect
                  value={filtroRegionInstModal}
                  onChange={value => {
                    setFiltroRegionInstModal(value);
                    setFiltroComunaInstModal("");
                  }}
                />
                <ComunaChileSelect
                  region={filtroRegionInstModal}
                  value={filtroComunaInstModal}
                  onChange={setFiltroComunaInstModal}
                />
              </div>
            </div>
            <Select
              value={formInstitucionId}
              onChange={e => setFormInstitucionId(e.target.value)}
              required
            >
              <option value="">Seleccionar...</option>
              {institucionesModal.slice(0, 200).map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.nombre}
                  {inst.tipo ? ` — ${etiquetaTipoInstitucion(inst.tipo)}` : ""}
                </option>
              ))}
            </Select>
            {institucionesModal.length === 0 && (
              <p className="text-xs text-amber-700 mt-1">Ninguna institución coincide con el filtro.</p>
            )}
            {institucionesModal.length > 200 && (
              <p className="text-xs text-neutral-gray-medium mt-1">
                Mostrando las primeras 200 coincidencias. Acote la búsqueda si no encuentra la suya.
              </p>
            )}
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
      </div>
    </>
  );

  if (embedded) return inner;

  return (
    <Card
      title={
        <>
          <FaUsers /> Administradores de institución
        </>
      }
      description="Los administradores gestionan usuarios y perfiles solo dentro de su institución."
    >
      {inner}
    </Card>
  );
}
