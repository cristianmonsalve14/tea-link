import React from "react";

const Dashboard: React.FC = () => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">Bienvenido al Dashboard</h1>
      <p className="text-lg mb-6">¡Has iniciado sesión correctamente!</p>
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
