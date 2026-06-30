import { SuperadminPageHeader } from "../../components/superadmin/SuperadminPageHeader";
import { useSuperadminInstituciones } from "../../components/superadmin/SuperadminInstitucionesContext";
import { UsuariosAdminSection } from "../../components/UsuariosAdminSection";

export default function SuperadminUsuariosPage() {
  const { institucionesOperativas } = useSuperadminInstituciones();

  return (
    <>
      <SuperadminPageHeader
        title="Administradores institucionales"
        description="Cuentas con permisos de gestión de usuarios y perfiles dentro de cada institución."
      />
      <UsuariosAdminSection instituciones={institucionesOperativas} embedded />
    </>
  );
}
