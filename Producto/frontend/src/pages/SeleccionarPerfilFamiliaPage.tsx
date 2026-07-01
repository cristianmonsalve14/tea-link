import { useEffect, useState } from "react";
import { apiUrl } from '../config/api';
import { useNavigate } from "react-router-dom";
import { RoleThemeProvider } from "../context/RoleThemeContext";
import { TeaLogo } from "../components/ui/TeaLogo";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import {
  clearSession,
  getToken,
  getUserName,
  setPerfilActivo
} from "../utils/auth";
import { parseApiError } from "../utils/parseApiError";
import { cn } from "../theme/cn";
import {
  etiquetaEstadoConsentimientoPendiente,
  type ConsentimientoSujeto
} from "../utils/perfilConsentimiento";

type PerfilFamilia = {
  id: number;
  nombre: string;
  edad?: number | null;
  diagnostico_clinico?: string | null;
  consentimiento_estado: "PENDIENTE" | "ACEPTADO" | "RECHAZADO";
  consentimiento_sujeto?: ConsentimientoSujeto;
  rol_en_perfil?: "TUTOR" | "TITULAR";
  institucion?: { nombre: string };
};

function etiquetaEstadoPerfil(p: PerfilFamilia): string {
  if (p.consentimiento_estado === "PENDIENTE") {
    return etiquetaEstadoConsentimientoPendiente(p.consentimiento_sujeto ?? "TUTOR_LEGAL");
  }
  if (p.consentimiento_estado === "ACEPTADO") {
    return p.rol_en_perfil === "TITULAR"
      ? "Autorizado — puede ingresar a su perfil"
      : "Autorizado — puede ingresar";
  }
  return "Consentimiento rechazado";
}

export default function SeleccionarPerfilFamiliaPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [perfiles, setPerfiles] = useState<PerfilFamilia[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function cargar() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(apiUrl("/api/perfiles/familia/tutor"), {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setError(parseApiError(data, "No se pudieron cargar los perfiles"));
          }
          return;
        }
        if (!cancelled) setPerfiles(data.perfiles ?? []);
      } catch {
        if (!cancelled) setError("Error de red. Verifique que el backend esté activo.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void cargar();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleElegir = (p: PerfilFamilia) => {
    if (p.consentimiento_estado === "RECHAZADO") return;
    if (p.consentimiento_estado === "PENDIENTE") {
      navigate(`/familia/consentimiento/${p.id}`, { replace: true });
      return;
    }
    setPerfilActivo(p.id, p.nombre);
    navigate("/dashboard", { replace: true });
  };

  const handleSalir = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  const nombre = getUserName();
  const esSoloTitular =
    perfiles.length > 0 && perfiles.every(p => p.rol_en_perfil === "TITULAR");

  return (
    <RoleThemeProvider rol="FAMILIA">
      <div className="min-h-screen bg-neutral-gray-light flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <div className="flex items-center gap-3 mb-6">
            <TeaLogo size={48} />
            <div>
              <h1 className="text-xl font-bold text-primary-blue">TEA Link</h1>
              <p className="text-sm text-neutral-gray-medium">Selección de perfil</p>
            </div>
          </div>

          <Card title="¿Sobre quién desea ingresar?">
            {nombre && (
              <p className="text-sm text-neutral-gray-medium mb-4">
                {esSoloTitular ? "Cuenta:" : "Tutor:"}{" "}
                <strong>{nombre}</strong>
              </p>
            )}
            <p className="text-sm text-neutral-gray-medium mb-4">
              {esSoloTitular
                ? "Elija su perfil registrado por la institución. Si aún no ha autorizado el uso de datos, deberá leer y aceptar el consentimiento antes de continuar."
                : "Elija el perfil vinculado a su cuenta. Si aún no ha autorizado el uso de datos (como tutor o como estudiante mayor de edad), deberá leer y aceptar el consentimiento antes de continuar."}
            </p>

            {loading && <p className="text-sm text-neutral-gray-medium">Cargando perfiles...</p>}
            {error && <Alert variant="error">{error}</Alert>}

            {!loading && !error && perfiles.length === 0 && (
              <Alert variant="warning">
                No tiene perfiles vinculados. Contacte al administrador de la institución que
                registró el perfil.
              </Alert>
            )}

            <ul className="space-y-3">
              {perfiles.map(p => (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={p.consentimiento_estado === "RECHAZADO"}
                    onClick={() => handleElegir(p)}
                    className={cn(
                      "w-full text-left rounded-xl border p-4 transition-colors",
                      p.consentimiento_estado === "RECHAZADO"
                        ? "border-neutral-gray-medium/30 opacity-60 cursor-not-allowed"
                        : "border-primary-blue/30 hover:border-primary-blue hover:bg-primary-blue/5"
                    )}
                  >
                    <p className="font-semibold text-neutral-gray">{p.nombre}</p>
                    {p.rol_en_perfil === "TITULAR" && (
                      <p className="text-xs text-neutral-gray-medium mt-1">Su perfil (titular)</p>
                    )}
                    {p.institucion?.nombre && (
                      <p className="text-xs text-neutral-gray-medium mt-1">
                        Institución: {p.institucion.nombre}
                      </p>
                    )}
                    <p
                      className={cn(
                        "text-xs mt-2 font-medium",
                        p.consentimiento_estado === "ACEPTADO" && "text-status-success",
                        p.consentimiento_estado === "PENDIENTE" && "text-status-warning",
                        p.consentimiento_estado === "RECHAZADO" && "text-status-error"
                      )}
                    >
                      {etiquetaEstadoPerfil(p)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>

            <Button type="button" variant="secondary" className="w-full mt-4" onClick={handleSalir}>
              Cerrar sesión
            </Button>
          </Card>
        </div>
      </div>
    </RoleThemeProvider>
  );
}
