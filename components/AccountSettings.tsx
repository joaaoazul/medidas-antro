"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { eraseEntries, updateProfile } from "@/app/conta/actions";
import { longLabel } from "@/lib/dates";
import { IDLE, type ActionState } from "@/lib/form-state";
import { RESPONSAVEL } from "@/lib/legal";
import { OBJETIVOS, SEXOS, type Consent, type Profile } from "@/lib/profile";
import PasswordForm from "./PasswordForm";
import SignOutButton from "./SignOutButton";
import { CHROME, useTheme } from "./theme";
import { Button, Card, Chip, ChipRow, SectionTitle } from "./ui";

function DadosPessoais({ profile }: { profile: Profile | null }) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [state, formAction, pending] = useActionState(updateProfile, IDLE);
  const [sexo, setSexo] = useState<string | null>(profile?.sexo ?? null);
  const [objetivo, setObjetivo] = useState<string | null>(
    profile?.objetivo ?? null,
  );

  const field = "touch w-full rounded-xl border px-3 text-base";
  const fieldStyle = {
    background: "var(--plane)",
    borderColor: "var(--border)",
    color: chrome.ink,
  };
  const rotulo = "text-xs font-medium";

  return (
    <Card className="p-5">
      <SectionTitle hint="Podes mudar tudo isto quando quiseres. O peso pretendido aparece como linha de referencia no grafico do peso.">
        Os teus dados
      </SectionTitle>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={rotulo} style={{ color: chrome.inkSecondary }}>
              Nome
            </span>
            <input
              type="text"
              name="nome"
              defaultValue={profile?.nome ?? ""}
              maxLength={80}
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
              defaultValue={profile?.dataNascimento ?? ""}
              className={`${field} tabular`}
              style={fieldStyle}
            />
          </label>
        </div>

        <div>
          <ChipRow label="Sexo">
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
        </div>

        <div>
          <ChipRow label="Objetivo">
            {OBJETIVOS.map((o) => (
              <Chip
                key={o.key}
                selected={objetivo === o.key}
                onClick={() => setObjetivo(objetivo === o.key ? null : o.key)}
              >
                {o.label}
              </Chip>
            ))}
          </ChipRow>
          <input type="hidden" name="objetivo" value={objetivo ?? ""} />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className={rotulo} style={{ color: chrome.inkSecondary }}>
              Altura (cm)
            </span>
            <input
              type="text"
              name="alturaCm"
              inputMode="decimal"
              placeholder="--"
              defaultValue={profile?.alturaCm ?? ""}
              className={`${field} tabular`}
              style={fieldStyle}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={rotulo} style={{ color: chrome.inkSecondary }}>
              Peso pretendido (kg)
            </span>
            <input
              type="text"
              name="objetivoPeso"
              inputMode="decimal"
              placeholder="--"
              defaultValue={profile?.objetivoPeso ?? ""}
              className={`${field} tabular`}
              style={fieldStyle}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={rotulo} style={{ color: chrome.inkSecondary }}>
              Treinos/semana
            </span>
            <input
              type="text"
              name="treinosPorSemana"
              inputMode="numeric"
              placeholder="--"
              defaultValue={profile?.treinosPorSemana ?? ""}
              className={`${field} tabular`}
              style={fieldStyle}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={rotulo} style={{ color: chrome.inkSecondary }}>
            Notas
          </span>
          <textarea
            name="notas"
            rows={3}
            maxLength={500}
            defaultValue={profile?.notas ?? ""}
            placeholder="Lesoes, restricoes, o que quiseres deixar registado."
            className="rounded-xl border px-3 py-2 text-base"
            style={fieldStyle}
          />
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <div className="sm:max-w-xs">
            <Button type="submit" variant="primary" disabled={pending} full>
              {pending ? "A guardar..." : "Guardar"}
            </Button>
          </div>
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
    </Card>
  );
}

/**
 * Apagar tudo pede a palavra escrita, e nao um segundo toque.
 *
 * Nao ha desfazer nenhum: escrever "APAGAR" obriga a parar e a ler o que vai
 * acontecer, coisa que um segundo botao ao lado do primeiro nao obriga.
 */
function ApagarRegistos({ total }: { total: number }) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [state, setState] = useState<ActionState>(IDLE);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      {!aberto ? (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="text-sm"
          style={{ color: chrome.muted }}
        >
          Apagar todos os registos
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: chrome.inkSecondary }}>
            Isto apaga {total} {total === 1 ? "registo" : "registos"} e nao tem
            desfazer. A conta fica, e podes voltar a registar. Exporta antes, se
            houver alguma hipotese de quereres isto de volta.
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs" style={{ color: chrome.muted }}>
              Escreve APAGAR para confirmar
            </span>
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="touch rounded-xl border px-3 text-base sm:max-w-xs"
              style={{
                background: "var(--plane)",
                borderColor: "var(--border)",
                color: chrome.ink,
              }}
            />
          </label>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              disabled={texto !== "APAGAR" || pending}
              onClick={() =>
                startTransition(async () => {
                  setState(await eraseEntries());
                  setAberto(false);
                  setTexto("");
                })
              }
              className="text-sm font-medium disabled:opacity-40"
              style={{ color: "#d03b3b" }}
            >
              {pending ? "A apagar..." : "Apagar tudo"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                setTexto("");
              }}
              className="text-sm"
              style={{ color: chrome.muted }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <p
        role="status"
        aria-live="polite"
        className="mt-2 text-sm"
        style={{ color: chrome.inkSecondary }}
      >
        {state.message}
      </p>
    </div>
  );
}

