import { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl } from '../config/api';
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { Field } from "./ui/Field";
import { Select } from "./ui/Select";
import {
  filtrarStaffAsignablePorNivel,
  etiquetaRolesAsignables,
  rolesAsignablesPorInstitucion
} from "../utils/perfilEquipoAsignacion";
import { etiquetaNivelEducacional } from "../utils/nivelEducacional";
import type { NivelEducacional } from "../utils/nivelEducacional";

type Staff = {
  id: number;
  email: string;
  nombre_completo: string;
  rol: string;
  niveles_educacionales?: NivelEducacional[] | null;
};

type Miembro = {
  id: number;
  rol_en_perfil: string;
  usuario: {
    id: number;
    email: string;
    nombre_completo: string;
    rol: string;
  };
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
  open: boolean;
  perfilId: number | null;
  perfilNombre: string;
  perfilNivelEducacional?: NivelEducacional | null;
  tipoInstitucion: string;
  onClose: () => void;
  onAsignado?: () => void;
};

export function AsignarEquipoPerfilModal({
  open,
  perfilId,
  perfilNombre,
  perfilNivelEducacional,
  tipoInstitucion,
  onClose,
  onAsignado
}: Props) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [staffId, setStaffId] = useState("");
  const [loading, setLoading] = useState(false);
  const [asignando, setAsignando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const rolesPermitidos = useMemo(
    () => rolesAsignablesPorInstitucion(tipoInstitucion),
    [tipoInstitucion]
  );
  const esColegio = tipoInstitucion === "CENTRO_EDUCACIONAL";
  const token = () => localStorage.getItem("token");

  const api = useCallback(
    (path: string, options?: RequestInit) =>
      fetch(apiUrl(`/api/perfiles${path}`), {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
          ...options?.headers
        }
      }),
    []
  );

  const cargarDatos = useCallback(async () => {
    if (!perfilId || !open) return;
    setLoading(true);
    setError(null);
    setMensaje(null);
    try {
      const [resStaff, resMiembros] = await Promise.all([
        fetch(apiUrl("/api/auth/usuarios"), {
          headers: { Authorization: `Bearer ${token()}` }
        }),
        api(`/${perfilId}/miembros-equipo`)
      ]);
      const dataStaff = await resStaff.json().catch(() => ({}));
      const dataMiembros = await resMiembros.json().catch(() => ({}));
      if (!resMiembros.ok) {
        setError(parseApiError(dataMiembros, "No se pudo cargar el equipo del perfil"));
        return;
      }
      const operativos = (dataStaff.usuarios ?? []).filter((u: Staff) =>
        rolesPermitidos.includes(u.rol)
      );
      setStaff(operativos);
      setMiembros(dataMiembros.miembros ?? []);
    } catch {
      setError("Error de red al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [api, open, perfilId, rolesPermitidos]);

  useEffect(() => {
    if (open && perfilId) {
      setStaffId("");
      cargarDatos();
    }
  }, [open, perfilId, cargarDatos]);

  const asignar = async () => {
    if (!perfilId || !staffId) return;
    setAsignando(true);
    setError(null);
    setMensaje(null);
    try {
      const res = await api(`/${perfilId}/asignar-miembro`, {
        method: "POST",
        body: JSON.stringify({ usuario_id: Number(staffId) })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiError(data, "No se pudo asignar"));
        return;
      }
      setMensaje(typeof data.message === "string" ? data.message : "Profesional asignado");
      setStaffId("");
      await cargarDatos();
      onAsignado?.();
    } catch {
      setError("Error de red al asignar");
    } finally {
      setAsignando(false);
    }
  };

  const miembrosInstitucion = miembros.filter(m => m.usuario.rol !== "FAMILIA");
  const staffPorNivel = useMemo(
    () => filtrarStaffAsignablePorNivel(staff, perfilNivelEducacional, tipoInstitucion),
    [staff, perfilNivelEducacional, tipoInstitucion]
  );
  const staffDisponible = staffPorNivel.filter(
    s => !miembrosInstitucion.some(m => m.usuario.id === s.id)
  );
  const excluidosPorNivel = staff.filter(
    s =>
      !staffPorNivel.some(ok => ok.id === s.id) &&
      !miembrosInstitucion.some(m => m.usuario.id === s.id)
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Asignar equipo — ${perfilNombre}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={asignar} disabled={!staffId || asignando || loading}>
            {asignando ? "Asignando..." : "Asignar"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-neutral-gray-medium mb-4">
        Asigne {etiquetaRolesAsignables(tipoInstitucion)} de su institución a este perfil. Puede
        agregar varios; cada uno solo verá los perfiles que usted asigne.
      </p>

      {esColegio && perfilNivelEducacional && (
        <p className="text-sm text-neutral-gray-medium mb-4 rounded-lg border border-gray-200 bg-neutral-gray-light/50 px-3 py-2">
          Nivel del alumno: <strong>{etiquetaNivelEducacional(perfilNivelEducacional)}</strong>.
          Solo aparecen educadores que tengan ese nivel en su ficha.
        </p>
      )}

      {loading && <p className="text-sm text-neutral-gray-medium">Cargando...</p>}
      {mensaje && <Alert variant="success" className="mb-3">{mensaje}</Alert>}
      {error && <Alert variant="error" className="mb-3">{error}</Alert>}

      {!loading && (
        <>
          {miembrosInstitucion.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold mb-2">Ya asignados en su institución</p>
              <ul className="text-sm space-y-1">
                {miembrosInstitucion.map(m => (
                  <li key={m.id}>
                    {m.usuario.nombre_completo} ({m.usuario.rol})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {staffDisponible.length === 0 ? (
            <p className="text-sm text-neutral-gray-medium">
              {staff.length === 0
                ? `No hay ${etiquetaRolesAsignables(tipoInstitucion)} registrados en su institución. Créelos en la pestaña Equipo.`
                : excluidosPorNivel.length > 0 && esColegio && perfilNivelEducacional
                  ? `Ningún educador disponible tiene el nivel ${etiquetaNivelEducacional(perfilNivelEducacional)}. Edite la ficha del educador o registre uno con ese nivel.`
                  : "Todos los profesionales de su institución ya están asignados a este perfil."}
            </p>
          ) : (
            <Field label="Seleccionar profesional">
              <Select value={staffId} onChange={e => setStaffId(e.target.value)}>
                <option value="">Seleccione...</option>
                {staffDisponible.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nombre_completo} — {u.rol}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </>
      )}
    </Modal>
  );
}
