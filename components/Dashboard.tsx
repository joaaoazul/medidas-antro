"use client";

import { useState } from "react";
import { longLabel, todayISO } from "@/lib/dates";
import type { Entry } from "@/lib/types";
import HistoryView from "./HistoryView";
import { BottomNav, type Tab, ThemeButton, TopTabs } from "./Nav";
import { CHROME, useTheme } from "./theme";
import TodayView from "./TodayView";
import TrendsView from "./TrendsView";

/**
 * Casca da app: cabecalho, separadores e a vista ativa.
 *
 * Os registos chegam inteiros do servidor e sao filtrados no cliente. Sao umas
 * centenas de linhas por ano -- cabem folgadamente numa resposta -- e assim
 * mudar de intervalo ou de metrica e imediato, sem uma ida ao servidor a cada
 * toque num filtro.
 */
export default function Dashboard({ entries }: { entries: Entry[] }) {
  const { mode, toggle } = useTheme();
  const chrome = CHROME[mode];
  const [tab, setTab] = useState<Tab>("hoje");
  // A data do formulario vive aqui para sobreviver a uma ida ao historico e
  // volta: quem foi confirmar um valor nao quer encontrar o campo reposto.
  const [date, setDate] = useState(todayISO());

  return (
    // O espaco em baixo e o que impede a barra fixa de tapar a ultima linha.
    <div className="pb-24 sm:pb-10">
      <header
        className="sticky top-0 z-10 border-b backdrop-blur"
        style={{
          borderColor: "var(--border)",
          background: "color-mix(in srgb, var(--plane) 85%, transparent)",
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <h1
              className="text-lg leading-tight font-semibold"
              style={{ color: chrome.ink }}
            >
              Medidas
            </h1>
            <p className="truncate text-xs" style={{ color: chrome.muted }}>
              {longLabel(todayISO())}
            </p>
          </div>
          <TopTabs active={tab} onChange={setTab} />
          <ThemeButton mode={mode} onToggle={toggle} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        {tab === "hoje" ? (
          <TodayView entries={entries} date={date} onDate={setDate} />
        ) : null}
        {tab === "evolucao" ? <TrendsView entries={entries} /> : null}
        {tab === "historico" ? <HistoryView entries={entries} /> : null}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
