import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaClipboardList, FaFileAlt, FaPlus } from "react-icons/fa";
import { GenerarReporteSection } from "./GenerarReporteSection";
import { ObservacionesBitacoraView, type ObservacionBitacora } from "./ObservacionesBitacoraView";
import { getRolPanelConfig } from "../config/rolPanelConfig";
import { parseApiError } from "../utils/parseApiError";
import { Tabs } from "./ui/Tabs";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { Field } from "./ui/Field";
import { Select } from "./ui/Select";
import { useRoleTheme } from "../context/RoleThemeContext";
import { cn } from "../theme/cn";

type Perfil = { id: number; nombre: string };

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
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [perfilId, setPerfilId] = useState<string>("");
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [perfilesError, setPerfilesError] = useState<string | null>(null);
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

  const fetchPerfiles = useCallback(async () => {
    setPerfilesError(null);
    try {
      const res = await fetch("http://localhost:3000/api/perfiles", {
        headers: { Authorization: `Bearer ${token()}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPerfilesError(parseApiError(data, "No se pudieron cargar los perfiles"));
        setPerfiles([]);
        return;
      }
      const list: Perfil[] = data.perfiles ?? [];
      setPerfiles(list);
      setPerfilId(prev => {
        if (prev && list.some(p => String(p.id) === prev)) return prev;
        return list.length > 0 ? String(list[0].id) : "";
      });
    } catch {
      setPerfilesError("Error de red al cargar perfiles. Verifique que el backend esté activo.");
      setPerfiles([]);
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
    fetchPerfiles();
  }, [fetchPerfiles]);

  useEffect(() => {
    fetchObservaciones();
  }, [fetchObservaciones]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchPerfiles();
        fetchObservaciones();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchPerfiles, fetchObservaciones]);

  const irANuevaObservacion = () => {
    const q = perfilId ? `?perfil=${perfilId}` : "";
    navigate(`/observaciones/nueva${q}`);
  };

  const irAEditarObservacion = (id: number) => {
    navigate(`/observaciones/${id}/editar`);
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
            <Field label={config.perfilLabel}>
              <Select value={perfilId} onChange={e => setPerfilId(e.target.value)}>
                <option value="">Seleccionar perfil...</option>
                {perfiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            {perfilesError && (
              <Alert variant="error" className="mt-3 mb-0">
                {perfilesError}
              </Alert>
            )}
            {perfiles.length === 0 && !perfilesError && (
              <Alert variant="warning" className="mt-3 mb-0">
                No hay perfiles asociados. El administrador de la institución debe
                registrarlos primero.
              </Alert>
            )}
          </Card>

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
