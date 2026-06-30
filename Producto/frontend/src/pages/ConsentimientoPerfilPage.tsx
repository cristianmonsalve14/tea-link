import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RoleThemeProvider } from "../context/RoleThemeContext";
import { TeaLogo } from "../components/ui/TeaLogo";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import {
  clearSession,
  getToken,
  setPerfilActivo
} from "../utils/auth";
import { parseApiError } from "../utils/parseApiError";

type ConsentData = {
  perfil: {
    id: number;
    nombre: string;
    consentimiento_estado: string;
    consentimiento_sujeto?: "TUTOR_LEGAL" | "TITULAR";
  };
  version: string;
  texto: string;
  requiere_accion: boolean;
  es_apoderado_secundario?: boolean;
};

export default function ConsentimientoPerfilPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const perfilId = Number(id);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ConsentData | null>(null);
  const [leido, setLeido] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(perfilId) || perfilId <= 0) {
      navigate("/familia/seleccionar-perfil", { replace: true });
      return;
    }

    let cancelled = false;
    async function cargar() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `http://localhost:3000/api/perfiles/${perfilId}/consentimiento`,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(parseApiError(json, "No se pudo cargar el consentimiento"));
          return;
        }
        if (!cancelled) {
          setData(json);
          if (json.perfil?.consentimiento_estado === "ACEPTADO") {
            setPerfilActivo(json.perfil.id, json.perfil.nombre);
            navigate("/dashboard", { replace: true });
          }
        }
      } catch {
        if (!cancelled) setError("Error de red.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void cargar();
    return () => {
      cancelled = true;
    };
  }, [perfilId, navigate]);

  const enviar = async (acepto: boolean) => {
    if (!data || (acepto && !leido)) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:3000/api/perfiles/${perfilId}/consentimiento`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ version: data.version, acepto })
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiError(json, "No se pudo registrar su respuesta"));
        return;
      }
      if (acepto) {
        setPerfilActivo(data.perfil.id, data.perfil.nombre);
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/familia/seleccionar-perfil", { replace: true });
      }
    } catch {
      setError("Error de red.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSalir = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  const esTitular = data?.perfil.consentimiento_sujeto === "TITULAR";
  const esApoderadoSecundario = data?.es_apoderado_secundario === true;

  return (
    <RoleThemeProvider rol="FAMILIA">
      <div className="min-h-screen bg-neutral-gray-light flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <TeaLogo size={48} />
            <div>
              <h1 className="text-xl font-bold text-primary-blue">TEA Link</h1>
              <p className="text-sm text-neutral-gray-medium">Consentimiento informado</p>
            </div>
          </div>

          <Card
            title={
              data
                ? `Autorización — ${data.perfil.nombre}`
                : esTitular
                  ? "Autorización del estudiante"
                  : "Autorización del tutor"
            }
          >
            {loading && <p className="text-sm text-neutral-gray-medium">Cargando...</p>}

            {data && !loading && (
              <>
                {esApoderadoSecundario && (
                  <p className="text-sm text-neutral-gray-medium mb-4">
                    El apoderado principal ya autorizó el perfil de{" "}
                    <strong>{data.perfil.nombre}</strong>. Confirme su propio consentimiento para
                    acceder a la bitácora.
                  </p>
                )}

                <div className="rounded-xl border border-neutral-gray-medium/25 bg-neutral-white p-4 max-h-64 overflow-y-auto text-sm text-neutral-gray leading-relaxed whitespace-pre-line mb-4">
                  {data.texto}
                </div>

                <label className="flex items-start gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={leido}
                    onChange={e => setLeido(e.target.checked)}
                  />
                  <span className="text-sm text-neutral-gray">
                    {esTitular ? (
                      <>
                        Declaro ser <strong>{data.perfil.nombre}</strong>, titular de este perfil
                        (mayor de edad), y autorizo el tratamiento de mis datos en TEA Link conforme
                        al texto anterior.
                      </>
                    ) : (
                      <>
                        Declaro ser padre, madre, tutor(a) o apoderado(a) legal de{" "}
                        <strong>{data.perfil.nombre}</strong> y autorizo el tratamiento de sus
                        datos en TEA Link conforme al texto anterior.
                      </>
                    )}
                  </span>
                </label>

                {error && <Alert variant="error">{error}</Alert>}

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    className="w-full sm:flex-1"
                    disabled={!leido || submitting}
                    onClick={() => enviar(true)}
                  >
                    {submitting ? "Registrando..." : "Acepto y continuar al panel"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:flex-1"
                    disabled={submitting}
                    onClick={() => enviar(false)}
                  >
                    No acepto
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full mt-2"
                  onClick={() => navigate("/familia/seleccionar-perfil")}
                  disabled={submitting}
                >
                  Volver a selección
                </Button>
              </>
            )}

            {!loading && !data && error && <Alert variant="error">{error}</Alert>}

            <Button type="button" variant="secondary" className="w-full mt-4" onClick={handleSalir}>
              Cerrar sesión
            </Button>
          </Card>
        </div>
      </div>
    </RoleThemeProvider>
  );
}
