"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveEntry } from "@/app/actions";
import { IDLE } from "@/lib/form-state";
import { todayISO } from "@/lib/dates";
import { METRICS, type Metric, type MetricId } from "@/lib/metrics";
import type { Entry } from "@/lib/types";
import { CHROME, useTheme } from "./theme";
import { Button, Card, Disclosure, SectionTitle } from "./ui";

/**
 * As tres que se medem quase todos os dias ficam sempre visiveis; os
 * perimetros, que se medem uma vez por semana, ficam atras de um toque. Assim o
 * gesto diario cabe num ecra de telemovel sem deslizar.
 */
const DAILY: MetricId[] = ["peso", "abdomen", "gordura"];

function Field({
  metric,
  mode,
}: {
  metric: Metric;
  mode: "light" | "dark";
}) {
  const chrome = CHROME[mode];

  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs font-medium">
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
        <span style={{ color: chrome.inkSecondary }}>{metric.short}</span>
        <span style={{ color: chrome.muted }}>({metric.unit})</span>
      </span>
      <input
        type="text"
        name={metric.id}
        // "decimal" traz o teclado numerico no telemovel sem impor o ponto: a
        // virgula decimal e aceite na gravacao.
        inputMode="decimal"
        autoComplete="off"
        placeholder="--"
        className="touch tabular rounded-xl border px-3 text-base"
        style={{
          background: "var(--plane)",
          borderColor: "var(--border)",
          color: chrome.ink,
        }}
      />
    </label>
  );
}

export default function EntryForm({
  entries,
  date,
  onDate,
}: {
  entries: Entry[];
  date: string;
  onDate: (next: string) => void;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [state, formAction, pending] = useActionState(saveEntry, IDLE);
  const [showAll, setShowAll] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const existing = entries.find((e) => e.date === date) ?? null;

  const extras = METRICS.filter((m) => !DAILY.includes(m.id));
  const hasExtras =
    existing !== null && extras.some((m) => existing.values[m.id] !== null);

  /*
   * Ao mudar de dia, a seccao dos perimetros abre sozinha se esse dia ja os tem:
   * esconder valores que existem seria esconder o que o formulario esta prestes
   * a substituir. Fica como ajuste durante o render, e nao num efeito, para nao
   * pintar o formulario fechado e reabri-lo logo a seguir.
   */
  const [lastDate, setLastDate] = useState(date);
  if (date !== lastDate) {
    setLastDate(date);
    setShowAll(hasExtras);
  }

  /**
   * Ao escolher uma data ja registada, os campos passam a mostrar o que la
   * esta: gravar por cima e edicao deliberada, nao um duplicado acidental.
   *
   * Isto e sincronizacao com o DOM, nao estado do React: os campos nao sao
   * controlados, para que escrever neles nao passe por um render por tecla.
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
    <Card className="p-5">
      <SectionTitle hint="Deixa em branco o que nao mediste. Um registo por dia: gravar a mesma data substitui o anterior.">
        {existing ? "Editar registo" : "Registar medidas"}
      </SectionTitle>

      <form ref={formRef} action={formAction}>
        <label className="flex flex-col gap-1.5">
          <span
            className="text-xs font-medium"
            style={{ color: chrome.inkSecondary }}
          >
            Data
          </span>
          <input
            type="date"
            name="date"
            value={date}
            max={todayISO()}
            onChange={(event) => onDate(event.target.value)}
            required
            className="touch tabular w-full rounded-xl border px-3 text-base"
            style={{
              background: "var(--plane)",
              borderColor: "var(--border)",
              color: chrome.ink,
            }}
          />
        </label>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {METRICS.filter((m) => DAILY.includes(m.id)).map((metric) => (
            <Field key={metric.id} metric={metric} mode={mode} />
          ))}
        </div>

        {/* Os campos existem sempre no DOM; escondidos, mantem o valor que o
            efeito de preenchimento la pos, por isso abrir e fechar a seccao
            nunca apaga nada. */}
        <div className={showAll ? "mt-3" : "hidden"}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {extras.map((metric) => (
              <Field key={metric.id} metric={metric} mode={mode} />
            ))}
          </div>

          <label className="mt-3 flex flex-col gap-1.5">
            <span
              className="text-xs font-medium"
              style={{ color: chrome.inkSecondary }}
            >
              Nota (opcional)
            </span>
            <textarea
              name="nota"
              rows={2}
              maxLength={500}
              placeholder="Treino, sono, o que quiseres lembrar."
              className="rounded-xl border px-3 py-2 text-base"
              style={{
                background: "var(--plane)",
                borderColor: "var(--border)",
                color: chrome.ink,
              }}
            />
          </label>
        </div>

        <div className="mt-3 sm:max-w-xs">
          <Disclosure open={showAll} onToggle={() => setShowAll((open) => !open)}>
            {showAll ? "Menos campos" : "Perimetros e nota"}
          </Disclosure>
        </div>

        <div className="mt-5 sm:max-w-xs">
          <Button type="submit" variant="primary" disabled={pending} full>
            {pending
              ? "A guardar..."
              : existing
                ? "Atualizar registo"
                : "Guardar"}
          </Button>
        </div>

        {/* role="status" faz o leitor de ecra anunciar o resultado sem roubar o
            foco a quem esta a preencher. */}
        <p
          role="status"
          aria-live="polite"
          className="mt-3 text-center text-sm sm:text-left"
          style={{
            color: state.status === "erro" ? "#d03b3b" : chrome.inkSecondary,
          }}
        >
          {state.message}
        </p>
      </form>
    </Card>
  );
}
