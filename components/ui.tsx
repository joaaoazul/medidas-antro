"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Pecas partilhadas do desenho.
 *
 * Tudo aqui e pensado primeiro para o ecra pequeno: e no telemovel que se
 * regista uma pesagem, de manha, com uma mao. O ecra grande e a adaptacao, nao
 * o contrario.
 */

/**
 * Desvanece o fim de uma tira que desliza na horizontal, so enquanto houver
 * mais para ver -- desaparece ao chegar ao fim do scroll. Sem isto, uma tira
 * cortada pela borda do cartao parece um erro de layout, nao um convite a
 * deslizar.
 */
function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [canScrollMore, setCanScrollMore] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setCanScrollMore(el.scrollWidth - el.scrollLeft - el.clientWidth > 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  const style = canScrollMore
    ? {
        maskImage: "linear-gradient(to right, black calc(100% - 28px), transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, black calc(100% - 28px), transparent 100%)",
      }
    : undefined;

  return { ref, style };
}

export function Card({
  children,
  className = "",
  as: Tag = "section",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "figure";
}) {
  return (
    <Tag
      className={`rounded-2xl border ${className}`}
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
    >
      {children}
    </Tag>
  );
}

export function SectionTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-3">
      <h2
        className="text-base font-medium"
        style={{ color: "var(--text-primary)" }}
      >
        {children}
      </h2>
      {hint ? (
        <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Tira de opcoes que desliza na horizontal.
 *
 * Num ecra de 390px, oito metricas em botoes quebrariam para quatro linhas e
 * empurrariam o grafico para fora do ecra. Deslizar mantem os filtros numa
 * linha e o conteudo onde estava.
 */
export function ChipRow({
  label,
  inline = false,
  wrap = false,
  children,
}: {
  label: string;
  /** Rotulo a esquerda das fichas em vez de por cima, quando o espaco vertical
      e o recurso escasso -- que num telemovel e sempre. */
  inline?: boolean;
  /** Quebra para varias linhas em vez de deslizar. Para tiras curtas o
      suficiente para nao empurrarem o resto do ecra -- ver o Métrica/Métricas
      no separador Evolução, onde ver as oito de uma vez vale mais do que a
      linha extra que ocupam. */
  wrap?: boolean;
  children: React.ReactNode;
}) {
  const { ref, style } = useScrollFade<HTMLDivElement>();

  if (wrap) {
    return (
      <div>
        <span
          className="mb-1.5 block text-xs font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </span>
        <div role="group" aria-label={label} className="flex flex-wrap gap-2">
          {children}
        </div>
      </div>
    );
  }

  if (inline) {
    return (
      <div
        ref={ref}
        role="group"
        aria-label={label}
        className="scroll-x -mx-4 flex items-center gap-2 px-4 sm:mx-0 sm:flex-wrap sm:px-0"
        style={style}
      >
        <span
          className="shrink-0 text-xs font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </span>
        {children}
      </div>
    );
  }

  return (
    <div>
      <span
        className="mb-1.5 block text-xs font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
      <div
        ref={ref}
        role="group"
        aria-label={label}
        className="scroll-x -mx-4 flex gap-2 px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
        style={style}
      >
        {children}
      </div>
    </div>
  );
}

export function Chip({
  selected,
  onClick,
  children,
  swatch,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  /** Cor da metrica, quando a opcao representa uma serie. */
  swatch?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="touch flex shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors"
      style={{
        borderColor: selected ? "transparent" : "var(--border)",
        background: selected ? "var(--selected)" : "transparent",
        color: selected ? "var(--text-primary)" : "var(--text-secondary)",
      }}
    >
      {swatch ? (
        // A cor pertence a metrica, nao a ordem em que aparece: ligar e
        // desligar series nunca repinta as que ficam.
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: 999,
            background: swatch,
            opacity: selected ? 1 : 0.45,
          }}
        />
      ) : null}
      {children}
    </button>
  );
}

/**
 * Comutador de duas opcoes, largura total.
 *
 * Duas vistas que se excluem nao sao um filtro: sao um sitio onde se esta. Um
 * comutador diz isso melhor do que duas fichas soltas no meio das outras, e num
 * telemovel uma barra inteira e muito mais facil de acertar.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex rounded-xl border p-1"
      style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
    >
      {options.map((option) => {
        const on = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(option.key)}
            className="touch flex-1 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: on ? "var(--selected)" : "transparent",
              color: on ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Botao de abrir/fechar uma seccao, com a seta a dizer para onde vai. */
export function Disclosure({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="touch flex w-full items-center justify-between rounded-xl border px-3.5 text-sm font-medium"
      style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
    >
      {children}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        style={{ transform: open ? "rotate(180deg)" : undefined }}
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  );
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "secondary",
  disabled,
  full,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
  disabled?: boolean;
  full?: boolean;
}) {
  const primary = variant === "primary";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`touch rounded-xl px-4 text-sm font-medium transition-opacity disabled:opacity-55 ${
        full ? "w-full" : ""
      } ${primary ? "" : "border"}`}
      style={
        primary
          ? { background: "var(--text-primary)", color: "var(--surface-1)" }
          : { borderColor: "var(--border)", color: "var(--text-secondary)" }
      }
    >
      {children}
    </button>
  );
}
