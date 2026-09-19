"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Mode = "light" | "dark";

const STORAGE_KEY = "medidas-theme";

/**
 * O tema nao e estado do React: vive no dataset do <html> (escrito antes da
 * primeira pintura, para nao haver flash) e na preferencia do sistema. Por isso
 * e lido com useSyncExternalStore, que e o mecanismo proprio para uma fonte
 * externa -- e que trata do snapshot do servidor sem provocar um render em
 * cascata dentro de um efeito.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  return () => {
    listeners.delete(onChange);
    mq.removeEventListener("change", onChange);
  };
}

function getSnapshot(): Mode {
  const stamped = document.documentElement.dataset.theme;
  if (stamped === "dark" || stamped === "light") return stamped;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// O servidor nao conhece a preferencia de quem vai ler; "light" mantem o HTML
// do servidor e o primeiro render do cliente iguais, e o valor real entra logo
// a seguir a hidratacao.
const getServerSnapshot = (): Mode => "light";

const subscribeToNothing = () => () => {};
const onClient = () => true;
const onServer = () => false;

export function useTheme(): { mode: Mode; toggle: () => void; mounted: boolean } {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Os graficos so medem depois de existir DOM; este sinal adia-os ate la.
  const mounted = useSyncExternalStore(subscribeToNothing, onClient, onServer);

  const toggle = useCallback(() => {
    const next: Mode = getSnapshot() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Modo privado ou armazenamento bloqueado: o tema vale so esta sessao.
    }
    for (const listener of listeners) listener();
  }, []);

  return { mode, toggle, mounted };
}

/** Cromado do grafico em hex, para as props SVG do Recharts. */
export const CHROME = {
  light: {
    surface: "#fcfcfb",
    grid: "#e1e0d9",
    axis: "#c3c2b7",
    muted: "#898781",
    ink: "#0b0b0b",
    inkSecondary: "#52514e",
  },
  dark: {
    surface: "#1a1a19",
    grid: "#2c2c2a",
    axis: "#383835",
    muted: "#898781",
    ink: "#ffffff",
    inkSecondary: "#c3c2b7",
  },
} as const;
