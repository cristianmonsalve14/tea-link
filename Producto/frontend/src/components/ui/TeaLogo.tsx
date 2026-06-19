/** Icono puzzle TEA Link — colores accesibles y calmados */
export function TeaLogo({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="10" y="10" width="60" height="60" rx="18" fill="#4A90E2" />
      <circle cx="40" cy="10" r="10" fill="#7ED321" />
      <circle cx="70" cy="40" r="10" fill="#6AA8F0" />
      <circle cx="40" cy="70" r="10" fill="#F5A623" />
      <circle cx="10" cy="40" r="10" fill="#96E03F" />
    </svg>
  );
}
