import {
  addDaysISO,
  daysBetween,
  isoToMs,
  monthKey,
  todayISO,
  weekStartISO,
} from "./dates";
import type { MetricId } from "./metrics";
import type { Entry, Granularity, Point, RangeKey } from "./types";

export const RANGES: { key: RangeKey; label: string; days: number | null }[] = [
  { key: "30d", label: "30 dias", days: 30 },
  { key: "90d", label: "90 dias", days: 90 },
  { key: "365d", label: "1 ano", days: 365 },
  { key: "tudo", label: "Tudo", days: null },
];

export const GRANULARITIES: { key: Granularity; label: string }[] = [
  { key: "dia", label: "Dia" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" },
];

/** Recorta os registos ao intervalo escolhido (inclusivo nas duas pontas). */
export function filterByRange(entries: Entry[], range: RangeKey): Entry[] {
  const spec = RANGES.find((r) => r.key === range);
  if (!spec || spec.days === null) return entries;
  const from = addDaysISO(todayISO(), -(spec.days - 1));
  return entries.filter((e) => e.date >= from);
}

function bucketOf(date: string, granularity: Granularity): string {
  if (granularity === "semana") return weekStartISO(date);
  if (granularity === "mes") return monthKey(date);
  return date;
}

function bucketStartMs(bucket: string): number {
  return isoToMs(bucket.length === 7 ? `${bucket}-01` : bucket);
}

/**
 * Serie de uma metrica. Semana e mes agregam pela MEDIA das medicoes existentes
 * -- pesar-se tres vezes numa semana nao pesa mais nessa semana do que pesar-se
 * uma. Baldes sem qualquer medicao nao sao inventados: nao existem na serie, e
 * a linha atravessa o buraco (connectNulls) em vez de fingir um valor.
 */
export function buildSeries(
  entries: Entry[],
  metric: MetricId,
  granularity: Granularity,
): Point[] {
  const buckets = new Map<string, { sum: number; samples: number }>();

  for (const entry of entries) {
    const value = entry.values[metric];
    if (value === null) continue;
    const key = bucketOf(entry.date, granularity);
    const acc = buckets.get(key) ?? { sum: 0, samples: 0 };
    acc.sum += value;
    acc.samples += 1;
    buckets.set(key, acc);
  }

  return [...buckets.entries()]
    .map(([bucket, acc]) => ({
      bucket,
      t: bucketStartMs(bucket),
      value: acc.sum / acc.samples,
      samples: acc.samples,
    }))
    .sort((a, b) => a.t - b.t);
}

export type Reading = { date: string; value: number };

/** Ultima medicao registada de uma metrica. */
export function latestReading(
  entries: Entry[],
  metric: MetricId,
): Reading | null {
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const value = entries[i].values[metric];
    if (value !== null) return { date: entries[i].date, value };
  }
  return null;
}

export type Delta = {
  /** Diferenca na unidade da metrica (atual menos anterior). */
  change: number;
  /** Data da medicao usada como referencia. */
  fromDate: string;
  /** Distancia real em dias -- raramente e exatamente a pedida. */
  spanDays: number;
};

/**
 * Variacao face a medicao mais proxima de ha `days` dias.
 *
 * Como ninguem se pesa em dias exatos, procuramos a medicao mais proxima do
 * alvo e aceitamo-la dentro de uma tolerancia proporcional. Devolvemos tambem
 * a distancia real para que a interface diga "ha 9 dias" em vez de mentir "7".
 */
export function deltaOver(
  entries: Entry[],
  metric: MetricId,
  days: number,
): Delta | null {
  const latest = latestReading(entries, metric);
  if (!latest) return null;

  const target = addDaysISO(latest.date, -days);
  const tolerance = Math.max(3, Math.round(days * 0.4));

  let best: Reading | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const entry of entries) {
    if (entry.date >= latest.date) continue;
    const value = entry.values[metric];
    if (value === null) continue;
    const distance = Math.abs(daysBetween(target, entry.date));
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { date: entry.date, value };
    }
  }

  if (!best || bestDistance > tolerance) return null;

  return {
    change: latest.value - best.value,
    fromDate: best.date,
    spanDays: daysBetween(best.date, latest.date),
  };
}

