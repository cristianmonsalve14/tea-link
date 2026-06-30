import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import {
  CatalogoInstitucionBusqueda,
  type CatalogoEstablecimientoItem
} from "../components/instituciones/CatalogoInstitucionBusqueda";
import { UbicacionInstitucionFields } from "../components/instituciones/UbicacionInstitucionFields";
import { SuperadminPageHeader } from "../components/superadmin/SuperadminPageHeader";
import { SUPERADMIN_BASE } from "../components/superadmin/nav";
import { useSuperadminInstituciones } from "../components/superadmin/SuperadminInstitucionesContext";
import { cn } from "../theme/cn";
import { getSectionTheme } from "../theme/roleTheme";
import type { InstitucionContacto } from "../utils/institucionContacto";
import { parseApiError } from "../utils/parseApiError";
import type { RegionChile } from "../utils/regionChile";
import { fetchComunasPorRegion } from "../utils/ubicacionChile";
import {
  validarTextoRequerido,
  primerErrorCampo
} from "../utils/formValidation";
import {
  contactoInstitucionValido,
  validarContactoInstitucion,
  type ErroresContactoInstitucion
} from "../utils/institucionContactoValidation";

type TipoInstitucion =
  | "FAMILIA"
  | "CENTRO_EDUCACIONAL"
  | "CENTRO_MEDICO"
  | "CENTRO_PROFESIONAL"
  | "SISTEMA";

type Institucion = InstitucionContacto & { tipo?: TipoInstitucion };

const TIPOS_INSTITUCION: { value: TipoInstitucion; label: string }[] = [
  { value: "FAMILIA", label: "Familia" },
  { value: "CENTRO_EDUCACIONAL", label: "Centro educacional" },
  { value: "CENTRO_MEDICO", label: "Centro médico" },
  { value: "CENTRO_PROFESIONAL", label: "Centro profesional" }
];

