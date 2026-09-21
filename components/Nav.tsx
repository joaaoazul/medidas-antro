"use client";

import Link from "next/link";

export type Tab = "hoje" | "evolucao" | "historico";

export const TABS: { key: Tab; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "evolucao", label: "Evolução" },
  { key: "historico", label: "Histórico" },
];

function Icon({ tab }: { tab: Tab }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (tab === "hoje") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M12 11v6M9 14h6" />
      </svg>
    );
  }
  if (tab === "evolucao") {
    return (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M7 15l4-5 3 3 4-6" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  );
}

function ArtigosIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 5.5c2-1 5-1 8 0v14c-3-1-6-1-8 0z" />
      <path d="M20 5.5c-2-1-5-1-8 0v14c3-1 6-1 8 0z" />
    </svg>
  );
}

/**
 * Separadores em barra fixa no fundo, so no ecra pequeno.
 *
 * O fundo do ecra e onde o polegar chega sem trocar a mao de posicao; um menu
 * no topo obriga a agarrar o telemovel de outra maneira so para mudar de vista.
 * No ecra grande a barra desaparece e os separadores vivem no cabecalho, onde
 * o rato ja esta.
 */
export function BottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav
      aria-label="Secções"
      className="fixed inset-x-0 bottom-0 z-20 border-t sm:hidden"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="flex">
        {TABS.map((tab) => {
          const on = tab.key === active;
          return (
            <li key={tab.key} className="flex-1">
              <button
                type="button"
                aria-current={on ? "page" : undefined}
                onClick={() => onChange(tab.key)}
                className="flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
                style={{
                  color: on ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                <Icon tab={tab.key} />
                {tab.label}
              </button>
            </li>
          );
        })}
        <li className="flex-1">
          <Link
            href="/artigos"
            className="flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            <ArtigosIcon />
            Aprender
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export function TopTabs({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav aria-label="Secções" className="hidden sm:block">
      <ul
        className="flex rounded-xl border p-1"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
      >
        {TABS.map((tab) => {
          const on = tab.key === active;
          return (
            <li key={tab.key}>
              <button
                type="button"
                aria-current={on ? "page" : undefined}
                onClick={() => onChange(tab.key)}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium"
                style={{
                  background: on ? "var(--selected)" : "transparent",
                  color: on ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                <Icon tab={tab.key} />
                {tab.label}
              </button>
            </li>
          );
        })}
        <li>
          <Link
            href="/artigos"
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            <ArtigosIcon />
            Aprender
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export function ThemeButton({
  mode,
  onToggle,
}: {
  mode: "light" | "dark";
  onToggle: () => void;
}) {
  const dark = mode === "dark";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      className="flex h-11 w-11 items-center justify-center rounded-xl border"
      style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
          </>
        ) : (
          <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />
        )}
      </svg>
    </button>
  );
}

/**
 * Atalho para as definicoes, no cabecalho.
 *
 * Uma ligacao e nao um quarto separador: as definicoes visitam-se de vez em
 * quando, e um separador fixo no fundo e espaco tirado as tres vistas que se
 * usam todos os dias.
 */
export function SettingsLink() {
  return (
    <Link
      href="/conta"
      aria-label="Definições da conta"
      title="Definições da conta"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
      style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V10a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    </Link>
  );
}