export type RelativeRow = { t: number; bucket: string } & Partial<
  Record<MetricId, number>
>;

/**
 * Linhas para o grafico comparativo: cada metrica indexada em % face ao seu
 * primeiro valor do intervalo.
 *
 * Isto existe porque peso (kg), perimetro (cm) e gordura (%) nao partilham
 * escala. Um segundo eixo Y resolveria a aparencia e estragaria a leitura -- as
 * duas escalas podem ser esticadas ate qualquer cruzamento parecer um facto.
 * Indexar tudo a uma base comum poe as series num unico eixo honesto.
 */
export function buildRelativeRows(
  entries: Entry[],
  metrics: MetricId[],
  granularity: Granularity,
): RelativeRow[] {
  const rows = new Map<string, RelativeRow>();

  for (const metric of metrics) {
    const series = buildSeries(entries, metric, granularity);
    const base = series.find((p) => p.value !== null && p.value !== 0)?.value;
    if (base === undefined || base === null) continue;

    for (const point of series) {
      if (point.value === null) continue;
      const row = rows.get(point.bucket) ?? {
        t: point.t,
        bucket: point.bucket,
      };
      row[metric] = ((point.value - base) / base) * 100;
      rows.set(point.bucket, row);
    }
  }

  return [...rows.values()].sort((a, b) => a.t - b.t);
}

export type Scale = { domain: [number, number]; ticks: number[] };

/** Passos "redondos" aceitaveis para um intervalo entre marcas. */
const NICE_STEPS = [1, 2, 2.5, 5, 10];

/**
 * Escala Y com folga de 8% em cada ponta e marcas em numeros redondos.
 *
 * Duas decisoes com consequencias na leitura:
 *
 * A folga. Series antropometricas variam pouco em termos relativos. Com o eixo
 * a comecar em zero, um ano de trabalho vira uma linha reta; colado aos
 * extremos, o ruido de uma balanca vira um penhasco. A folga fixa e o meio
 * termo -- e e a mesma em todos os graficos, por isso nao distorce a comparacao
 * entre eles.
 *
 * As marcas redondas. Sao elas que carregam os valores que nao rotulamos
 * diretamente, e "80 / 82 / 84" le-se de relance como "80,3 / 82,3 / 84,3"
 * nunca se lera. O dominio e alargado ate ao multiplo do passo, nunca
 * encolhido: arredondar para dentro cortaria pontos reais.
 */
export function niceScale(points: Point[], tickCount = 4): Scale {
  const values = points
    .map((p) => p.value)
    .filter((v): v is number => v !== null);

  if (values.length === 0) return { domain: [0, 1], ticks: [0, 1] };

  let min = Math.min(...values);
  let max = Math.max(...values);

  if (min === max) {
    min -= 1;
    max += 1;
  }

  const padding = (max - min) * 0.08;
  min -= padding;
  max += padding;

  const rawStep = (max - min) / Math.max(1, tickCount - 1);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  // rawStep / magnitude fica sempre em [1, 10), por isso o 10 final garante
  // que ha sempre um passo escolhido.
  const step = (NICE_STEPS.find((s) => s * magnitude >= rawStep) ?? 10) * magnitude;

  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;

  // Somar o passo repetidamente acumula erro binario (0.1 + 0.2 ...), por isso
  // cada marca e calculada a partir do indice e arredondada ao passo.
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  const count = Math.round((hi - lo) / step);
  const ticks = Array.from({ length: count + 1 }, (_, i) =>
    Number((lo + i * step).toFixed(decimals + 2)),
  );

  return { domain: [ticks[0], ticks[ticks.length - 1]], ticks };
}
