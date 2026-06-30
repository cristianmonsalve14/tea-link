import { useEffect, useState } from "react";
import { FaBuilding, FaGraduationCap, FaUserFriends, FaUserMd } from "react-icons/fa";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import { Card } from "../ui/Card";
import { ScrollableTable } from "../ui/ScrollableTable";
import { dataTable } from "../ui/dataTable";
import { AsignarEquipoPerfilModal } from "../AsignarEquipoPerfilModal";
import { adminPuedeAsignarEquipoPerfil } from "../../utils/perfilEquipoAsignacion";
import { cn } from "../../theme/cn";
import { getSectionTheme } from "../../theme/roleTheme";
import { etiquetaNivelEducacional, type NivelEducacional } from "../../utils/nivelEducacional";
import { formatearEdadPerfil } from "../../utils/edadDesdeFechaNacimiento";
import {
  etiquetaCausaDiscapacidad,
  etiquetaGradoDiscapacidad,
  resumenDiagnosticoPerfil
} from "../../utils/diagnosticoPerfil";
import { PerfilObservacionesLectura } from "./PerfilObservacionesLectura";
import { InstitucionContactoCard } from "../instituciones/InstitucionContactoCard";
import type { InstitucionContacto } from "../../utils/institucionContacto";
import { etiquetaEstadoConsentimientoPendiente } from "../../utils/perfilConsentimiento";

type EquipoMiembro = {
  nombre_completo: string;
  email: string;
  rol_en_perfil_label: string;
  institucion?: { nombre: string; tipo_label?: string } | null;
};

type InstitucionRef = InstitucionContacto;

export type DetallePerfil = {
  modo?: "admin" | "equipo";
  perfil: {
    id: number;
    nombre: string;
    edad?: number | null;
    nivel_educacional?: string | null;
    diagnostico_clinico?: string | null;
    diagnostico_secundario?: string | null;
    causa_discapacidad?: string | null;
    grado_discapacidad?: string | null;
    porcentaje_rnd?: number | null;
    tiene_credencial_rnd?: boolean;
    fecha_nacimiento?: string | null;
    notas?: string | null;
    consentimiento_estado?: string;
    consentimiento_sujeto?: "TUTOR_LEGAL" | "TITULAR";
    consentimiento_aceptado_at?: string | null;
    created_at?: string;
  };
  es_propio?: boolean;
  institucion_duena?: InstitucionRef | null;
  centro_educacional?: InstitucionRef | null;
  instituciones_vinculadas: Array<{
    id: number;
    estado?: string;
    solicitante: InstitucionRef;
    invitada: InstitucionRef;
    created_at?: string;
  }>;
  equipo_por_rol: {
    familia: EquipoMiembro[];
    educadores: EquipoMiembro[];
    medicos: EquipoMiembro[];
    profesionales: EquipoMiembro[];
  };
  estadisticas: {
    total_instituciones?: number;
    total_miembros: number;
    colaboraciones_activas: number;
  };
};

const ESTADO_COLAB: Record<string, string> = {
  PENDIENTE: "Pendiente",
  ACEPTADA: "Activa",
  RECHAZADA: "Rechazada"
};

