import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHandshake, FaPlus, FaUserGraduate, FaUsers } from "react-icons/fa";
import { AdminEquipoSection } from "./AdminEquipoSection";
import { AdminColaboracionSection } from "./AdminColaboracionSection";
import { AsignarEquipoPerfilModal } from "./AsignarEquipoPerfilModal";
import { adminPuedeAsignarEquipoPerfil } from "../utils/perfilEquipoAsignacion";
import { Tabs } from "./ui/Tabs";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { Modal } from "./ui/Modal";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { ScrollableTable } from "./ui/ScrollableTable";
import { dataTable, filterFieldMinWidth } from "./ui/dataTable";
import { TableActionButton } from "./ui/TableActionButton";
import { Select } from "./ui/Select";
import { useRoleTheme } from "../context/RoleThemeContext";
import { cn } from "../theme/cn";
import { validarNombreCompletoConApellido } from "../utils/nombrePersona";
import { validarEmail } from "../utils/formValidation";
import {
  etiquetaNivelEducacional,
  etiquetaNivelEducacionalCorta,
  NIVEL_EDUCACIONAL_GRUPOS,
  type NivelEducacional
} from "../utils/nivelEducacional";
import {
  calcularEdadDesdeFechaNacimiento,
  fechaHoyInput,
  formatearEdadPerfil
} from "../utils/edadDesdeFechaNacimiento";
import {
  determinarSujetoConsentimiento,
  etiquetaEstadoConsentimientoPendiente,
  etiquetaResponsableConsentimiento,
  esMenorDeEdad,
  institucionPuedeCrearPerfil
} from "../utils/perfilConsentimiento";
import {
  CAUSA_DISCAPACIDAD_LABEL,
  CAUSAS_DISCAPACIDAD,
  DIAGNOSTICO_CLINICO_GRUPOS,
  etiquetaDiagnosticoClinico,
  GRADO_DISCAPACIDAD_LABEL,
  GRADOS_DISCAPACIDAD,
  requiereDatosRnd,
  resumenDiagnosticoPerfil,
  type CausaDiscapacidad,
  type DiagnosticoClinico,
  type GradoDiscapacidad
} from "../utils/diagnosticoPerfil";
import { InvitarInstitucionModal } from "./InvitarInstitucionModal";
import {
  perfilPuedeCederCustodia,
  receptorCustodiaColaboracion
} from "../utils/perfilCustodia";
import { getSectionTheme } from "../theme/roleTheme";
import {
  formatearRutChileno,
  mensajeErrorRut,
  validarRutChileno
} from "../utils/rutChileno";

type Perfil = {
  id: number;
  rut?: string | null;
  nombre: string;
  edad?: number | null;
  nivel_educacional?: NivelEducacional | null;
  diagnostico_clinico: DiagnosticoClinico;
  diagnostico_secundario?: DiagnosticoClinico | null;
  causa_discapacidad?: CausaDiscapacidad | null;
  grado_discapacidad?: GradoDiscapacidad | null;
  porcentaje_rnd?: number | null;
  tiene_credencial_rnd?: boolean;
  fecha_nacimiento?: string | null;
  notas?: string | null;
  consentimiento_estado?: "PENDIENTE" | "ACEPTADO" | "RECHAZADO";
  consentimiento_sujeto?: "TUTOR_LEGAL" | "TITULAR";
  es_propio?: boolean;
  institucion_duena?: { id: number; nombre: string; tipo: string } | null;
  colaboraciones?: Array<{
    institucion_id: number;
    nombre: string;
    tipo: string;
    estado: "PENDIENTE" | "ACEPTADA" | "RECHAZADA";
    direccion: "ENVIADA" | "RECIBIDA";
  }>;
};

type ResumenPerfiles = {
  total: number;
  propios: number;
  compartidos: number;
  filtrados?: number;
};

type Paginacion = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const CONSENT_LABEL_BASE: Record<NonNullable<Perfil["consentimiento_estado"]>, string> = {
  PENDIENTE: "Pendiente",
  ACEPTADO: "Autorizado",
  RECHAZADO: "Rechazado"
};

function etiquetaConsentimiento(perfil: Perfil): string {
  if (perfil.consentimiento_estado === "PENDIENTE") {
    return etiquetaEstadoConsentimientoPendiente(perfil.consentimiento_sujeto ?? "TUTOR_LEGAL");
  }
  if (perfil.consentimiento_estado) {
    return CONSENT_LABEL_BASE[perfil.consentimiento_estado];
  }
  return "—";
}

const COLAB_ESTADO: Record<"PENDIENTE" | "ACEPTADA" | "RECHAZADA", string> = {
  PENDIENTE: "pendiente",
  ACEPTADA: "activa",
  RECHAZADA: "rechazada"
};

function formatColaboraciones(p: Perfil): string {
  const partes: string[] = [];
  const duenaId = p.institucion_duena?.id;
  if (p.es_propio === false && p.institucion_duena) {
    partes.push(`${p.institucion_duena.nombre} (dueño)`);
  }
  for (const c of p.colaboraciones ?? []) {
    if (duenaId && c.institucion_id === duenaId) continue;
    partes.push(`${c.nombre} (${COLAB_ESTADO[c.estado]})`);
  }
  return partes.length > 0 ? partes.join(" · ") : "—";
}

