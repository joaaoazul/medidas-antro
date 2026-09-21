"use client";

import { useMemo } from "react";
import { todayISO } from "@/lib/dates";
import { HERO_METRIC, METRICS, METRIC_BY_ID } from "@/lib/metrics";
import {
  buildSeries,
  deltaOver,
  filterByRange,
  latestReading,
} from "@/lib/series";
import type { Entry } from "@/lib/types";
import EntryForm from "./EntryForm";
import { HeroCard, MetricCard } from "./MetricCard";
import { CHROME, useTheme } from "./theme";
import { Card } from "./ui";

/** Janela de comparacao dos cartoes, em dias. */
const SHORT_WINDOW = 7;

/**
 * O ecra de entrada responde a uma unica pergunta -- "como estou hoje, e ja
 * registei?" -- e poe o formulario a um deslize de distancia. O intervalo e o
 * agrupamento nao existem aqui de proposito: sao ferramentas de leitura, e
 * vivem no separador que se abre para ler.
 */
export default function TodayView({
  entries,
  editing,
  onCancelEdit,
  objetivoPeso,
}: {
  entries: Entry[];
  editing: Entry | null;
  onCancelEdit: () => void;
  /** Peso pretendido, do perfil: mostra a distancia no cartao do Peso. */
  objetivoPeso: number | null;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];

  // As mini-linhas mostram a fase recente, nao a historia toda: num tracinho de
  // 96px, um ano inteiro vira uma mancha.
  const recent = useMemo(() => filterByRange(entries, "90d"), [entries]);
  const series = useMemo(
    () =>
      Object.fromEntries(
        METRICS.map((m) => [m.id, buildSeries(recent, m.id, "dia")]),
      ),
    [recent],
  );

  const registosDeHoje = entries.filter((e) => e.date === todayISO()).length;
  const hero = METRIC_BY_ID[HERO_METRIC];
  const others = METRICS.filter(
    (m) => m.id !== HERO_METRIC && latestReading(entries, m.id) !== null,
  );

  return (
    <div className="flex flex-col gap-4">
      {entries.length === 0 ? (
        <Card className="p-6">
          <p
            className="text-center text-sm"
            style={{ color: chrome.inkSecondary }}
          >
            Ainda não há nada registado. Preenche as medidas de hoje aqui em
            baixo -- basta uma para começar.
          </p>
        </Card>
      ) : (
        <>
          {/* Exatamente uma figura heroi por vista. */}
          <HeroCard
            metric={hero}
            reading={latestReading(entries, HERO_METRIC)}
            delta={deltaOver(entries, HERO_METRIC, SHORT_WINDOW)}
            points={series[HERO_METRIC]}
            objetivo={HERO_METRIC === "peso" ? objetivoPeso : null}
          />

          <p
            className="text-center text-sm"
            style={{
              color: registosDeHoje > 0 ? chrome.inkSecondary : chrome.muted,
            }}
          >
            {registosDeHoje === 0
              ? "Ainda não registaste hoje."
              : registosDeHoje === 1
                ? "Já registaste uma medição hoje."
                : `Já registaste ${registosDeHoje} medições hoje.`}
          </p>

          {others.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {others.map((metric) => (
                <MetricCard
                  key={metric.id}
                  metric={metric}
                  reading={latestReading(entries, metric.id)}
                  delta={deltaOver(entries, metric.id, SHORT_WINDOW)}
                  points={series[metric.id]}
                />
              ))}
            </div>
          ) : null}
        </>
      )}

      <EntryForm editing={editing} onCancelEdit={onCancelEdit} />
    </div>
  );
}
