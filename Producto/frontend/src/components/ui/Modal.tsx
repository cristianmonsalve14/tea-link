import { cn } from "../../theme/cn";
import { useRoleTheme } from "../../context/RoleThemeContext";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl"
};

export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  const theme = useRoleTheme();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={cn(
          "bg-neutral-white rounded-2xl shadow-2xl w-full flex flex-col",
          "max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)]",
          sizes[size]
        )}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="shrink-0 relative px-5 pt-5 pb-3 sm:px-6 sm:pt-6 border-b border-neutral-gray-light">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-neutral-gray-medium hover:text-status-error text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-gray-light"
            aria-label="Cerrar"
          >
            ×
          </button>
          <h3
            id="modal-title"
            className={cn("text-lg sm:text-xl font-bold pr-10", theme.accentText)}
          >
            {title}
          </h3>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 px-5 sm:px-6 py-4 flex gap-2 justify-end border-t border-neutral-gray-light bg-neutral-white rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
