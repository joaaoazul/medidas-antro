"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CHROME, useTheme } from "./theme";

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
        setMessage(payload.error ?? "Nao foi possivel importar.");
        return;
      }
      setMessage(`${payload.imported} registos importados.`);
      router.refresh();
    } catch {
      setError(true);
      setMessage("Nao foi possivel ler o ficheiro.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section
      className="rounded-xl border p-4"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
    >
      <h2 className="text-sm font-medium" style={{ color: chrome.ink }}>
        Copia de seguranca
      </h2>
      <p className="mt-0.5 text-xs" style={{ color: chrome.muted }}>
        Os dados ficam num ficheiro SQLite nesta maquina. Exporta de vez em
        quando -- e tambem a forma de os levar para outro lado.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <a
          href="/api/export?format=json"
          className="rounded-lg border px-3 py-1.5 text-xs"
          style={{ borderColor: "var(--border)", color: chrome.inkSecondary }}
        >
          Exportar JSON
        </a>
        <a
          href="/api/export?format=csv"
          className="rounded-lg border px-3 py-1.5 text-xs"
          style={{ borderColor: "var(--border)", color: chrome.inkSecondary }}
        >
          Exportar CSV
        </a>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border px-3 py-1.5 text-xs"
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
        <span className="text-xs" style={{ color: chrome.muted }}>
          {count} {count === 1 ? "registo" : "registos"} na base
        </span>
        <span
          role="status"
          aria-live="polite"
          className="text-xs"
          style={{ color: error ? "#d03b3b" : chrome.inkSecondary }}
        >
          {message}
        </span>
      </div>
    </section>
  );
}
