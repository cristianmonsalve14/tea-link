import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaClipboardList, FaFileAlt, FaPlus, FaUser } from "react-icons/fa";
import { GenerarReporteSection } from "./GenerarReporteSection";
import { ObservacionesBitacoraView, type ObservacionBitacora } from "./ObservacionesBitacoraView";
import { PerfilSelector } from "./perfiles/PerfilSelector";
import { getRolPanelConfig } from "../config/rolPanelConfig";
import { getPerfilActivoId } from "../utils/auth";
import { parseApiError } from "../utils/parseApiError";
import { Tabs } from "./ui/Tabs";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { useRoleTheme } from "../context/RoleThemeContext";
import { ApoderadosFamiliaSection } from "./familia/ApoderadosFamiliaSection";
import { cn } from "../theme/cn";

type Observacion = ObservacionBitacora & {
  perfil_id: number;
  perfil: { id: number; nombre: string };
};

type Props = {
  rol: string;
};

export function ObservacionesRolDashboard({ rol }: Props) {
  const navigate = useNavigate();
  const config = getRolPanelConfig(rol);
  const theme = useRoleTheme();
  const [perfilId, setPerfilId] = useState<string>(() => {
    if (rol === "FAMILIA") {
      const activo = getPerfilActivoId();
      if (activo) return String(activo);
    }
    return "";
  });
  const [perfilNombre, setPerfilNombre] = useState("");
  const [perfilListKey, setPerfilListKey] = useState(0);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [tab, setTab] = useState<"observaciones" | "reportes">("observaciones");

  const token = () => localStorage.getItem("token");

  useEffect(() => {
    try {
      const t = token();
      if (!t) return;
      const payload = JSON.parse(atob(t.split(".")[1]));
      setUserId(payload.userId ?? null);
    } catch {
      setUserId(null);
    }
  }, []);

  const fetchObservaciones = useCallback(async () => {
    if (!perfilId) {
      setObservaciones([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:3000/api/observaciones?perfil_id=${perfilId}`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(parseApiError(data, "Error al cargar observaciones"));
        setObservaciones([]);
        return;
      }
      const data = await res.json();
      setObservaciones(data.observaciones ?? []);
    } catch {
      setError("Error de red");
      setObservaciones([]);
    } finally {
      setLoading(false);
    }
  }, [perfilId]);

  useEffect(() => {
    fetchObservaciones();
  }, [fetchObservaciones]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setPerfilListKey(k => k + 1);
        fetchObservaciones();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchObservaciones]);

  const irANuevaObservacion = () => {
    const q = perfilId ? `?perfil=${perfilId}` : "";
    navigate(`/observaciones/nueva${q}`);
  };

  const irAEditarObservacion = (id: number) => {
    navigate(`/observaciones/${id}/editar`);
  };

  const puedeVerFicha = ["MEDICO", "PROFESIONAL", "EDUCADOR"].includes(rol);

  const irAFichaPaciente = () => {
    if (perfilId) navigate(`/perfiles/${perfilId}/ficha`);
  };

  const handleEliminar = async (obs: ObservacionBitacora) => {
    if (obs.autor_id !== userId) return;
    if (!window.confirm(`¿Eliminar observación "${obs.titulo}"?`)) return;
    try {
      const res = await fetch(`http://localhost:3000/api/observaciones/${obs.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(parseApiError(data, "Error al eliminar"));
        return;
      }
      await fetchObservaciones();
    } catch {
      setError("Error de red");
    }
  };

  const tabItems = [
    { id: "observaciones" as const, label: config.observacionesTitle, icon: <FaClipboardList /> },
    ...(config.showReportesTab
      ? [{ id: "reportes" as const, label: config.reportesTabLabel, icon: <FaFileAlt /> }]
      : [])
  ];

  return (
    <div className="w-full">
      <p className={cn("text-sm mb-6 max-w-2xl", theme.accentText)}>
        {config.hint} Las observaciones del equipo vinculado a este perfil aparecen aquí según
        su nivel de privacidad.
      </p>

      <Tabs active={tab} onChange={setTab} items={tabItems} />

      {tab === "reportes" && config.showReportesTab ? (
        <GenerarReporteSection />
      ) : (
        <>
          <Card className="mb-4">
            <PerfilSelector
              key={perfilListKey}
              label={config.perfilLabel}
              value={perfilId}
              onChange={(id, perfil) => {
                setPerfilId(id);
                setPerfilNombre(perfil?.nombre ?? "");
              }}
              searchPlaceholder="Buscar por nombre, apellido o diagnóstico..."
              emptyMessage={
                rol === "FAMILIA"
                  ? "No tiene perfiles asignados. El colegio o centro médico debe crear el perfil e invitarle como apoderado."
                  : "No hay perfiles asociados. El administrador de la institución debe asignárselos primero."
              }
            />
            {puedeVerFicha && perfilId && (
              <div className="mt-4">
                <Button variant="secondary" onClick={irAFichaPaciente}>
                  <FaUser />
                  Ver ficha del paciente
                </Button>
              </div>
            )}
          </Card>

          {rol === "FAMILIA" && perfilId && (
            <div className="mb-4">
              <ApoderadosFamiliaSection perfilId={perfilId} perfilNombre={perfilNombre} />
            </div>
          )}

          <Card
            title={
              <>
                <FaClipboardList /> {config.observacionesTitle}
              </>
            }
            action={
              <Button disabled={!perfilId} onClick={irANuevaObservacion}>
                <FaPlus /> {config.nuevaObservacionLabel}
              </Button>
            }
          >
            {error && <Alert variant="error">{error}</Alert>}

            <ObservacionesBitacoraView
              observaciones={observaciones}
              loading={loading}
              emptyMessage={config.emptyObservaciones}
              rolViewer={rol}
              userId={userId}
              perfilId={perfilId}
              nuevaLabel={config.nuevaObservacionLabel}
              onEdit={irAEditarObservacion}
              onEliminar={handleEliminar}
              onNueva={irANuevaObservacion}
            />
          </Card>
        </>
      )}
    </div>
  );
}
