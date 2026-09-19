"use client";

import { METRICS, type MetricId } from "@/lib/metrics";
import { GRANULARITIES, RANGES } from "@/lib/series";
import type { Granularity, RangeKey } from "@/lib/types";
import { CHROME, useTheme } from "./theme";

export type ViewMode = "metrica" | "relativo";

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs" style={{ color: chrome.muted }}>
        {label}
      </span>
      <div
        role="group"
        aria-label={label}
        className="flex rounded-lg border p-0.5"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
      >
        {options.map((option) => {
          const selected = option.key === value;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.key)}
              className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
              style={{
                background: selected ? "var(--selected)" : "transparent",
                color: selected ? chrome.ink : chrome.inkSecondary,
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FilterBar({
  range,
  onRange,
  granularity,
  onGranularity,
  view,
  onView,
  selected,
  onToggleMetric,
}: {
  range: RangeKey;
  onRange: (next: RangeKey) => void;
  granularity: Granularity;
  onGranularity: (next: Granularity) => void;
  view: ViewMode;
  onView: (next: ViewMode) => void;
  selected: MetricId[];
  onToggleMetric: (id: MetricId) => void;
}) {
  const { mode, toggle } = useTheme();
  const chrome = CHROME[mode];

  return (
    // Uma linha, acima dos graficos: os filtros delimitam tudo o que vem
    // abaixo, por isso os cartoes, os graficos e a tabela concordam sempre.
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <Segmented
        label="Intervalo"
        options={RANGES.map((r) => ({ key: r.key, label: r.label }))}
        value={range}
        onChange={onRange}
      />
      <Segmented
        label="Agrupar por"
        options={GRANULARITIES}
        value={granularity}
        onChange={onGranularity}
      />
      <Segmented
        label="Vista"
        options={[
          { key: "metrica" as const, label: "Por metrica" },
          { key: "relativo" as const, label: "Comparar" },
        ]}
        value={view}
        onChange={onView}
      />

      <button
        type="button"
        onClick={toggle}
        className="ml-auto rounded-lg border px-2.5 py-1 text-xs"
        style={{ borderColor: "var(--border)", color: chrome.inkSecondary }}
      >
        {mode === "dark" ? "Modo claro" : "Modo escuro"}
      </button>

      {view === "relativo" ? (
        <div className="flex w-full flex-wrap items-center gap-2">
          <span className="text-xs" style={{ color: chrome.muted }}>
            Metricas
          </span>
          {METRICS.map((metric) => {
            const on = selected.includes(metric.id);
            return (
              <button
                key={metric.id}
                type="button"
                aria-pressed={on}
                onClick={() => onToggleMetric(metric.id)}
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
                style={{
                  borderColor: "var(--border)",
                  background: on ? "var(--selected)" : "transparent",
                  color: on ? chrome.ink : chrome.muted,
                }}
              >
                {/* A cor pertence a metrica, nao a sua posicao: ligar e desligar
                    series nunca repinta as que ficam. */}
                <span
                  aria-hidden
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 2,
                    borderRadius: 1,
                    background: metric.color[mode],
                    opacity: on ? 1 : 0.4,
                  }}
                />
                {metric.short}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
