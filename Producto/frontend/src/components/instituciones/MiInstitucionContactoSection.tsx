import { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl } from '../../config/api';
import { FaBuilding } from "react-icons/fa";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import { parseApiError } from "../../utils/parseApiError";
import type { InstitucionContacto } from "../../utils/institucionContacto";
import { InstitucionContactoCard } from "./InstitucionContactoCard";
import { UbicacionInstitucionFields } from "./UbicacionInstitucionFields";
import type { RegionChile } from "../../utils/regionChile";
import {
  contactoInstitucionValido,
  validarContactoInstitucion,
  type ErroresContactoInstitucion
} from "../../utils/institucionContactoValidation";
import { fetchComunasPorRegion } from "../../utils/ubicacionChile";
import { primerErrorCampo } from "../../utils/formValidation";

export function MiInstitucionContactoSection() {
  const [institucion, setInstitucion] = useState<InstitucionContacto | null>(null);
  const [ubicacion, setUbicacion] = useState<{
    region: RegionChile | "";
    comuna: string;
    localidad: string;
  }>({ region: "", comuna: "", localidad: "" });
  const [direccion, setDireccion] = useState("");
  const [emailContacto, setEmailContacto] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ErroresContactoInstitucion>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const comunasRef = useRef<string[]>([]);

  const token = () => localStorage.getItem("token");

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/api/auth/mi-institucion"), {
        headers: { Authorization: `Bearer ${token()}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiError(data, "No se pudo cargar su institución"));
        return;
      }
      const inst = data.institucion as InstitucionContacto;
      setInstitucion(inst);
      setUbicacion({
        region: (inst.region as RegionChile) ?? "",
        comuna: inst.comuna ?? "",
        localidad: inst.localidad ?? ""
      });
      setDireccion(inst.direccion ?? "");
      setEmailContacto(inst.email_contacto ?? "");
      setTelefonoContacto(inst.telefono_contacto ?? "");
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const guardar = async () => {
    setSubmitAttempted(true);
    setError(null);
    setMensaje(null);

    if (institucion?.tipo !== "SISTEMA") {
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
    }

    setSaving(true);
    try {
      const res = await fetch(apiUrl("/api/auth/mi-institucion/contacto"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`
        },
        body: JSON.stringify({
          region: ubicacion.region || null,
          comuna: ubicacion.comuna.trim() || null,
          localidad: ubicacion.localidad.trim() || null,
          direccion: direccion.trim(),
          email_contacto: emailContacto.trim().toLowerCase(),
          telefono_contacto: telefonoContacto.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiError(data, "No se pudieron guardar los datos"));
        return;
      }
      setInstitucion(data.institucion);
      setMensaje("Datos de contacto actualizados.");
      setEditando(false);
    } catch {
      setError("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <FaBuilding />
          Contacto de su institución
        </span>
      }
      description="Ubicación y datos de contacto visibles para otras instituciones vinculadas en TEA Link."
    >
      {loading && <p className="text-sm text-neutral-gray-medium">Cargando...</p>}
      {error && <Alert variant="error">{error}</Alert>}
      {mensaje && <Alert variant="success">{mensaje}</Alert>}

      {!loading && institucion && !editando && (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <InstitucionContactoCard institucion={institucion} showTipo />
          <Button variant="secondary" size="sm" onClick={() => setEditando(true)}>
            Editar contacto
          </Button>
        </div>
      )}

      {!loading && institucion && editando && (
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            void guardar();
          }}
        >
          {institucion.tipo !== "SISTEMA" && (
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
          <Field
            label="Dirección (calle y número)"
            required
            error={submitAttempted ? fieldErrors.direccion : undefined}
          >
            <Input
              value={direccion}
              onChange={e => setDireccion(e.target.value)}
              placeholder="Av. Ejemplo 123"
              maxLength={255}
              required
              error={submitAttempted && Boolean(fieldErrors.direccion)}
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
              placeholder="contacto@institucion.cl"
              maxLength={255}
              required
              error={submitAttempted && Boolean(fieldErrors.email_contacto)}
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
              placeholder="+56 9 1234 5678"
              maxLength={50}
              required
              error={submitAttempted && Boolean(fieldErrors.telefono_contacto)}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => {
                setEditando(false);
                setSubmitAttempted(false);
                setFieldErrors({});
                setUbicacion({
                  region: (institucion.region as RegionChile) ?? "",
                  comuna: institucion.comuna ?? "",
                  localidad: institucion.localidad ?? ""
                });
                setDireccion(institucion.direccion ?? "");
                setEmailContacto(institucion.email_contacto ?? "");
                setTelefonoContacto(institucion.telefono_contacto ?? "");
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
