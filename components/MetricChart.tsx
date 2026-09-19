"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { msToISO, longLabel, shortLabel } from "@/lib/dates";
import { formatValue, type Metric } from "@/lib/metrics";
import { niceScale } from "@/lib/series";
import type { Granularity, Point } from "@/lib/types";
import { CHROME, useTheme } from "./theme";

/** Acima disto os pontos deixam de ser marcas e passam a ser ruido. */
const MAX_DOTS = 40;

function bucketAt(t: number, granularity: Granularity): string {
  const iso = msToISO(t);
  return granularity === "mes" ? iso.slice(0, 7) : iso;
}

type TooltipPayload = { payload: Point }[];

function ChartTooltip({
  active,
  payload,
  metric,
  granularity,
  color,
  ink,
  muted,
  surface,
}: {
  active?: boolean;
  payload?: TooltipPayload;
  metric: Metric;
  granularity: Granularity;
  color: string;
  ink: string;
  muted: string;
  surface: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  if (point.value === null) return null;

  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-sm"
      style={{ background: surface, borderColor: "var(--border)" }}
    >
      {/* O valor lidera; o nome da serie e secundario -- quem passa o rato ja
          sabe o que esta a ver e quer o numero. */}
      <div className="tabular text-base font-semibold" style={{ color: ink }}>
        {formatValue(metric.id, point.value)}{" "}
        <span className="text-sm font-normal">{metric.unit}</span>
      </div>
      <div className="mt-1 flex items-center gap-2" style={{ color: muted }}>
        {/* Chave em risco, nao em quadrado: a densidade do tooltip nao aguenta
            tinta com peso de dados a fazer trabalho de rotulo. */}
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 12,
            height: 2,
            borderRadius: 1,
            background: color,
          }}
        />
        <span className="text-xs">{longLabel(point.bucket)}</span>
      </div>
      {granularity !== "dia" && point.samples > 1 ? (
        <div className="mt-0.5 text-xs" style={{ color: muted }}>
          media de {point.samples} medicoes
        </div>
      ) : null}
    </div>
  );
}

export default function MetricChart({
  metric,
  points,
  granularity,
}: {
  metric: Metric;
  points: Point[];
  granularity: Granularity;
}) {
  const { mode, mounted } = useTheme();
  const chrome = CHROME[mode];
  const color = metric.color[mode];

  const last = points.length > 0 ? points[points.length - 1] : null;
  const scale = niceScale(points);
  const showDots = points.length <= MAX_DOTS;

  return (
    <figure
      className="rounded-xl border p-4"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
    >
      <figcaption className="mb-3 flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: 999,
              background: color,
            }}
          />
          {/* Serie unica: o titulo diz o que esta desenhado, por isso nao ha
              caixa de legenda a repetir a mesma informacao. */}
          <span className="text-sm font-medium" style={{ color: chrome.ink }}>
            {metric.label}
          </span>
        </span>
        <span className="text-xs" style={{ color: chrome.muted }}>
          {metric.unit}
        </span>
      </figcaption>

      <div className="h-44 w-full">
        {mounted && points.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={points}
              margin={{ top: 12, right: 52, bottom: 4, left: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke={chrome.grid}
                strokeWidth={1}
              />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(t: number) =>
                  shortLabel(bucketAt(t, granularity))
                }
                tick={{ fill: chrome.muted, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: chrome.axis }}
                minTickGap={28}
              />
              <YAxis
                domain={scale.domain}
                ticks={scale.ticks}
                tickFormatter={(v: number) => String(v)}
                tick={{ fill: chrome.muted, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                // A mira encontra o X: ninguem acerta numa linha de 2px.
                cursor={{ stroke: chrome.axis, strokeWidth: 1 }}
                content={
                  <ChartTooltip
                    metric={metric}
                    granularity={granularity}
                    color={color}
                    ink={chrome.ink}
                    muted={chrome.muted}
                    surface={chrome.surface}
                  />
                }
              />
              <Line
                // Linear, nao suavizada: uma curva entre duas pesagens desenha
                // dias que nunca foram medidos.
                type="linear"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                isAnimationActive={false}
                dot={
                  showDots
                    ? {
                        r: 4,
                        fill: color,
                        stroke: chrome.surface,
                        strokeWidth: 2,
                      }
                    : false
                }
                activeDot={{
                  r: 5,
                  fill: color,
                  stroke: chrome.surface,
                  strokeWidth: 2,
                }}
              />
              {last && last.value !== null ? (
                /* Rotulo direto so na ponta -- um numero em cada ponto nao se
                   le, e este e tambem o apoio exigido pelas cores de contraste
                   mais baixo em modo claro. */
                <ReferenceDot
                  x={last.t}
                  y={last.value}
                  r={4}
                  fill={color}
                  stroke={chrome.surface}
                  strokeWidth={2}
                  label={{
                    value: formatValue(metric.id, last.value),
                    position: "right",
                    offset: 10,
                    fill: chrome.ink,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div
            className="flex h-full items-center justify-center text-sm"
            style={{ color: chrome.muted }}
          >
            {mounted ? "Sem medicoes neste intervalo." : ""}
          </div>
        )}
      </div>
    </figure>
  );
}
