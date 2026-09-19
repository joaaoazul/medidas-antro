"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "@/app/auth/actions";
import { IDLE } from "@/lib/form-state";
import { CHROME, useTheme } from "./theme";
import { Button, Card, Segmented } from "./ui";

type Mode = "entrar" | "criar";

/**
 * Um painel por modo, e nao um formulario que troca de accao.
 *
 * A chave no componente pai remonta este painel ao mudar de modo, o que limpa
 * o estado da accao anterior. Sem isso, o erro "email ou palavra-passe errados"
 * ficava a olhar para quem tinha acabado de carregar em "Criar conta".
 */
function Panel({ mode }: { mode: Mode }) {
  const { mode: theme } = useTheme();
  const chrome = CHROME[theme];
  const [state, formAction, pending] = useActionState(
    mode === "entrar" ? signIn : signUp,
    IDLE,
  );

  const field = "touch w-full rounded-xl border px-3 text-base";
  const fieldStyle = {
    background: "var(--plane)",
    borderColor: "var(--border)",
    color: chrome.ink,
  };

  return (
    <form action={formAction} className="mt-5 flex flex-col gap-3">
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
          // Diz ao gestor de palavras-passe se deve oferecer a que ja tem ou
          // propor uma nova. Sem isto, criar conta preenche a antiga.
          autoComplete={mode === "entrar" ? "current-password" : "new-password"}
          minLength={8}
          required
          className={field}
          style={fieldStyle}
        />
        {mode === "criar" ? (
          <span className="text-xs" style={{ color: chrome.muted }}>
            Pelo menos 8 caracteres.
          </span>
        ) : null}
      </label>

      <div className="mt-2">
        <Button type="submit" variant="primary" disabled={pending} full>
          {pending
            ? "Um momento..."
            : mode === "entrar"
              ? "Entrar"
              : "Criar conta"}
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
  );
}

export default function AuthForm() {
  const { mode: theme } = useTheme();
  const chrome = CHROME[theme];
  const [mode, setMode] = useState<Mode>("entrar");

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
        <Segmented
          label="Entrar ou criar conta"
          value={mode}
          onChange={setMode}
          options={[
            { key: "entrar", label: "Entrar" },
            { key: "criar", label: "Criar conta" },
          ]}
        />
        <Panel key={mode} mode={mode} />
      </Card>
    </div>
  );
}
