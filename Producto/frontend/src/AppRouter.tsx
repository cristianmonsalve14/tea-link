import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import NuevaObservacionPage from "./pages/NuevaObservacionPage";
import EditarObservacionPage from "./pages/EditarObservacionPage";
import CambiarPasswordInicialPage from "./pages/CambiarPasswordInicialPage";
import SeleccionarPerfilFamiliaPage from "./pages/SeleccionarPerfilFamiliaPage";
import ConsentimientoPerfilPage from "./pages/ConsentimientoPerfilPage";
import PerfilDetallePage from "./pages/PerfilDetallePage";
import SuperadminInstitucionFormPage from "./pages/SuperadminInstitucionFormPage";
import SuperadminDashboardPage from "./pages/superadmin/SuperadminDashboardPage";
import SuperadminInstitucionesPage from "./pages/superadmin/SuperadminInstitucionesPage";
import SuperadminUsuariosPage from "./pages/superadmin/SuperadminUsuariosPage";
import SuperadminAuditoriaPage from "./pages/superadmin/SuperadminAuditoriaPage";
import SuperadminPerfilesPage from "./pages/superadmin/SuperadminPerfilesPage";
import { DashboardByRole } from "./components/DashboardByRole";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SuperadminRoute } from "./components/SuperadminRoute";
import { SuperadminLayout } from "./components/superadmin/SuperadminLayout";
import { RoleThemeProvider } from "./context/RoleThemeContext";
import { CambiarPasswordRoute } from "./components/CambiarPasswordRoute";
import { FamiliaPerfilRoute } from "./components/FamiliaPerfilRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";

const SuperadminApp = () => (
  <RoleThemeProvider rol="SUPERADMIN">
    <ErrorBoundary>
      <SuperadminLayout />
    </ErrorBoundary>
  </RoleThemeProvider>
);

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
        path="/familia/seleccionar-perfil"
        element={
          <FamiliaPerfilRoute>
            <SeleccionarPerfilFamiliaPage />
          </FamiliaPerfilRoute>
        }
      />
      <Route
        path="/familia/consentimiento/:id"
        element={
          <FamiliaPerfilRoute>
            <ConsentimientoPerfilPage />
          </FamiliaPerfilRoute>
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
        path="/superadmin"
        element={
          <ProtectedRoute>
            <SuperadminRoute>
              <SuperadminApp />
            </SuperadminRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<SuperadminDashboardPage />} />
        <Route path="instituciones" element={<SuperadminInstitucionesPage />} />
        <Route path="instituciones/nueva" element={<SuperadminInstitucionFormPage />} />
        <Route path="instituciones/:id/editar" element={<SuperadminInstitucionFormPage />} />
        <Route path="usuarios" element={<SuperadminUsuariosPage />} />
        <Route path="perfiles" element={<SuperadminPerfilesPage />} />
        <Route path="auditoria" element={<SuperadminAuditoriaPage />} />
      </Route>
      <Route
        path="/perfiles/:id/ficha"
        element={
          <ProtectedRoute>
            <PerfilDetallePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/perfiles/:id"
        element={
          <ProtectedRoute>
            <PerfilDetallePage />
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
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
