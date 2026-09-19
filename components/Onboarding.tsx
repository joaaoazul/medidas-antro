"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { completeOnboarding } from "@/app/bem-vindo/actions";
import { todayISO } from "@/lib/dates";
import { IDLE } from "@/lib/form-state";
import { IDADE_MINIMA } from "@/lib/legal";
import { OBJETIVOS, SEXOS } from "@/lib/profile";
import { CHROME, useTheme } from "./theme";
import { Button, Card, Chip, ChipRow } from "./ui";

const PASSOS = ["Termos", "Sobre ti", "Objetivos"] as const;

function Caixa({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];

  return (
    <label className="flex cursor-pointer items-start gap-3">
      {/* O valor so vai no formulario quando esta marcada; e por isso que o
          servidor pode confiar em "sim" e nao num booleano implicito. */}
      <input
        type="checkbox"
        name={name}
        value="sim"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 rounded"
        style={{ accentColor: chrome.ink }}
      />
      <span className="text-sm" style={{ color: chrome.inkSecondary }}>
        {children}
      </span>
    </label>
  );
}

export default function Onboarding({ email }: { email: string }) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [state, formAction, pending] = useActionState(completeOnboarding, IDLE);

  const [passo, setPasso] = useState(0);
  const [aceitaDocumentos, setAceitaDocumentos] = useState(false);
  const [aceitaSaude, setAceitaSaude] = useState(false);
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState<string | null>(null);
  const [objetivo, setObjetivo] = useState<string | null>(null);
  const [erroLocal, setErroLocal] = useState("");

  const field = "touch w-full rounded-xl border px-3 text-base";
  const fieldStyle = {
    background: "var(--plane)",
    borderColor: "var(--border)",
    color: chrome.ink,
  };
  const rotulo = "text-xs font-medium";

  function avancar() {
    if (passo === 0 && (!aceitaDocumentos || !aceitaSaude)) {
      setErroLocal("Marca as duas caixas para continuares.");
      return;
    }
    if (passo === 1 && nome.trim() === "") {
      setErroLocal("Escreve o teu nome.");
      return;
    }
    if (passo === 1 && dataNascimento === "") {
      setErroLocal("Preenche a data de nascimento.");
      return;
    }
    setErroLocal("");
    setPasso((p) => p + 1);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <header className="mb-5">
        <h1 className="text-xl font-semibold" style={{ color: chrome.ink }}>
          Bem-vindo
        </h1>
        <p className="mt-1 text-sm" style={{ color: chrome.muted }}>
          Tres passos rapidos e ficas a usar. Sessao iniciada como {email}.
        </p>
      </header>

      {/* Indicador de progresso: tres barras, nao um numero. Num telemovel, ver
          quanto falta vale mais do que ler "passo 2 de 3". */}
      <ol className="mb-5 flex gap-2" aria-label={`Passo ${passo + 1} de 3`}>
        {PASSOS.map((nomePasso, i) => (
          <li key={nomePasso} className="flex-1">
            <div
              className="h-1 rounded-full"
              style={{
                background: i <= passo ? chrome.ink : "var(--border)",
              }}
            />
            <span
              className="mt-1.5 block text-[11px]"
              style={{ color: i === passo ? chrome.ink : chrome.muted }}
            >
              {nomePasso}
            </span>
          </li>
        ))}
      </ol>

      <form action={formAction}>
        {/* Todos os passos ficam montados: escondidos, mantem o que ja foi
            escrito, por isso voltar atras nunca apaga nada. */}
        <Card className={passo === 0 ? "p-5" : "hidden"}>
          <h2 className="text-base font-medium" style={{ color: chrome.ink }}>
            Antes de comecares
          </h2>
          <p className="mt-2 text-sm" style={{ color: chrome.muted }}>
            Esta aplicacao guarda dados sobre o teu corpo. O Regulamento Geral
            sobre a Protecao de Dados trata-os como categoria especial, e exige
            que digas que sim de forma expressa -- por isso sao duas caixas, e
            nenhuma vem marcada.
          </p>

          <div className="mt-4 flex flex-col gap-4">
            <Caixa
              name="aceita_documentos"
              checked={aceitaDocumentos}
              onChange={setAceitaDocumentos}
            >
              Li e aceito os{" "}
              <Link
                href="/termos"
                target="_blank"
                className="underline"
                style={{ color: chrome.ink }}
              >
                Termos de Servico
              </Link>{" "}
              e a{" "}
              <Link
                href="/privacidade"
                target="_blank"
                className="underline"
                style={{ color: chrome.ink }}
              >
                Politica de Privacidade
              </Link>
              .
            </Caixa>

            <Caixa
              name="aceita_saude"
              checked={aceitaSaude}
              onChange={setAceitaSaude}
            >
              Consinto expressamente que os meus dados de saude -- peso, gordura
              corporal, massa muscular e perimetros -- sejam tratados para me
              mostrarem a minha evolucao. Posso retirar este consentimento
              quando quiser.
            </Caixa>
          </div>

          <p className="mt-4 text-xs" style={{ color: chrome.muted }}>
            Esta aplicacao nao presta aconselhamento medico. Os numeros que
            registas sao um registo do que mediste, nao um diagnostico.
          </p>
        </Card>

        <Card className={passo === 1 ? "p-5" : "hidden"}>
          <h2 className="text-base font-medium" style={{ color: chrome.ink }}>
            Sobre ti
          </h2>

          <div className="mt-4 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={rotulo} style={{ color: chrome.inkSecondary }}>
                Como queres ser tratado
              </span>
              <input
                type="text"
                name="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={80}
                autoComplete="given-name"
                className={field}
                style={fieldStyle}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={rotulo} style={{ color: chrome.inkSecondary }}>
                Data de nascimento
              </span>
              <input
                type="date"
                name="dataNascimento"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                max={todayISO()}
                className={`${field} tabular`}
                style={fieldStyle}
              />
              <span className="text-xs" style={{ color: chrome.muted }}>
                Precisamos dela para confirmar que tens {IDADE_MINIMA} anos ou
                mais.
              </span>
            </label>

            <div>
              <ChipRow label="Sexo (opcional)">
                {SEXOS.map((s) => (
                  <Chip
                    key={s.key}
                    selected={sexo === s.key}
                    onClick={() => setSexo(sexo === s.key ? null : s.key)}
                  >
                    {s.label}
                  </Chip>
                ))}
              </ChipRow>
              <input type="hidden" name="sexo" value={sexo ?? ""} />
              <p className="mt-1.5 text-xs" style={{ color: chrome.muted }}>
                As faixas de referencia de composicao corporal diferem. Se
                preferires nao dizer, nao digas.
              </p>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className={rotulo} style={{ color: chrome.inkSecondary }}>
                Altura em cm (opcional)
              </span>
              <input
                type="text"
                name="alturaCm"
                inputMode="decimal"
                placeholder="--"
                className={`${field} tabular`}
                style={fieldStyle}
              />
            </label>
          </div>
        </Card>

        <Card className={passo === 2 ? "p-5" : "hidden"}>
          <h2 className="text-base font-medium" style={{ color: chrome.ink }}>
            Objetivos
          </h2>
          <p className="mt-1 text-sm" style={{ color: chrome.muted }}>
            Tudo opcional, e tudo alteravel depois.
          </p>

          <div className="mt-4 flex flex-col gap-4">
            <div>
              <ChipRow label="O que queres">
                {OBJETIVOS.map((o) => (
                  <Chip
                    key={o.key}
                    selected={objetivo === o.key}
                    onClick={() =>
                      setObjetivo(objetivo === o.key ? null : o.key)
                    }
                  >
                    {o.label}
                  </Chip>
                ))}
              </ChipRow>
              <input type="hidden" name="objetivo" value={objetivo ?? ""} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={rotulo} style={{ color: chrome.inkSecondary }}>
                  Peso pretendido (kg)
                </span>
                <input
                  type="text"
                  name="objetivoPeso"
                  inputMode="decimal"
                  placeholder="--"
                  className={`${field} tabular`}
                  style={fieldStyle}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className={rotulo} style={{ color: chrome.inkSecondary }}>
                  Treinos por semana
                </span>
                <input
                  type="text"
                  name="treinosPorSemana"
                  inputMode="numeric"
                  placeholder="--"
                  className={`${field} tabular`}
                  style={fieldStyle}
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className={rotulo} style={{ color: chrome.inkSecondary }}>
                Alguma nota (opcional)
              </span>
              <textarea
                name="notas"
                rows={3}
                maxLength={500}
                placeholder="Lesoes, restricoes, o que quiseres deixar registado."
                className="rounded-xl border px-3 py-2 text-base"
                style={fieldStyle}
              />
            </label>
          </div>

          <p className="mt-4 text-xs" style={{ color: chrome.muted }}>
            Se disseres o peso pretendido, ele aparece como uma linha de
            referencia no grafico do peso.
          </p>
        </Card>

        <div className="mt-5 flex gap-3">
          {passo > 0 ? (
            <Button
              onClick={() => {
                setErroLocal("");
                setPasso((p) => p - 1);
              }}
            >
              Voltar
            </Button>
          ) : null}

          {passo < PASSOS.length - 1 ? (
            <div className="flex-1">
              <Button onClick={avancar} variant="primary" full>
                Continuar
              </Button>
            </div>
          ) : (
            <div className="flex-1">
              <Button type="submit" variant="primary" disabled={pending} full>
                {pending ? "A guardar..." : "Comecar"}
              </Button>
            </div>
          )}
        </div>

        <p
          role="status"
          aria-live="polite"
          className="mt-3 min-h-5 text-center text-sm"
          style={{ color: "#d03b3b" }}
        >
          {erroLocal || (state.status === "erro" ? state.message : "")}
        </p>
      </form>
    </div>
  );
}
