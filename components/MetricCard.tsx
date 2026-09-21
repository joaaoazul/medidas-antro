"use client";

import { longLabel } from "@/lib/dates";
import { formatValue, type Metric } from "@/lib/metrics";
import type { Delta, Reading } from "@/lib/series";
import type { Point } from "@/lib/types";
import { CHROME, useTheme } from "./theme";
import { Card } from "./ui";

/** Faixa final da serie desenhada na mini-linha do cartao. */
const SPARK_POINTS = 14;

function Sparkline({
  points,
  color,
  width,
  height,
}: {
  points: Point[];
  color: string;
  width: number;
  height: number;
}) {
  const values = points
    .slice(-SPARK_POINTS)
    .map((p) => p.value)
    .filter((v): v is number => v !== null);

  if (values.length < 2) return null;

  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const coords = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const d = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`)
    .join(" ");
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      className="shrink-0"
    >
      {/* O traco recua; so o ponto atual leva a cor cheia. */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeOpacity={0.4}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill={color} />
    </svg>
  );
}

/**
 * A variacao fica em tinta neutra, com seta e sinal.
 *
 * Nao a pintamos de verde ou vermelho porque a app nao sabe o objetivo de quem
 * a usa: descer 2 kg pode ser a meta ou o alarme. A direcao esta na seta e no
 * sinal; a cor nao emite um juizo que nos nao podemos fazer.
 */
function DeltaLine({ metric, delta }: { metric: Metric; delta: Delta | null }) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];

  if (!delta) {
    return (
      <span className="text-xs" style={{ color: chrome.muted }}>
        Sem comparação
      </span>
    );
  }

  const arrow = delta.change > 0 ? "↑" : delta.change < 0 ? "↓" : "→";

  return (
    <span className="tabular text-xs" style={{ color: chrome.muted }}>
      <span aria-hidden>{arrow}</span> {delta.change > 0 ? "+" : ""}
      {formatValue(metric.id, delta.change)} {metric.unit} em {delta.spanDays}{" "}
      {delta.spanDays === 1 ? "dia" : "dias"}
    </span>
  );
}

/**
 * Distancia ao objetivo, na mesma tinta neutra do DeltaLine e pela mesma
 * razao: a seta diz para que lado fica o numero que a propria pessoa
 * escolheu, nao se chegar la e bom ou mau.
 */
function ObjetivoLine({
  metric,
  reading,
  objetivo,
}: {
  metric: Metric;
  reading: Reading | null;
  objetivo: number;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];

  if (!reading) return null;

  const diferenca = reading.value - objetivo;
  if (Math.abs(diferenca) < 0.05) {
    return (
      <span className="text-xs" style={{ color: chrome.muted }}>
        Objetivo atingido
      </span>
    );
  }

  const arrow = diferenca > 0 ? "↓" : "↑";

  return (
    <span className="tabular text-xs" style={{ color: chrome.muted }}>
      <span aria-hidden>{arrow}</span> {formatValue(metric.id, Math.abs(diferenca))}{" "}
      {metric.unit} até ao objetivo ({formatValue(metric.id, objetivo)} {metric.unit})
    </span>
  );
}

/**
 * Numeros em figuras tabulares, inclusive o grande.
 *
 * A regra geral manda figuras proporcionais num valor grande isolado, porque a
 * tabular da a cada digito a largura de um zero e o numero fica frouxo. Na
 * Outfit a conta inverte-se: medido no browser, "111" ocupa 42px contra 81px de
 * "000" -- o algarismo 1 e quase metade dos outros. Com um valor que muda a
 * cada pesagem, as figuras proporcionais fariam o numero encolher e crescer
 * sozinho e os cartoes ao lado dancariam com ele.
 */
export function HeroCard({
  metric,
  reading,
  delta,
  points,
  objetivo,
}: {
  metric: Metric;
  reading: Reading | null;
  delta: Delta | null;
  points: Point[];
  /** Peso pretendido, do perfil. So faz sentido quando a metrica heroi e o peso. */
  objetivo?: number | null;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const color = metric.color[mode];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: 999,
            background: color,
          }}
        />
        <span className="text-sm" style={{ color: chrome.inkSecondary }}>
          {metric.label}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span
            className="tabular text-6xl leading-none font-semibold"
            style={{ color: chrome.ink }}
          >
            {formatValue(metric.id, reading?.value ?? null)}
          </span>
          <span className="text-lg" style={{ color: chrome.inkSecondary }}>
            {metric.unit}
          </span>
        </div>
        <Sparkline points={points} color={color} width={96} height={34} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <DeltaLine metric={metric} delta={delta} />
        {reading ? (
          <span className="text-xs" style={{ color: chrome.muted }}>
            &middot; {longLabel(reading.date)}
          </span>
        ) : null}
      </div>

      {objetivo ? (
        <div className="mt-1.5">
          <ObjetivoLine metric={metric} reading={reading} objetivo={objetivo} />
        </div>
      ) : null}
    </Card>
  );
}

export function MetricCard({
  metric,
  reading,
  delta,
  points,
}: {
  metric: Metric;
  reading: Reading | null;
  delta: Delta | null;
  points: Point[];
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const color = metric.color[mode];

  return (
    <Card className="p-4" as="div">
      <div className="flex items-center gap-1.5">
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 7,
            height: 7,
            borderRadius: 999,
            background: color,
          }}
        />
        <span
          className="truncate text-xs"
          style={{ color: chrome.inkSecondary }}
          title={metric.label}
        >
          {metric.short}
        </span>
      </div>

      <div className="mt-1.5 flex items-end justify-between gap-2">
        <span className="flex items-baseline gap-1">
          <span
            className="tabular text-2xl leading-none font-semibold"
            style={{ color: chrome.ink }}
          >
            {formatValue(metric.id, reading?.value ?? null)}
          </span>
          <span className="text-xs" style={{ color: chrome.inkSecondary }}>
            {metric.unit}
          </span>
        </span>
        <Sparkline points={points} color={color} width={46} height={20} />
      </div>

      <div className="mt-1.5">
        <DeltaLine metric={metric} delta={delta} />
      </div>
    </Card>
  );
}
