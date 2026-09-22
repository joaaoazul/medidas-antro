"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { classificar, lerCsv, type Classificacao, type ErroDeLinha } from "@/lib/csv";
import { longLabel } from "@/lib/dates";
import type { Entry } from "@/lib/types";
import type { EntryInput } from "@/lib/validation";
import { CHROME, useTheme } from "./theme";
import { Button, Card, SectionTitle } from "./ui";

/** O que um CSV lido traz, antes de se decidir importar. */
type Previa = {
  ficheiro: string;
  classificacao: Classificacao;
  erros: ErroDeLinha[];
  reconhecidas: string[];
  ignoradas: string[];
};

/** Linhas de erro mostradas antes de passar a conta-las. */
const MAX_ERROS = 5;

function intervalo(entradas: EntryInput[]): string {
  const datas = entradas.map((e) => e.date).sort();
  const [a, b] = [datas[0], datas[datas.length - 1]];
  return a === b ? `de ${longLabel(a)}` : `de ${longLabel(a)} a ${longLabel(b)}`;
}

export default function DataTransfer({ entries }: { entries: Entry[] }) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [aImportar, setAImportar] = useState(false);

  function avisar(texto: string, eErro = false) {
    setMessage(texto);
    setError(eErro);
  }

  /** O mesmo envio para o JSON e para o CSV: um pedido, tudo ou nada. */
  async function enviar(body: string): Promise<void> {
    avisar("A importar...");
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });
      // Sessao expirada: o middleware redireciona para /entrar e o fetch
      // segue. Nao e o ficheiro que esta mal, e isso tem de ficar dito.
      if (response.redirected) {
        avisar("A sessão expirou. Entra outra vez e repete a importação.", true);
        return;
      }
      const payload = await response.json();
      if (!response.ok) {
        avisar(payload.error ?? "Não foi possível importar.", true);
        return;
      }
      avisar(
        payload.imported === 1
          ? "1 medição importada."
          : `${payload.imported} medições importadas.`,
      );
      router.refresh();
    } catch {
      avisar("Não foi possível importar. Verifica a ligação.", true);
    }
  }

  async function onFile(file: File) {
    setPrevia(null);
    try {
      const texto = await file.text();
      const csv = /\.csv$/i.test(file.name) || file.type === "text/csv";

      // O JSON e uma copia de seguranca da propria app: leva ids, reconcilia
      // sozinho, e vai direto. O CSV vem de qualquer lado -- mostra-se primeiro.
      if (!csv) {
        await enviar(texto);
        return;
      }

      const leitura = lerCsv(texto);
      if (!leitura.ok) {
        avisar(leitura.mensagem, true);
        return;
      }
      avisar("");
      setPrevia({
        ficheiro: file.name,
        classificacao: classificar(leitura.medicoes, entries),
        erros: leitura.erros,
        reconhecidas: leitura.reconhecidas,
        ignoradas: leitura.ignoradas,
      });
    } catch {
      avisar("Não foi possível ler o ficheiro.", true);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function confirmar() {
    if (!previa) return;
    setAImportar(true);
    await enviar(
      JSON.stringify({
        entries: previa.classificacao.novas.map((n) => n.entrada),
      }),
    );
    setAImportar(false);
    setPrevia(null);
  }

  const novas = previa?.classificacao.novas ?? [];

  return (
    <Card className="p-5">
      <SectionTitle hint="Os dados ficam na base de dados, na Supabase. Exporta de vez em quando -- é também a forma de os levar para outro lado. Importa uma cópia da app (JSON) ou uma folha de cálculo (CSV).">
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
          Importar
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json,text/csv,.csv"
          className="sr-only"
          aria-label="Escolher ficheiro para importar"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onFile(file);
          }}
        />
      </div>

      {/*
       * A pre-visualizacao do CSV.
       *
       * Um CSV vem de qualquer lado, e o que parece a mesma folha pode ter as
       * colunas trocadas ou datas num formato que nao se esperava. Mostrar o
       * que vai entrar -- quantas, de quando a quando, o que ficou de fora e
       * porque -- antes de entrar e a unica forma de a pessoa dar por um erro
       * sem ter de o ir procurar no historico depois.
       */}
      {previa ? (
        <div
          className="mt-4 rounded-xl border p-4"
          style={{ borderColor: "var(--border)", background: "var(--plane)" }}
        >
          <p className="text-xs" style={{ color: chrome.muted }}>
            {previa.ficheiro}
          </p>

          <p className="mt-1 text-sm font-semibold" style={{ color: chrome.ink }}>
            {novas.length === 0
              ? "Nada de novo para importar."
              : novas.length === 1
                ? `1 medição nova, ${intervalo(novas.map((n) => n.entrada))}.`
                : `${novas.length} medições novas, ${intervalo(novas.map((n) => n.entrada))}.`}
          </p>

          <ul className="mt-2 flex flex-col gap-1 text-sm" style={{ color: chrome.inkSecondary }}>
            {previa.classificacao.iguais.length > 0 ? (
              <li>
                {previa.classificacao.iguais.length === 1
                  ? "1 já existe e fica como está."
                  : `${previa.classificacao.iguais.length} já existem e ficam como estão.`}
              </li>
            ) : null}
            {previa.classificacao.conflitos.length > 0 ? (
              <li>
                {previa.classificacao.conflitos.length === 1
                  ? "1 fica de fora: "
                  : `${previa.classificacao.conflitos.length} ficam de fora: `}
                já há uma medição nesse dia e hora com outros valores (
                {previa.classificacao.conflitos
                  .slice(0, 3)
                  .map((c) => `linha ${c.linha}`)
                  .join(", ")}
                {previa.classificacao.conflitos.length > 3 ? "..." : ""}).
              </li>
            ) : null}
          </ul>

          {previa.erros.length > 0 ? (
            <div className="mt-3">
              <p className="text-sm" style={{ color: "#d03b3b" }}>
                {previa.erros.length === 1
                  ? "1 linha com erros fica de fora:"
                  : `${previa.erros.length} linhas com erros ficam de fora:`}
              </p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {previa.erros.slice(0, MAX_ERROS).map((e) => (
                  <li key={e.linha} className="text-xs" style={{ color: chrome.inkSecondary }}>
                    Linha {e.linha}: {e.mensagem}
                  </li>
                ))}
                {previa.erros.length > MAX_ERROS ? (
                  <li className="text-xs" style={{ color: chrome.muted }}>
                    e mais {previa.erros.length - MAX_ERROS}.
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          <p className="mt-3 text-xs" style={{ color: chrome.muted }}>
            Colunas lidas: {previa.reconhecidas.join(", ")}.
            {previa.ignoradas.length > 0
              ? ` Ignoradas: ${previa.ignoradas.join(", ")}.`
              : ""}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {novas.length > 0 ? (
              <Button variant="primary" onClick={() => void confirmar()} disabled={aImportar}>
                {aImportar
                  ? "A importar..."
                  : novas.length === 1
                    ? "Importar 1 medição"
                    : `Importar ${novas.length} medições`}
              </Button>
            ) : null}
            <Button onClick={() => setPrevia(null)} disabled={aImportar}>
              {novas.length > 0 ? "Cancelar" : "Fechar"}
            </Button>
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-xs" style={{ color: chrome.muted }}>
        {entries.length} {entries.length === 1 ? "registo" : "registos"} na base.{" "}
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
