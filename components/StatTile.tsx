"use client";

import { formatValue, type Metric } from "@/lib/metrics";
import type { Delta } from "@/lib/series";
import type { Point } from "@/lib/types";
import { CHROME, useTheme } from "./theme";

/** Faixa final da serie desenhada na mini-linha do cartao. */
const SPARK_POINTS = 12;

function Sparkline({ points, color }: { points: Point[]; color: string }) {
  const values = points
    .slice(-SPARK_POINTS)
    .map((p) => p.value)
    .filter((v): v is number => v !== null);

  if (values.length < 2) return null;

  const width = 72;
  const height = 24;
  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const coords = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const d = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
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
        strokeOpacity={0.45}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill={color} />
    </svg>
  );
}

export default function StatTile({
  metric,
  value,
  delta,
  points,
  hero = false,
}: {
  metric: Metric;
  value: number | null;
  delta: Delta | null;
  points: Point[];
  hero?: boolean;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const color = metric.color[mode];

  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
    >
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

      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          {/* Figuras proporcionais: a tabular da a cada digito a largura de um
              zero e, em corpo grande, o numero fica frouxo. */}
          <span
            className={hero ? "text-5xl font-semibold" : "text-2xl font-semibold"}
            style={{ color: chrome.ink }}
          >
            {formatValue(metric.id, value)}
          </span>
          <span
            className={hero ? "ml-2 text-lg" : "ml-1.5 text-sm"}
            style={{ color: chrome.inkSecondary }}
          >
            {metric.unit}
          </span>
        </div>
        <Sparkline points={points} color={color} />
      </div>

      {/*
        A variacao fica em tinta neutra, com seta e sinal.
        Nao a pintamos de verde ou vermelho porque a app nao sabe o objetivo de
        quem a usa: descer 2 kg pode ser a meta ou o alarme. A direcao esta na
        seta e no sinal; a cor nao emite um juizo que nos nao podemos fazer.
      */}
      <div className="mt-2 text-xs" style={{ color: chrome.muted }}>
        {delta ? (
          <span className="tabular">
            <span aria-hidden>{delta.change > 0 ? "↑" : delta.change < 0 ? "↓" : "→"}</span>{" "}
            {delta.change > 0 ? "+" : ""}
            {formatValue(metric.id, delta.change)} {metric.unit} em{" "}
            {delta.spanDays} {delta.spanDays === 1 ? "dia" : "dias"}
          </span>
        ) : (
          <span>Sem comparacao disponivel</span>
        )}
      </div>
    </div>
  );
}
