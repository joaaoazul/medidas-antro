"use client";

import { useMemo, useState } from "react";
import { METRICS, type MetricId } from "@/lib/metrics";
import { RANGES, filterByRange } from "@/lib/series";
import { normalizar } from "@/lib/texto";
import type { Entry, RangeKey } from "@/lib/types";
import DataTransfer from "./DataTransfer";
import HistoryList from "./HistoryList";
import { CHROME, useTheme } from "./theme";
import { Chip, ChipRow } from "./ui";

/**
 * So o historico e a copia de seguranca. A conta, os consentimentos e o
 * apagamento vivem em /conta -- misturar definicoes com o registo do dia-a-dia
 * poe accoes que nao se desfazem ao lado de accoes triviais.
 */

export default function HistoryView({
  entries,
  onEdit,
}: {
  entries: Entry[];
  onEdit: (entry: Entry) => void;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];

  const [range, setRange] = useState<RangeKey>("tudo");
  const [metrica, setMetrica] = useState<MetricId | null>(null);
  const [procura, setProcura] = useState("");

  const filtradas = useMemo(() => {
    const termo = normalizar(procura.trim());
    return filterByRange(entries, range).filter((entry) => {
      if (metrica && entry.values[metrica] === null) return false;
      if (termo === "") return true;
      // A data entra na pesquisa porque "2026-03" e a forma mais rapida de
      // chegar a um mes inteiro sem inventar um seletor de datas para isso.
      return (
        normalizar(entry.nota ?? "").includes(termo) ||
        entry.date.includes(termo)
      );
    });
  }, [entries, range, metrica, procura]);

  const aFiltrar =
    range !== "tudo" || metrica !== null || procura.trim() !== "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="sr-only">Procurar nas notas ou por data</span>
          <input
            type="search"
            value={procura}
            onChange={(event) => setProcura(event.target.value)}
            placeholder="Procurar numa nota, ou 2026-03"
            className="touch w-full rounded-xl border px-3.5 text-base"
            style={{
              background: "var(--plane)",
              borderColor: "var(--border)",
              color: chrome.ink,
            }}
          />
        </label>

        {/* Deslizam na horizontal em vez de quebrarem: num ecra de 390px, nove
            fichas em quatro linhas empurravam a lista toda para fora do ecra. */}
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

        <ChipRow label="Com medida de">
          <Chip selected={metrica === null} onClick={() => setMetrica(null)}>
            Qualquer
          </Chip>
          {METRICS.map((m) => (
            <Chip
              key={m.id}
              swatch={m.color[mode]}
              selected={metrica === m.id}
              onClick={() => setMetrica(metrica === m.id ? null : m.id)}
            >
              {m.short}
            </Chip>
          ))}
        </ChipRow>

        {aFiltrar ? (
          <p
            role="status"
            aria-live="polite"
            className="px-1 text-xs"
            style={{ color: chrome.muted }}
          >
            {filtradas.length}{" "}
            {filtradas.length === 1 ? "medição" : "medições"} de{" "}
            {entries.length}.
          </p>
        ) : null}
      </div>

      <HistoryList entries={filtradas} onEdit={onEdit} aFiltrar={aFiltrar} />
      {/* O total, e nao o filtrado: a copia de seguranca leva tudo. */}
      <DataTransfer count={entries.length} />
    </div>
  );
}
