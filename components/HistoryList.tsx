"use client";

import { useState, useTransition } from "react";
import { removeEntry } from "@/app/actions";
import { longLabel } from "@/lib/dates";
import { METRICS, formatValue } from "@/lib/metrics";
import type { Entry } from "@/lib/types";
import { CHROME, useTheme } from "./theme";
import { Button, Card } from "./ui";

/**
 * O historico nao e um extra.
 *
 * Tres das cores da paleta ficam abaixo de 3:1 sobre a superficie clara, e a
 * regra e explicita: nessa situacao o valor tem de estar alcancavel sem depender
 * da cor nem do rato. Esta vista e essa garantia -- e, de passagem, a forma mais
 * rapida de corrigir um engano de digitacao.
 *
 * Duas apresentacoes do mesmo conteudo: no telemovel uma ficha por dia, porque
 * uma tabela de nove colunas num ecra de 390px so se le a arrastar para o lado;
 * no ecra grande a tabela, que se percorre muito melhor com os olhos.
 */

/** Dias mostrados antes de ser preciso pedir o resto. */
const PREVIEW = 10;

function DeleteControl({ entry }: { entry: Entry }) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs"
        style={{ color: chrome.muted }}
        aria-label={`Apagar o registo de ${longLabel(entry.date)}`}
      >
        Apagar
      </button>
    );
  }

  return (
    <span className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await removeEntry(entry.date);
            setConfirming(false);
          })
        }
        className="text-xs font-medium"
        style={{ color: "#d03b3b" }}
      >
        Confirmar
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-xs"
        style={{ color: chrome.muted }}
      >
        Cancelar
      </button>
    </span>
  );
}

export default function HistoryList({ entries }: { entries: Entry[] }) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [expanded, setExpanded] = useState(false);

  // Do mais recente para o mais antigo: quem abre o historico vem quase sempre
  // ver ou corrigir o que registou ha pouco.
  const rows = [...entries].reverse();
  const visible = expanded ? rows : rows.slice(0, PREVIEW);

  if (rows.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-sm" style={{ color: chrome.muted }}>
          Ainda nao ha registos neste intervalo.
        </p>
      </Card>
    );
  }

  return (
    <div>
      {/* Telemovel: uma ficha por dia. */}
      <ul className="flex flex-col gap-3 sm:hidden">
        {visible.map((entry) => {
          const measured = METRICS.filter((m) => entry.values[m.id] !== null);
          return (
            <li key={entry.date}>
              <Card className="p-4" as="div">
                <div className="flex items-baseline justify-between gap-3">
                  <h3
                    className="text-sm font-medium"
                    style={{ color: chrome.ink }}
                  >
                    {longLabel(entry.date)}
                  </h3>
                  <DeleteControl entry={entry} />
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2.5">
                  {measured.map((metric) => (
                    <div key={metric.id}>
                      <dt
                        className="flex items-center gap-1 text-[11px] whitespace-nowrap"
                        style={{ color: chrome.muted }}
                      >
                        <span
                          aria-hidden
                          style={{
                            display: "inline-block",
                            width: 6,
                            height: 6,
                            borderRadius: 999,
                            background: metric.color[mode],
                          }}
                        />
                        {metric.short}
                      </dt>
                      <dd
                        className="tabular text-sm font-medium"
                        style={{ color: chrome.ink }}
                      >
                        {formatValue(metric.id, entry.values[metric.id])}
                        <span
                          className="ml-0.5 text-[11px] font-normal"
                          style={{ color: chrome.muted }}
                        >
                          {metric.unit}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>

                {entry.nota ? (
                  <p className="mt-3 text-xs" style={{ color: chrome.muted }}>
                    {entry.nota}
                  </p>
                ) : null}
              </Card>
            </li>
          );
        })}
      </ul>

      {/* Ecra grande: tabela. */}
      <Card className="hidden overflow-hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Medidas registadas por dia no intervalo selecionado
            </caption>
            <thead>
              <tr style={{ color: chrome.muted }}>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-normal"
                >
                  Data
                </th>
                {METRICS.map((metric) => (
                  <th
                    key={metric.id}
                    scope="col"
                    className="px-3 py-3 text-right text-xs font-normal whitespace-nowrap"
                  >
                    <span className="flex items-center justify-end gap-1.5">
                      <span
                        aria-hidden
                        style={{
                          display: "inline-block",
                          width: 7,
                          height: 7,
                          borderRadius: 999,
                          background: metric.color[mode],
                        }}
                      />
                      {metric.short}
                    </span>
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-right">
                  <span className="sr-only">Acoes</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((entry) => (
                <tr
                  key={entry.date}
                  className="border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <th
                    scope="row"
                    className="px-4 py-2.5 text-left font-normal whitespace-nowrap"
                    style={{ color: chrome.ink }}
                  >
                    {longLabel(entry.date)}
                    {entry.nota ? (
                      <span
                        className="mt-0.5 block max-w-52 truncate text-xs"
                        style={{ color: chrome.muted }}
                        title={entry.nota}
                      >
                        {entry.nota}
                      </span>
                    ) : null}
                  </th>
                  {METRICS.map((metric) => (
                    <td
                      key={metric.id}
                      className="tabular px-3 py-2.5 text-right whitespace-nowrap"
                      style={{
                        color:
                          entry.values[metric.id] === null
                            ? chrome.muted
                            : chrome.ink,
                      }}
                    >
                      {formatValue(metric.id, entry.values[metric.id])}
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right">
                    <DeleteControl entry={entry} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {rows.length > PREVIEW ? (
        <div className="mt-3">
          <Button onClick={() => setExpanded((open) => !open)} full>
            {expanded
              ? `Mostrar so os ultimos ${PREVIEW}`
              : `Mostrar os ${rows.length} dias`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
