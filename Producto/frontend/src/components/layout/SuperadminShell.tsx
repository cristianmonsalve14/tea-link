import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaSignOutAlt, FaTimes } from "react-icons/fa";
import { clearSession, getUserName } from "../../utils/auth";
import { TeaLogo } from "../ui/TeaLogo";
import { cn } from "../../theme/cn";
import { SUPERADMIN_NAV } from "../superadmin/nav";

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
  const userName = getUserName();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeMeta = SUPERADMIN_NAV.find(item => item.key === activeSection);

  const handleNavigate = (key: string) => {
    onNavigate(key);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const sidebarNav = (
    <>
      <div className="flex items-center justify-between gap-3 mb-8 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-xl p-2.5 bg-white/10 ring-1 ring-white/15 shrink-0 shadow-lg">
            <TeaLogo size={26} className="text-white" />
          </div>
          <div className="min-w-0">
            <span className="text-lg font-bold tracking-tight text-white block truncate">
              TEA Link
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300/90">
              Command Center
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="md:hidden shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-white/10"
          aria-label="Cerrar menú"
        >
          <FaTimes size={18} />
        </button>
      </div>

      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto overscroll-contain">
        {navItems.map(({ key, label, icon }) => {
          const meta = SUPERADMIN_NAV.find(n => n.key === key);
          const active = activeSection === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleNavigate(key)}
              className={cn(
                "group flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200",
                active
                  ? "bg-white/12 text-white shadow-lg ring-1 ring-white/10"
                  : "text-slate-400 hover:bg-white/6 hover:text-slate-100"
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center rounded-lg p-2 shrink-0 transition-colors mt-0.5",
                  active
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-900/40"
                    : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white"
                )}
              >
                {icon}
              </span>
              <span className="min-w-0">
                <span className="text-sm font-semibold block truncate">{label}</span>
                {meta?.description && (
                  <span
                    className={cn(
                      "text-[10px] leading-snug mt-0.5 block line-clamp-2",
                      active ? "text-indigo-200/80" : "text-slate-500 group-hover:text-slate-400"
                    )}
                  >
                    {meta.description}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/10 space-y-3 shrink-0">
        {userName && (
          <div className="px-3 py-3 rounded-xl bg-white/5 ring-1 ring-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/80">
              Sesión activa
            </p>
            <p className="text-sm font-semibold mt-1 truncate text-white">{userName}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Superadministrador</p>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-300 font-medium hover:bg-red-500/10 hover:text-red-200 transition-colors"
        >
          <span className="flex items-center justify-center rounded-lg p-2 bg-red-500/10 shrink-0">
            <FaSignOutAlt size={16} />
          </span>
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh flex flex-col md:flex-row bg-slate-100">
      <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900 text-white shadow-lg">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10"
          aria-label="Abrir menú de navegación"
        >
          <FaBars size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
            TEA Link · Superadmin
          </p>
          <p className="text-sm font-bold truncate">{activeMeta?.label ?? "Panel"}</p>
        </div>
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden"
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-50 md:z-auto h-dvh md:min-h-dvh",
          "w-[min(100vw-2rem,18rem)] md:w-72",
          "flex flex-col p-5 md:p-6",
          "bg-linear-to-b from-slate-900 via-slate-900 to-indigo-950",
          "border-r border-white/5 shadow-2xl",
          "transition-transform duration-200 ease-out md:translate-x-0",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full pointer-events-none md:pointer-events-auto"
        )}
      >
        {sidebarNav}
      </aside>

      <main className="flex-1 min-w-0 w-full flex flex-col overflow-x-hidden">
        <div className="hidden md:block border-b border-slate-200/80 bg-white/70 backdrop-blur-md px-6 lg:px-10 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">
            Plataforma TEA Link
          </p>
          <p className="text-sm font-semibold text-slate-800 mt-0.5">
            {activeMeta?.label ?? "Panel de control"}
          </p>
        </div>
        <div className="flex-1 p-4 sm:p-6 lg:p-10 bg-linear-to-br from-slate-50 via-white to-indigo-50/30">
          <div className="max-w-[1400px] mx-auto w-full">{children}</div>
        </div>
      </main>
    </div>
  );
}
