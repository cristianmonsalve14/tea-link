import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { apiUrl } from '../../config/api';
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaEdit, FaEye, FaShieldAlt } from "react-icons/fa";
import { getRolPanelConfig, type CategoriaObs } from "../../config/rolPanelConfig";
import {
  CATEGORIA_INFO,
  PRIVACIDAD_INFO
} from "../../config/observacionUi";
import { getRole } from "../../utils/auth";
import { parseApiError } from "../../utils/parseApiError";
import {
  isDescripcionObservacionValida,
  mensajeDescripcionCorta
} from "../../utils/observacionFormRules";
import {
  validarFechaEvento,
  validarTituloObservacion
} from "../../utils/formValidation";
import {
  datetimeLocalChileToISO,
  formatDatetimeLocalChile,
  formatFechaHoraChile,
  nowDatetimeLocalChile,
  toDatetimeLocalChile
} from "../../utils/fechaChile";
import { useRoleTheme } from "../../context/RoleThemeContext";
import { Card } from "../ui/Card";
import { PerfilSelector } from "../perfiles/PerfilSelector";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Modal } from "../ui/Modal";
import { cn } from "../../theme/cn";

type PrivacidadKey = keyof typeof PRIVACIDAD_INFO;

type Props = {
  perfilIdInicial?: string;
  observacionId?: number;
};

