"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CHROME, useTheme } from "./theme";
import { Card, SectionTitle } from "./ui";

export default function DataTransfer({ count }: { count: number }) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function onFile(file: File) {
    setMessage("A importar...");
    setError(false);
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: await file.text(),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(true);
        setMessage(payload.error ?? "Não foi possível importar.");
        return;
      }
      setMessage(`${payload.imported} registos importados.`);
      router.refresh();
    } catch {
      setError(true);
      setMessage("Não foi possível ler o ficheiro.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Card className="p-5">
      <SectionTitle hint="Os dados ficam na base de dados, na Supabase. Exporta de vez em quando -- é também a forma de os levar para outro lado.">
        Cópia de segurança
      </SectionTitle>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <a
          href="/api/export?format=json"
          className="touch flex items-center rounded-xl border px-3.5 text-sm font-medium"
          style={{ borderColor: "var(--border)", color: chrome.inkSecondary }}
        >
          Exportar JSON
        </a>
        <a
          href="/api/export?format=csv"
          className="touch flex items-center rounded-xl border px-3.5 text-sm font-medium"
          style={{ borderColor: "var(--border)", color: chrome.inkSecondary }}
        >
          Exportar CSV
        </a>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="touch rounded-xl border px-3.5 text-sm font-medium"
          style={{ borderColor: "var(--border)", color: chrome.inkSecondary }}
        >
          Importar JSON
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onFile(file);
          }}
        />
      </div>

      <p className="mt-3 text-xs" style={{ color: chrome.muted }}>
        {count} {count === 1 ? "registo" : "registos"} na base.{" "}
        <span
          role="status"
          aria-live="polite"
          style={{ color: error ? "#d03b3b" : chrome.inkSecondary }}
        >
          {message}
        </span>
      </p>
    </Card>
  );
}
