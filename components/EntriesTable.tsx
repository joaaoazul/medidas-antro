"use client";

import { useState, useTransition } from "react";
import { removeEntry } from "@/app/actions";
import { longLabel } from "@/lib/dates";
import { METRICS, formatValue } from "@/lib/metrics";
import type { Entry } from "@/lib/types";
import { CHROME, useTheme } from "./theme";

/**
 * A vista em tabela nao e um extra.
 *
 * Tres das cores da paleta ficam abaixo de 3:1 sobre a superficie clara, e a
 * regra e explicita: nessa situacao o valor tem de estar alcancavel sem depender
 * da cor nem do rato. A tabela e essa garantia -- e, de passagem, a forma mais
 * rapida de corrigir um engano de digitacao.
 */

/** Linhas mostradas antes de ser preciso pedir o resto. */
const PREVIEW_ROWS = 14;
export default function EntriesTable({ entries }: { entries: Entry[] }) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Do mais recente para o mais antigo: quem abre a tabela vem quase sempre
  // ver ou corrigir o que registou ha pouco.
  const rows = [...entries].reverse();
  const visible = expanded ? rows : rows.slice(0, PREVIEW_ROWS);

  return (
    <section
      className="rounded-xl border"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
    >
      <div className="flex items-baseline justify-between gap-3 p-4">
        <h2 className="text-sm font-medium" style={{ color: chrome.ink }}>
          Registos
        </h2>
        <span className="text-xs" style={{ color: chrome.muted }}>
          {rows.length} {rows.length === 1 ? "dia" : "dias"} no intervalo
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 pb-4 text-sm" style={{ color: chrome.muted }}>
          Ainda nao ha registos neste intervalo.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Medidas registadas por dia no intervalo selecionado
            </caption>
            <thead>
              <tr style={{ color: chrome.muted }}>
                <th scope="col" className="px-4 py-2 text-left text-xs font-normal">
                  Data
                </th>
                {METRICS.map((metric) => (
                  <th
                    key={metric.id}
                    scope="col"
                    className="px-3 py-2 text-right text-xs font-normal whitespace-nowrap"
                  >
                    <span className="flex items-center justify-end gap-1.5">
                      <span
                        aria-hidden
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: metric.color[mode],
                        }}
                      />
                      {metric.short}
                    </span>
                  </th>
                ))}
                <th scope="col" className="px-4 py-2 text-right text-xs font-normal">
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
                    className="px-4 py-2 text-left font-normal whitespace-nowrap"
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
                      className="tabular px-3 py-2 text-right whitespace-nowrap"
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
                  <td className="px-4 py-2 text-right">
                    {confirming === entry.date ? (
                      <span className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await removeEntry(entry.date);
                              setConfirming(null);
                            })
                          }
                          className="text-xs font-medium"
                          style={{ color: "#d03b3b" }}
                        >
                          Apagar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(null)}
                          className="text-xs"
                          style={{ color: chrome.muted }}
                        >
                          Cancelar
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirming(entry.date)}
                        className="text-xs"
                        style={{ color: chrome.muted }}
                        aria-label={`Apagar o registo de ${longLabel(entry.date)}`}
                      >
                        Apagar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length > PREVIEW_ROWS ? (
            <div className="p-4">
              <button
                type="button"
                onClick={() => setExpanded((open) => !open)}
                className="rounded-lg border px-3 py-1.5 text-xs"
                style={{
                  borderColor: "var(--border)",
                  color: chrome.inkSecondary,
                }}
              >
                {expanded
                  ? `Mostrar so os ultimos ${PREVIEW_ROWS}`
                  : `Mostrar os ${rows.length} dias`}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
