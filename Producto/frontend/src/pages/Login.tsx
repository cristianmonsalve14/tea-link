import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, clearSession, saveSession, syncSessionFromToken, mustChangePassword } from "../utils/auth";
import { RoleThemeProvider } from "../context/RoleThemeContext";
import { TeaLogo } from "../components/ui/TeaLogo";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { Alert } from "../components/ui/Alert";
import { cn } from "../theme/cn";
import {
  FaChalkboardTeacher,
  FaHandsHelping,
  FaHome,
  FaStethoscope
} from "react-icons/fa";

const AUDIENCIAS = [
  {
    icon: FaHome,
    titulo: "Familias",
    texto: "Comparta lo que observa en casa y siga el avance de su hijo o hija en un solo lugar."
  },
  {
    icon: FaChalkboardTeacher,
    titulo: "Educadores",
    texto: "Registre conducta, aprendizaje y convivencia en el aula, con trazabilidad clara."
  },
  {
    icon: FaHandsHelping,
    titulo: "Profesionales",
    texto: "Documente intervenciones terapéuticas y coordine con el resto del equipo."
  },
  {
    icon: FaStethoscope,
    titulo: "Médicos",
    texto: "Lleve notas clínicas con el nivel de privacidad que cada situación requiera."
  }
] as const;

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false
  });
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (value: string) => {
    if (!value) return "El email es obligatorio";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return "Email inválido";
    return "";
  };
  const validatePassword = (value: string) => {
    if (!value) return "La contraseña es obligatoria";
    if (value.length < 6) return "Mínimo 6 caracteres";
    return "";
  };

  const emailError = touched.email ? validateEmail(email) : "";
  const passwordError = touched.password ? validatePassword(password) : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (validateEmail(email) || validatePassword(password)) return;
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      if (!response.ok) {
        throw new Error("Credenciales incorrectas o error de servidor");
      }
      const data = await response.json();
      setSuccess(true);
      const institucion =
        data.user?.institucion_nombre ?? data.user?.institucion_id?.toString();
      saveSession(
        data.token,
        data.user?.rol,
        institucion,
        data.user?.institucion_tipo,
        !!data.user?.must_change_password,
        data.user?.nombre_completo
      );
      setTimeout(() => {
        navigate(
          data.user?.must_change_password ? "/cambiar-contrasena" : "/dashboard"
        );
      }, data.user?.must_change_password ? 400 : 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated()) {
      setHasActiveSession(true);
    } else {
      clearSession();
      setHasActiveSession(false);
    }
  }, []);

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  const handleContinueSession = () => {
    syncSessionFromToken();
    navigate(mustChangePassword() ? "/cambiar-contrasena" : "/dashboard", { replace: true });
  };

  const handleLogout = () => {
    clearSession();
    setHasActiveSession(false);
    setSuccess(false);
    setError("");
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col lg:flex-row">
      {/* Panel descriptivo — solo desktop, compacto */}
      <aside className="hidden lg:flex lg:w-[48%] xl:w-[50%] h-full bg-linear-to-br from-primary-dark via-primary to-primary-light text-white px-8 py-6 flex-col justify-center relative overflow-hidden shrink-0">
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -left-8 bottom-16 w-28 h-28 rounded-full bg-secondary/25" />

        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-2.5 mb-4">
            <TeaLogo size={36} />
            <h1 className="text-2xl font-extrabold tracking-tight">TEA Link</h1>
          </div>

          <p className="text-base font-semibold leading-snug mb-4">
            Un mismo espacio para quienes acompañan el día a día
          </p>

          <ul className="grid grid-cols-2 gap-2">
            {AUDIENCIAS.map(({ icon: Icon, titulo, texto }) => (
              <li
                key={titulo}
                className="flex gap-2 p-2 rounded-lg bg-white/10 border border-white/15"
              >
                <span className="shrink-0 w-7 h-7 rounded-md bg-white/20 flex items-center justify-center text-sm">
                  <Icon aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-xs">{titulo}</p>
                  <p className="text-[10px] leading-tight text-white/85 mt-0.5 line-clamp-3">
                    {texto}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[10px] text-white/75 leading-snug">
            Ingrese con la cuenta que le entregó su colegio, centro de salud o institución.
          </p>
        </div>
      </aside>

      {/* Formulario */}
      <main className="flex-1 h-full min-h-0 flex flex-col items-center justify-center bg-linear-to-br from-blue-400 via-red-200 to-green-300 relative overflow-hidden px-4 py-4">
        <div className="absolute top-0 right-0 m-6 opacity-25 pointer-events-none">
          <svg width="72" height="72" viewBox="0 0 80 80" fill="none" aria-hidden>
            <rect x="10" y="10" width="60" height="60" rx="18" fill="#3B82F6" />
            <circle cx="40" cy="10" r="10" fill="#F59E42" />
            <circle cx="70" cy="40" r="10" fill="#10B981" />
            <circle cx="40" cy="70" r="10" fill="#F43F5E" />
            <circle cx="10" cy="40" r="10" fill="#FDE047" />
          </svg>
        </div>

        <div className="lg:hidden text-center mb-3 z-10 shrink-0">
          <p className="text-blue-900 font-semibold text-base">TEA Link</p>
          <p className="text-blue-800 text-xs">Acceso para familia, educadores y equipo</p>
        </div>

        <RoleThemeProvider rol={null}>
          <form
            onSubmit={handleSubmit}
            className="z-10 w-full max-w-sm shrink-0 bg-white/70 backdrop-blur-lg p-5 sm:p-6 rounded-2xl shadow-2xl shadow-blue-200 ring-2 ring-blue-300"
            autoComplete="off"
          >
            <h2 className="text-xl font-bold mb-4 text-center text-primary-dark">
              Bienvenido/a
            </h2>

            {hasActiveSession && (
              <Alert variant="info">
                <p className="mb-2">Ya tienes una sesión activa.</p>
                <div className="flex flex-col gap-2 mt-2">
                  <Button type="button" fullWidth onClick={handleContinueSession}>
                    Continuar al panel
                  </Button>
                  <Button type="button" variant="outline" fullWidth onClick={handleLogout}>
                    Cerrar sesión e ingresar de nuevo
                  </Button>
                </div>
              </Alert>
            )}

            <div className="space-y-3">
              <Field label="Correo electrónico" error={emailError || undefined}>
                <Input
                  type="email"
                  placeholder="su.cuenta@institucion.cl"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => {
                    setEmail(v => v.trim().toLowerCase());
                    setTouched(t => ({ ...t, email: true }));
                  }}
                  error={!!emailError}
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="py-2 min-h-10"
                />
              </Field>

              <Field label="Contraseña" error={passwordError || undefined}>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, password: true }))}
                    error={!!passwordError}
                    className="pr-12 py-2 min-h-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary-dark text-lg"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </Field>
            </div>

            <Button
              type="submit"
              fullWidth
              size="md"
              className={cn("mt-4 font-bold", loading && "opacity-60")}
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>

            {error && (
              <Alert variant="error" className="mt-4 mb-0 text-center">
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" className="mt-4 mb-0 text-center">
                ¡Login exitoso! Redirigiendo...
              </Alert>
            )}

            <div className="mt-3 text-center text-[10px] text-blue-900 opacity-70">
              <span role="img" aria-label="puzzle">🧩</span> ¡Cada pieza cuenta!{" "}
              <span role="img" aria-label="autismo">🌈</span>
            </div>
          </form>
        </RoleThemeProvider>
      </main>
    </div>
  );
};

export default Login;
