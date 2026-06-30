import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SuperadminShell } from "../layout/SuperadminShell";
import { SuperadminInstitucionesProvider } from "./SuperadminInstitucionesContext";
import { SUPERADMIN_NAV, resolveSuperadminNavKey } from "./nav";

export function SuperadminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeKey = resolveSuperadminNavKey(pathname);

  const navItems = SUPERADMIN_NAV.map(item => ({
    key: item.key,
    label: item.label,
    icon: <item.icon size={18} />
  }));

  return (
    <SuperadminInstitucionesProvider>
      <SuperadminShell
        navItems={navItems}
        activeSection={activeKey}
        onNavigate={key => {
          const target = SUPERADMIN_NAV.find(n => n.key === key);
          if (target) navigate(target.path);
        }}
      >
        <Outlet />
      </SuperadminShell>
    </SuperadminInstitucionesProvider>
  );
}
