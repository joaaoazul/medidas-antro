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
  { key: "mes", label: "Mês" },
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
export function niceScale(points: Point[], tickCount = 5): Scale {
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
  const step =
    (NICE_STEPS.find((s) => s * magnitude >= rawStep) ?? 10) * magnitude;

  /*
   * As marcas sao os multiplos do passo que caem DENTRO do dominio, e nao o
   * contrario: alargar o dominio ate ao multiplo seguinte, dos dois lados,
   * podia acrescentar quase um passo inteiro de vazio em cima e em baixo, e o
   * grafico passava metade da altura a desenhar nada.
   */
  const decimals = Math.max(0, -Math.floor(Math.log10(step))) + 2;
  const first = Math.ceil(min / step);
  const last = Math.floor(max / step);
  const ticks = Array.from({ length: Math.max(0, last - first + 1) }, (_, i) =>
    Number(((first + i) * step).toFixed(decimals)),
  );

  return { domain: [min, max], ticks };
}

export type TrendPoint = Point & { trend: number | null };

/**
 * Constante de tempo da media movel, em dias.
 *
 * Com 7, uma pesagem isolada move a tendencia cerca de 13% da sua distancia a
 * ela: o ruido de um dia mau nao desvia a linha, mas tres dias seguidos no
 * mesmo sentido ja a inclinam.
 */
const TREND_TAU_DAYS = 7;

/** Pontos a menos do que isto nao chegam para uma tendencia significar algo. */
export const MIN_TREND_POINTS = 6;

/**
 * Acrescenta a cada ponto a media movel exponencial da serie.
 *
 * Existe porque os artigos da propria app dizem que uma pesagem isolada conta
 * pouco, e ate aqui a unica resposta que a app dava a isso era agrupar por
 * semana -- que tira o ruido deitando fora a resolucao (90 pontos viram 13). A
 * media movel poe as duas leituras no mesmo grafico: os pontos continuam a ser
 * as medicoes reais, e a linha suave diz para onde elas vao.
 *
 * O peso de cada medicao depende do intervalo REAL ate a anterior, nao da sua
 * posicao na lista: `1 - exp(-dias/tau)`. E o que torna a linha honesta depois
 * de uma interrupcao -- ao fim de tres semanas sem medir, a medicao seguinte
 * nao e mais uma amostra a somar a uma tendencia velha, e praticamente o novo
 * ponto de partida. Com um peso fixo, a linha voltava com uma inclinacao
 * inventada nos dias em que ninguem se pesou.
 */
export function withTrend(points: Point[]): TrendPoint[] {
  const out: TrendPoint[] = [];
  let anterior: { t: number; trend: number } | null = null;

  for (const point of points) {
    if (point.value === null) {
      out.push({ ...point, trend: null });
      continue;
    }

    if (anterior === null) {
      anterior = { t: point.t, trend: point.value };
      out.push({ ...point, trend: point.value });
      continue;
    }

    const dias = Math.max(0, (point.t - anterior.t) / 86_400_000);
    const peso = 1 - Math.exp(-dias / TREND_TAU_DAYS);
    // A anotacao e necessaria: sem ela o TypeScript segue `anterior` ate a
    // atribuicao da iteracao seguinte e ve uma inferencia circular.
    const trend: number =
      anterior.trend + peso * (point.value - anterior.trend);
    anterior = { t: point.t, trend };
    out.push({ ...point, trend });
  }

  return out;
}

export type Ritmo = {
  /** Variacao por semana, na unidade da metrica. */
  porSemana: number;
  /** Quantas medicoes entraram na conta. */
  medicoes: number;
  /** Dias entre a primeira e a ultima medicao usadas. */
  dias: number;
  /** Qualidade do ajuste, 0 a 1. E o que separa uma tendencia de uma nuvem. */
  r2: number;
};

/** Abaixo disto a reta passa por tao poucos pontos que nao descreve nada. */
const RITMO_MIN_MEDICOES = 6;

/** E tem de as apanhar espalhadas: seis pesagens em tres dias nao sao um ritmo. */
const RITMO_MIN_DIAS = 14;

/**
 * Ajuste por minimos quadrados a uma janela fixa de dias.
 *
 * A pergunta do separador Evolucao e "o que mudou, e em que ritmo?", e a app
 * so respondia a primeira metade: a variacao face a uma medicao antiga depende
 * de duas leituras, e uma balanca pode mover-se um quilo num dia. Uma reta por
 * todas as medicoes da janela usa-as a todas, por isso um dia mau nao manda no
 * declive.
 *
 * O `r2` sai junto de proposito: uma reta e sempre possivel de calcular, mesmo
 * quando os pontos sao uma nuvem e ela nao descreve nada.
 */
