import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<{email: boolean; password: boolean}>({email: false, password: false});
  const navigate = useNavigate();

  // Validaciones
  const validateEmail = (value: string) => {
    if (!value) return "El email es obligatorio";
    // Regex simple para email
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return "Email inválido";
    return "";
  };
  const validatePassword = (value: string) => {
    if (!value) return "La contraseña es obligatoria";
    if (value.length < 8) return "Mínimo 8 caracteres";
    return "";
  };

  const emailError = touched.email ? validateEmail(email) : "";
  const passwordError = touched.password ? validatePassword(password) : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({email: true, password: true});
    if (validateEmail(email) || validatePassword(password)) return;
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw new Error("Credenciales incorrectas o error de servidor");
      }
      const data = await response.json();
      setSuccess(true);
      localStorage.setItem("token", data.token);
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Error desconocido");
      } else {
        setError("Error desconocido");
      }
    } finally {
      setLoading(false);
    }
  };

  // Si ya está autenticado, redirigir (solo en efecto para evitar render en blanco)
  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-blue-400 via-red-200 to-green-300 relative overflow-hidden">
      {/* Puzzle SVG decorativo */}
      <div className="absolute top-0 right-0 m-6 opacity-30 z-0">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="60" height="60" rx="18" fill="#3B82F6"/>
          <circle cx="40" cy="10" r="10" fill="#F59E42"/>
          <circle cx="70" cy="40" r="10" fill="#10B981"/>
          <circle cx="40" cy="70" r="10" fill="#F43F5E"/>
          <circle cx="10" cy="40" r="10" fill="#FDE047"/>
        </svg>
      </div>
      <div className="flex flex-col items-center w-full z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block">
            <svg width="36" height="36" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="10" width="60" height="60" rx="18" fill="#3B82F6"/>
              <circle cx="40" cy="10" r="10" fill="#F59E42"/>
              <circle cx="70" cy="40" r="10" fill="#10B981"/>
              <circle cx="40" cy="70" r="10" fill="#F43F5E"/>
              <circle cx="10" cy="40" r="10" fill="#FDE047"/>
            </svg>
          </span>
          <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight drop-shadow">TEA-LINK</h1>
        </div>
        <span className="text-blue-900 mb-6 text-lg font-medium text-center">Conectando familias, educadores y profesionales</span>
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-2xl shadow-blue-200 w-80 bg-clip-padding relative ring-2 ring-blue-300 hover:scale-[1.02] transition-transform duration-200"
        autoComplete="off"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">Bienvenido/a</h2>
        <div className="mb-4 relative">
          <span className="absolute left-2 top-2.5 text-blue-400">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M2 6.5A2.5 2.5 0 014.5 4h15A2.5 2.5 0 0122 6.5v11a2.5 2.5 0 01-2.5 2.5h-15A2.5 2.5 0 012 17.5v-11z" stroke="#3B82F6" strokeWidth="2"/><path d="M2 7l10 6 10-6" stroke="#3B82F6" strokeWidth="2"/></svg>
          </span>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => setTouched(t => ({...t, email: true}))}
            className={`pl-9 w-full p-2 border-2 rounded focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all ${emailError ? "border-red-400" : "border-gray-300"}`}
            autoFocus
          />
          {emailError && <p className="text-red-500 text-sm mt-1 ml-1">{emailError}</p>}
        </div>
        <div className="mb-4 relative">
          <span className="absolute left-2 top-2.5 text-blue-400">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 17a2 2 0 002-2v-2a2 2 0 00-2-2 2 2 0 00-2 2v2a2 2 0 002 2z" stroke="#3B82F6" strokeWidth="2"/><rect x="6" y="7" width="12" height="10" rx="2" stroke="#3B82F6" strokeWidth="2"/></svg>
          </span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onBlur={() => setTouched(t => ({...t, password: true}))}
            className={`pl-9 w-full p-2 border-2 rounded focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all ${passwordError ? "border-red-400" : "border-gray-300"}`}
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-2 top-2 text-blue-400 hover:text-blue-700"
            onClick={() => setShowPassword(v => !v)}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
          {passwordError && <p className="text-red-500 text-sm mt-1 ml-1">{passwordError}</p>}
        </div>
        <button
          type="submit"
          className={`w-full bg-blue-500 text-white font-bold p-2 rounded shadow hover:bg-blue-600 transition-transform ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          disabled={loading}
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        {success && <p className="text-green-600 mt-4 text-center">¡Login exitoso! Redirigiendo...</p>}
        <div className="mt-6 text-center text-xs text-blue-900 opacity-70">
          <span role="img" aria-label="puzzle">🧩</span> ¡Cada pieza cuenta! <span role="img" aria-label="autismo">🌈</span>
        </div>
      </form>
    </div>
  );
}

export default Login;
