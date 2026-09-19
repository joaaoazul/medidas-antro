import type { MetricId } from "./metrics";

/**
 * Uma medicao.
 *
 * A data e um dia de calendario (YYYY-MM-DD) e a hora e opcional e separada.
 * Podem existir varias medicoes no mesmo dia -- pesar-se de manha e a noite e o
 * caso normal, nao uma excecao.
 */
export type Entry = {
  /** Chave propria: a data deixou de ser unica. */
  id: string;
  date: string;
  /** "HH:MM", ou null para quem nao quer registar a hora. */
  hora: string | null;
  values: Record<MetricId, number | null>;
  nota: string | null;
  updatedAt: string;
};

/** Ponto de uma serie temporal ja agregada. */
export type Point = {
  /** Rotulo do balde: YYYY-MM-DD (dia), YYYY-MM-DD da 2a feira (semana) ou YYYY-MM (mes). */
  bucket: string;
  /** Milissegundos do inicio do balde, usado como eixo X numerico. */
  t: number;
  value: number | null;
  /** Quantas medicoes entraram na media deste balde. */
  samples: number;
};

export type Granularity = "dia" | "semana" | "mes";

export type RangeKey = "30d" | "90d" | "365d" | "tudo";
