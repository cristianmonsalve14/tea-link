import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { ScrollableTable } from "./ui/ScrollableTable";
import { TableActionButton } from "./ui/TableActionButton";
import { dataTable } from "./ui/dataTable";
import { cn } from "../theme/cn";
import { getSectionTheme } from "../theme/roleTheme";
import { etiquetaEspecialidadEducador } from "../utils/especialidadEducador";
import type { EspecialidadEducador } from "../utils/especialidadEducador";
import { etiquetaProfesionProfesional } from "../utils/profesionProfesional";
import {
  etiquetaNivelEducacional,
  resumenNivelesEducador
} from "../utils/nivelEducacional";
import type { NivelEducacional } from "../utils/nivelEducacional";

type UsuarioDetalle = {
  id: number;
  email: string;
  nombre_completo: string;
  rol: string;
  niveles_educacionales?: NivelEducacional[];
  especialidad?: EspecialidadEducador | null;
  created_at?: string;
};

type PerfilVinculado = {
  id: number;
  nombre: string;
  nivel_educacional: NivelEducacional | null;
  consentimiento_estado: string;
  edad: number | null;
  rol_en_perfil: string;
};

type Props = {
  open: boolean;
  usuarioId: number | null;
  muestraCamposEducador: boolean;
  muestraProfesion?: boolean;
  onClose: () => void;
};

function parseApiError(errorData: Record<string, unknown>, fallback: string): string {
  if (typeof errorData?.error === "string") return errorData.error;
  return fallback;
}

function formatearFecha(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function etiquetaConsentimiento(estado: string): string {
  if (estado === "ACEPTADO") return "Consentimiento activo";
  if (estado === "PENDIENTE") return "Consentimiento pendiente";
  if (estado === "RECHAZADO") return "Consentimiento rechazado";
  return estado;
}

export function EducadorDetalleModal({
  open,
  usuarioId,
  muestraCamposEducador,
  muestraProfesion = false,
  onClose
}: Props) {
  const navigate = useNavigate();
  const section = getSectionTheme("team");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<UsuarioDetalle | null>(null);
  const [perfiles, setPerfiles] = useState<PerfilVinculado[]>([]);

  const cargarDetalle = useCallback(async () => {
    if (!usuarioId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3000/api/auth/usuario/${usuarioId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiError(data, "No se pudo cargar la ficha"));
        setUsuario(null);
        setPerfiles([]);
        return;
      }
      setUsuario(data.usuario ?? null);
      setPerfiles(data.perfiles ?? []);
    } catch {
      setError("Error de red al cargar la ficha");
      setUsuario(null);
      setPerfiles([]);
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    if (open && usuarioId) {
      void cargarDetalle();
    } else {
      setUsuario(null);
      setPerfiles([]);
      setError(null);
    }
  }, [open, usuarioId, cargarDetalle]);

  const titulo = muestraCamposEducador ? "Ficha del educador" : "Ficha del usuario";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titulo}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {loading ? (
        <p className="text-neutral-gray-medium text-sm">Cargando ficha...</p>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : usuario ? (
        <div className="space-y-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-neutral-gray-medium">Nombre</dt>
              <dd className="font-medium">{usuario.nombre_completo}</dd>
            </div>
            <div>
              <dt className="text-neutral-gray-medium">Email</dt>
              <dd className="font-medium">{usuario.email}</dd>
            </div>
            <div>
              <dt className="text-neutral-gray-medium">Rol</dt>
              <dd className="font-medium">{usuario.rol}</dd>
            </div>
            <div>
              <dt className="text-neutral-gray-medium">Registrado</dt>
              <dd className="font-medium">{formatearFecha(usuario.created_at)}</dd>
            </div>
            {muestraCamposEducador && (
              <>
                <div className="sm:col-span-2">
                  <dt className="text-neutral-gray-medium">Niveles que atiende</dt>
                  <dd className="font-medium">
                    {resumenNivelesEducador(usuario.niveles_educacionales)}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-gray-medium">Especialidad o cargo</dt>
                  <dd className="font-medium">
                    {etiquetaEspecialidadEducador(usuario.especialidad)}
                  </dd>
                </div>
              </>
            )}
            {muestraProfesion && usuario.rol === "PROFESIONAL" && (
              <div>
                <dt className="text-neutral-gray-medium">Profesión</dt>
                <dd className="font-medium">
                  {etiquetaProfesionProfesional(usuario.especialidad)}
                </dd>
              </div>
            )}
          </dl>

          <div>
            <h3 className={cn("text-sm font-semibold mb-3", section.accentText)}>
              Alumnos vinculados ({perfiles.length})
            </h3>
            {perfiles.length === 0 ? (
              <p className="text-sm text-neutral-gray-medium rounded-lg border border-dashed border-gray-200 p-4">
                Este usuario aún no tiene alumnos vinculados en la institución.
              </p>
            ) : (
              <ScrollableTable className="max-h-72 overflow-y-auto">
                <table className={dataTable.table}>
                  <thead>
                    <tr className={section.tableHead}>
                      <th className={dataTable.th}>Alumno</th>
                      <th className={dataTable.th}>Nivel</th>
                      <th className={dataTable.th}>Estado</th>
                      <th className={dataTable.th}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perfiles.map(p => (
                      <tr key={p.id} className={cn("border-b", section.tableRowHover)}>
                        <td className={dataTable.td}>{p.nombre}</td>
                        <td className={dataTable.td}>
                          {etiquetaNivelEducacional(p.nivel_educacional)}
                        </td>
                        <td className={dataTable.td}>
                          {etiquetaConsentimiento(p.consentimiento_estado)}
                        </td>
                        <td className={dataTable.td}>
                          <TableActionButton
                            onClick={() => {
                              onClose();
                              navigate(`/admin/perfiles/${p.id}`);
                            }}
                          >
                            Ver ficha
                          </TableActionButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollableTable>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