function ajuste(
  entries: Entry[],
  metric: MetricId,
  janela: number,
): Ritmo | null {
  const latest = latestReading(entries, metric);
  if (!latest) return null;

  const desde = addDaysISO(latest.date, -(janela - 1));
  const amostras: { x: number; y: number }[] = [];

  for (const entry of entries) {
    if (entry.date < desde || entry.date > latest.date) continue;
    const value = entry.values[metric];
    if (value === null) continue;
    amostras.push({ x: daysBetween(desde, entry.date), y: value });
  }

  if (amostras.length < RITMO_MIN_MEDICOES) return null;

  const dias = amostras[amostras.length - 1].x - amostras[0].x;
  if (dias < RITMO_MIN_DIAS) return null;

  const n = amostras.length;
  const mediaX = amostras.reduce((s, p) => s + p.x, 0) / n;
  const mediaY = amostras.reduce((s, p) => s + p.y, 0) / n;

  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const { x, y } of amostras) {
    sxy += (x - mediaX) * (y - mediaY);
    sxx += (x - mediaX) ** 2;
    syy += (y - mediaY) ** 2;
  }

  // Todas as medicoes no mesmo dia, ou todas com o mesmo valor: nao ha declive
  // nenhum a tirar dali.
  if (sxx === 0 || syy === 0) return null;

  const declive = sxy / sxx;

  return {
    porSemana: declive * 7,
    medicoes: n,
    dias,
    r2: (sxy * sxy) / (sxx * syy),
  };
}

/**
 * Acima deste ajuste, a reta descreve mesmo os pontos e pode ser extrapolada.
 *
 * Extrapolar e uma afirmacao muito mais forte do que descrever, e merece uma
 * guarda mais forte: uma reta atraves de uma nuvem tem sempre um declive, e
 * multiplica-lo por meses da uma data com ar de facto.
 */
const RITMO_R2_MINIMO = 0.5;

/**
 * Janelas tentadas, da mais curta para a mais longa.
 *
 * Medido no conjunto de exemplo (240 dias), o declive e quase o mesmo em todas
 * -- entre -0,22 e -0,27 kg por semana -- mas o ajuste sobe de 0,33 a 28 dias
 * para 0,83 a 90. Ou seja: a tendencia esta la desde o inicio, e o que falta
 * numa janela curta nao e sinal, e tempo para o sinal vencer o ruido da
 * balanca. Por isso preferimos sempre a janela mais curta -- e a mais recente,
 * e a que reage primeiro a uma mudanca -- e so alargamos quando ela nao chega
 * para sustentar o que dizemos.
 */
const RITMO_JANELAS = [28, 42, 56, 90];

/**
 * Ritmo de variacao, na janela mais curta que o consiga sustentar.
 *
 * Devolve tambem a janela que acabou por usar, para a interface dizer "nas
 * ultimas 4 semanas" ou "nas ultimas 13" em vez de um periodo inventado.
 * Quando nenhuma janela chega ao ajuste minimo, devolve a mais curta que seja
 * valida: o ritmo continua a poder ser descrito, e e a `projecao` que recusa
 * extrapola-lo.
 */
export function ritmo(entries: Entry[], metric: MetricId): Ritmo | null {
  let primeiro: Ritmo | null = null;

  for (const janela of RITMO_JANELAS) {
    const r = ajuste(entries, metric, janela);
    if (!r) continue;
    if (r.r2 >= RITMO_R2_MINIMO) return r;
    primeiro ??= r;
  }

  return primeiro;
}

/** Mais longe do que isto, a projecao diz mais sobre a reta do que sobre a pessoa. */
const PROJECAO_DIAS_MAXIMO = 365;

/**
 * Quando e que o objetivo e alcancado, ao ritmo atual -- ou null quando nao ha
 * projecao honesta a fazer.
 *
 * Devolve null se o ajuste for fraco, se o ritmo apontar ao contrario do
 * objetivo, ou se a data cair para la do horizonte: nos tres casos o numero
 * existiria, e nos tres seria ficcao com ar de previsao.
 */
export function projecao(
  ritmo: Ritmo,
  atual: number,
  objetivo: number,
): { data: string; dias: number } | null {
  if (ritmo.r2 < RITMO_R2_MINIMO) return null;

  const falta = objetivo - atual;
  if (falta === 0) return null;
  // Sinais diferentes: esta a afastar-se do objetivo, e a "previsao" seria uma
  // data no passado.
  if (Math.sign(falta) !== Math.sign(ritmo.porSemana)) return null;

  const dias = Math.round((falta / ritmo.porSemana) * 7);
  if (dias <= 0 || dias > PROJECAO_DIAS_MAXIMO) return null;

  return { data: addDaysISO(todayISO(), dias), dias };
}

/**
 * Notas das medicoes, agrupadas pelo balde em que caem.
 *
 * As notas ja existiam por medicao, mas so se viam no historico -- e sao
 * precisamente o que explica um degrau na linha ("comecei creatina", "ferias",
 * "doente"). Trazidas para o grafico, transformam-no de "o que aconteceu" em
 * "porque aconteceu".
 *
 * Varias notas podem cair no mesmo balde quando se agrupa por semana ou mes;
 * sao guardadas todas, pela mesma razao que a media diz de quantas medicoes e
 * feita: quem le tem direito a saber o que esta ali dentro.
 */
export function notasPorBalde(
  entries: Entry[],
  granularity: Granularity,
): Map<string, string[]> {
  const notas = new Map<string, string[]>();

  for (const entry of entries) {
    if (!entry.nota) continue;
    const key = bucketOf(entry.date, granularity);
    const lista = notas.get(key) ?? [];
    lista.push(entry.nota);
    notas.set(key, lista);
  }

  return notas;
}