export function NuevaObservacionForm({ perfilIdInicial, observacionId }: Props) {
  const navigate = useNavigate();
  const rol = getRole() ?? "EDUCADOR";
  const config = getRolPanelConfig(rol);
  const theme = useRoleTheme();
  const isEdit = observacionId != null;

  const [perfilId, setPerfilId] = useState(perfilIdInicial ?? "");
  const [perfilNombre, setPerfilNombre] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<CategoriaObs>(config.defaultCategoria);
  const [fechaEvento, setFechaEvento] = useState(nowDatetimeLocalChile);
  const [privacidad, setPrivacidad] = useState<PrivacidadKey>("PUBLICA");
  const [formLoading, setFormLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(isEdit);
  const [editReady, setEditReady] = useState(!isEdit);
  const [registradaEl, setRegistradaEl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    perfil?: string;
    titulo?: string;
    descripcion?: string;
    fecha?: string;
  }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmarPrivacidad, setConfirmarPrivacidad] = useState(false);

  const token = () => localStorage.getItem("token");

  useEffect(() => {
    if (perfilIdInicial && !isEdit) setPerfilId(perfilIdInicial);
  }, [perfilIdInicial, isEdit]);

  useEffect(() => {
    if (!observacionId) return;
    let cancelled = false;

    (async () => {
      setLoadingInitial(true);
      setEditReady(false);
      setFormError(null);
      try {
        const t = token();
        let userId: number | null = null;
        if (t) {
          try {
            userId = JSON.parse(atob(t.split(".")[1])).userId ?? null;
          } catch {
            userId = null;
          }
        }

        const res = await fetch(apiUrl(`/api/observaciones/${observacionId}`), {
          headers: { Authorization: `Bearer ${t}` }
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setFormError(parseApiError(data, "No se pudo cargar la observación"));
          }
          return;
        }

        const obs = data.observacion;
        if (!obs) {
          if (!cancelled) setFormError("Observación no encontrada");
          return;
        }
        if (userId != null && obs.autor_id !== userId && obs.autor?.id !== userId) {
          if (!cancelled) {
            setFormError("Solo puede editar observaciones que usted registró");
          }
          return;
        }

        if (cancelled) return;

        const perfilObs = obs.perfil;
        const pid = obs.perfil_id ?? perfilObs?.id;
        if (pid) {
          setPerfilId(String(pid));
          setPerfilNombre(perfilObs?.nombre ?? `Perfil #${pid}`);
        }
        setTitulo(obs.titulo ?? "");
        setDescripcion(obs.descripcion ?? "");
        setCategoria((obs.categoria as CategoriaObs) ?? config.defaultCategoria);
        setFechaEvento(toDatetimeLocalChile(obs.fecha_evento));
        if (obs.privacidad && obs.privacidad in PRIVACIDAD_INFO) {
          setPrivacidad(obs.privacidad as PrivacidadKey);
        }
        if (obs.created_at) setRegistradaEl(obs.created_at);
        setEditReady(true);
      } catch {
        if (!cancelled) setFormError("Error de red al cargar la observación");
      } finally {
        if (!cancelled) setLoadingInitial(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [observacionId, config.defaultCategoria]);

  const nombrePerfilVisible = perfilNombre || "Sin perfil";

  const tituloPreview = useDebouncedValue(titulo, 280);
  const descripcionPreview = useDebouncedValue(descripcion, 280);
  const tituloProgreso = useDebouncedValue(titulo, 400);
  const descripcionProgreso = useDebouncedValue(descripcion, 400);

  const progreso = useMemo(() => {
    let n = 0;
    if (perfilId) n++;
    if (tituloProgreso.trim().length >= 3) n++;
    if (descripcionProgreso.trim().length >= 10) n++;
    if (categoria) n++;
    if (fechaEvento) n++;
    return Math.round((n / 5) * 100);
  }, [perfilId, tituloProgreso, descripcionProgreso, categoria, fechaEvento]);

  const guardarObservacion = async () => {
    setFormLoading(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria,
        fecha_evento: datetimeLocalChileToISO(fechaEvento)
      };
      if (config.showPrivacidad) body.privacidad = privacidad;

      const url = isEdit
        ? apiUrl(`/api/observaciones/${observacionId}`)
        : apiUrl("/api/observaciones");
      const method = isEdit ? "PUT" : "POST";

      if (!isEdit) {
        body.perfil_id = Number(perfilId);
      }

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(
          parseApiError(data, isEdit ? "Error al actualizar observación" : "Error al crear observación")
        );
        return;
      }
      setConfirmarPrivacidad(false);
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch {
      setFormError("Error de red al guardar");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    const errores = {
      perfil: !perfilId ? "Seleccione un perfil" : undefined,
      titulo: validarTituloObservacion(titulo) ?? undefined,
      descripcion: !isDescripcionObservacionValida(descripcion)
        ? mensajeDescripcionCorta()
        : undefined,
      fecha: validarFechaEvento(fechaEvento) ?? undefined
    };
    setFieldErrors(errores);
    const primerError =
      errores.perfil ?? errores.titulo ?? errores.descripcion ?? errores.fecha ?? null;
    if (primerError) {
      setFormError(primerError);
      return;
    }
    setFormError(null);

    if (!isEdit && config.showPrivacidad) {
      setConfirmarPrivacidad(true);
      return;
    }

    await guardarObservacion();
  };

  const privacidadSeleccionada = PRIVACIDAD_INFO[privacidad];

  if (loadingInitial) {
    return <p className="text-neutral-gray-medium py-8 text-center">Cargando observación...</p>;
  }

  if (isEdit && !editReady) {
    return (
      <div className="py-8 space-y-4 max-w-lg mx-auto">
        <Alert variant="error">
          {formError ?? "No se pudo cargar la observación para editar."}
        </Alert>
        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
          Volver al panel
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {isEdit && (
        <div
          className={cn(
            "rounded-xl border p-4 sm:p-5 mb-6",
            theme.accentBorder,
            theme.accentBgSubtle
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                theme.accentBgMuted,
                theme.accentText
              )}
            >
              <FaEdit aria-hidden />
            </span>
            <div>
              <p className={cn("text-lg font-bold", theme.accentTextStrong)}>
                Editando observación #{observacionId}
              </p>
              <p className="text-sm text-neutral-gray-medium mt-1">
                Los datos actuales ya están cargados abajo. Modifique lo necesario y pulse{" "}
                <strong>Guardar cambios</strong>; no se creará un registro nuevo.
              </p>
              {registradaEl && (
                <p className="text-xs text-neutral-gray-medium mt-2">
                  Registrada el{" "}
                  {formatFechaHoraChile(registradaEl)}
                  {titulo.trim() ? (
                    <>
                      {" "}
                      · Título actual: <strong>{titulo.trim()}</strong>
                    </>
                  ) : null}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barra de progreso — solo al crear */}
      {!isEdit && (
        <div className="mb-6">
          <div className="flex justify-between text-xs font-medium mb-1.5">
            <span className={theme.accentText}>Completitud del registro</span>
            <span className={theme.accentText}>{progreso}%</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-gray-light overflow-hidden">
            <div
              className={cn("h-full rounded-full", theme.btnPrimary.split(" ")[0])}
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6 items-start [overflow-anchor:none]">
        {/* Formulario */}
        <form
          id="observacion-form"
          onSubmit={handleSubmit}
          className="lg:col-span-3 space-y-5"
        >
          <Card
            title={
              isEdit
                ? `1. ${config.perfilLabel} (no editable)`
                : "1. ¿Sobre quién es la observación?"
            }
          >
            {isEdit ? (
              <div
                className={cn(
                  "rounded-xl border px-4 py-3",
                  theme.accentBgMuted,
                  theme.accentBorder
                )}
              >
                <p className="text-xs font-medium text-neutral-gray-medium uppercase tracking-wide">
                  {config.perfilLabel}
                </p>
                <p className="font-semibold text-neutral-gray mt-1">{nombrePerfilVisible}</p>
              </div>
            ) : (
              <PerfilSelector
                label={config.perfilLabel}
                value={perfilId}
                onChange={(id, perfil) => {
                  setPerfilId(id);
                  if (perfil) setPerfilNombre(perfil.nombre);
                }}
                required
              />
            )}
          </Card>

          <Card title={isEdit ? "2. Modificar detalle" : "2. Detalle de la observación"}>
            <div className="space-y-4">
              <Field
                label="Título breve"
                required
                error={submitAttempted ? fieldErrors.titulo : undefined}
              >
                <Input
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ej. Buen avance en lectura en voz alta"
                  required
                  maxLength={120}
                  error={submitAttempted && Boolean(fieldErrors.titulo)}
                />
                <p className="text-xs text-neutral-gray-medium mt-1 text-right">
                  {titulo.length}/120
                </p>
              </Field>

              <Field
                label="Descripción"
                required
                error={submitAttempted ? fieldErrors.descripcion : undefined}
              >
                <Textarea
                  rows={6}
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Describa qué ocurrió, en qué contexto y qué relevancia tiene para el seguimiento..."
                  required
                  className="min-h-[8rem]"
                  error={submitAttempted && Boolean(fieldErrors.descripcion)}
                />
                <p className="text-xs text-neutral-gray-medium mt-1">
                  Mínimo 10 caracteres · {descripcion.trim().length} escritos
                </p>
              </Field>

              <div>
                <p className={cn("text-sm font-semibold mb-2", theme.accentText)}>
                  Categoría
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {config.categorias.map(cat => {
                    const info = CATEGORIA_INFO[cat];
                    const activa = categoria === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoria(cat)}
                        className={cn(
                          "text-left p-3 rounded-xl border transition-all",
                          activa
                            ? cn(theme.accentBorder, theme.accentBgSubtle, "ring-2 ring-offset-1", theme.accentBorder)
                            : "border-neutral-gray-medium/30 hover:border-neutral-gray-medium bg-neutral-white"
                        )}
                      >
                        <span className="text-lg" aria-hidden>
                          {info.emoji}
                        </span>
                        <p className={cn("text-sm font-semibold mt-1", activa && theme.accentTextStrong)}>
                          {info.label}
                        </p>
                        <p className="text-[10px] text-neutral-gray-medium leading-tight mt-0.5 line-clamp-2">
                          {info.descripcion}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Field
                label="Fecha y hora del evento"
                required
                hint="Horario de Chile (continental)"
                error={submitAttempted ? fieldErrors.fecha : undefined}
              >
                <Input
                  type="datetime-local"
                  value={fechaEvento}
                  onChange={e => setFechaEvento(e.target.value)}
                  required
                  error={submitAttempted && Boolean(fieldErrors.fecha)}
                />
              </Field>
            </div>
          </Card>

          {config.showPrivacidad && (
            <Card title="3. Privacidad (solo médico)">
              <div className="space-y-2">
                {(Object.keys(PRIVACIDAD_INFO) as PrivacidadKey[]).map(
                  key => {
                    const info = PRIVACIDAD_INFO[key];
                    const activa = privacidad === key;
                    return (
                      <label
                        key={key}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                          activa
                            ? cn(theme.accentBgSubtle, theme.accentBorder)
                            : "border-neutral-gray-medium/30 hover:bg-neutral-gray-light"
                        )}
                      >
                        <input
                          type="radio"
                          name="privacidad"
                          value={key}
                          checked={activa}
                          onChange={() => setPrivacidad(key)}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-semibold text-sm">{info.label}</p>
                          <p className="text-xs text-neutral-gray-medium">{info.descripcion}</p>
                        </div>
                      </label>
                    );
                  }
                )}
              </div>
            </Card>
          )}

          {formError && <Alert variant="error">{formError}</Alert>}
          {success && (
            <Alert variant="success">
              <span className="inline-flex items-center gap-2">
                <FaCheckCircle />
                {isEdit
                  ? "Observación actualizada. Volviendo al panel..."
                  : "Observación registrada. Volviendo al panel..."}
              </span>
            </Alert>
          )}
        </form>

        {/* Vista previa */}
        <aside className="lg:col-span-2 lg:sticky lg:top-6 lg:self-start space-y-4 [contain:layout]">
          <Card
            title={
              <>
                <FaEye /> Vista previa
              </>
            }
            description={
              isEdit
                ? "Así quedará en la bitácora tras guardar los cambios"
                : "Así aparecerá en el listado del equipo"
            }
          >
            <div
              className={cn(
                "rounded-xl border p-4",
                theme.accentBorder,
                theme.accentBgMuted
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{CATEGORIA_INFO[categoria].emoji}</span>
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    theme.accentBgSubtle,
                    theme.accentText
                  )}
                >
                  {CATEGORIA_INFO[categoria].label}
                </span>
              </div>
              <h3 className="font-bold text-neutral-gray line-clamp-2 min-h-[3.25rem]">
                {tituloPreview.trim() || "Título de la observación"}
              </h3>
              <p className="text-sm text-neutral-gray-medium mt-2 whitespace-pre-wrap min-h-[9rem] max-h-[9rem] overflow-y-auto">
                {descripcionPreview.trim() || "La descripción que escriba se mostrará aquí..."}
              </p>
              <p className="text-xs text-neutral-gray-medium mt-4 pt-3 border-t border-neutral-gray-medium/20">
                Perfil: <strong>{nombrePerfilVisible}</strong>
                <br />
                {formatDatetimeLocalChile(fechaEvento)}
                {config.showPrivacidad && (
                  <>
                    <br />
                    Privacidad: {PRIVACIDAD_INFO[privacidad].label}
                  </>
                )}
              </p>
            </div>
          </Card>

          <div
            className={cn(
              "rounded-xl border p-4 text-sm",
              theme.accentBorder,
              theme.accentBgSubtle
            )}
          >
            <p className={cn("font-semibold mb-1", theme.accentText)}>
              {isEdit ? "Recuerde" : "Consejo"}
            </p>
            <p className="text-neutral-gray-medium text-xs leading-relaxed">
              {isEdit
                ? "Está actualizando un registro existente. Revise título, descripción y fecha antes de guardar."
                : "Sea concreto: qué pasó, dónde, quién estaba presente y por qué es relevante para el seguimiento. Evite juicios; describa hechos observables."}
            </p>
          </div>
        </aside>
      </div>

      {/* Barra de acciones fija */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-gray-medium/20 bg-neutral-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/dashboard")}
            disabled={formLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="observacion-form"
            disabled={formLoading || success || !perfilId}
          >
            {formLoading
              ? "Guardando..."
              : isEdit
                ? "Guardar cambios"
                : config.nuevaObservacionLabel}
          </Button>
        </div>
      </div>

      <Modal
        open={confirmarPrivacidad}
        onClose={() => !formLoading && setConfirmarPrivacidad(false)}
        title="Confirmar privacidad de la nota clínica"
        size="sm"
        footer={
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end w-full">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmarPrivacidad(false)}
              disabled={formLoading}
            >
              Revisar privacidad
            </Button>
            <Button type="button" onClick={guardarObservacion} disabled={formLoading}>
              {formLoading ? "Registrando..." : "Sí, confirmar y registrar"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-gray-medium">
            Antes de registrar la nota, confirme que el nivel de privacidad elegido es el
            correcto. Esto define quién podrá ver este registro en TEA Link.
          </p>
          <div
            className={cn(
              "rounded-xl border p-4",
              theme.accentBorder,
              theme.accentBgSubtle
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-gray-medium flex items-center gap-2">
              <FaShieldAlt />
              Privacidad seleccionada
            </p>
            <p className={cn("text-lg font-bold mt-2", theme.accentTextStrong)}>
              {privacidadSeleccionada.label}
            </p>
            <p className="text-sm text-neutral-gray mt-2">
              {privacidadSeleccionada.descripcion}
            </p>
          </div>
          <p className="text-xs text-neutral-gray-medium">
            Paciente: <strong>{nombrePerfilVisible}</strong> · Nota:{" "}
            <strong>{titulo.trim() || "Sin título"}</strong>
          </p>
        </div>
      </Modal>
    </div>
  );
}
