"use client";

import { useMemo, useState } from "react";
import { METRICS, METRIC_BY_ID, type MetricId } from "@/lib/metrics";
import {
  GRANULARITIES,
  RANGES,
  buildRelativeRows,
  buildSeries,
  filterByRange,
} from "@/lib/series";
import type { Entry, Granularity, RangeKey } from "@/lib/types";
import MetricChart from "./MetricChart";
import RelativeChart from "./RelativeChart";
import { CHROME, useTheme } from "./theme";
import { Chip, ChipRow, Segmented } from "./ui";

type Mode = "individual" | "comparar";

/**
 * Selecao inicial do grafico comparativo.
 *
 * Sao os tres primeiros slots da paleta -- o unico subconjunto que passa os
 * limiares de daltonismo com todos os pares em jogo. Mais series continuam a
 * ser possiveis (as linhas usam a lista de pares adjacentes, que a paleta
 * inteira cumpre), mas tres e o arranque seguro.
 */
const DEFAULT_SELECTION: MetricId[] = ["peso", "abdomen", "gordura"];

export default function TrendsView({
  entries,
  objetivoPeso,
}: {
  entries: Entry[];
  objetivoPeso: number | null;
}) {
  const { mode: theme } = useTheme();
  const chrome = CHROME[theme];

  const [range, setRange] = useState<RangeKey>("90d");
  const [granularity, setGranularity] = useState<Granularity>("dia");
  const [mode, setMode] = useState<Mode>("individual");
  const [focused, setFocused] = useState<MetricId>("peso");
  const [selected, setSelected] = useState<MetricId[]>(DEFAULT_SELECTION);

  // Os filtros delimitam tudo o que vem abaixo: o grafico le sempre a mesma
  // fatia que os controlos anunciam.
  const ranged = useMemo(() => filterByRange(entries, range), [entries, range]);

  const points = useMemo(
    () => buildSeries(ranged, focused, granularity),
    [ranged, focused, granularity],
  );

  const relativeRows = useMemo(
    () => buildRelativeRows(ranged, selected, granularity),
    [ranged, selected, granularity],
  );

  /*
   * Ha algum dia com mais do que uma medicao no intervalo?
   *
   * O balde "dia" tambem faz media -- pesar-se de manha e a noite da um ponto,
   * nao dois -- e este rodape garantia sem condicao nenhuma que cada ponto era
   * uma medicao. Dizia-o precisamente a quem tinha o caso em que nao era.
   */
  const variasPorDia = useMemo(() => {
    const vistos = new Set<string>();
    for (const entry of ranged) {
      if (vistos.has(entry.date)) return true;
      vistos.add(entry.date);
    }
    return false;
  }, [ranged]);

  const toggleSelected = (id: MetricId) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((m) => m !== id)
        : [...current, id].sort(
            (a, b) =>
              METRICS.findIndex((m) => m.id === a) -
              METRICS.findIndex((m) => m.id === b),
          ),
    );

  return (
    <div className="flex flex-col gap-4">
      {/*
       * Os controlos ficam acima do grafico, mas comprimidos ao minimo: a
       * escolha de vista virou um comutador, as metricas quebram para a linha
       * seguinte em vez de deslizar -- ve-las todas de uma vez vale a linha
       * extra -- e o intervalo e o agrupamento partilham uma linha com os
       * rotulos ao lado.
       */}
      {/* No ecra grande o comutador nao precisa de 1200px: a largura total e
          para o polegar, nao para o rato. */}
      <div className="sm:max-w-sm">
        <Segmented
          label="Vista"
          value={mode}
          onChange={setMode}
          options={[
            { key: "individual", label: "Uma métrica" },
            { key: "comparar", label: "Comparar" },
          ]}
        />
      </div>

      <ChipRow label={mode === "individual" ? "Métrica" : "Métricas"} wrap>
        {METRICS.map((metric) => (
          <Chip
            key={metric.id}
            swatch={metric.color[theme]}
            selected={
              mode === "individual"
                ? metric.id === focused
                : selected.includes(metric.id)
            }
            onClick={() =>
              mode === "individual"
                ? setFocused(metric.id)
                : toggleSelected(metric.id)
            }
          >
            {metric.short}
          </Chip>
        ))}
      </ChipRow>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
        <ChipRow label="Intervalo" inline>
          {RANGES.map((option) => (
            <Chip
              key={option.key}
              selected={option.key === range}
              onClick={() => setRange(option.key)}
            >
              {option.label}
            </Chip>
          ))}
        </ChipRow>

        <ChipRow label="Agrupar" inline>
          {GRANULARITIES.map((option) => (
            <Chip
              key={option.key}
              selected={option.key === granularity}
              onClick={() => setGranularity(option.key)}
            >
              {option.label}
            </Chip>
          ))}
        </ChipRow>
      </div>

      {/*
       * Um grafico de cada vez, escolhido nas fichas acima.
       *
       * A alternativa seria empilhar as oito metricas num so grafico com dois
       * eixos Y. Seria errado: duas escalas independentes podem ser esticadas
       * ate qualquer cruzamento parecer significativo, e quem le nao tem como
       * saber que o cruzamento e um artefacto do eixo. Quando e mesmo preciso
       * ve-las juntas, a vista "Comparar" indexa tudo a uma base comum e usa um
       * unico eixo honesto.
       */}
      {mode === "individual" ? (
        <MetricChart
          metric={METRIC_BY_ID[focused]}
          points={points}
          granularity={granularity}
          // A linha de referencia so faz sentido na metrica a que o objetivo
          // diz respeito: um peso pretendido desenhado sobre o perimetro do
          // braco seria uma marca sem significado nenhum.
          objetivo={focused === "peso" ? objetivoPeso : null}
        />
      ) : (
        <RelativeChart
          rows={relativeRows}
          metrics={selected}
          granularity={granularity}
        />
      )}

      <p className="px-1 text-xs" style={{ color: chrome.muted }}>
        {granularity === "dia"
          ? variasPorDia
            ? "Cada ponto é uma medição -- e a média do dia, nos dias em que há mais do que uma."
            : "Cada ponto é uma medição."
          : `Cada ponto é a média das medições ${
              granularity === "semana" ? "da semana" : "do mês"
            }.`}
      </p>
    </div>
  );
}
