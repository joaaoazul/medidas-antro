"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LogoMark } from "@/components/Logo";

/**
 * O limite de erro da app.
 *
 * Nao existia: qualquer erro nao apanhado caia no ecra generico do Next, em
 * ingles, sem dizer nada a quem esta a meio de registar uma pesagem. Gravar e
 * apagar sem rede ja nao chegam aqui -- tem tratamento proprio --, mas este e
 * a rede de seguranca para o que ninguem previu.
 *
 * `retry` e nao `reset`: nesta versao do Next e o `retry` que volta a pedir os
 * dados ao servidor antes de desenhar outra vez; o `reset` so redesenhava com
 * o que ja havia, e o que falhou continuava a falhar.
 *
 * Nao mostra a mensagem do erro. Em producao, o Next substitui as mensagens
 * dos erros do servidor por um identificador, precisamente para nao expor
 * pormenores -- e uma mensagem tecnica nao ajudaria quem esta do outro lado.
 */
export default function Erro({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <LogoMark size={36} />
      <h1
        className="mt-6 text-xl font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Algo correu mal
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
        Não foi por nada que tenhas feito. As medições que já estavam gravadas
        continuam lá.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="touch rounded-xl px-4 text-sm font-medium"
          style={{ background: "var(--text-primary)", color: "var(--plane)" }}
        >
          Tentar outra vez
        </button>
        <Link
          href="/"
          className="touch flex items-center rounded-xl border px-4 text-sm font-medium"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          Voltar ao início
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
          Referência: <span className="tabular">{error.digest}</span>
        </p>
      ) : null}
    </main>
  );
}
