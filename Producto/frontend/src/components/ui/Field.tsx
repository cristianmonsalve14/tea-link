import { Label } from "./Label";

export function Field({
  label,
  required,
  hint,
  error,
  children
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label required={required}>{label}</Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-neutral-gray-medium mt-1">{hint}</p>
      )}
      {error && <p className="text-sm text-status-error mt-1">{error}</p>}
    </div>
  );
}
