import { useState } from "react";
import { apiUrl } from '../config/api';
import { useNavigate } from "react-router-dom";
import { RoleThemeProvider } from "../context/RoleThemeContext";
import { TeaLogo } from "../components/ui/TeaLogo";
import { Card } from "../components/ui/Card";
import { Field } from "../components/ui/Field";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import {
  clearMustChangePassword,
  clearSession,
  getPostAuthPath,
  getRole,
  getToken,
  saveSession
} from "../utils/auth";
import {
  validarConfirmacionPassword,
  validarPasswordNueva
} from "../utils/formValidation";

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

export default function CambiarPasswordInicialPage() {
  const navigate = useNavigate();
  const rol = getRole();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    actual?: string;
    nueva?: string;
    confirmar?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setError(null);

    const errores = {
      actual: !actual ? "La contraseña temporal actual es obligatoria" : undefined,
      nueva: validarPasswordNueva(nueva) ?? undefined,
      confirmar: validarConfirmacionPassword(nueva, confirmar) ?? undefined
    };
    setFieldErrors(errores);
    const primerError = errores.actual ?? errores.nueva ?? errores.confirmar ?? null;
    if (primerError) {
      setError(primerError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/cambiar-password-inicial"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password_actual: actual,
          password_nueva: nueva
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiError(data, "No se pudo actualizar la contraseña"));
        return;
      }

      const institucion =
        data.user?.institucion_nombre ?? data.user?.institucion_id?.toString();
      saveSession(
        data.token,
        data.user?.rol,
        institucion,
        data.user?.institucion_tipo,
        false,
        data.user?.nombre_completo
      );
      clearMustChangePassword();
      navigate(getPostAuthPath(), { replace: true });
    } catch {
      setError("Error de red. Verifique que el backend esté en marcha.");
    } finally {
      setLoading(false);
    }
  };

  const handleSalir = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <RoleThemeProvider rol={rol}>
      <div className="min-h-screen bg-neutral-gray-light flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 mb-6">
          <TeaLogo size={48} />
          <div>
            <h1 className="text-xl font-bold text-primary-blue">TEA Link</h1>
            <p className="text-sm text-neutral-gray-medium">Configuración de acceso</p>
          </div>
        </div>

        <Card className="w-full max-w-md" title="Defina su contraseña">
          <p className="text-sm text-neutral-gray-medium mb-4">
            Por seguridad, debe reemplazar la contraseña temporal que le entregó su
            administrador antes de usar el panel.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Contraseña temporal actual"
              required
              error={submitAttempted ? fieldErrors.actual : undefined}
            >
              <Input
                type="password"
                value={actual}
                onChange={e => setActual(e.target.value)}
                autoComplete="current-password"
                required
                error={submitAttempted && Boolean(fieldErrors.actual)}
              />
            </Field>
            <Field
              label="Nueva contraseña"
              required
              error={submitAttempted ? fieldErrors.nueva : undefined}
            >
              <Input
                type="password"
                value={nueva}
                onChange={e => setNueva(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                error={submitAttempted && Boolean(fieldErrors.nueva)}
              />
            </Field>
            <Field
              label="Confirmar nueva contraseña"
              required
              error={submitAttempted ? fieldErrors.confirmar : undefined}
            >
              <Input
                type="password"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                error={submitAttempted && Boolean(fieldErrors.confirmar)}
              />
            </Field>

            {error && <Alert variant="error">{error}</Alert>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Guardando..." : "Guardar y continuar al panel"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleSalir}
              disabled={loading}
            >
              Cerrar sesión
            </Button>
          </form>
        </Card>
      </div>
    </RoleThemeProvider>
  );
}
