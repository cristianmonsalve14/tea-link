import { useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import { clearSession, getUserName } from "../../utils/auth";
import { useRoleTheme } from "../../context/RoleThemeContext";
import { TeaLogo } from "../ui/TeaLogo";
import { cn } from "../../theme/cn";

export type NavItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
};

type SuperadminShellProps = {
  children: React.ReactNode;
  navItems: NavItem[];
  activeSection: string;
  onNavigate: (key: string) => void;
};

export function SuperadminShell({
  children,
  navItems,
  activeSection,
  onNavigate
}: SuperadminShellProps) {
  const navigate = useNavigate();
  const theme = useRoleTheme();
  const userName = getUserName();

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className={cn("min-h-screen flex", theme.pageBg)}>
      <aside
        className={cn(
          "w-64 min-h-screen shadow-xl rounded-r-2xl flex flex-col p-6 gap-2 border-r sticky top-0",
          theme.sidebarBg,
          theme.sidebarBorder
        )}
      >
        <div className="flex items-center gap-3 mb-10 select-none">
          <div className={cn("rounded-xl p-2.5 shadow-md", theme.logoIcon)}>
            <TeaLogo size={28} />
          </div>
          <div>
            <span className={cn("text-xl font-extrabold tracking-tight block", theme.accentTextStrong)}>
              TEA Link
            </span>
            <span className={cn("text-xs font-medium", theme.accentText)}>Superadmin</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate(key)}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-xl font-semibold transition-all duration-200 relative",
                activeSection === key ? theme.sidebarItemActive : theme.sidebarItemInactive
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r transition-opacity",
                  theme.sidebarIndicator,
                  activeSection === key ? "opacity-100" : "opacity-0"
                )}
              />
              <span
                className={cn(
                  "flex items-center justify-center rounded-full p-2 transition-colors",
                  activeSection === key
                    ? theme.sidebarIconWrapActive
                    : theme.sidebarIconWrapInactive
                )}
              >
                {icon}
              </span>
              <span className="text-base">{label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-100 space-y-3">
          {userName && (
            <div className={cn("px-3 py-2 rounded-xl", theme.accentBgSubtle)}>
              <p className={cn("text-[10px] font-medium uppercase tracking-wide", theme.accentText)}>
                {theme.label}
              </p>
              <p className={cn("text-sm font-semibold mt-0.5", theme.accentTextStrong)}>
                {userName}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors"
          >
            <span className="flex items-center justify-center rounded-full p-2 bg-red-100">
              <FaSignOutAlt size={18} />
            </span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 min-h-screen p-4 md:p-8 flex flex-col gap-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
