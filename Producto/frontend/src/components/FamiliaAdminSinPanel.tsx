import { Card } from "./ui/Card";
import { Alert } from "./ui/Alert";

export function FamiliaAdminSinPanel() {
  return (
    <Card title="Acceso no disponible">
      <Alert variant="info" className="mb-0">
        <p className="mb-2">
          Las instituciones tipo <strong>familia</strong> no tienen panel de administración en TEA
          Link.
        </p>
        <p className="text-sm">
          Los perfiles los crean el <strong>colegio</strong> o el <strong>centro médico</strong>, que
          envían la invitación al apoderado. Use su cuenta con rol{" "}
          <strong>Familia / tutor</strong> para ver la bitácora, registrar observaciones públicas e
          invitar a otro apoderado del mismo perfil (hasta el límite permitido).
        </p>
      </Alert>
    </Card>
  );
}
