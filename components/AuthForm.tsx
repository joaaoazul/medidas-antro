"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/app/auth/actions";
import { IDLE } from "@/lib/form-state";
import { RESPONSAVEL } from "@/lib/legal";
import { CHROME, useTheme } from "./theme";
import { Button, Card } from "./ui";

/**
 * So entrar. Nao ha criar conta aqui.
 *
 * A aplicacao e de acesso restrito: as contas sao criadas pelo administrador. O
 * aviso sobre a palavra-passe esquecida esta a vista porque, sem recuperacao
 * automatica por email, quem se esquecer fica sem saber o que fazer -- e um
 * formulario que nao explica isso parece avariado.
 */
export default function AuthForm() {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [state, formAction, pending] = useActionState(signIn, IDLE);

  const field = "touch w-full rounded-xl border px-3 text-base";
  const fieldStyle = {
    background: "var(--plane)",
    borderColor: "var(--border)",
    color: chrome.ink,
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold" style={{ color: chrome.ink }}>
          Medidas
        </h1>
        <p className="mt-1 text-sm" style={{ color: chrome.muted }}>
          As tuas medidas ficam so tuas: cada registo esta preso a tua conta na
          propria base de dados.
        </p>
      </div>

      <Card className="p-5">
        <form action={formAction} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: chrome.inkSecondary }}>
              Email
            </span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              className={field}
              style={fieldStyle}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: chrome.inkSecondary }}>
              Palavra-passe
            </span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className={field}
              style={fieldStyle}
            />
          </label>

          <div className="mt-2">
            <Button type="submit" variant="primary" disabled={pending} full>
              {pending ? "Um momento..." : "Entrar"}
            </Button>
          </div>

          <p
            role="status"
            aria-live="polite"
            className="min-h-5 text-center text-sm"
            style={{
              color: state.status === "erro" ? "#d03b3b" : chrome.inkSecondary,
            }}
          >
            {state.message}
          </p>
        </form>
      </Card>

      <div
        className="mt-5 flex flex-col gap-3 text-center text-xs"
        style={{ color: chrome.muted }}
      >
        <p>
          Esqueceste-te da palavra-passe, ou precisas de conta? Fala com{" "}
          <span style={{ color: chrome.inkSecondary }}>{RESPONSAVEL.email}</span>
          . As contas desta aplicacao sao criadas pelo administrador.
        </p>
        <p className="flex justify-center gap-4">
          <Link href="/termos" style={{ color: chrome.inkSecondary }}>
            Termos de Servico
          </Link>
          <Link href="/privacidade" style={{ color: chrome.inkSecondary }}>
            Politica de Privacidade
          </Link>
        </p>
      </div>
    </div>
  );
}