function EquipoLista({ items, vacio }: { items: EquipoMiembro[]; vacio: string }) {
  if (items.length === 0) {
    return <p className="text-xs text-neutral-gray-medium">{vacio}</p>;
  }
  return (
    <ul className="text-sm space-y-2">
      {items.map(m => (
        <li key={`${m.email}-${m.rol_en_perfil_label}`}>
          <span className="font-medium">{m.nombre_completo}</span>
          <span className="text-neutral-gray-medium"> — {m.email}</span>
          {m.institucion && (
            <span className="text-xs text-neutral-gray-medium block">
              {m.institucion.nombre}
              {m.institucion.tipo_label ? ` (${m.institucion.tipo_label})` : ""}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

type Props = {
  perfilId: number;
  tipoInstitucion?: string;
};

export function PerfilDetalleContent({ perfilId, tipoInstitucion: tipoProp }: Props) {
  const section = getSectionTheme("default");
  const [detalle, setDetalle] = useState<DetallePerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asignarOpen, setAsignarOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const tipoInstitucion =
    tipoProp || localStorage.getItem("institucion_tipo") || "";

  useEffect(() => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3000/api/perfiles/${perfilId}/detalle`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : "No se pudo cargar la ficha"
          );
        }
        setDetalle(data);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : "Error de red");
        setDetalle(null);
      })
      .finally(() => setLoading(false));
  }, [perfilId, reloadKey]);

  const p = detalle?.perfil;
  const esAdmin = detalle?.modo !== "equipo";
  const puedeAsignar =
    esAdmin &&
    detalle &&
    adminPuedeAsignarEquipoPerfil(
      {
        es_propio: detalle.es_propio ?? false,
        consentimiento_estado: p?.consentimiento_estado
      },
      tipoInstitucion
    );

  if (loading) {
    return <p className="text-neutral-gray-medium">Cargando ficha del perfil...</p>;
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!detalle || !p) {
    return <Alert variant="error">No se encontró el perfil.</Alert>;
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-gray">{p.nombre}</h2>
          <p className="text-sm text-neutral-gray-medium mt-1">
            {esAdmin
              ? "Ficha completa del menor en TEA Link"
              : "Ficha clínica — datos del paciente y equipo tratante"}
          </p>
        </div>
        {puedeAsignar && (
          <Button variant="secondary" onClick={() => setAsignarOpen(true)}>
            Asignar equipo
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <Card title="Datos del paciente">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {p.fecha_nacimiento && (
              <div>
                <span className="text-neutral-gray-medium">Fecha de nacimiento</span>
                <p className="font-medium">
                  {new Date(p.fecha_nacimiento).toLocaleDateString("es-CL")}
                </p>
              </div>
            )}
            <div>
              <span className="text-neutral-gray-medium">Edad</span>
              <p className="font-medium">{formatearEdadPerfil(p.fecha_nacimiento, p.edad)}</p>
            </div>
            {p.nivel_educacional && (
              <div>
                <span className="text-neutral-gray-medium">Nivel educacional</span>
                <p className="font-medium">{etiquetaNivelEducacional(p.nivel_educacional)}</p>
              </div>
            )}
            <div className="sm:col-span-2">
              <span className="text-neutral-gray-medium">Diagnóstico clínico</span>
              <p className="font-medium">{resumenDiagnosticoPerfil(p)}</p>
            </div>
            <div>
              <span className="text-neutral-gray-medium">Credencial RND</span>
              <p className="font-medium">{p.tiene_credencial_rnd ? "Sí" : "No"}</p>
            </div>
            {p.grado_discapacidad && p.grado_discapacidad !== "NO_CALIFICADO" && (
              <div>
                <span className="text-neutral-gray-medium">Grado discapacidad</span>
                <p className="font-medium">{etiquetaGradoDiscapacidad(p.grado_discapacidad)}</p>
              </div>
            )}
            {p.causa_discapacidad && (
              <div>
                <span className="text-neutral-gray-medium">Causa (Decreto 47)</span>
                <p className="font-medium">{etiquetaCausaDiscapacidad(p.causa_discapacidad)}</p>
              </div>
            )}
            {p.porcentaje_rnd != null && (
              <div>
                <span className="text-neutral-gray-medium">Porcentaje RND</span>
                <p className="font-medium">{p.porcentaje_rnd}%</p>
              </div>
            )}
            {esAdmin && (
              <>
                <div>
                  <span className="text-neutral-gray-medium">Consentimiento</span>
                  <p className="font-medium">
                    {p.consentimiento_estado === "PENDIENTE"
                      ? etiquetaEstadoConsentimientoPendiente(
                          p.consentimiento_sujeto ?? "TUTOR_LEGAL"
                        )
                      : p.consentimiento_estado === "ACEPTADO"
                        ? "Autorizado"
                        : p.consentimiento_estado === "RECHAZADO"
                          ? "Rechazado"
                          : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-gray-medium">Tipo en su institución</span>
                  <p className="font-medium">{detalle.es_propio ? "Propio" : "Compartido"}</p>
                </div>
              </>
            )}
            {p.notas && (
              <div className="sm:col-span-2 lg:col-span-3">
                <span className="text-neutral-gray-medium">Notas clínicas / seguimiento</span>
                <p className="font-medium whitespace-pre-wrap">{p.notas}</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-xs mt-4">
            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary-dark">
              {detalle.estadisticas.total_miembros} miembro
              {detalle.estadisticas.total_miembros !== 1 ? "s" : ""} en equipo
            </span>
            {detalle.estadisticas.colaboraciones_activas > 0 && (
              <span className="px-2 py-1 rounded-full bg-secondary/10 text-secondary-dark">
                {detalle.estadisticas.colaboraciones_activas} institución
                {detalle.estadisticas.colaboraciones_activas !== 1 ? "es" : ""} en red
              </span>
            )}
          </div>
        </Card>

        {esAdmin && (
          <PerfilObservacionesLectura
            perfilId={perfilId}
            consentimientoEstado={p.consentimiento_estado}
          />
        )}

        {(detalle.centro_educacional || detalle.institucion_duena) && (
          <Card
            title={
              <span className="flex items-center gap-2">
                <FaGraduationCap />
                Instituciones del paciente
              </span>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              {detalle.centro_educacional && (
                <div>
                  <span className="text-neutral-gray-medium">Centro educacional</span>
                  <p className="font-medium">{detalle.centro_educacional.nombre}</p>
                  {detalle.centro_educacional.tipo_label && (
                    <p className="text-xs text-neutral-gray-medium">
                      {detalle.centro_educacional.tipo_label}
                    </p>
                  )}
                </div>
              )}
              {detalle.institucion_duena && (
                <div>
                  <span className="text-neutral-gray-medium">Institución responsable del perfil</span>
                  <p className="font-medium">{detalle.institucion_duena.nombre}</p>
                  {detalle.institucion_duena.tipo_label && (
                    <p className="text-xs text-neutral-gray-medium">
                      {detalle.institucion_duena.tipo_label}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {detalle.instituciones_vinculadas.length > 0 && (
          <Card
            title={
              <span className="flex items-center gap-2">
                <FaBuilding />
                {esAdmin ? "Instituciones vinculadas" : "Red interinstitucional activa"}
              </span>
            }
          >
            <ScrollableTable>
              <table className={dataTable.table}>
                <thead>
                  <tr className={section.tableHead}>
                    <th className={dataTable.th}>Solicitante</th>
                    <th className={dataTable.th}>Invitada</th>
                    {esAdmin && <th className={dataTable.th}>Estado</th>}
                    {esAdmin && <th className={dataTable.th}>Contacto</th>}
                  </tr>
                </thead>
                <tbody>
                  {detalle.instituciones_vinculadas.map(iv => (
                    <tr key={iv.id} className={cn("border-b", section.tableRowHover)}>
                      <td className={dataTable.td}>
                        {iv.solicitante.nombre}
                        {iv.solicitante.tipo_label && (
                          <span className="block text-sm text-neutral-gray-medium">
                            {iv.solicitante.tipo_label}
                          </span>
                        )}
                      </td>
                      <td className={dataTable.td}>
                        {iv.invitada.nombre}
                        {iv.invitada.tipo_label && (
                          <span className="block text-sm text-neutral-gray-medium">
                            {iv.invitada.tipo_label}
                          </span>
                        )}
                      </td>
                      {esAdmin && (
                        <td className={dataTable.td}>
                          {ESTADO_COLAB[iv.estado ?? ""] ?? iv.estado ?? "—"}
                        </td>
                      )}
                      {esAdmin && (
                        <td className={dataTable.td}>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-semibold text-neutral-gray-medium mb-1">
                                Solicitante
                              </p>
                              <InstitucionContactoCard
                                institucion={iv.solicitante}
                                showTipo={false}
                              />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-neutral-gray-medium mb-1">
                                Invitada
                              </p>
                              <InstitucionContactoCard
                                institucion={iv.invitada}
                                showTipo={false}
                              />
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollableTable>
          </Card>
        )}

        <Card
          title={
            <span className="flex items-center gap-2">
              <FaUserFriends />
              Equipo tratante
            </span>
          }
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-neutral-gray mb-2">Familia / Tutor</p>
              <EquipoLista
                items={detalle.equipo_por_rol.familia}
                vacio="Sin tutor ni titular registrado"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-gray mb-2">Educadores</p>
              <EquipoLista
                items={detalle.equipo_por_rol.educadores}
                vacio="Sin educadores asignados"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-gray mb-2 flex items-center gap-1">
                <FaUserMd /> Médicos tratantes
              </p>
              <EquipoLista items={detalle.equipo_por_rol.medicos} vacio="Sin médicos asignados" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-gray mb-2">
                Profesionales terapéuticos
              </p>
              <EquipoLista
                items={detalle.equipo_por_rol.profesionales}
                vacio="Sin profesionales asignados"
              />
            </div>
          </div>
        </Card>
      </div>

      {puedeAsignar && (
        <AsignarEquipoPerfilModal
          open={asignarOpen}
          perfilId={perfilId}
          perfilNombre={p.nombre}
          perfilNivelEducacional={p.nivel_educacional as NivelEducacional | null | undefined}
          tipoInstitucion={tipoInstitucion}
          onClose={() => setAsignarOpen(false)}
          onAsignado={() => setReloadKey(k => k + 1)}
        />
      )}
    </>
  );
}
