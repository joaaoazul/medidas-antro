import type { MetricId } from "./metrics";

/** Um registo diario. A data (YYYY-MM-DD) e a chave: um registo por dia. */
export type Entry = {
  date: string;
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
