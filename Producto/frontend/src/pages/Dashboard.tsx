import React from "react";
import { useNavigate } from "react-router-dom";
import { clearSession, getRole } from "../utils/auth";
import { AdminInstitucionDashboard } from "../components/AdminInstitucionDashboard";
import { ObservacionesRolDashboard } from "../components/ObservacionesRolDashboard";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  const rol = getRole();
  const institucion = localStorage.getItem("institucion");

  let contenido;
  switch (rol) {
    case "ADMINISTRADOR":
      contenido = <AdminInstitucionDashboard institucionNombre={institucion} />;
      break;
    case "EDUCADOR":
    case "FAMILIA":
    case "PROFESIONAL":
    case "MEDICO":
      contenido = (
        <ObservacionesRolDashboard rol={rol!} institucionNombre={institucion} />
      );
      break;
    default:
      contenido = (
        <>
          <h1 className="text-3xl font-bold mb-4">Bienvenido al Dashboard</h1>
          <p className="text-lg mb-6">¡Has iniciado sesión correctamente!</p>
        </>
      );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      {contenido}
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 font-semibold"
      >
        Cerrar sesión
      </button>
    </div>
  );
};

export default Dashboard;
