// Logo do Reabrigo — duas curvas que se encontram no topo (mãos formando
// um arco / abrigo), com um coração ao centro. Lê como "comunidade
// abrigando comunidade".
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
      {/* Mão/arco esquerdo */}
      <path d="M4 24 C5 14, 11 8, 16 8" />
      {/* Mão/arco direito */}
      <path d="M28 24 C27 14, 21 8, 16 8" />
      {/* Coração no centro */}
      <path
        d="M12 17.5 C12 16, 13.5 15, 14.5 16 L16 17.5 L17.5 16 C18.5 15, 20 16, 20 17.5 C20 19, 16 22, 16 22 C16 22, 12 19, 12 17.5 Z"
        fill="currentColor"
        stroke="none"
      />
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