function textoResumen(resumen: ResumenPerfiles | null, esColaborador: boolean): string {
  if (!resumen || resumen.total === 0) return "";
  if (!esColaborador) {
    return `${resumen.total} ${resumen.total === 1 ? "menor" : "menores"} en TEA Link`;
  }
  const detalle: string[] = [];
  if (resumen.propios > 0) detalle.push(`${resumen.propios} propio${resumen.propios > 1 ? "s" : ""}`);
  if (resumen.compartidos > 0) {
    detalle.push(`${resumen.compartidos} compartido${resumen.compartidos > 1 ? "s" : ""}`);
  }
  return `${resumen.total} en TEA Link (${detalle.join(" · ")})`;
}

function parseApiError(errorData: Record<string, unknown>, fallback: string): string {
  if (Array.isArray(errorData?.error)) {
    return (
      errorData.error
        .map((i: { message?: string }) => i.message)
        .filter(Boolean)
        .join(". ") || fallback
    );
  }
  if (typeof errorData?.error === "string") return errorData.error;
  return fallback;
}

type Props = {
  institucionNombre: string | null;
};

export function AdminInstitucionDashboard({ institucionNombre }: Props) {
  const navigate = useNavigate();
  const theme = useRoleTheme();
  const section = getSectionTheme("default");
  const [tab, setTab] = useState<"perfiles" | "equipo" | "colaboracion">("perfiles");
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [resumen, setResumen] = useState<ResumenPerfiles | null>(null);
  const [paginacion, setPaginacion] = useState<Paginacion | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaInput, setBusquedaInput] = useState("");
  const [orden, setOrden] = useState<
    "nombre" | "edad" | "consentimiento" | "created_at" | "nivel_educacional"
  >("nivel_educacional");
  const [direccion, setDireccion] = useState<"asc" | "desc">("asc");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "propios" | "compartidos">("todos");
  const [filtroNivel, setFiltroNivel] = useState<"" | "sin_nivel" | NivelEducacional>("");
  const [filtroDiagnostico, setFiltroDiagnostico] = useState<"" | DiagnosticoClinico>("");
  const [pagina, setPagina] = useState(1);
  const [asignarEquipo, setAsignarEquipo] = useState<{
    id: number;
    nombre: string;
    nivel_educacional?: NivelEducacional | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [rut, setRut] = useState("");
  const [rutAviso, setRutAviso] = useState<string | null>(null);
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [notas, setNotas] = useState("");
  const [nivelEducacional, setNivelEducacional] = useState<NivelEducacional | "">("");
  const [diagnosticoClinico, setDiagnosticoClinico] = useState<DiagnosticoClinico | "">("");
  const [diagnosticoSecundario, setDiagnosticoSecundario] = useState<DiagnosticoClinico | "">("");
  const [causaDiscapacidad, setCausaDiscapacidad] = useState<CausaDiscapacidad | "">("");
  const [gradoDiscapacidad, setGradoDiscapacidad] = useState<GradoDiscapacidad>("NO_CALIFICADO");
  const [porcentajeRnd, setPorcentajeRnd] = useState("");
  const [tieneCredencialRnd, setTieneCredencialRnd] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [cediendoId, setCediendoId] = useState<number | null>(null);
  const [tutorNombre, setTutorNombre] = useState("");
  const [tutorEmail, setTutorEmail] = useState("");
  const [tempPasswordModal, setTempPasswordModal] = useState<string | null>(null);
  const [invitarPerfil, setInvitarPerfil] = useState<Perfil | null>(null);
  const [tipoInstitucion, setTipoInstitucion] = useState(
    () => localStorage.getItem("institucion_tipo") ?? ""
  );

  const requiereResponsableConsentimiento =
    tipoInstitucion === "CENTRO_EDUCACIONAL" || tipoInstitucion === "CENTRO_MEDICO";
  const edadCalculada = fechaNacimiento
    ? calcularEdadDesdeFechaNacimiento(fechaNacimiento)
    : null;
  const sujetoConsentimientoForm = determinarSujetoConsentimiento(edadCalculada);
  const esMenorEnFormulario = esMenorDeEdad(edadCalculada);
  const puedeInvitar =
    tipoInstitucion === "CENTRO_EDUCACIONAL" || tipoInstitucion === "CENTRO_MEDICO";
  const esCentroColaborador =
    tipoInstitucion === "CENTRO_MEDICO" || tipoInstitucion === "CENTRO_PROFESIONAL";
  const esCentroTerapeutico = tipoInstitucion === "CENTRO_PROFESIONAL";
  const puedeCrearPerfil = institucionPuedeCrearPerfil(tipoInstitucion);
  const esColegio = tipoInstitucion === "CENTRO_EDUCACIONAL";
  const muestraColaboracion = puedeInvitar || esCentroColaborador;

  const api = (path: string, options?: RequestInit) =>
    fetch(`http://localhost:3000/api/perfiles${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        ...options?.headers
      }
    });

  const fetchPerfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pagina),
        limit: "20",
        sort: orden,
        order: direccion,
        tipo: filtroTipo
      });
      if (busqueda.trim()) params.set("q", busqueda.trim());
      if (esColegio && filtroNivel) params.set("nivel", filtroNivel);
      if (filtroDiagnostico) params.set("diagnostico", filtroDiagnostico);

      const res = await api(`?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(parseApiError(data, "No se pudieron cargar los perfiles"));
        setPerfiles([]);
        return;
      }
      const data = await res.json();
      setPerfiles(data.perfiles ?? []);
      setResumen(data.resumen ?? null);
      setPaginacion(data.paginacion ?? null);
    } catch {
      setError("Error de red al cargar perfiles");
      setPerfiles([]);
    } finally {
      setLoading(false);
    }
  }, [busqueda, pagina, orden, direccion, filtroTipo, filtroNivel, filtroDiagnostico, esColegio]);

  useEffect(() => {
    fetchPerfiles();
  }, [fetchPerfiles]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setBusqueda(busquedaInput);
      setPagina(1);
    }, 350);
    return () => window.clearTimeout(t);
  }, [busquedaInput]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:3000/api/auth/usuarios", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json().catch(() => ({})))
      .then(data => {
        const tipo = data?.configuracion?.tipoInstitucion;
        if (typeof tipo === "string" && tipo) {
          setTipoInstitucion(tipo);
          localStorage.setItem("institucion_tipo", tipo);
        }
      })
      .catch(() => {});
  }, []);

  const resetForm = () => {
    setNombre("");
    setRut("");
    setRutAviso(null);
    setFechaNacimiento("");
    setNotas("");
    setTutorNombre("");
    setTutorEmail("");
    setNivelEducacional("");
    setDiagnosticoClinico("");
    setDiagnosticoSecundario("");
    setCausaDiscapacidad("");
    setGradoDiscapacidad("NO_CALIFICADO");
    setPorcentajeRnd("");
    setTieneCredencialRnd(false);
    setFormError(null);
    setEditingId(null);
  };

  const abrirCrear = () => {
    resetForm();
    setModalMode("create");
    setModalOpen(true);
  };

  const abrirEditar = (p: Perfil) => {
    setModalMode("edit");
    setEditingId(p.id);
    setRut(p.rut ? formatearRutChileno(p.rut) : "");
    setRutAviso(null);
    setNombre(p.nombre);
    const fecha =
      p.fecha_nacimiento ? p.fecha_nacimiento.toString().slice(0, 10) : "";
    setFechaNacimiento(fecha);
    setDiagnosticoClinico(p.diagnostico_clinico ?? "");
    setDiagnosticoSecundario(p.diagnostico_secundario ?? "");
    setCausaDiscapacidad(p.causa_discapacidad ?? "");
    setGradoDiscapacidad(p.grado_discapacidad ?? "NO_CALIFICADO");
    setPorcentajeRnd(p.porcentaje_rnd != null ? String(p.porcentaje_rnd) : "");
    setTieneCredencialRnd(Boolean(p.tiene_credencial_rnd));
    setNotas(p.notas ?? "");
    setNivelEducacional(p.nivel_educacional ?? "");
    setFormError(null);
    setModalOpen(true);
  };

  const handleFechaNacimientoChange = (value: string) => {
    setFechaNacimiento(value);
  };

  const edadMostrada = formatearEdadPerfil(
    fechaNacimiento || null,
    null
  );

  const cerrarModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleRutBlur = async () => {
    const trimmed = rut.trim();
    if (!trimmed) {
      setRutAviso(null);
      return;
    }
    if (!validarRutChileno(trimmed)) {
      setRutAviso(null);
      return;
    }
    const formateado = formatearRutChileno(trimmed);
    setRut(formateado);
    if (modalMode !== "create") return;
    try {
      const res = await api(`/buscar-rut?rut=${encodeURIComponent(formateado)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.encontrado && data.perfil) {
        const inst = data.perfil.institucion?.nombre ?? "otra institución";
        setRutAviso(
          `Este RUT ya está registrado a nombre de ${data.perfil.nombre} (custodia: ${inst}). No puede crear un duplicado.`
        );
      } else {
        setRutAviso(null);
      }
    } catch {
      /* consulta opcional */
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setFormError("El nombre es obligatorio");
      return;
    }
    if (nombre.trim().length < 2) {
      setFormError("El nombre debe tener al menos 2 caracteres");
      return;
    }
    if (modalMode === "create") {
      const errorRut = mensajeErrorRut(rut);
      if (errorRut) {
        setFormError(errorRut);
        return;
      }
    }
    if (modalMode === "create" && requiereResponsableConsentimiento) {
      if (!fechaNacimiento) {
        setFormError("Debe indicar la fecha de nacimiento para definir quién acepta el consentimiento");
        return;
      }
      if (!tutorNombre.trim() || !tutorEmail.trim()) {
        setFormError(
          esMenorEnFormulario
            ? "Debe registrar email y nombre del tutor o apoderado"
            : "Debe registrar el email del estudiante (mayor de edad) que aceptará el consentimiento"
        );
        return;
      }
      const errorTutor = validarNombreCompletoConApellido(tutorNombre);
      if (errorTutor) {
        setFormError(errorTutor);
        return;
      }
      const errorEmailTutor = validarEmail(tutorEmail);
      if (errorEmailTutor) {
        setFormError(errorEmailTutor);
        return;
      }
    }
    if (esColegio && !nivelEducacional) {
      setFormError("Debe indicar el nivel educacional del estudiante");
      return;
    }
    if (!diagnosticoClinico) {
      setFormError("Debe seleccionar el diagnóstico clínico principal");
      return;
    }
    if (
      diagnosticoSecundario &&
      diagnosticoSecundario === diagnosticoClinico
    ) {
      setFormError("El diagnóstico secundario debe ser distinto del principal");
      return;
    }
    if (requiereDatosRnd(tieneCredencialRnd, gradoDiscapacidad)) {
      if (!causaDiscapacidad) {
        setFormError("Indique la causa de discapacidad (calificación COMPIN / RND)");
        return;
      }
      if (gradoDiscapacidad === "NO_CALIFICADO") {
        setFormError("Indique el grado de discapacidad del Registro Nacional");
        return;
      }
    }
    setFormLoading(true);
    setFormError(null);
    const body: Record<string, unknown> = {
      nombre: nombre.trim(),
      diagnostico_clinico: diagnosticoClinico,
      diagnostico_secundario: diagnosticoSecundario || null,
      causa_discapacidad: causaDiscapacidad || null,
      grado_discapacidad: gradoDiscapacidad,
      porcentaje_rnd: porcentajeRnd.trim() ? Number(porcentajeRnd) : null,
      tiene_credencial_rnd: tieneCredencialRnd,
      notas: notas.trim() || undefined,
      fecha_nacimiento: fechaNacimiento || undefined
    };
    if (fechaNacimiento) {
      const edadCalc = calcularEdadDesdeFechaNacimiento(fechaNacimiento);
      if (edadCalc != null) body.edad = edadCalc;
    }
    if (esColegio && nivelEducacional) {
      body.nivel_educacional = nivelEducacional;
    }
    if (modalMode === "create") {
      body.rut = rut.trim();
    }
    if (modalMode === "create" && tutorEmail.trim() && tutorNombre.trim()) {
      body.tutor_email = tutorEmail.trim().toLowerCase();
      body.tutor_nombre_completo = tutorNombre.trim();
    }

    try {
      const isEdit = modalMode === "edit" && editingId != null;
      const res = await api(isEdit ? `/${editingId}` : "", {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(parseApiError(data, "Error al guardar perfil"));
        return;
      }
      const data = await res.json().catch(() => ({}));
      cerrarModal();
      await fetchPerfiles();
      if (data.tutor?.tempPassword || data.responsable?.tempPassword) {
        const resp = data.responsable ?? data.tutor;
        const esTitular = resp?.sujeto === "TITULAR" || sujetoConsentimientoForm === "TITULAR";
        setTempPasswordModal(
          esTitular
            ? `Perfil creado. Comparta con el estudiante:\n\nEmail: ${resp.email}\nContraseña temporal: ${resp.tempPassword}\n\nDebe ingresar, cambiar la clave y autorizar el consentimiento de su propio perfil.`
            : `Perfil creado. Comparta con el tutor:\n\nEmail: ${resp.email}\nContraseña temporal: ${resp.tempPassword}\n\nDebe ingresar, cambiar la clave y autorizar el consentimiento al seleccionar al menor.`
        );
      } else if ((data.tutor || data.responsable) && modalMode === "create") {
        const resp = data.responsable ?? data.tutor;
        const esTitular = resp?.sujeto === "TITULAR" || sujetoConsentimientoForm === "TITULAR";
        setTempPasswordModal(
          esTitular
            ? `Perfil creado. El estudiante ${resp.email} ya tenía cuenta; quedó vinculado. Debe autorizar el consentimiento de su perfil al ingresar.`
            : `Perfil creado. El tutor ${resp.email} ya tenía cuenta; quedó vinculado. Debe autorizar el consentimiento al ingresar.`
        );
      }
    } catch {
      setFormError("Error de red al guardar");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCederCustodia = async (p: Perfil) => {
    const receptor = receptorCustodiaColaboracion(p.colaboraciones);
    if (!receptor) return;
    if (
      !window.confirm(
        `¿Ceder la custodia de "${p.nombre}" a ${receptor.nombre}?\n\n` +
          "• Las observaciones y el historial se conservan.\n" +
          "• Su institución dejará de administrar este perfil.\n" +
          "• El nuevo dueño podrá asignar equipo e invitar a otros centros."
      )
    ) {
      return;
    }
    setCediendoId(p.id);
    setError(null);
    try {
      const res = await api(`/${p.id}/ceder-custodia`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiError(data, "No se pudo ceder la custodia"));
        return;
      }
      await fetchPerfiles();
    } catch {
      setError("Error de red al ceder custodia");
    } finally {
      setCediendoId(null);
    }
  };

  const abrirInvitar = (p: Perfil) => {
    setInvitarPerfil(p);
  };

  const tabItems = [
    { id: "perfiles" as const, label: "Perfiles", icon: <FaUserGraduate /> },
    { id: "equipo" as const, label: esCentroColaborador ? "Equipo" : "Educadores", icon: <FaUsers /> },
    ...(muestraColaboracion
      ? [
          {
            id: "colaboracion" as const,
            label: "Red y contacto",
            icon: <FaHandshake />
          }
        ]
      : [])
  ];

  return (
    <div className="w-full">
      <p className="text-sm text-neutral-gray-medium mb-6 max-w-2xl">
        Gestiona los <strong>perfiles</strong> y el <strong>equipo</strong> de{" "}
        <strong>{institucionNombre || "tu institución"}</strong>.
        {muestraColaboracion && (
          <>
            {" "}
            En <strong>Red y contacto</strong> actualice los datos de su institución, consulte otras
            instituciones vinculadas y coordine la red interinstitucional.
          </>
        )}
      </p>

      <Tabs
        variant="pills"
        active={tab}
        onChange={setTab}
        items={tabItems}
      />

      {tab === "equipo" && <AdminEquipoSection />}

      {tab === "colaboracion" && (
        <AdminColaboracionSection modo={esCentroColaborador ? "receptor" : "emisor"} />
      )}

      {tab === "perfiles" && (
        <Card
          title={
            <>
              <FaUserGraduate /> Perfiles de estudiantes
              {resumen && resumen.total > 0 && (
                <span className="ml-2 text-sm font-normal text-neutral-gray-medium">
                  — {textoResumen(resumen, esCentroColaborador)}
                </span>
              )}
            </>
          }
          description={
            esColegio
              ? "Organice a los estudiantes por nivel (básica, media, formación técnica o universitaria). Con consentimiento autorizado, use Invitar centro para sumar colaboradores médicos o terapéuticos."
              : esCentroTerapeutico
                ? "Su centro no crea perfiles: trabaja sobre personas que un colegio, familia o centro médico comparte mediante colaboración."
                : esCentroColaborador
                  ? "Listado unificado: perfiles creados en su centro y personas compartidas por otras instituciones."
                  : "Registre el perfil y los datos de quien aceptará el consentimiento (tutor si es menor de 18 años, o el propio estudiante si es mayor de edad)."
          }
          action={
            puedeCrearPerfil ? (
              <Button onClick={abrirCrear}>
                <FaPlus /> Nuevo perfil
              </Button>
            ) : undefined
          }
        >
          {error && <Alert variant="error">{error}</Alert>}

          <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(12rem,1fr)_repeat(auto-fit,minmax(11.5rem,13.5rem))] xl:items-end">
            <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1 min-w-0">
              <Field label="Buscar">
                <Input
                  placeholder="Nombre del estudiante..."
                  value={busquedaInput}
                  onChange={e => setBusquedaInput(e.target.value)}
                />
              </Field>
            </div>
            {esColegio && (
              <div className={filterFieldMinWidth.nivel}>
                <Field label="Nivel">
                  <Select
                    value={filtroNivel}
                    title={
                      filtroNivel
                        ? filtroNivel === "sin_nivel"
                          ? "Sin nivel asignado"
                          : etiquetaNivelEducacional(filtroNivel)
                        : "Todos los niveles"
                    }
                    onChange={e => {
                      setFiltroNivel(e.target.value as typeof filtroNivel);
                      setPagina(1);
                    }}
                  >
                    <option value="">Todos los niveles</option>
                    <option value="sin_nivel">Sin nivel asignado</option>
                    {NIVEL_EDUCACIONAL_GRUPOS.map(grupo => (
                      <optgroup key={grupo.label} label={grupo.label}>
                        {grupo.niveles.map(n => (
                          <option key={n} value={n}>
                            {etiquetaNivelEducacional(n)}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </Select>
                </Field>
              </div>
            )}
            <div className={filterFieldMinWidth.tipo}>
              <Field label="Diagnóstico">
                <Select
                  value={filtroDiagnostico}
                  onChange={e => {
                    setFiltroDiagnostico(e.target.value as typeof filtroDiagnostico);
                    setPagina(1);
                  }}
                >
                  <option value="">Todos</option>
                  {DIAGNOSTICO_CLINICO_GRUPOS.map(grupo => (
                    <optgroup key={grupo.label} label={grupo.label}>
                      {grupo.items.map(d => (
                        <option key={d} value={d}>
                          {etiquetaDiagnosticoClinico(d)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </Field>
            </div>
            <div className={filterFieldMinWidth.sort}>
              <Field label="Ordenar por">
                <Select
                  value={orden}
                  title={
                    orden === "nivel_educacional"
                      ? "Nivel educacional"
                      : orden === "created_at"
                        ? "Fecha alta"
                        : orden === "consentimiento"
                          ? "Consentimiento"
                          : orden === "edad"
                            ? "Edad"
                            : "Nombre"
                  }
                  onChange={e => {
                    setOrden(e.target.value as typeof orden);
                    setPagina(1);
                  }}
                >
                  {esColegio && <option value="nivel_educacional">Nivel educacional</option>}
                  <option value="nombre">Nombre</option>
                  <option value="edad">Edad</option>
                  <option value="consentimiento">Consentimiento</option>
                  <option value="created_at">Fecha alta</option>
                </Select>
              </Field>
            </div>
            <div className={filterFieldMinWidth.direction}>
              <Field label="Dirección">
                <Select
                  value={direccion}
                  title={direccion === "asc" ? "Ascendente" : "Descendente"}
                  onChange={e => {
                    setDireccion(e.target.value as typeof direccion);
                    setPagina(1);
                  }}
                >
                  <option value="asc">Ascendente</option>
                  <option value="desc">Descendente</option>
                </Select>
              </Field>
            </div>
            {esCentroColaborador && (
              <div className={filterFieldMinWidth.tipo}>
                <Field label="Mostrar">
                  <Select
                    value={filtroTipo}
                    onChange={e => {
                      setFiltroTipo(e.target.value as typeof filtroTipo);
                      setPagina(1);
                    }}
                  >
                    <option value="todos">Todos</option>
                    <option value="propios">Solo propios</option>
                    <option value="compartidos">Solo compartidos</option>
                  </Select>
                </Field>
              </div>
            )}
          </div>

          {paginacion && paginacion.total > 0 && (
            <p className="text-sm text-neutral-gray-medium mb-3">
              Mostrando página {paginacion.page} de {paginacion.totalPages} (
              {paginacion.total} resultado{paginacion.total !== 1 ? "s" : ""}
              {resumen && resumen.total !== paginacion.total
                ? ` de ${resumen.total} en total`
                : ""}
              )
            </p>
          )}

          {loading ? (
            <p className="text-neutral-gray-medium">Cargando perfiles...</p>
          ) : perfiles.length === 0 ? (
            <div
              className={cn(
                "text-center py-10 rounded-xl border border-dashed",
                section.accentBgEmpty,
                section.accentBorderDashed
              )}
            >
              <p className="text-neutral-gray-medium mb-3">
                {busqueda.trim()
                  ? "No hay perfiles que coincidan con la búsqueda."
                  : esCentroTerapeutico
                    ? "Aún no hay perfiles compartidos con su centro. Acepte una invitación en la pestaña Colaboración."
                    : "Aún no hay perfiles en esta institución."}
              </p>
              {!busqueda.trim() && puedeCrearPerfil && (
                <Button onClick={abrirCrear}>Crear el primer perfil</Button>
              )}
            </div>
          ) : (
            <ScrollableTable>
              <table className={dataTable.table}>
                <thead>
                  <tr className={section.tableHead}>
                    <th className={dataTable.th}>Nombre</th>
                    <th className={cn(dataTable.th, "min-w-[8rem] whitespace-nowrap")}>RUT</th>
                    {esColegio && (
                      <th className={cn(dataTable.th, "min-w-[9rem]")}>Nivel</th>
                    )}
                    <th className={cn(dataTable.th, "w-16")}>Edad</th>
                    {esCentroColaborador && (
                      <th className={dataTable.th}>Tipo</th>
                    )}
                    <th className={cn(dataTable.th, "min-w-[8rem]")}>Diagnóstico</th>
                    <th className={cn(dataTable.th, "min-w-[10rem]")}>
                      {esColegio || esCentroColaborador ? "Instituciones" : "Consentimiento"}
                    </th>
                    {(esColegio || esCentroColaborador) && (
                      <th className={cn(dataTable.th, "min-w-[7rem]")}>Consentimiento</th>
                    )}
                    <th className={cn(dataTable.th, "min-w-[12rem]")}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {perfiles.map(p => {
                    const esPropio = p.es_propio !== false;
                    return (
                    <tr key={p.id} className={cn("border-b", section.tableRowHover)}>
                      <td className={dataTable.tdMedium}>
                        <button
                          type="button"
                          className={cn(theme.link, "text-left font-medium")}
                          onClick={() => navigate(`/admin/perfiles/${p.id}`)}
                          title="Ver ficha completa"
                        >
                          {p.nombre}
                        </button>
                      </td>
                      <td className={cn(dataTable.td, "whitespace-nowrap text-sm")}>
                        {p.rut ? formatearRutChileno(p.rut) : "—"}
                      </td>
                      {esColegio && (
                        <td
                          className={cn(dataTable.td, "min-w-[9rem] whitespace-nowrap")}
                          title={etiquetaNivelEducacional(p.nivel_educacional)}
                        >
                          {etiquetaNivelEducacionalCorta(p.nivel_educacional)}
                        </td>
                      )}
                      <td className={dataTable.td}>
                        {formatearEdadPerfil(p.fecha_nacimiento, p.edad)}
                      </td>
                      {esCentroColaborador && (
                        <td className={dataTable.td}>
                          <span
                            className={cn(
                              "inline-block px-2 py-0.5 rounded-full text-sm",
                              esPropio
                                ? "bg-primary/10 text-primary-dark"
                                : "bg-secondary/10 text-secondary-dark"
                            )}
                          >
                            {esPropio ? "Propio" : "Compartido"}
                          </span>
                        </td>
                      )}
                      <td
                        className={cn(dataTable.td, "max-w-[14rem]")}
                        title={resumenDiagnosticoPerfil(p)}
                      >
                        <span className="line-clamp-2">{resumenDiagnosticoPerfil(p)}</span>
                      </td>
                      {(esColegio || esCentroColaborador) && (
                        <td className={cn(dataTable.td, "max-w-[16rem] leading-snug")}>
                          {formatColaboraciones(p)}
                        </td>
                      )}
                      {!(esColegio || esCentroColaborador) && (
                        <td className={dataTable.td}>
                          {p.consentimiento_estado ? etiquetaConsentimiento(p) : "—"}
                        </td>
                      )}
                      {(esColegio || esCentroColaborador) && (
                        <td className={cn(dataTable.td, "whitespace-nowrap")}>
                          {p.consentimiento_estado ? etiquetaConsentimiento(p) : "—"}
                        </td>
                      )}
                      <td className={dataTable.td}>
                        <div className="flex flex-wrap gap-1.5">
                          <TableActionButton onClick={() => navigate(`/admin/perfiles/${p.id}`)}>
                            Ver ficha
                          </TableActionButton>
                          {esPropio && (
                            <TableActionButton onClick={() => abrirEditar(p)}>
                              Editar
                            </TableActionButton>
                          )}
                          {esPropio && puedeInvitar && p.consentimiento_estado === "ACEPTADO" && (
                            <TableActionButton
                              onClick={() => abrirInvitar(p)}
                              title={
                                esColegio
                                  ? "Invitar centro médico o terapéutico"
                                  : "Invitar colegio o centro terapéutico"
                              }
                            >
                              Invitar centro
                            </TableActionButton>
                          )}
                          {adminPuedeAsignarEquipoPerfil(p, tipoInstitucion) && (
                            <TableActionButton
                              onClick={() =>
                                setAsignarEquipo({
                                  id: p.id,
                                  nombre: p.nombre,
                                  nivel_educacional: p.nivel_educacional
                                })
                              }
                            >
                              Asignar equipo
                            </TableActionButton>
                          )}
                          {esPropio && puedeInvitar && p.consentimiento_estado === "PENDIENTE" && (
                            <span
                              className="inline-flex items-center px-2.5 py-1 text-xs text-neutral-gray-medium"
                              title={`El ${etiquetaResponsableConsentimiento(p.consentimiento_sujeto ?? "TUTOR_LEGAL")} debe aceptar el consentimiento antes de invitar otras instituciones`}
                            >
                              Invitar ({etiquetaEstadoConsentimientoPendiente(p.consentimiento_sujeto ?? "TUTOR_LEGAL").toLowerCase()})
                            </span>
                          )}
                          {esPropio && perfilPuedeCederCustodia(p) && (
                            <TableActionButton
                              onClick={() => handleCederCustodia(p)}
                              disabled={cediendoId === p.id}
                              title="Transferir la administración del perfil a la institución colaboradora"
                            >
                              {cediendoId === p.id ? "..." : "Ceder custodia"}
                            </TableActionButton>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollableTable>
          )}

          {paginacion && paginacion.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 gap-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagina <= 1 || loading}
                onClick={() => setPagina(p => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span className="text-sm text-neutral-gray-medium">
                Página {paginacion.page} / {paginacion.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagina >= paginacion.totalPages || loading}
                onClick={() => setPagina(p => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </Card>
      )}

      <AsignarEquipoPerfilModal
        open={asignarEquipo != null}
        perfilId={asignarEquipo?.id ?? null}
        perfilNombre={asignarEquipo?.nombre ?? ""}
        perfilNivelEducacional={asignarEquipo?.nivel_educacional}
        tipoInstitucion={tipoInstitucion}
        onClose={() => setAsignarEquipo(null)}
        onAsignado={fetchPerfiles}
      />

      <Modal
        open={modalOpen}
        onClose={cerrarModal}
        title={modalMode === "edit" ? "Editar perfil" : "Nuevo perfil"}
        footer={
          <>
            <Button variant="secondary" onClick={cerrarModal} disabled={formLoading}>
              Cancelar
            </Button>
            <Button type="submit" form="perfil-form" disabled={formLoading}>
              {formLoading ? "Guardando..." : "Guardar"}
            </Button>
          </>
        }
      >
        <form id="perfil-form" onSubmit={handleGuardar} className="space-y-4">
          {modalMode === "create" ? (
            <Field
              label="RUT del estudiante"
              required
              hint="Identificador único en el registro nacional TEA Link"
            >
              <Input
                value={rut}
                onChange={e => {
                  setRut(e.target.value);
                  setRutAviso(null);
                }}
                onBlur={handleRutBlur}
                placeholder="12.345.678-9"
                required
              />
              {rutAviso && (
                <p className="text-xs text-amber-700 mt-1" role="status">
                  {rutAviso}
                </p>
              )}
            </Field>
          ) : (
            <Field label="RUT del estudiante" hint="No se puede modificar tras el alta">
              <Input
                value={rut}
                readOnly
                className="bg-neutral-gray-light/60 cursor-not-allowed"
              />
            </Field>
          )}
          <Field label="Nombre" required>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} required />
          </Field>
          {esColegio && (
            <Field label="Nivel educacional" required>
              <Select
                value={nivelEducacional}
                onChange={e => setNivelEducacional(e.target.value as NivelEducacional | "")}
                required
              >
                <option value="">Seleccione curso o programa…</option>
                {NIVEL_EDUCACIONAL_GRUPOS.map(grupo => (
                  <optgroup key={grupo.label} label={grupo.label}>
                    {grupo.niveles.map(n => (
                      <option key={n} value={n}>
                        {etiquetaNivelEducacional(n)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
              <p className="text-xs text-neutral-gray-medium mt-1">
                Incluye enseñanza básica, media y formación laboral para establecimientos
                especiales (referencia Mineduc).
              </p>
            </Field>
          )}
          <Field label="Fecha de nacimiento">
            <Input
              type="date"
              max={fechaHoyInput()}
              value={fechaNacimiento}
              onChange={e => handleFechaNacimientoChange(e.target.value)}
            />
          </Field>
          <Field
            label="Edad"
            hint={
              fechaNacimiento
                ? "Años y meses cumplidos según la fecha de nacimiento"
                : "Ingrese la fecha de nacimiento para calcular la edad"
            }
          >
            <Input
              type="text"
              value={fechaNacimiento ? edadMostrada : ""}
              readOnly
              placeholder="—"
              className="bg-neutral-gray-light/60 cursor-not-allowed"
            />
          </Field>
          <Field label="Diagnóstico clínico principal" required>
            <Select
              value={diagnosticoClinico}
              onChange={e => setDiagnosticoClinico(e.target.value as DiagnosticoClinico | "")}
              required
            >
              <option value="">Seleccione diagnóstico…</option>
              {DIAGNOSTICO_CLINICO_GRUPOS.map(grupo => (
                <optgroup key={grupo.label} label={grupo.label}>
                  {grupo.items.map(d => (
                    <option key={d} value={d}>
                      {etiquetaDiagnosticoClinico(d)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
          <Field label="Diagnóstico clínico secundario">
            <Select
              value={diagnosticoSecundario}
              onChange={e =>
                setDiagnosticoSecundario(e.target.value as DiagnosticoClinico | "")
              }
            >
              <option value="">Ninguno</option>
              {DIAGNOSTICO_CLINICO_GRUPOS.map(grupo => (
                <optgroup key={grupo.label} label={grupo.label}>
                  {grupo.items.map(d => (
                    <option key={d} value={d} disabled={d === diagnosticoClinico}>
                      {etiquetaDiagnosticoClinico(d)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
          <div className="rounded-lg border border-neutral-gray-medium/25 p-4 space-y-4 bg-neutral-gray-light/30">
            <p className="text-sm font-semibold text-neutral-gray">
              Calificación Registro Nacional de la Discapacidad (RND)
            </p>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={tieneCredencialRnd}
                onChange={e => setTieneCredencialRnd(e.target.checked)}
                className="rounded border-neutral-gray-medium"
              />
              Tiene credencial de discapacidad (RND)
            </label>
            <Field label="Grado de discapacidad">
              <Select
                value={gradoDiscapacidad}
                onChange={e =>
                  setGradoDiscapacidad(e.target.value as GradoDiscapacidad)
                }
              >
                {GRADOS_DISCAPACIDAD.map(g => (
                  <option key={g} value={g}>
                    {GRADO_DISCAPACIDAD_LABEL[g]}
                  </option>
                ))}
              </Select>
            </Field>
            {requiereDatosRnd(tieneCredencialRnd, gradoDiscapacidad) && (
              <>
                <Field label="Causa de discapacidad (Decreto 47)" required>
                  <Select
                    value={causaDiscapacidad}
                    onChange={e =>
                      setCausaDiscapacidad(e.target.value as CausaDiscapacidad | "")
                    }
                    required
                  >
                    <option value="">Seleccione causa…</option>
                    {CAUSAS_DISCAPACIDAD.map(c => (
                      <option key={c} value={c}>
                        {CAUSA_DISCAPACIDAD_LABEL[c]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Porcentaje RND (opcional)"
                  hint="Debe coincidir con el grado indicado en el dictamen COMPIN"
                >
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={porcentajeRnd}
                    onChange={e => setPorcentajeRnd(e.target.value)}
                    placeholder="Ej: 35"
                  />
                </Field>
              </>
            )}
          </div>
          <Field label="Notas administrativas">
            <Textarea rows={3} value={notas} onChange={e => setNotas(e.target.value)} />
          </Field>
          {modalMode === "create" && requiereResponsableConsentimiento && (
            <>
              <hr className="border-neutral-gray-medium/20" />
              <p className="text-sm font-semibold text-neutral-gray">
                {esMenorEnFormulario
                  ? "Tutor / apoderado legal"
                  : "Estudiante titular (mayor de edad)"}
              </p>
              <p className="text-xs text-neutral-gray-medium">
                {esMenorEnFormulario
                  ? "Obligatorio: se creará la cuenta FAMILIA del tutor con contraseña temporal. Debe aceptar el consentimiento del menor."
                  : fechaNacimiento
                    ? "Obligatorio: se creará la cuenta FAMILIA del estudiante con contraseña temporal. Debe aceptar el consentimiento de su propio perfil."
                    : "Indique la fecha de nacimiento para determinar si el consentimiento lo acepta el tutor o el propio estudiante."}
              </p>
              <Field
                label={esMenorEnFormulario ? "Nombre del tutor" : "Nombre completo del estudiante"}
                required={requiereResponsableConsentimiento && !!fechaNacimiento}
              >
                <Input
                  value={tutorNombre}
                  onChange={e => setTutorNombre(e.target.value)}
                  placeholder={
                    esMenorEnFormulario
                      ? "Ej: María González López"
                      : "Ej: Juan Pérez Soto"
                  }
                  required={requiereResponsableConsentimiento && !!fechaNacimiento}
                  disabled={!fechaNacimiento}
                />
                <p className="text-xs text-neutral-gray-medium mt-1">
                  Nombre, primer apellido y segundo apellido son obligatorios.
                </p>
              </Field>
              <Field
                label={esMenorEnFormulario ? "Email del tutor" : "Email del estudiante"}
                required={requiereResponsableConsentimiento && !!fechaNacimiento}
              >
                <Input
                  type="email"
                  value={tutorEmail}
                  onChange={e => setTutorEmail(e.target.value)}
                  required={requiereResponsableConsentimiento && !!fechaNacimiento}
                  disabled={!fechaNacimiento}
                />
              </Field>
            </>
          )}
          {modalMode === "create" && !requiereResponsableConsentimiento && (
            <>
              <hr className="border-neutral-gray-medium/20" />
              <p className="text-sm font-semibold text-neutral-gray">Tutor / apoderado legal</p>
              <p className="text-xs text-neutral-gray-medium">Opcional en instituciones tipo familia.</p>
              <Field label="Nombre del tutor">
                <Input
                  value={tutorNombre}
                  onChange={e => setTutorNombre(e.target.value)}
                  placeholder="Ej: María González López"
                />
              </Field>
              <Field label="Email del tutor">
                <Input
                  type="email"
                  value={tutorEmail}
                  onChange={e => setTutorEmail(e.target.value)}
                />
              </Field>
            </>
          )}
          {formError && <Alert variant="error" className="mb-0">{formError}</Alert>}
        </form>
      </Modal>

      <InvitarInstitucionModal
        open={!!invitarPerfil}
        perfilId={invitarPerfil?.id ?? null}
        perfilNombre={invitarPerfil?.nombre ?? ""}
        tipoInstitucion={tipoInstitucion}
        onClose={() => setInvitarPerfil(null)}
        onInvitado={fetchPerfiles}
      />

      <Modal
        open={!!tempPasswordModal}
        onClose={() => setTempPasswordModal(null)}
        title={
          sujetoConsentimientoForm === "TITULAR"
            ? "Credenciales del estudiante"
            : "Credenciales del tutor"
        }
        footer={
          <Button onClick={() => setTempPasswordModal(null)}>Entendido</Button>
        }
      >
        <pre className="text-sm whitespace-pre-wrap text-neutral-gray">{tempPasswordModal}</pre>
      </Modal>
    </div>
  );
}
