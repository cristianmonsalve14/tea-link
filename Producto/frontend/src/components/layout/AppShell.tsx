import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSignOutAlt } from "react-icons/fa";
import { clearSession, getUserName } from "../../utils/auth";
import { useRoleTheme } from "../../context/RoleThemeContext";
import { TeaLogo } from "../ui/TeaLogo";
import { cn } from "../../theme/cn";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  institucionNombre?: string | null;
  backTo?: string;
  backLabel?: string;
};

export function AppShell({
  children,
  title,
  subtitle,
  institucionNombre,
  backTo,
  backLabel = "Volver"
}: AppShellProps) {
  const navigate = useNavigate();
  const theme = useRoleTheme();

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  const displayTitle = title ?? theme.label;
  const displaySubtitle = subtitle ?? theme.subtitle;
  const userName = getUserName();

  return (
    <div className={cn("min-h-screen flex flex-col", theme.pageBg)}>
      <header className={cn("shadow-md", theme.headerBar, theme.headerText)}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("rounded-xl p-2 shadow-sm", theme.logoIcon)}>
              <TeaLogo size={32} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider opacity-90">
                TEA Link
              </p>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">
                {displayTitle}
              </h1>
              <p className="text-sm opacity-90">{displaySubtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
            {institucionNombre && (
              <span className="text-sm opacity-95 hidden md:inline">
                Institución:{" "}
                <strong className="font-semibold">{institucionNombre}</strong>
              </span>
            )}
            <div
              className={cn(
                "flex flex-col items-end text-right px-3 py-2 rounded-xl border border-white/25 bg-white/10 w-full sm:w-auto sm:min-w-[140px]"
              )}
            >
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full mb-1", theme.badge)}>
                {theme.label}
              </span>
              {userName ? (
                <span className="text-sm font-semibold leading-tight">{userName}</span>
              ) : (
                <span className="text-xs opacity-80">Sesión activa</span>
              )}
              {institucionNombre && (
                <span className="text-[10px] opacity-85 mt-1 md:hidden max-w-[180px] truncate">
                  {institucionNombre}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-sm font-semibold transition-colors w-full sm:w-auto"
            >
              <FaSignOutAlt />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {backTo && (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className={cn(
              "inline-flex items-center gap-2 text-sm font-semibold mb-5 px-3 py-1.5 rounded-lg transition-colors",
              theme.accentText,
              theme.accentBgSubtle,
              "hover:opacity-80 border",
              theme.accentBorder
            )}
          >
            <FaArrowLeft /> {backLabel}
          </button>
        )}
        {children}
      </main>

      <footer className="py-4 text-center text-xs text-neutral-gray-medium border-t border-gray-200/80 bg-neutral-white">
        TEA Link · Comunicación colaborativa para personas con TEA
      </footer>
    </div>
  );
}
