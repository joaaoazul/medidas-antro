"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArticleBadge } from "./ArticleIcon";
import { insights } from "@/lib/insights";
import { getArticle } from "@/lib/articles";
import type { Entry } from "@/lib/types";
import { CHROME, useTheme } from "./theme";
import { Card, SectionTitle } from "./ui";

/**
 * O que os registos dizem, por baixo do grafico.
 *
 * Fica na Evolucao e nao no Hoje de proposito: o Hoje responde a "como estou, e
 * ja registei?" e tem o gesto diario a defender; a Evolucao e o separador onde
 * ja se veio ler, e ler e interpretar. Por baixo do grafico, e nao por cima,
 * porque e a leitura dele -- primeiro ve-se a forma, depois le-se o que ela
 * diz.
 *
 * Nenhum destes textos felicita nem alerta. A app nao sabe qual e o objetivo de
 * quem a usa -- e a mesma razao pela qual a variacao nao e verde nem vermelha.
 */
export default function Insights({
  entries,
  alturaCm,
}: {
  entries: Entry[];
  /** Do perfil. Sem ela, o racio cintura-altura nao se calcula. */
  alturaCm: number | null;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];

  // Sobre TODOS os registos, nao sobre o intervalo escolhido nos filtros: um
  // padrao semanal ou uma recomposicao precisam de meses, e desapareciam
  // sozinhos se alguem carregasse em "30 dias".
  const lista = useMemo(
    () => insights(entries, alturaCm),
    [entries, alturaCm],
  );

  if (lista.length === 0) {
    return (
      <Card className="p-5">
        <SectionTitle>O que os teus dados dizem</SectionTitle>
        <p className="text-sm" style={{ color: chrome.muted }}>
          Ainda não há registos que cheguem para dizer alguma coisa com
          segurança. Duas ou três semanas de medições costumam bastar.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <SectionTitle hint="Sai dos teus próprios registos. Descreve o que lá está -- não é aconselhamento médico.">
        O que os teus dados dizem
      </SectionTitle>

      <ul className="flex flex-col gap-4">
        {lista.map((insight) => {
          const artigo = insight.artigo ? getArticle(insight.artigo) : undefined;
          return (
            <li key={insight.id} className="flex gap-3.5">
              {artigo ? <ArticleBadge slug={artigo.slug} size={40} /> : null}
              <div className="min-w-0">
                <h3
                  className="text-sm font-semibold"
                  style={{ color: chrome.ink }}
                >
                  {insight.titulo}
                </h3>
                <p
                  className="mt-1 text-sm leading-relaxed"
                  style={{ color: chrome.inkSecondary }}
                >
                  {insight.texto}
                </p>
                {artigo ? (
                  <Link
                    href={`/artigos/${artigo.slug}`}
                    className="mt-1.5 inline-block text-xs"
                    style={{ color: chrome.muted }}
                  >
                    {artigo.titulo} &rarr;
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
