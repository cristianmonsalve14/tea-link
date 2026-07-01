import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiUrl } from '../../config/api';
import { FaSearch } from "react-icons/fa";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Alert } from "../ui/Alert";
import { useRoleTheme } from "../../context/RoleThemeContext";
import { parseApiError } from "../../utils/parseApiError";
import {
  filtrarPerfilesPorBusqueda,
  type PerfilBusqueda
} from "../../utils/perfilSelectorFilter";
import { cn } from "../../theme/cn";

export type PerfilOption = PerfilBusqueda;

type Props = {
  value: string;
  onChange: (id: string, perfil?: PerfilOption) => void;
  label: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  required?: boolean;
};

export function PerfilSelector({
  value,
  onChange,
  label,
  searchPlaceholder = "Buscar por nombre, apellido, diagnóstico...",
  emptyMessage = "No hay perfiles asignados. Contacte al administrador de su institución.",
  required
}: Props) {
  const theme = useRoleTheme();
  const [busqueda, setBusqueda] = useState("");
  const [todosPerfiles, setTodosPerfiles] = useState<PerfilOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const didAutoSelect = useRef(false);

  const token = () => localStorage.getItem("token");

  const fetchPerfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        apiUrl("/api/perfiles?all=true&sort=nombre&order=asc"),
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiError(data, "No se pudieron cargar los perfiles"));
        setTodosPerfiles([]);
        return;
      }
      const list: PerfilOption[] = data.perfiles ?? [];
      setTodosPerfiles(list);

      if (!value && list.length > 0 && !didAutoSelect.current) {
        didAutoSelect.current = true;
        onChange(String(list[0].id), list[0]);
      }
    } catch {
      setError("Error de red al cargar perfiles. Verifique que el backend esté activo.");
      setTodosPerfiles([]);
    } finally {
      setLoading(false);
    }
  }, [value, onChange]);

  useEffect(() => {
    fetchPerfiles();
  }, [fetchPerfiles]);

  const perfilesFiltrados = useMemo(() => {
    const filtrados = filtrarPerfilesPorBusqueda(todosPerfiles, busqueda);
    if (!value) return filtrados;

    const seleccionado = todosPerfiles.find(p => String(p.id) === value);
    if (seleccionado && !filtrados.some(p => p.id === seleccionado.id)) {
      return [seleccionado, ...filtrados];
    }
    return filtrados;
  }, [todosPerfiles, busqueda, value]);

  const labelConTotal =
    todosPerfiles.length > 0
      ? `${label} (${todosPerfiles.length} asignado${todosPerfiles.length !== 1 ? "s" : ""})`
      : label;

  const handleSelectChange = (id: string) => {
    const perfil = todosPerfiles.find(p => String(p.id) === id);
    onChange(id, perfil);
  };

  return (
    <div className="space-y-3">
      <Field label={labelConTotal} required={required}>
        <div className="relative mb-3">
          <span
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none",
              theme.accentText
            )}
          >
            <FaSearch />
          </span>
          <Input
            className="pl-9"
            placeholder={searchPlaceholder}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            aria-label={`Buscar ${label.toLowerCase()}`}
            disabled={loading || todosPerfiles.length === 0}
          />
        </div>

        {loading ? (
          <p className="text-sm text-neutral-gray-medium">Cargando pacientes...</p>
        ) : (
          <Select
            value={value}
            onChange={e => handleSelectChange(e.target.value)}
            required={required}
          >
            <option value="">Seleccionar...</option>
            {perfilesFiltrados.map(p => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {error && <Alert variant="error">{error}</Alert>}

      {!error && !loading && todosPerfiles.length === 0 && (
        <Alert variant="warning">{emptyMessage}</Alert>
      )}

      {!error && !loading && todosPerfiles.length > 0 && busqueda.trim() && (
        <p className="text-xs text-neutral-gray-medium">
          {perfilesFiltrados.length} coincidencia{perfilesFiltrados.length !== 1 ? "s" : ""} de{" "}
          {todosPerfiles.length}
        </p>
      )}
    </div>
  );
}