export default function AccountSettings({
  email,
  profile,
  consents,
  admin,
  totalRegistos,
}: {
  email: string;
  profile: Profile | null;
  consents: Consent[];
  admin: boolean;
  totalRegistos: number;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <Link href="/" className="text-sm" style={{ color: chrome.muted }}>
          &larr; Voltar
        </Link>
        <h1
          className="mt-4 text-xl font-semibold"
          style={{ color: chrome.ink }}
        >
          Definicoes da conta
        </h1>
      </header>

      <div className="flex flex-col gap-4">
        <DadosPessoais profile={profile} />

        <Card className="p-5">
          <PasswordForm obrigatoria={false} embutido />
        </Card>

        <Card className="p-5">
          <SectionTitle>Conta</SectionTitle>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <dt style={{ color: chrome.muted }}>Email</dt>
              <dd className="break-all" style={{ color: chrome.ink }}>
                {email}
              </dd>
            </div>
            {profile?.onboardingEm ? (
              <div className="flex flex-wrap items-baseline gap-x-3">
                <dt style={{ color: chrome.muted }}>Conta ativa desde</dt>
                <dd style={{ color: chrome.ink }}>
                  {longLabel(profile.onboardingEm.slice(0, 10))}
                </dd>
              </div>
            ) : null}
          </dl>

          {/*
            Mudar o email e apagar a conta ficam com o administrador de
            proposito. O email e a identidade de entrada: muda-lo pela app exigia
            confirmacao por email, e esta aplicacao nao envia nenhum. Apagar a
            conta nao tem desfazer, e leva as medidas todas com ela.
          */}
          <p className="mt-4 text-sm" style={{ color: chrome.muted }}>
            Para mudar o email, apagar a conta ou retirar o consentimento, fala
            com{" "}
            <span style={{ color: chrome.inkSecondary }}>
              {RESPONSAVEL.email}
            </span>
            . Sao coisas que nao se desfazem, por isso nao ficam a um toque de
            distancia.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <SignOutButton />
            {admin ? (
              <Link
                href="/admin"
                className="text-sm"
                style={{ color: chrome.inkSecondary }}
              >
                Administracao
              </Link>
            ) : null}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle hint="O que aceitaste, e quando. Fica registado para se poder demonstrar, como o RGPD exige.">
            Consentimentos
          </SectionTitle>

          {consents.length === 0 ? (
            <p className="text-sm" style={{ color: chrome.muted }}>
              Sem registos.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {consents.map((c, i) => (
                <li
                  key={`${c.documento}-${c.versao}-${i}`}
                  className="flex flex-wrap items-baseline gap-x-2"
                >
                  <span style={{ color: chrome.ink }}>
                    {c.documento === "termos"
                      ? "Termos de Servico"
                      : "Politica de Privacidade"}
                  </span>
                  <span className="text-xs" style={{ color: chrome.muted }}>
                    versao {c.versao} &middot; aceite a{" "}
                    {longLabel(c.aceite_em.slice(0, 10))}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Link href="/termos" style={{ color: chrome.inkSecondary }}>
              Ler os Termos
            </Link>
            <Link href="/privacidade" style={{ color: chrome.inkSecondary }}>
              Ler a Politica de Privacidade
            </Link>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle hint="Leva os teus dados contigo, em formatos abertos, quando quiseres.">
            Os teus registos
          </SectionTitle>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/api/export?format=json"
              className="touch flex items-center rounded-xl border px-3.5 text-sm font-medium"
              style={{
                borderColor: "var(--border)",
                color: chrome.inkSecondary,
              }}
            >
              Exportar JSON
            </a>
            <a
              href="/api/export?format=csv"
              className="touch flex items-center rounded-xl border px-3.5 text-sm font-medium"
              style={{
                borderColor: "var(--border)",
                color: chrome.inkSecondary,
              }}
            >
              Exportar CSV
            </a>
            <span className="text-sm" style={{ color: chrome.muted }}>
              {totalRegistos}{" "}
              {totalRegistos === 1 ? "dia registado" : "dias registados"}
            </span>
          </div>

          <div
            className="mt-5 border-t pt-4"
            style={{ borderColor: "var(--border)" }}
          >
            <ApagarRegistos total={totalRegistos} />
          </div>
        </Card>
      </div>
    </div>
  );
}
