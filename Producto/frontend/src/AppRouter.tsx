import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import NuevaObservacionPage from "./pages/NuevaObservacionPage";
import EditarObservacionPage from "./pages/EditarObservacionPage";
import CambiarPasswordInicialPage from "./pages/CambiarPasswordInicialPage";
import { DashboardByRole } from "./components/DashboardByRole";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CambiarPasswordRoute } from "./components/CambiarPasswordRoute";

const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/cambiar-contrasena"
        element={
          <CambiarPasswordRoute>
            <CambiarPasswordInicialPage />
          </CambiarPasswordRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardByRole />
          </ProtectedRoute>
        }
      />
      <Route
        path="/observaciones/nueva"
        element={
          <ProtectedRoute>
            <NuevaObservacionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/observaciones/:id/editar"
        element={
          <ProtectedRoute>
            <EditarObservacionPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
