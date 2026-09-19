"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { IDLE, saveEntry } from "@/app/actions";
import { todayISO } from "@/lib/dates";
import { METRICS } from "@/lib/metrics";
import type { Entry } from "@/lib/types";
import { CHROME, useTheme } from "./theme";

export default function EntryForm({ entries }: { entries: Entry[] }) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [state, formAction, pending] = useActionState(saveEntry, IDLE);
  const [date, setDate] = useState(todayISO());
  const formRef = useRef<HTMLFormElement>(null);

  const existing = entries.find((e) => e.date === date) ?? null;

  /**
   * Ao escolher uma data ja registada, os campos passam a mostrar o que la
   * esta: gravar por cima e edicao deliberada, nao um duplicado acidental.
   */
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    for (const metric of METRICS) {
      const field = form.elements.namedItem(metric.id) as HTMLInputElement | null;
      if (field) {
        const value = existing?.values[metric.id] ?? null;
        field.value = value === null ? "" : String(value);
      }
    }
    const nota = form.elements.namedItem("nota") as HTMLTextAreaElement | null;
    if (nota) nota.value = existing?.nota ?? "";
  }, [existing]);

  return (
    <section
      className="rounded-xl border p-4"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
    >
      <h2 className="text-sm font-medium" style={{ color: chrome.ink }}>
        Registar medidas
      </h2>
      <p className="mt-0.5 text-xs" style={{ color: chrome.muted }}>
        Deixa em branco o que nao mediste. Um registo por dia: gravar a mesma
        data substitui o anterior.
      </p>

      <form ref={formRef} action={formAction} className="mt-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <label className="flex flex-col gap-1 text-xs">
            <span style={{ color: chrome.inkSecondary }}>Data</span>
            <input
              type="date"
              name="date"
              value={date}
              max={todayISO()}
              onChange={(event) => setDate(event.target.value)}
              required
              className="tabular rounded-lg border px-2 py-1.5 text-sm"
              style={{
                background: "var(--plane)",
                borderColor: "var(--border)",
                color: chrome.ink,
              }}
            />
          </label>

          {METRICS.map((metric) => (
            <label key={metric.id} className="flex flex-col gap-1 text-xs">
              <span className="flex items-center gap-1.5">
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
                <span style={{ color: chrome.inkSecondary }}>
                  {metric.short} ({metric.unit})
                </span>
              </span>
              <input
                type="text"
                name={metric.id}
                // "decimal" traz o teclado numerico no telemovel sem impor o
                // ponto: a virgula decimal e aceite na gravacao.
                inputMode="decimal"
                autoComplete="off"
                placeholder="--"
                className="tabular rounded-lg border px-2 py-1.5 text-sm"
                style={{
                  background: "var(--plane)",
                  borderColor: "var(--border)",
                  color: chrome.ink,
                }}
              />
            </label>
          ))}
        </div>

        <label className="mt-3 flex flex-col gap-1 text-xs">
          <span style={{ color: chrome.inkSecondary }}>Nota (opcional)</span>
          <textarea
            name="nota"
            rows={2}
            maxLength={500}
            placeholder="Treino, sono, o que quiseres lembrar."
            className="rounded-lg border px-2 py-1.5 text-sm"
            style={{
              background: "var(--plane)",
              borderColor: "var(--border)",
              color: chrome.ink,
            }}
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
            style={{ background: chrome.ink, color: chrome.surface }}
          >
            {pending ? "A guardar..." : existing ? "Atualizar registo" : "Guardar"}
          </button>

          {/* role="status" faz o leitor de ecra anunciar o resultado sem roubar
              o foco a quem esta a preencher. */}
          <p
            role="status"
            aria-live="polite"
            className="text-sm"
            style={{
              color: state.status === "erro" ? "#d03b3b" : chrome.inkSecondary,
            }}
          >
            {state.message}
          </p>
        </div>
      </form>
    </section>
  );
}
