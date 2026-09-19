"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { longLabel, msToISO, shortLabel } from "@/lib/dates";
import { METRIC_BY_ID, type MetricId } from "@/lib/metrics";
import type { RelativeRow } from "@/lib/series";
import type { Granularity } from "@/lib/types";
import { CHROME, useTheme } from "./theme";
import { Card } from "./ui";

function bucketAt(t: number, granularity: Granularity): string {
  const iso = msToISO(t);
  return granularity === "mes" ? iso.slice(0, 7) : iso;
}

function formatPercent(v: number): string {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

type TooltipPayload = { payload: RelativeRow }[];

function ChartTooltip({
  active,
  payload,
  metrics,
  mode,
}: {
  active?: boolean;
  payload?: TooltipPayload;
  metrics: MetricId[];
  mode: "light" | "dark";
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const chrome = CHROME[mode];

  // Um tooltip, todas as series: o ponteiro nunca precisa de acertar numa linha
  // para dar um valor.
  const rows = metrics
    .map((id) => ({ id, value: row[id] }))
    .filter((r): r is { id: MetricId; value: number } => r.value !== undefined);

  if (rows.length === 0) return null;

  return (
    <div
      className="rounded-lg border px-3 py-2 shadow-sm"
      style={{ background: chrome.surface, borderColor: "var(--border)" }}
    >
      <div className="mb-1.5 text-xs" style={{ color: chrome.muted }}>
        {longLabel(row.bucket)}
      </div>
      <ul className="space-y-1">
        {rows.map(({ id, value }) => (
          <li key={id} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              style={{
                display: "inline-block",
                width: 12,
                height: 2,
                borderRadius: 1,
                background: METRIC_BY_ID[id].color[mode],
                flexShrink: 0,
              }}
            />
            <span
              className="tabular font-semibold"
              style={{ color: chrome.ink, minWidth: "3.5rem" }}
            >
              {formatPercent(value)}
            </span>
            <span className="text-xs" style={{ color: chrome.inkSecondary }}>
              {METRIC_BY_ID[id].short}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RelativeChart({
  rows,
  metrics,
  granularity,
}: {
  rows: RelativeRow[];
  metrics: MetricId[];
  granularity: Granularity;
}) {
  const { mode, mounted } = useTheme();
  const chrome = CHROME[mode];

  return (
    <Card className="p-4 sm:p-5" as="figure">
      <figcaption className="mb-1">
        <h2 className="text-base font-medium" style={{ color: chrome.ink }}>
          Evolucao relativa
        </h2>
        {/*
          A razao completa vive no README e no comentario de buildRelativeRows:
          peso, perimetros e percentagens nao partilham escala, e dois eixos Y
          independentes podem ser esticados ate qualquer cruzamento parecer um
          facto. Aqui fica so o que o leitor precisa de saber para ler o eixo --
          cinco linhas de explicacao num telemovel empurram o grafico para fora
          do ecra, e um grafico que nao se ve nao explica nada.
        */}
        <p className="mt-0.5 text-xs" style={{ color: chrome.muted }}>
          Cada metrica em % face a primeira medicao do intervalo, para caberem
          todas num unico eixo.
        </p>
      </figcaption>

      {/* A legenda esta sempre presente com duas ou mais series: e o canal de
          identidade fiavel. As linhas convergem perto dos 0%, por isso os
          rotulos diretos dariam lugar a colisoes -- aqui o par legenda +
          tooltip faz o trabalho. */}
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
        {metrics.map((id) => (
          <li key={id} className="flex items-center gap-1.5 text-xs">
            <span
              aria-hidden
              style={{
                display: "inline-block",
                width: 14,
                height: 2,
                borderRadius: 1,
                background: METRIC_BY_ID[id].color[mode],
              }}
            />
            <span style={{ color: chrome.inkSecondary }}>
              {METRIC_BY_ID[id].short}
            </span>
          </li>
        ))}
      </ul>

      <div className="h-64 w-full sm:h-80">
        {mounted && rows.length > 0 && metrics.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rows}
              margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke={chrome.grid}
                strokeWidth={1}
                syncWithTicks
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
                tickFormatter={formatPercent}
                tick={{ fill: chrome.muted, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={56}
                tickCount={5}
              />
              <ReferenceLine y={0} stroke={chrome.axis} strokeWidth={1} />
              <Tooltip
                cursor={{ stroke: chrome.axis, strokeWidth: 1 }}
                content={<ChartTooltip metrics={metrics} mode={mode} />}
              />
              {metrics.map((id) => (
                <Line
                  key={id}
                  type="linear"
                  dataKey={id}
                  stroke={METRIC_BY_ID[id].color[mode]}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: METRIC_BY_ID[id].color[mode],
                    stroke: chrome.surface,
                    strokeWidth: 2,
                  }}
                  isAnimationActive={false}
                  // As medicoes sao esparsas; a linha atravessa o dia em falta
                  // em vez de se partir.
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div
            className="flex h-full items-center justify-center text-sm"
            style={{ color: chrome.muted }}
          >
            {mounted ? "Escolhe pelo menos uma metrica com medicoes." : ""}
          </div>
        )}
      </div>
    </Card>
  );
}
