import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";
import { cn } from "../../theme/cn";

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumb?: BreadcrumbItem[];
  className?: string;
};

export function SuperadminPageHeader({
  title,
  description,
  action,
  breadcrumb,
  className
}: Props) {
  return (
    <header className={cn("mb-6 md:mb-8", className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-3">
          {breadcrumb.map((item, i) => (
            <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <FaChevronRight className="opacity-40 shrink-0" size={10} aria-hidden />}
              {item.to ? (
                <Link to={item.to} className="hover:text-indigo-600 transition-colors font-medium">
                  {item.label}
                </Link>
              ) : (
                <span className="text-slate-700 font-semibold">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm sm:text-base text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0 w-full lg:w-auto">{action}</div>}
      </div>
    </header>
  );
}
