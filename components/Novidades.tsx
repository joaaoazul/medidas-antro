"use client";

import Link from "next/link";
import { ARTICLES } from "@/lib/articles";
import { METRIC_BY_ID } from "@/lib/metrics";
import {
  NOVIDADES_ATTR,
  NOVIDADES_KEY,
  NOVIDADES_VERSAO,
} from "@/lib/novidades";
import { MIN_TREND_POINTS, withTrend } from "@/lib/series";
import { TOOLS } from "@/lib/tools";
import type { Point } from "@/lib/types";
import { CHROME, useTheme } from "./theme";
import { Card } from "./ui";

/**
 * Serie de demonstracao, para quem ainda nao tem medicoes que cheguem.
 *
 * Os valores estao escritos a mao e nao sorteados: um `Math.random()` daria
 * numeros diferentes no servidor e no cliente, e a hidratacao acusava a
 * divergencia. Sao 24 dias de uma descida com o ruido tipico de uma balanca --
 * e exatamente o ruido que a linha de tendencia existe para atravessar.
 */
const DEMO_VALORES = [
  82.4, 82.1, 82.7, 82.3, 82.4, 81.8, 82.2, 81.9, 81.3, 81.7, 81.8, 81.1,
  81.4, 80.8, 81.2, 81.3, 80.6, 80.9, 80.4, 80.8, 80.2, 80.5, 79.8, 80.1,
];

const DEMO_PONTOS: Point[] = DEMO_VALORES.map((value, i) => ({
  bucket: String(i),
  t: i * 86_400_000,
  value,
  samples: 1,
}));

/** Pontos mostrados na demonstracao: a fase recente, nao a historia toda. */
const DEMO_JANELA = 24;

const LARGURA = 260;
const ALTURA = 64;

/**
 * A demonstracao da tendencia, com os dados de quem esta a ler sempre que os
 * houver.
 *
 * Explicar uma linha de tendencia por palavras e muito menos eficaz do que
 * mostra-la, e mostra-la com o peso da propria pessoa poupa a traducao mental
 * entre o exemplo e o caso dela.
 */
function Demo({ points, color }: { points: Point[]; color: string }) {
  const reais = points.filter((p) => p.value !== null);
  const usarReais = reais.length >= MIN_TREND_POINTS;
  const serie = usarReais ? reais.slice(-DEMO_JANELA) : DEMO_PONTOS;
  const rows = withTrend(serie);

  const valores = rows.flatMap((r) =>
    r.value === null ? [] : [r.value, r.trend ?? r.value],
  );
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const span = max - min || 1;
  const pad = 6;

  const caminho = (chave: "value" | "trend") =>
    rows
      .map((row, i) => {
        const v = row[chave];
        if (v === null || v === undefined) return null;
        const x = pad + (i / Math.max(1, rows.length - 1)) * (LARGURA - pad * 2);
        const y = ALTURA - pad - ((v - min) / span) * (ALTURA - pad * 2);
        return `${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .filter((c): c is string => c !== null)
      .map((c, i) => `${i === 0 ? "M" : "L"}${c}`)
      .join(" ");

  return (
    <div className="flex flex-col items-start">
      <svg
        width={LARGURA}
        height={ALTURA}
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        className="max-w-full"
        role="img"
        aria-label={
          usarReais
            ? "As tuas últimas medições de peso, com a linha de tendência por cima."
            : "Exemplo: medições dia a dia, com a linha de tendência por cima."
        }
      >
        {/* A mesma gramatica do grafico a serio: a tendencia por baixo e
            esbatida, os pontos medidos por cima e na cor cheia. */}
        <path
          d={caminho("trend")}
          fill="none"
          stroke={color}
          strokeOpacity={0.35}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={caminho("value")}
          fill="none"
          stroke={color}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!usarReais ? (
        <span className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
          exemplo
        </span>
      ) : null}
    </div>
  );
}

function Atalho({
  href,
  titulo,
  descricao,
}: {
  href: string;
  titulo: string;
  descricao: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl border p-3"
      style={{ borderColor: "var(--border)" }}
    >
      <span className="min-w-0">
        <span
          className="block text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {titulo}
        </span>
        <span
          className="mt-0.5 block text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          {descricao}
        </span>
      </span>
      <span aria-hidden className="shrink-0" style={{ color: "var(--text-muted)" }}>
        &rarr;
      </span>
    </Link>
  );
}

/**
 * O que ha de novo, a entrada -- e uma vez so.
 *
 * Fica acima do cartao do peso, que e o unico sitio onde se descobre sem ir
 * procurar, mas sai do caminho ao primeiro toque no X e nao volta ate a versao
 * seguinte. Nao concorre com a figura heroi da vista: nao e um numero, e um
 * aviso, e desaparece de vez.
 */
export default function Novidades({
  points,
  onAbrirEvolucao,
}: {
  points: Point[];
  /** Leva ao separador onde a tendencia esta. */
  onAbrirEvolucao: () => void;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const color = METRIC_BY_ID.peso.color[mode];

  function dispensar() {
    try {
      localStorage.setItem(NOVIDADES_KEY, NOVIDADES_VERSAO);
    } catch {
      // Modo privado ou armazenamento bloqueado: o cartao volta na proxima
      // visita. E o mal menor -- a alternativa era nao o poder fechar.
    }
    document.documentElement.dataset[NOVIDADES_ATTR] = "vistas";
  }

  return (
    <div data-novidades-card>
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              className="text-sm font-semibold"
              style={{ color: chrome.ink }}
            >
              Novidades
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: chrome.muted }}>
              Aparece uma vez. Podes fechar.
            </p>
          </div>
          <button
            type="button"
            onClick={dispensar}
            aria-label="Dispensar as novidades"
            className="-mt-1.5 -mr-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ color: chrome.muted }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* No ecra grande a demonstracao poe-se ao lado do texto: centrada num
            cartao de 1100px, uma figura de 260px fica a boiar no meio do vazio. */}
        <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-[260px_1fr] sm:items-center">
          <Demo points={points} color={color} />

          <div>
            <h3 className="text-sm font-medium" style={{ color: chrome.ink }}>
              Linha de tendência
            </h3>
            <p
              className="mt-1 text-sm leading-relaxed"
              style={{ color: chrome.inkSecondary }}
            >
              Uma pesagem isolada diz pouco -- água, sal e sono movem a balança
              sem nada ter mudado. Os pontos continuam a ser as tuas medições; a
              linha grossa diz para onde elas vão.
            </p>

            {/* Um botao com altura de toque, e nao a palavra "Evolucao"
                sublinhada no meio da frase: um alvo de uma palavra falha-se
                com o polegar, e a regra dos 44px vale tambem aqui. */}
            <button
              type="button"
              onClick={onAbrirEvolucao}
              className="touch -ml-1 flex items-center gap-2 rounded-xl px-1 text-sm font-medium"
              style={{ color: chrome.ink }}
            >
              Abrir a Evolução
              <span aria-hidden style={{ color: chrome.muted }}>
                &rarr;
              </span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Atalho
            href="/artigos"
            titulo="Aprender"
            descricao={`${ARTICLES.length} artigos curtos sobre medidas e o corpo.`}
          />
          <Atalho
            href="/ferramentas"
            titulo="Ferramentas"
            descricao={`${TOOLS.length} calculadoras, já preenchidas com os teus registos.`}
          />
        </div>
      </Card>
    </div>
  );
}
