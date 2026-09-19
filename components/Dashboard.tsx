"use client";

import { useMemo, useState } from "react";
import {
  HERO_METRIC,
  METRICS,
  METRIC_BY_ID,
  type MetricId,
} from "@/lib/metrics";
import {
  buildRelativeRows,
  buildSeries,
  deltaOver,
  filterByRange,
  latestReading,
} from "@/lib/series";
import type { Entry, Granularity, RangeKey } from "@/lib/types";
import DataTransfer from "./DataTransfer";
import EntriesTable from "./EntriesTable";
import EntryForm from "./EntryForm";
import FilterBar, { type ViewMode } from "./FilterBar";
import MetricChart from "./MetricChart";
import RelativeChart from "./RelativeChart";
import StatTile from "./StatTile";
import { CHROME, useTheme } from "./theme";

/**
 * Selecao inicial do grafico comparativo.
 *
 * Sao os tres primeiros slots da paleta -- o unico subconjunto que passa os
 * limiares de daltonismo com todos os pares em jogo. Mais series continuam a
 * ser possiveis (as linhas usam a lista de pares adjacentes, que a paleta
 * inteira cumpre), mas tres e o arranque seguro.
 */
const DEFAULT_SELECTION: MetricId[] = ["peso", "abdomen", "gordura"];

/** Janelas de comparacao dos cartoes, em dias. */
const SHORT_WINDOW = 7;

export default function Dashboard({ entries }: { entries: Entry[] }) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];

  const [range, setRange] = useState<RangeKey>("90d");
  const [granularity, setGranularity] = useState<Granularity>("dia");
  const [view, setView] = useState<ViewMode>("metrica");
  const [selected, setSelected] = useState<MetricId[]>(DEFAULT_SELECTION);

  // Os filtros delimitam tudo: cartoes, graficos e tabela leem sempre a mesma
  // fatia, por isso os numeros nunca se contradizem entre si.
  const ranged = useMemo(() => filterByRange(entries, range), [entries, range]);

  const series = useMemo(
    () =>
      Object.fromEntries(
        METRICS.map((m) => [m.id, buildSeries(ranged, m.id, granularity)]),
      ) as Record<MetricId, ReturnType<typeof buildSeries>>,
    [ranged, granularity],
  );

  const withData = useMemo(
    () => METRICS.filter((m) => series[m.id].length > 0),
    [series],
  );

  const relativeRows = useMemo(
    () => buildRelativeRows(ranged, selected, granularity),
    [ranged, selected, granularity],
  );

  const toggleMetric = (id: MetricId) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((m) => m !== id)
        : [...current, id].sort(
            (a, b) =>
              METRICS.findIndex((m) => m.id === a) -
              METRICS.findIndex((m) => m.id === b),
          ),
    );

  const heroMetric = METRIC_BY_ID[HERO_METRIC];
  const heroReading = latestReading(ranged, HERO_METRIC);
  const others = withData.filter((m) => m.id !== HERO_METRIC);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: chrome.ink }}>
          Medidas
        </h1>
        <p className="mt-1 text-sm" style={{ color: chrome.muted }}>
          Regista as medidas do dia e ve como evoluem por dias, semanas e meses.
        </p>
      </header>

      <div className="mb-6">
        <FilterBar
          range={range}
          onRange={setRange}
          granularity={granularity}
          onGranularity={setGranularity}
          view={view}
          onView={setView}
          selected={selected}
          onToggleMetric={toggleMetric}
        />
      </div>

      {entries.length === 0 ? (
        <section
          className="rounded-xl border p-8 text-center"
          style={{
            background: "var(--surface-1)",
            borderColor: "var(--border)",
          }}
        >
          <p className="text-sm" style={{ color: chrome.inkSecondary }}>
            Ainda nao ha nada registado. Preenche o formulario abaixo com as
            medidas de hoje -- basta uma para comecar.
          </p>
        </section>
      ) : (
        <>
          {/* Exatamente uma figura heroi por vista. */}
          <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <StatTile
                metric={heroMetric}
                value={heroReading?.value ?? null}
                delta={deltaOver(ranged, HERO_METRIC, SHORT_WINDOW)}
                points={series[HERO_METRIC]}
                hero
              />
            </div>
            {others.map((metric) => (
              <StatTile
                key={metric.id}
                metric={metric}
                value={latestReading(ranged, metric.id)?.value ?? null}
                delta={deltaOver(ranged, metric.id, SHORT_WINDOW)}
                points={series[metric.id]}
              />
            ))}
          </div>

          {view === "metrica" ? (
            /*
             * Pequenos multiplos, um grafico por metrica.
             *
             * Poderiamos empilhar tudo num grafico com dois eixos Y; seria
             * errado. Duas escalas independentes podem ser esticadas ate
             * qualquer cruzamento parecer significativo, e o leitor nao tem
             * como saber que o cruzamento e um artefacto do eixo. Cada metrica
             * na sua moldura, com a mesma folga de 8%, compara-se sem mentir.
             */
            <div className="grid gap-4 lg:grid-cols-2">
              {withData.map((metric) => (
                <MetricChart
                  key={metric.id}
                  metric={metric}
                  points={series[metric.id]}
                  granularity={granularity}
                />
              ))}
            </div>
          ) : (
            <RelativeChart
              rows={relativeRows}
              metrics={selected}
              granularity={granularity}
            />
          )}
        </>
      )}

      <div className="mt-6 grid gap-4">
        <EntryForm entries={entries} />
        <EntriesTable entries={ranged} />
        <DataTransfer count={entries.length} />
      </div>
    </div>
  );
}
