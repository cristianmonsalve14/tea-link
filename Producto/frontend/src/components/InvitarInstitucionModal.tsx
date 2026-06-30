import { useCallback, useEffect, useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { cn } from "../theme/cn";
import { parseApiError } from "../utils/parseApiError";
import {
  etiquetaTipoInstitucion,
  tiposInstitucionInvitablesPorSolicitante,
  type InstitucionContacto,
  type TipoInstitucionInvitable
} from "../utils/institucionContacto";
import {
  mensajeBusquedaInvitable,
  MIN_BUSQUEDA_INVITABLE_CHARS,
  rangoPaginaInvitables,
  UMBRAL_CATALOGO_INVITABLE_LISTADO
} from "../utils/institucionInvitable";
import { InstitucionContactoCard } from "./instituciones/InstitucionContactoCard";
import { RegionChileSelect } from "./instituciones/RegionChileSelect";
import { ComunaChileSelect } from "./instituciones/ComunaChileSelect";
import type { RegionChile } from "../utils/regionChile";

type Paginacion = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ResumenInvitables = {
  total: number;
  filtrados: number;
  excluidas_por_invitacion?: number;
  requiere_busqueda?: boolean;
};

type SolicitudEnviada = {
  id: number;
  estado: string;
  institucion_invitada: InstitucionContacto;
};

type Props = {
  open: boolean;
  perfilId: number | null;
  perfilNombre: string;
  tipoInstitucion?: string;
  onClose: () => void;
  onInvitado?: () => void;
};

export function InvitarInstitucionModal({
  open,
  perfilId,
  perfilNombre,
  tipoInstitucion = "",
  onClose,
  onInvitado
}: Props) {
  const tiposInvitables = useMemo(
    () => tiposInstitucionInvitablesPorSolicitante(tipoInstitucion),
    [tipoInstitucion]
  );

  const [instituciones, setInstituciones] = useState<InstitucionContacto[]>([]);
  const [paginacion, setPaginacion] = useState<Paginacion | null>(null);
  const [resumen, setResumen] = useState<ResumenInvitables | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudEnviada[]>([]);
  const [institucionSeleccionadaId, setInstitucionSeleccionadaId] = useState<number | null>(
    null
  );
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoInstitucionInvitable | "">("");
  const [filtroRegion, setFiltroRegion] = useState<RegionChile | "">("");
  const [filtroComuna, setFiltroComuna] = useState("");
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = useCallback(
    (path: string, options?: RequestInit) =>
      fetch(`http://localhost:3000/api/perfiles${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          ...options?.headers
        }
      }),
    []
  );

  const institucionSeleccionada = useMemo(
    () => instituciones.find(i => i.id === institucionSeleccionadaId) ?? null,
    [instituciones, institucionSeleccionadaId]
  );

  const hayFiltros = Boolean(busqueda.trim() || filtroTipo || filtroRegion || filtroComuna);
  const catalogoGrande = (resumen?.filtrados ?? resumen?.total ?? 0) > UMBRAL_CATALOGO_INVITABLE_LISTADO;
  const requiereBusqueda = resumen?.requiere_busqueda ?? false;

  const mensajeGuiaBusqueda = useMemo(
    () => mensajeBusquedaInvitable(resumen?.filtrados ?? 0, busquedaInput, Boolean(filtroRegion || filtroComuna)),
    [resumen?.filtrados, busquedaInput, filtroRegion, filtroComuna]
  );

  const tituloResumen = useMemo(() => {
    if (!resumen) return null;
    const partes = [`${resumen.total} centros en la plataforma`];
    if (hayFiltros && resumen.filtrados !== resumen.total) {
      partes.push(`${resumen.filtrados} coinciden`);
    }
    if (resumen.excluidas_por_invitacion) {
      partes.push(`${resumen.excluidas_por_invitacion} ya invitados a este perfil`);
    }
    return partes.join(" · ");
  }, [resumen, hayFiltros]);

  const textoRango = useMemo(() => {
    if (!paginacion || paginacion.total <= 0) return null;
    const rango = rangoPaginaInvitables(paginacion.page, paginacion.limit, paginacion.total);
    if (!rango) return null;
    return `Mostrando ${rango.desde}–${rango.hasta} de ${paginacion.total} centros`;
  }, [paginacion]);

  const placeholderBusqueda = catalogoGrande
    ? `Mín. ${MIN_BUSQUEDA_INVITABLE_CHARS} caracteres — nombre, email, teléfono o dirección...`
    : "Nombre, email, teléfono o dirección...";

  const cargarSolicitudes = useCallback(async () => {
    if (!perfilId) return;
    const res = await api(`/${perfilId}/solicitudes-institucion`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setSolicitudes(data.solicitudes ?? []);
    } else {
      setSolicitudes([]);
    }
  }, [api, perfilId]);

  const cargarInstituciones = useCallback(async () => {
    if (!perfilId || !open) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pagina),
        limit: "10",
        perfil_id: String(perfilId)
      });
      if (busqueda.trim()) params.set("q", busqueda.trim());
      if (filtroTipo) params.set("tipo", filtroTipo);
      if (filtroRegion) params.set("region", filtroRegion);
      if (filtroComuna) params.set("comuna", filtroComuna);

      const res = await api(`/instituciones-invitables?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiError(data, "No se pudo cargar instituciones"));
        setInstituciones([]);
        setPaginacion(null);
        setResumen(null);
        return;
      }
      setInstituciones(data.instituciones ?? []);
      setPaginacion(data.paginacion ?? null);
      setResumen(data.resumen ?? null);
      setInstitucionSeleccionadaId(prev => {
        const ids = (data.instituciones ?? []).map((i: InstitucionContacto) => i.id);
        return prev && ids.includes(prev) ? prev : null;
      });
    } catch {
      setError("Error de red al cargar instituciones");
    } finally {
      setLoading(false);
    }
  }, [api, busqueda, filtroTipo, filtroRegion, filtroComuna, open, pagina, perfilId]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setBusqueda(busquedaInput);
      setPagina(1);
    }, 350);
    return () => window.clearTimeout(t);
  }, [busquedaInput]);

  useEffect(() => {
    if (!open) {
      setBusquedaInput("");
      setBusqueda("");
      setFiltroTipo("");
      setFiltroRegion("");
      setFiltroComuna("");
      setPagina(1);
      setInstitucionSeleccionadaId(null);
      setInstituciones([]);
      setPaginacion(null);
      setResumen(null);
      setError(null);
      return;
    }
    void cargarSolicitudes();
  }, [open, cargarSolicitudes]);

  useEffect(() => {
    if (open && perfilId) {
      void cargarInstituciones();
    }
  }, [open, perfilId, cargarInstituciones]);

  const enviarInvitacion = async () => {
    if (!perfilId || !institucionSeleccionadaId) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await api(`/${perfilId}/solicitudes-institucion`, {
        method: "POST",
        body: JSON.stringify({ institucion_invitada_id: institucionSeleccionadaId })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiError(data, "No se pudo enviar la invitación"));
        return;
      }
      setInstitucionSeleccionadaId(null);
      await cargarSolicitudes();
      await cargarInstituciones();
      onInvitado?.();
    } catch {
      setError("Error de red al enviar invitación");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Invitar institución — ${perfilNombre}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            onClick={enviarInvitacion}
            disabled={!institucionSeleccionadaId || enviando || loading}
          >
            {enviando ? "Enviando..." : "Enviar invitación"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-neutral-gray-medium mb-4">
        Busque un centro médico o terapéutico en Chile. Use región, comuna y el buscador para acotar
        resultados cuando el catálogo nacional sea amplio.
      </p>

      {solicitudes.length > 0 && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-neutral-gray-light/40 p-3">
          <p className="text-sm font-semibold mb-2">Invitaciones enviadas</p>
          <ul className="text-sm space-y-1">
            {solicitudes.map(s => (
              <li key={s.id}>
                {s.institucion_invitada.nombre} — {s.estado.toLowerCase()}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <Field label="Buscar centro" required={catalogoGrande}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-gray-medium pointer-events-none">
              <FaSearch aria-hidden />
            </span>
            <Input
              value={busquedaInput}
              onChange={e => setBusquedaInput(e.target.value)}
              placeholder={placeholderBusqueda}
              className="pl-9"
              autoFocus={catalogoGrande}
            />
          </div>
        </Field>
        <Field label="Tipo de centro">
          <Select
            value={filtroTipo}
            onChange={e => {
              setFiltroTipo(e.target.value as TipoInstitucionInvitable | "");
              setPagina(1);
            }}
          >
            <option value="">Todos</option>
            {tiposInvitables.map(t => (
              <option key={t} value={t}>
                {etiquetaTipoInstitucion(t)}
              </option>
            ))}
          </Select>
        </Field>
        <RegionChileSelect
          value={filtroRegion}
          onChange={value => {
            setFiltroRegion(value);
            setFiltroComuna("");
            setPagina(1);
          }}
          label="Región"
        />
        <ComunaChileSelect
          region={filtroRegion}
          value={filtroComuna}
          onChange={value => {
            setFiltroComuna(value);
            setPagina(1);
          }}
        />
      </div>

      {tituloResumen && (
        <p className="text-xs text-neutral-gray-medium mb-3">{tituloResumen}</p>
      )}

      {mensajeGuiaBusqueda && !loading && (
        <Alert variant="info" className="mb-3">
          {mensajeGuiaBusqueda}
        </Alert>
      )}

      {error && <Alert variant="error" className="mb-3">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-neutral-gray-medium py-4">Buscando centros...</p>
      ) : requiereBusqueda ? null : instituciones.length === 0 ? (
        <p className="text-sm text-neutral-gray-medium rounded-lg border border-dashed border-gray-200 p-4">
          {hayFiltros
            ? "No hay centros que coincidan con la búsqueda."
            : "No hay centros disponibles para invitar (puede que ya estén todos invitados a este perfil)."}
        </p>
      ) : (
        <>
          {textoRango && (
            <p className="text-xs font-medium text-neutral-gray-medium mb-2">{textoRango}</p>
          )}
          <ul className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {instituciones.map(inst => {
              const seleccionada = institucionSeleccionadaId === inst.id;
              return (
                <li key={inst.id}>
                  <button
                    type="button"
                    onClick={() => setInstitucionSeleccionadaId(inst.id)}
                    className={cn(
                      "w-full text-left rounded-xl border p-3 transition-colors",
                      seleccionada
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-gray-200 hover:bg-neutral-gray-light/50"
                    )}
                  >
                    <p className="font-medium text-sm">{inst.nombre}</p>
                    <p className="text-xs text-neutral-gray-medium mt-0.5">
                      {inst.tipo_label ?? etiquetaTipoInstitucion(inst.tipo)}
                      {inst.ubicacion_label ? ` · ${inst.ubicacion_label}` : ""}
                      {inst.email_contacto ? ` · ${inst.email_contacto}` : ""}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {!requiereBusqueda && paginacion && paginacion.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 mb-4 text-sm">
          <span className="text-neutral-gray-medium">
            Página {paginacion.page} de {paginacion.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={paginacion.page <= 1 || loading}
              onClick={() => setPagina(p => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={paginacion.page >= paginacion.totalPages || loading}
              onClick={() => setPagina(p => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {institucionSeleccionada && (
        <div className="rounded-xl border border-neutral-gray-medium/20 p-4 bg-neutral-gray-light/30">
          <p className="text-xs font-semibold text-neutral-gray-medium mb-2">
            Centro seleccionado — datos de contacto
          </p>
          <InstitucionContactoCard institucion={institucionSeleccionada} />
        </div>
      )}
    </Modal>
  );
}
