"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveEntry } from "@/app/actions";
import { longLabel, todayISO } from "@/lib/dates";
import { IDLE } from "@/lib/form-state";
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

function Field({ metric, mode }: { metric: Metric; mode: "light" | "dark" }) {
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
  /** Medicao a editar; nulo quando o formulario cria uma nova. */
  editing,
  onCancelEdit,
}: {
  editing: Entry | null;
  onCancelEdit: () => void;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [state, formAction, pending] = useActionState(saveEntry, IDLE);
  const [showAll, setShowAll] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const extras = METRICS.filter((m) => !DAILY.includes(m.id));

  /**
   * Preenche os campos a partir da medicao em edicao, e limpa-os ao sair da
   * edicao.
   *
   * E sincronizacao com o DOM, nao estado do React: os campos nao sao
   * controlados, para que escrever neles nao passe por um render por tecla.
   */
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    for (const metric of METRICS) {
      const field = form.elements.namedItem(
        metric.id,
      ) as HTMLInputElement | null;
      if (field) {
        const valor = editing?.values[metric.id] ?? null;
        field.value = valor === null ? "" : String(valor);
      }
    }

    const nota = form.elements.namedItem("nota") as HTMLTextAreaElement | null;
    if (nota) nota.value = editing?.nota ?? "";

    const data = form.elements.namedItem("date") as HTMLInputElement | null;
    if (data) data.value = editing?.date ?? todayISO();

    const hora = form.elements.namedItem("hora") as HTMLInputElement | null;
    if (hora) hora.value = editing?.hora ?? "";

    // Ao editar uma medicao que tem perimetros, a seccao abre: esconder valores
    // que ja existem seria esconder o que o formulario esta prestes a alterar.
    setShowAll(
      editing !== null && extras.some((m) => editing.values[m.id] !== null),
    );
    // extras e estavel (deriva de uma constante), por isso so a medicao conta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  // Depois de gravar uma medicao nova, os campos ficam limpos para a seguinte.
  useEffect(() => {
    if (state.status === "ok" && !editing) formRef.current?.reset();
  }, [state, editing]);

  return (
    <Card className="p-5">
      <SectionTitle
        hint={
          editing
            ? "Estas a alterar uma medicao ja gravada."
            : "Deixa em branco o que nao mediste. Podes registar mais do que uma medicao no mesmo dia -- de manha e a noite, por exemplo."
        }
      >
        {editing ? "Editar medicao" : "Registar medidas"}
      </SectionTitle>

      <form ref={formRef} action={formAction}>
        {/* Sem id, a gravacao cria uma medicao nova; com id, altera aquela. */}
        <input type="hidden" name="id" value={editing?.id ?? ""} />

        <div className="grid grid-cols-2 gap-3">
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
              defaultValue={todayISO()}
              max={todayISO()}
              required
              className="touch tabular w-full rounded-xl border px-3 text-base"
              style={{
                background: "var(--plane)",
                borderColor: "var(--border)",
                color: chrome.ink,
              }}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span
              className="text-xs font-medium"
              style={{ color: chrome.inkSecondary }}
            >
              Hora (opcional)
            </span>
            <input
              type="time"
              name="hora"
              className="touch tabular w-full rounded-xl border px-3 text-base"
              style={{
                background: "var(--plane)",
                borderColor: "var(--border)",
                color: chrome.ink,
              }}
            />
          </label>
        </div>

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
          <Disclosure open={showAll} onToggle={() => setShowAll((o) => !o)}>
            {showAll ? "Menos campos" : "Perimetros e nota"}
          </Disclosure>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex-1 sm:max-w-xs sm:flex-none">
            <Button type="submit" variant="primary" disabled={pending} full>
              {pending
                ? "A guardar..."
                : editing
                  ? "Guardar alteracoes"
                  : "Guardar"}
            </Button>
          </div>
          {editing ? (
            <Button onClick={onCancelEdit}>Cancelar edicao</Button>
          ) : null}
        </div>

        {editing ? (
          <p className="mt-2 text-xs" style={{ color: chrome.muted }}>
            A editar a medicao de {longLabel(editing.date)}
            {editing.hora ? ` as ${editing.hora}` : ""}.
          </p>
        ) : null}

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
