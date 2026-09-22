"use client";

import Link from "next/link";
import { longLabel } from "@/lib/dates";
import type { Pendente } from "@/lib/fila-offline";
import { METRICS, formatValue } from "@/lib/metrics";
import type { Fila } from "./fila";
import { CHROME, useTheme } from "./theme";
import { Button, Card } from "./ui";

/** "22 set 2026 às 08:00 · 80.4 kg" -- o suficiente para a reconhecer. */
function descrever(p: Pendente): string {
  const { entrada } = p;
  const quando = entrada.hora
    ? `${longLabel(entrada.date)} às ${entrada.hora}`
    : longLabel(entrada.date);
  const primeira = METRICS.find((m) => entrada.values[m.id] !== null);
  return primeira
    ? `${quando} · ${formatValue(primeira.id, entrada.values[primeira.id])} ${primeira.unit}`
    : quando;
}

/**
 * O que ficou guardado no aparelho e ainda nao chegou ao servidor.
 *
 * Existe para a pessoa nunca ter de adivinhar onde esta a pesagem que acabou
 * de fazer. Enquanto ela nao chega, nao aparece nos cartoes nem nos graficos
 * -- que mostram o que esta gravado --, e sem este aviso pareceria perdida.
 *
 * Diz porque e que ainda nao foi, porque o que fazer depende disso: sem rede
 * espera-se; com a sessao expirada, esperar nao resolve nada.
 */
export default function FilaPendente({ fila }: { fila: Fila }) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const { pendentes, estado, descartar, enviarAgora } = fila;

  const aEspera = pendentes.filter((p) => !p.falha);
  const recusadas = pendentes.filter((p) => p.falha);

  if (pendentes.length === 0) {
    return estado.tipo === "enviadas" && estado.n > 0 ? (
      <p
        role="status"
        className="px-1 text-center text-sm"
        style={{ color: chrome.inkSecondary }}
      >
        {estado.n === 1
          ? "A medição guardada sem rede já foi enviada."
          : `As ${estado.n} medições guardadas sem rede já foram enviadas.`}
      </p>
    ) : null;
  }

  const porque =
    estado.tipo === "sem-sessao"
      ? "A sessão expirou. Ficam guardadas neste aparelho até entrares outra vez."
      : estado.tipo === "servidor"
        ? "O servidor não respondeu. Tenta-se outra vez sozinho, ou agora."
        : estado.tipo === "a-enviar"
          ? "A enviar..."
          : "Ficaram guardadas neste aparelho e seguem sozinhas quando voltar a ligação.";

  return (
    <Card className="p-5">
      <div role="status" aria-live="polite">
        {aEspera.length > 0 ? (
          <>
            <h2 className="text-sm font-semibold" style={{ color: chrome.ink }}>
              {aEspera.length === 1
                ? "1 medição à espera de rede"
                : `${aEspera.length} medições à espera de rede`}
            </h2>
            <p className="mt-1 text-sm" style={{ color: chrome.inkSecondary }}>
              {porque}
            </p>
            <ul className="mt-2 flex flex-col gap-0.5">
              {aEspera.map((p) => (
                <li
                  key={p.entrada.id}
                  className="tabular text-xs"
                  style={{ color: chrome.muted }}
                >
                  {descrever(p)}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {estado.tipo === "sem-sessao" ? (
                <Link
                  href="/entrar"
                  className="touch flex items-center rounded-xl border px-3.5 text-sm font-medium"
                  style={{ borderColor: "var(--border)", color: chrome.ink }}
                >
                  Entrar outra vez
                </Link>
              ) : (
                <Button
                  onClick={() => void enviarAgora()}
                  disabled={estado.tipo === "a-enviar"}
                >
                  Enviar agora
                </Button>
              )}
            </div>
          </>
        ) : null}

        {/* Uma recusa nao melhora com tempo -- nao se reenvia sozinha. Fica a
            vista, com a razao, ate a pessoa decidir. */}
        {recusadas.length > 0 ? (
          <div className={aEspera.length > 0 ? "mt-4 border-t pt-4" : ""} style={{ borderColor: "var(--border)" }}>
            <h2 className="text-sm font-semibold" style={{ color: chrome.ink }}>
              {recusadas.length === 1
                ? "Uma medição guardada sem rede não foi aceite"
                : `${recusadas.length} medições guardadas sem rede não foram aceites`}
            </h2>
            <ul className="mt-2 flex flex-col gap-2">
              {recusadas.map((p) => (
                <li key={p.entrada.id} className="flex items-start justify-between gap-3">
                  <span className="min-w-0 text-sm">
                    <span className="tabular block" style={{ color: chrome.inkSecondary }}>
                      {descrever(p)}
                    </span>
                    <span className="block text-xs" style={{ color: "#d03b3b" }}>
                      {p.falha}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => descartar(p.entrada.id)}
                    className="touch shrink-0 rounded-xl px-2 text-xs"
                    style={{ color: chrome.muted }}
                    aria-label={`Descartar a medição de ${descrever(p)}`}
                  >
                    Descartar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
