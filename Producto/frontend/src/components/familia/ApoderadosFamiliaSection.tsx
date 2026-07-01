import { useCallback, useEffect, useState } from "react";
import { apiUrl } from '../../config/api';
import { FaUserFriends } from "react-icons/fa";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import { Modal } from "../ui/Modal";
import { parseApiError } from "../../utils/parseApiError";
import { MENSAJE_NOMBRE_CON_APELLIDO } from "../../utils/nombrePersona";
import { validarEmail } from "../../utils/formValidation";
import { useRoleTheme } from "../../context/RoleThemeContext";
import { cn } from "../../theme/cn";

type Apoderado = {
  usuario_id: number;
  nombre_completo: string;
  email: string;
  es_principal: boolean;
  consentimiento_aceptado: boolean;
};

type Props = {
  perfilId: string;
  perfilNombre?: string;
};

export function ApoderadosFamiliaSection({ perfilId, perfilNombre }: Props) {
  const theme = useRoleTheme();
  const [apoderados, setApoderados] = useState<Apoderado[]>([]);
  const [esPrincipal, setEsPrincipal] = useState(false);
  const [puedeInvitar, setPuedeInvitar] = useState(false);
  const [total, setTotal] = useState(0);
  const [maximo, setMaximo] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [tempPasswordModal, setTempPasswordModal] = useState<string | null>(null);

  const token = () => localStorage.getItem("token");

  const cargar = useCallback(async () => {
    if (!perfilId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/perfiles/${perfilId}/apoderados`), {
        headers: { Authorization: `Bearer ${token()}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiError(data, "No se pudieron cargar los apoderados"));
        return;
      }
      setApoderados(data.apoderados ?? []);
      setEsPrincipal(Boolean(data.es_principal));
      setPuedeInvitar(Boolean(data.puede_invitar));
      setTotal(data.total ?? 0);
      setMaximo(data.maximo ?? 3);
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }, [perfilId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const invitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const emailErr = validarEmail(email);
    if (emailErr) {
      setFormError(emailErr);
      return;
    }
    if (!nombre.trim()) {
      setFormError("El nombre completo es obligatorio");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(apiUrl(`/api/perfiles/${perfilId}/apoderados`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          nombre_completo: nombre.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(parseApiError(data, "No se pudo invitar al apoderado"));
        return;
      }
      setModalOpen(false);
      setNombre("");
      setEmail("");
      if (data.tempPassword) {
        setTempPasswordModal(
          `Apoderado invitado.\n\nEmail: ${data.apoderado?.email}\nContraseña temporal: ${data.tempPassword}\n\nDebe ingresar, cambiar la clave y confirmar el consentimiento de este perfil.`
        );
      }
      await cargar();
    } catch {
      setFormError("Error de red");
    } finally {
      setEnviando(false);
    }
  };

  if (!perfilId) return null;

  return (
    <>
      <Card
        title={
          <span className="flex items-center gap-2">
            <FaUserFriends />
            Apoderados{perfilNombre ? ` de ${perfilNombre}` : ""}
          </span>
        }
        description={
          esPrincipal
            ? `Puede invitar hasta ${maximo} apoderados por perfil. Para otro hijo o hija, solicítelo en el colegio o centro de salud.`
            : "Apoderados con acceso a este perfil. Solo el apoderado principal puede invitar a otros."
        }
        action={
          esPrincipal && puedeInvitar ? (
            <Button size="sm" onClick={() => setModalOpen(true)}>
              Invitar apoderado
            </Button>
          ) : undefined
        }
      >
        {error && <Alert variant="error">{error}</Alert>}
        {loading && <p className="text-sm text-neutral-gray-medium">Cargando...</p>}
        {!loading && (
          <div className="space-y-2">
            <p className="text-sm text-neutral-gray-medium">
              {total} de {maximo} apoderados
            </p>
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {apoderados.map(a => (
                <li
                  key={a.usuario_id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium text-neutral-gray">{a.nombre_completo}</p>
                    <p className="text-neutral-gray-medium">{a.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {a.es_principal && (
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          theme.accentBgMuted,
                          theme.accentText
                        )}
                      >
                        Principal
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        a.consentimiento_aceptado
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-900"
                      )}
                    >
                      {a.consentimiento_aceptado ? "Confirmado" : "Pendiente confirmación"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            {apoderados.length === 0 && (
              <p className="text-sm text-neutral-gray-medium">Sin apoderados vinculados.</p>
            )}
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setFormError(null);
        }}
        title="Invitar apoderado"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={enviando}>
              Cancelar
            </Button>
            <Button type="submit" form="invitar-apoderado-form" disabled={enviando}>
              {enviando ? "Enviando..." : "Invitar"}
            </Button>
          </>
        }
      >
        <form id="invitar-apoderado-form" onSubmit={invitar} className="space-y-4">
          <p className="text-sm text-neutral-gray-medium">
            Invite a otro tutor o apoderado legal. Tendrá acceso a este perfil para ver y registrar
            observaciones públicas, tras confirmar el consentimiento.
          </p>
          <Field label="Nombre completo" required>
            <Input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Pedro Pérez González"
              required
            />
            <p className="text-xs text-neutral-gray-medium mt-1">{MENSAJE_NOMBRE_CON_APELLIDO}</p>
          </Field>
          <Field label="Correo electrónico" required>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </Field>
          {formError && <Alert variant="error">{formError}</Alert>}
        </form>
      </Modal>

      <Modal
        open={!!tempPasswordModal}
        onClose={() => setTempPasswordModal(null)}
        title="Credenciales del apoderado"
        footer={<Button onClick={() => setTempPasswordModal(null)}>Entendido</Button>}
      >
        <pre className="text-sm whitespace-pre-wrap text-neutral-gray">{tempPasswordModal}</pre>
      </Modal>
    </>
  );
}
