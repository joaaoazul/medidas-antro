"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import {
  createAccount,
  deleteAccount,
  resetPassword,
} from "@/app/admin/actions";
import { ADMIN_IDLE, type AdminState } from "@/lib/form-state";
import { longLabel } from "@/lib/dates";
import { CHROME, useTheme } from "./theme";
import { Button, Card, SectionTitle } from "./ui";

export type Conta = {
  id: string;
  email: string;
  criadaEm: string;
  ultimaEntrada: string | null;
  passwordTemporaria: boolean;
};

/**
 * A palavra-passe temporaria aparece uma vez e nao volta.
 *
 * Nao e guardada em texto legivel em lado nenhum -- nem na base de dados, nem
 * em logs. Se esta mensagem se perder antes de ser entregue, o caminho e repor
 * outra vez.
 */
function Segredo({ valor }: { valor: string }) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [copiado, setCopiado] = useState(false);

  return (
    <div
      className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border p-3"
      style={{ borderColor: "var(--border)", background: "var(--plane)" }}
    >
      <code
        className="tabular text-base font-semibold tracking-wide"
        style={{ color: chrome.ink }}
      >
        {valor}
      </code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(valor);
            setCopiado(true);
          } catch {
            // Sem permissao para a area de transferencia: fica a leitura manual.
          }
        }}
        className="text-xs font-medium"
        style={{ color: chrome.inkSecondary }}
      >
        {copiado ? "Copiado" : "Copiar"}
      </button>
      <span className="text-xs" style={{ color: chrome.muted }}>
        So aparece agora.
      </span>
    </div>
  );
}

function Mensagem({ state }: { state: AdminState }) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  if (!state.message) return null;

  return (
    <div className="mt-3">
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
      {state.segredo ? <Segredo valor={state.segredo} /> : null}
    </div>
  );
}

function AccoesDaConta({ conta, euId }: { conta: Conta; euId: string }) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<AdminState>(ADMIN_IDLE);
  const [aConfirmar, setAConfirmar] = useState(false);

  const sou = conta.id === euId;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => setState(await resetPassword(conta.id)))
          }
          className="text-xs font-medium disabled:opacity-55"
          style={{ color: chrome.inkSecondary }}
        >
          Repor palavra-passe
        </button>

        {sou ? null : aConfirmar ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setState(await deleteAccount(conta.id));
                  setAConfirmar(false);
                })
              }
              className="text-xs font-medium"
              style={{ color: "#d03b3b" }}
            >
              Apagar mesmo, com todas as medidas
            </button>
            <button
              type="button"
              onClick={() => setAConfirmar(false)}
              className="text-xs"
              style={{ color: chrome.muted }}
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setAConfirmar(true)}
            className="text-xs"
            style={{ color: chrome.muted }}
          >
            Apagar conta
          </button>
        )}
      </div>
      <Mensagem state={state} />
    </div>
  );
}

export default function AdminPanel({
  contas,
  euId,
}: {
  contas: Conta[];
  euId: string;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [state, formAction, pending] = useActionState(
    createAccount,
    ADMIN_IDLE,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <Link href="/" className="text-sm" style={{ color: chrome.muted }}>
          &larr; Voltar a app
        </Link>
        <h1
          className="mt-4 text-xl font-semibold"
          style={{ color: chrome.ink }}
        >
          Administracao
        </h1>
        <p className="mt-1 text-sm" style={{ color: chrome.muted }}>
          Gestao de contas. Esta pagina nao da acesso as medidas nem aos perfis
          de ninguem: a base de dados recusa esse acesso, e nao e uma questao de
          politica interna.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <Card className="p-5">
          <SectionTitle hint="A conta e criada com uma palavra-passe temporaria que so aparece uma vez. Quem a receber tem de a mudar na primeira entrada.">
            Criar conta
          </SectionTitle>

          <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              name="email"
              required
              placeholder="email da pessoa"
              className="touch flex-1 rounded-xl border px-3 text-base"
              style={{
                background: "var(--plane)",
                borderColor: "var(--border)",
                color: chrome.ink,
              }}
            />
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "A criar..." : "Criar conta"}
            </Button>
          </form>

          <Mensagem state={state} />
        </Card>

        <Card className="p-5">
          <SectionTitle
            hint={`${contas.length} ${contas.length === 1 ? "conta" : "contas"} nesta aplicacao.`}
          >
            Contas
          </SectionTitle>

          <ul className="flex flex-col gap-4">
            {contas.map((conta) => (
              <li
                key={conta.id}
                className="border-t pt-4 first:border-t-0 first:pt-0"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span
                    className="text-sm font-medium break-all"
                    style={{ color: chrome.ink }}
                  >
                    {conta.email}
                  </span>
                  {conta.id === euId ? (
                    <span className="text-xs" style={{ color: chrome.muted }}>
                      (tu)
                    </span>
                  ) : null}
                  {conta.passwordTemporaria ? (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px]"
                      style={{
                        background: "var(--selected)",
                        color: chrome.inkSecondary,
                      }}
                    >
                      palavra-passe por mudar
                    </span>
                  ) : null}
                </div>

                <p className="mt-1 text-xs" style={{ color: chrome.muted }}>
                  Criada a {longLabel(conta.criadaEm)} &middot;{" "}
                  {conta.ultimaEntrada
                    ? `ultima entrada a ${longLabel(conta.ultimaEntrada)}`
                    : "ainda nao entrou"}
                </p>

                <AccoesDaConta conta={conta} euId={euId} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
