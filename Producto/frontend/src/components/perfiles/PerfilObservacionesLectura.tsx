import { useCallback, useEffect, useState } from "react";
import { apiUrl } from '../../config/api';
import { FaClipboardList } from "react-icons/fa";
import {
  ObservacionesBitacoraView,
  type ObservacionBitacora
} from "../ObservacionesBitacoraView";
import { Card } from "../ui/Card";
import { Alert } from "../ui/Alert";
import { parseApiError } from "../../utils/parseApiError";

type Props = {
  perfilId: number;
  consentimientoEstado?: string;
};

export function PerfilObservacionesLectura({ perfilId, consentimientoEstado }: Props) {
  const [observaciones, setObservaciones] = useState<ObservacionBitacora[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchObservaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        apiUrl(`/api/observaciones?perfil_id=${perfilId}`),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiError(data, "No se pudieron cargar las observaciones"));
        setObservaciones([]);
        return;
      }
      setObservaciones(data.observaciones ?? []);
    } catch {
      setError("Error de red al cargar observaciones");
      setObservaciones([]);
    } finally {
      setLoading(false);
    }
  }, [perfilId]);

  useEffect(() => {
    if (consentimientoEstado && consentimientoEstado !== "ACEPTADO") {
      setObservaciones([]);
      setLoading(false);
      setError(null);
      return;
    }
    void fetchObservaciones();
  }, [consentimientoEstado, fetchObservaciones]);

  if (consentimientoEstado && consentimientoEstado !== "ACEPTADO") {
    return (
      <Card
        title={
          <span className="flex items-center gap-2">
            <FaClipboardList />
            Observaciones del equipo
          </span>
        }
      >
        <p className="text-sm text-neutral-gray-medium">
          Las observaciones estarán disponibles cuando se autorice el consentimiento de datos del
          perfil.
        </p>
      </Card>
    );
  }

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <FaClipboardList />
          Observaciones del equipo
        </span>
      }
      description="Consulta en solo lectura. Ve registros públicos y compartidos con el equipo; las notas clínicas privadas no se muestran."
    >
      {error && <Alert variant="error">{error}</Alert>}
      <ObservacionesBitacoraView
        observaciones={observaciones}
        loading={loading}
        emptyMessage="Aún no hay observaciones visibles para este perfil."
        rolViewer="ADMINISTRADOR"
        userId={null}
        soloLectura
      />
    </Card>
  );
}
