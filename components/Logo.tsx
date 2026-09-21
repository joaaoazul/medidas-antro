/**
 * Marca da app: o mesmo gesto do cartao do Peso no separador Hoje -- uma
 * linha ascendente com um ponto no fim, na cor da metrica que lidera a app.
 * Nao e um icone generico de medida; e a propria mini-linha da evolucao.
 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="var(--text-primary)" />
      <path
        d="M7.5 20.5l5-7 4 4 7-9.5"
        fill="none"
        stroke="#2a78d6"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="23.5"
        cy="8"
        r="2.6"
        fill="#2a78d6"
        stroke="var(--text-primary)"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function Logo({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span
        className="text-sm font-semibold tracking-tight"
        style={{ color: "var(--text-primary)" }}
      >
        Medidas
      </span>
    </span>
  );
}
