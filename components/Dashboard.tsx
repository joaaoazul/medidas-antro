"use client";

import { useState } from "react";
import { longLabel, todayISO } from "@/lib/dates";
import type { Entry } from "@/lib/types";
import HistoryView from "./HistoryView";
import { LogoMark } from "./Logo";
import { BottomNav, SettingsLink, type Tab, ThemeButton, TopTabs } from "./Nav";
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
export default function Dashboard({
  entries,
  nome,
  objetivoPeso,
}: {
  entries: Entry[];
  nome: string | null;
  /** Peso pretendido, do perfil: vira linha de referencia no grafico do peso. */
  objetivoPeso: number | null;
}) {
  const { mode, toggle } = useTheme();
  const chrome = CHROME[mode];
  const [tab, setTab] = useState<Tab>("hoje");
  // A medicao em edicao vive aqui, e nao dentro do historico, porque o
  // formulario esta noutro separador: escolher "editar" no historico tem de
  // levar a pessoa ao formulario com aquela medicao carregada.
  const [editing, setEditing] = useState<Entry | null>(null);

  function editar(entry: Entry) {
    setEditing(entry);
    setTab("hoje");
  }

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
          <div className="flex shrink-0 items-center gap-2">
            <LogoMark size={22} />
            <span
              className="hidden text-sm font-semibold tracking-tight sm:inline"
              style={{ color: chrome.ink }}
            >
              Medidas
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h1
              className="truncate text-lg leading-tight font-semibold"
              style={{ color: chrome.ink }}
            >
              {nome ? `Olá, ${nome}` : "Medidas"}
            </h1>
            <p className="truncate text-xs" style={{ color: chrome.muted }}>
              {longLabel(todayISO())}
            </p>
          </div>
          <TopTabs active={tab} onChange={setTab} />
          <ThemeButton mode={mode} onToggle={toggle} />
          <SettingsLink />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        {tab === "hoje" ? (
          <TodayView
            entries={entries}
            editing={editing}
            onCancelEdit={() => setEditing(null)}
            objetivoPeso={objetivoPeso}
            onAbrirEvolucao={() => setTab("evolucao")}
          />
        ) : null}
        {tab === "evolucao" ? (
          <TrendsView entries={entries} objetivoPeso={objetivoPeso} />
        ) : null}
        {tab === "historico" ? (
          <HistoryView entries={entries} onEdit={editar} />
        ) : null}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
