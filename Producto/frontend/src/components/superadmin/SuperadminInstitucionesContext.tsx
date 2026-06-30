import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { InstitucionContacto } from "../../utils/institucionContacto";

export type SuperadminInstitucion = InstitucionContacto & {
  registro_manual?: boolean;
  codigo_externo?: string | null;
  catalogo_fuente?: string | null;
  tipo_oficial?: string | null;
};

type ContextValue = {
  instituciones: SuperadminInstitucion[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  institucionesOperativas: SuperadminInstitucion[];
};

const SuperadminInstitucionesContext = createContext<ContextValue | null>(null);

export function SuperadminInstitucionesProvider({ children }: { children: React.ReactNode }) {
  const [instituciones, setInstituciones] = useState<SuperadminInstitucion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/auth/instituciones", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInstituciones([]);
        setError(typeof data?.error === "string" ? data.error : "No se pudieron cargar instituciones");
        return;
      }
      setInstituciones(Array.isArray(data?.instituciones) ? data.instituciones : []);
    } catch {
      setInstituciones([]);
      setError("Error de red al cargar instituciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const institucionesOperativas = useMemo(
    () => instituciones.filter(i => i.tipo !== "SISTEMA"),
    [instituciones]
  );

  const value = useMemo(
    () => ({ instituciones, loading, error, refresh, institucionesOperativas }),
    [instituciones, loading, error, refresh, institucionesOperativas]
  );

  return (
    <SuperadminInstitucionesContext.Provider value={value}>
      {children}
    </SuperadminInstitucionesContext.Provider>
  );
}

export function useSuperadminInstituciones() {
  const ctx = useContext(SuperadminInstitucionesContext);
  if (!ctx) {
    throw new Error("useSuperadminInstituciones debe usarse dentro de SuperadminInstitucionesProvider");
  }
  return ctx;
}
