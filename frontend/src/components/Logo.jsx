export function Logo({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 22 L16 8 L28 22" />
      <path d="M9 22 V18" />
      <path d="M23 22 V18" />
      <path d="M16 8 L16 14" opacity="0.4" />
    </svg>
  )
}

export function LogoMark({ size = 40, className = "" }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ${className}`}
      style={{ width: size, height: size }}
    >
      <Logo size={Math.round(size * 0.6)} />
    </span>
  )
}
