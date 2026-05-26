import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import { DashboardByRole } from "./components/DashboardByRole";
import { ProtectedRoute } from "./components/ProtectedRoute";

const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardByRole />
          </ProtectedRoute>
        }
      />
      {/*
        IMPORTANTE:
        Para agregar nuevas páginas privadas, protégelas así:
        <Route path="/nueva-ruta" element={
          <ProtectedRoute>
            <NuevaPagina />
          </ProtectedRoute>
        } />
        Solo las rutas públicas (login, landing, registro, etc.) deben quedar sin ProtectedRoute.
      */}
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
