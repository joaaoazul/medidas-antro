"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { saveEntry } from "@/app/actions";
import { horaAgora, longLabel, todayISO } from "@/lib/dates";
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
   * Preenche os campos a partir da medicao em edicao, ou prepara-os para uma
   * nova.
   *
   * E sincronizacao com o DOM, nao estado do React: os campos nao sao
   * controlados, para que escrever neles nao passe por um render por tecla. A
   * data e a hora sao postas aqui, e nao em defaultValue, porque saem do
   * relogio -- durante o render, o servidor e o cliente podiam dar minutos ou
   * fusos diferentes, e a hidratacao acusava a divergencia.
   */
  const preencher = useCallback((medicao: Entry | null) => {
    const form = formRef.current;
    if (!form) return;

    for (const metric of METRICS) {
      const field = form.elements.namedItem(
        metric.id,
      ) as HTMLInputElement | null;
      if (field) {
        const valor = medicao?.values[metric.id] ?? null;
        field.value = valor === null ? "" : String(valor);
      }
    }

    const nota = form.elements.namedItem("nota") as HTMLTextAreaElement | null;
    if (nota) nota.value = medicao?.nota ?? "";

    const data = form.elements.namedItem("date") as HTMLInputElement | null;
    if (data) data.value = medicao?.date ?? todayISO();

    // Vem preenchida com a hora atual: e o campo que distingue duas medicoes do
    // mesmo dia, e obrigar a escolhe-la do zero a cada pesagem seria friccao sem
    // ganho nenhum.
    const hora = form.elements.namedItem("hora") as HTMLInputElement | null;
    if (hora) hora.value = medicao?.hora ?? horaAgora();
  }, []);

  useEffect(() => {
    preencher(editing);
  }, [editing, preencher]);

  /*
   * Ao mudar de medicao, a seccao dos perimetros abre sozinha se essa medicao ja
   * os tem: esconder valores que existem seria esconder o que o formulario esta
   * prestes a alterar.
   *
   * Fica como ajuste durante o render, e nao num efeito, para nao pintar o
   * formulario fechado e reabri-lo logo a seguir.
   */
  const editingId = editing?.id ?? null;
  const [ultimaMedicao, setUltimaMedicao] = useState<string | null>(null);
  if (editingId !== ultimaMedicao) {
    setUltimaMedicao(editingId);
    setShowAll(
      editing !== null && extras.some((m) => editing.values[m.id] !== null),
    );
  }

  // Depois de gravar uma medicao nova, os campos ficam prontos para a seguinte,
  // com a hora acertada no momento em que se gravou.
  useEffect(() => {
    if (state.status === "ok" && !editing) preencher(null);
  }, [state, editing, preencher]);

  return (
    <Card className="p-5">
      <SectionTitle
        hint={
          editing
            ? "Estás a alterar uma medição já gravada."
            : "Deixa em branco o que não mediste. Podes registar mais do que uma medição no mesmo dia -- é a hora que as distingue."
        }
      >
        {editing ? "Editar medição" : "Registar medidas"}
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
              Hora
            </span>
            {/* type="time" abre o seletor do proprio sistema -- a roda no iOS, o
                relogio no Android. Um seletor desenhado a mao seria pior: nao
                conhece o formato de 12 ou 24 horas de quem esta do outro lado,
                nem funciona com as ajudas de acessibilidade do telemovel. */}
            <input
              type="time"
              name="hora"
              required
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
            {showAll ? "Menos campos" : "Perímetros e nota"}
          </Disclosure>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex-1 sm:max-w-xs sm:flex-none">
            <Button type="submit" variant="primary" disabled={pending} full>
              {pending
                ? "A guardar..."
                : editing
                  ? "Guardar alterações"
                  : "Guardar"}
            </Button>
          </div>
          {editing ? (
            <Button onClick={onCancelEdit}>Cancelar edição</Button>
          ) : null}
        </div>

        {editing ? (
          <p className="mt-2 text-xs" style={{ color: chrome.muted }}>
            A editar a medição de {longLabel(editing.date)}
            {editing.hora ? ` às ${editing.hora}` : ""}.
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
