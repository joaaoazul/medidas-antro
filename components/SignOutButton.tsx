"use client";

import { useFormStatus } from "react-dom";
import { signOut } from "@/app/auth/actions";
import { CHROME, useTheme } from "./theme";

function Submit({ compact }: { compact: boolean }) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const { pending } = useFormStatus();

  if (compact) {
    return (
      <button
        type="submit"
        disabled={pending}
        aria-label="Terminar sessao"
        title="Terminar sessao"
        className="flex h-11 w-11 items-center justify-center rounded-xl border disabled:opacity-55"
        style={{ borderColor: "var(--border)", color: chrome.inkSecondary }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <path d="M16 17l5-5-5-5M21 12H9" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={pending}
      className="touch rounded-xl border px-3.5 text-sm font-medium disabled:opacity-55"
      style={{ borderColor: "var(--border)", color: chrome.inkSecondary }}
    >
      {pending ? "A sair..." : "Terminar sessao"}
    </button>
  );
}

/**
 * Um formulario com a server action em vez de um onClick: assim terminar sessao
 * e um POST, e nao um GET que um pre-carregamento de link ou um scanner de
 * antivirus pudesse disparar sozinho.
 */
export default function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={signOut}>
      <Submit compact={compact} />
    </form>
  );
}
