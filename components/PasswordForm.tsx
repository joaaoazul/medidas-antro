"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/auth/actions";
import { IDLE } from "@/lib/form-state";
import { CHROME, useTheme } from "./theme";
import { Button, Card, SectionTitle } from "./ui";

export default function PasswordForm({ obrigatoria }: { obrigatoria: boolean }) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const [state, formAction, pending] = useActionState(changePassword, IDLE);

  const field = "touch w-full rounded-xl border px-3 text-base";
  const fieldStyle = {
    background: "var(--plane)",
    borderColor: "var(--border)",
    color: chrome.ink,
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <Card className="p-5">
        <SectionTitle
          hint={
            obrigatoria
              ? "A palavra-passe que tens agora foi criada pelo administrador, que a conhece. Escolhe uma so tua antes de continuares."
              : "Escolhe uma palavra-passe nova."
          }
        >
          {obrigatoria ? "Escolhe a tua palavra-passe" : "Mudar a palavra-passe"}
        </SectionTitle>

        <form action={formAction} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: chrome.inkSecondary }}>
              Palavra-passe nova
            </span>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              required
              className={field}
              style={fieldStyle}
            />
            <span className="text-xs" style={{ color: chrome.muted }}>
              Pelo menos 8 caracteres.
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: chrome.inkSecondary }}>
              Repete a palavra-passe
            </span>
            <input
              type="password"
              name="confirmacao"
              autoComplete="new-password"
              minLength={8}
              required
              className={field}
              style={fieldStyle}
            />
          </label>

          <div className="mt-2">
            <Button type="submit" variant="primary" disabled={pending} full>
              {pending ? "A guardar..." : "Guardar palavra-passe"}
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
    </div>
  );
}