export default function SuperadminInstitucionFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refresh: refreshInstituciones } = useSuperadminInstituciones();
  const instSection = getSectionTheme("institutions");
  const isEdit = Boolean(id);
  const editingId = id ? Number(id) : null;

  const [loadingData, setLoadingData] = useState(isEdit);
  const [modoIncorporacion, setModoIncorporacion] = useState<"catalogo" | "manual">("catalogo");
  const [catalogoSeleccionadoId, setCatalogoSeleccionadoId] = useState<number | null>(null);
  const [catalogoSeleccionadoLabel, setCatalogoSeleccionadoLabel] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoInstitucion>("CENTRO_EDUCACIONAL");
  const [direccion, setDireccion] = useState("");
  const [ubicacion, setUbicacion] = useState<{
    region: RegionChile | "";
    comuna: string;
    localidad: string;
  }>({ region: "", comuna: "", localidad: "" });
  const [emailContacto, setEmailContacto] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ErroresContactoInstitucion>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const comunasRef = useRef<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!isEdit || !editingId || !Number.isFinite(editingId)) return;
    const token = localStorage.getItem("token");
    setLoadingData(true);
    fetch("http://localhost:3000/api/auth/instituciones", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(parseApiError(data, "No se pudo cargar la institución"));
        const lista: Institucion[] = Array.isArray(data?.instituciones) ? data.instituciones : [];
        const inst = lista.find(i => i.id === editingId);
        if (!inst) throw new Error("Institución no encontrada");
        setNombre(inst.nombre);
        setTipo(inst.tipo ?? "CENTRO_EDUCACIONAL");
        setDireccion(inst.direccion ?? "");
        setUbicacion({
          region: (inst.region as RegionChile) ?? "",
          comuna: inst.comuna ?? "",
          localidad: inst.localidad ?? ""
        });
        setEmailContacto(inst.email_contacto ?? "");
        setTelefonoContacto(inst.telefono_contacto ?? "");
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : "Error al cargar institución");
      })
      .finally(() => setLoadingData(false));
  }, [isEdit, editingId]);

  const volver = () => {
    navigate(`${SUPERADMIN_BASE}/instituciones`);
  };

  const aplicarSeleccionCatalogo = (item: CatalogoEstablecimientoItem) => {
    setCatalogoSeleccionadoId(item.id);
    setCatalogoSeleccionadoLabel(`${item.codigo_label} — ${item.nombre}`);
    setNombre(item.nombre);
    setTipo(item.tipo_sugerido as TipoInstitucion);
    setDireccion(item.direccion ?? "");
    setUbicacion({
      region: (item.region as RegionChile) ?? "",
      comuna: item.comuna ?? "",
      localidad: item.localidad ?? item.comuna ?? ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitAttempted(true);
    const desdeCatalogo = !isEdit && modoIncorporacion === "catalogo" && catalogoSeleccionadoId != null;

    const nombreError =
      !desdeCatalogo && (isEdit || modoIncorporacion === "manual")
        ? validarTextoRequerido(nombre, "El nombre", 2, 100)
        : null;
    if (nombreError) {
      setError(nombreError);
      return;
    }
    if (!isEdit && modoIncorporacion === "catalogo" && !catalogoSeleccionadoId) {
      setError("Seleccione un establecimiento del catálogo oficial");
      return;
    }

    if (tipo !== "SISTEMA") {
      let comunas = comunasRef.current;
      if (ubicacion.region && comunas.length === 0) {
        try {
          comunas = await fetchComunasPorRegion(ubicacion.region);
          comunasRef.current = comunas;
        } catch {
          comunas = [];
        }
      }
      const errores = validarContactoInstitucion(
        ubicacion,
        direccion,
        emailContacto,
        telefonoContacto,
        comunas
      );
      setFieldErrors(errores);
      if (!contactoInstitucionValido(errores)) {
        setError(primerErrorCampo(errores) ?? "Revise los campos marcados");
        return;
      }
    } else {
      setFieldErrors({});
    }

    setGuardando(true);
    try {
      const token = localStorage.getItem("token");
      const body: Record<string, unknown> = {
        tipo,
        region: tipo === "SISTEMA" ? null : ubicacion.region,
        comuna: tipo === "SISTEMA" ? null : ubicacion.comuna.trim(),
        localidad: tipo === "SISTEMA" ? null : ubicacion.localidad.trim()
      };
      if (tipo !== "SISTEMA") {
        body.direccion = direccion.trim();
        body.email_contacto = emailContacto.trim().toLowerCase();
        body.telefono_contacto = telefonoContacto.trim();
      }
      if (desdeCatalogo) {
        body.catalogo_establecimiento_id = catalogoSeleccionadoId;
        body.registro_manual = false;
      } else {
        body.nombre = nombre.trim();
        body.registro_manual = true;
      }

      const url = isEdit
        ? `http://localhost:3000/api/auth/institucion/${editingId}`
        : "http://localhost:3000/api/auth/institucion";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(
          parseApiError(errorData, isEdit ? "Error al actualizar institución" : "Error al crear institución")
        );
        return;
      }
      await refreshInstituciones();
      volver();
    } catch {
      setError("Error de red o servidor");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      <SuperadminPageHeader
        title={isEdit ? "Editar institución" : "Nueva institución"}
        description={
          isEdit
            ? "Actualice los datos de contacto y ubicación de la institución."
            : "Incorpore desde el catálogo oficial MINEDUC / MINSAL o use ingreso manual cuando el establecimiento no figure en el directorio."
        }
        breadcrumb={[
          { label: "Instituciones", to: `${SUPERADMIN_BASE}/instituciones` },
          { label: isEdit ? "Editar" : "Nueva" }
        ]}
      />

      {loadingData ? (
        <p className="text-sm text-slate-500">Cargando datos…</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-8 shadow-sm"
        >
          {!isEdit && (
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                type="button"
                variant={modoIncorporacion === "catalogo" ? "primary" : "secondary"}
                onClick={() => setModoIncorporacion("catalogo")}
              >
                Catálogo oficial
              </Button>
              <Button
                type="button"
                variant={modoIncorporacion === "manual" ? "primary" : "secondary"}
                onClick={() => {
                  setModoIncorporacion("manual");
                  setCatalogoSeleccionadoId(null);
                  setCatalogoSeleccionadoLabel(null);
                }}
              >
                Ingreso manual
              </Button>
            </div>
          )}

          {!isEdit && modoIncorporacion === "catalogo" && (
            <CatalogoInstitucionBusqueda
              layout="page"
              seleccionadoId={catalogoSeleccionadoId}
              onSeleccionar={aplicarSeleccionCatalogo}
            />
          )}

          <div className="space-y-4 bg-neutral-white rounded-2xl shadow-lg border border-secondary/20 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-neutral-gray">Datos de la institución</h2>

            {catalogoSeleccionadoLabel && (
              <Alert variant="success" className="mb-0">
                <p className="break-words leading-relaxed">
                  Seleccionado: <strong>{catalogoSeleccionadoLabel}</strong>
                </p>
              </Alert>
            )}

            {(isEdit || modoIncorporacion === "manual") && (
              <Field label="Nombre de la institución" required>
                <Input
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  autoFocus
                  maxLength={100}
                  required
                />
              </Field>
            )}

            {!isEdit && modoIncorporacion === "catalogo" && (
              <Field label="Nombre (desde catálogo)">
                <div className="rounded-lg border border-gray-200 bg-neutral-gray-light/50 px-3 py-2.5 text-sm text-neutral-gray break-words leading-relaxed">
                  {nombre || "Seleccione un establecimiento en el catálogo"}
                </div>
              </Field>
            )}

            <Field label="Tipo" required>
              <Select
                value={tipo}
                onChange={e => setTipo(e.target.value as TipoInstitucion)}
                required
                disabled={tipo === "SISTEMA"}
              >
                {(tipo === "SISTEMA"
                  ? [{ value: "SISTEMA" as TipoInstitucion, label: "Sistema" }]
                  : TIPOS_INSTITUCION
                ).map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>

            {tipo !== "SISTEMA" && (
              <UbicacionInstitucionFields
                value={ubicacion}
                onChange={setUbicacion}
                required
                errors={submitAttempted ? fieldErrors : undefined}
                onComunasLoaded={comunas => {
                  comunasRef.current = comunas;
                }}
              />
            )}

            {tipo !== "SISTEMA" && (
              <>
                <Field
                  label="Dirección"
                  required
                  error={submitAttempted ? fieldErrors.direccion : undefined}
                >
                  <Input
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                    maxLength={255}
                    required
                    error={submitAttempted && Boolean(fieldErrors.direccion)}
                    placeholder="Av. Ejemplo 123, comuna"
                  />
                </Field>
                <Field
                  label="Correo de contacto"
                  required
                  error={submitAttempted ? fieldErrors.email_contacto : undefined}
                >
                  <Input
                    type="email"
                    value={emailContacto}
                    onChange={e => setEmailContacto(e.target.value)}
                    maxLength={255}
                    required
                    error={submitAttempted && Boolean(fieldErrors.email_contacto)}
                    placeholder="contacto@institucion.cl"
                  />
                </Field>
                <Field
                  label="Teléfono de contacto"
                  required
                  error={submitAttempted ? fieldErrors.telefono_contacto : undefined}
                >
                  <Input
                    value={telefonoContacto}
                    onChange={e => setTelefonoContacto(e.target.value)}
                    maxLength={50}
                    required
                    error={submitAttempted && Boolean(fieldErrors.telefono_contacto)}
                    placeholder="+56 9 1234 5678"
                  />
                </Field>
              </>
            )}

            {error && <Alert variant="error" className="mb-0">{error}</Alert>}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={volver} disabled={guardando}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className={cn(instSection.btnPrimary, instSection.btnPrimaryHover)}
                disabled={guardando}
              >
                {guardando ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear institución"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
