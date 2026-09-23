"use client";

import Link from "next/link";
import { useMemo } from "react";
import { insights } from "@/lib/insights";
import {
  NOVIDADES_ATTR,
  NOVIDADES_KEY,
  NOVIDADES_VERSAO,
} from "@/lib/novidades";
import type { Entry } from "@/lib/types";
import type { Tab } from "./Nav";
import { CHROME, useTheme } from "./theme";
import { Card } from "./ui";

type Destino =
  | { tipo: "separador"; tab: Tab }
  | { tipo: "pagina"; href: string }
  | null;

type Item = { titulo: string; texto: string; destino: Destino };

/**
 * Uma linha por novidade, a levar ao sitio onde ela esta.
 *
 * Uma linha e nao um cartao: com sete novidades, cartoes empilhados davam
 * dois ecras de aviso antes do peso -- e um aviso que obriga a deslizar dois
 * ecras nao se le, fecha-se.
 */
function Linha({
  item,
  onAbrir,
}: {
  item: Item;
  onAbrir: (tab: Tab) => void;
}) {
  const conteudo = (
    <>
      <span className="min-w-0">
        <span
          className="block text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {item.titulo}
        </span>
        <span
          className="mt-0.5 block text-xs leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {item.texto}
        </span>
      </span>
      {item.destino ? (
        <span aria-hidden className="shrink-0" style={{ color: "var(--text-muted)" }}>
          &rarr;
        </span>
      ) : null}
    </>
  );
  const classe =
    "flex w-full items-center justify-between gap-3 border-t py-2 text-left";
  const estilo = { borderColor: "var(--border)" };

  if (item.destino?.tipo === "pagina") {
    return (
      <Link href={item.destino.href} className={classe} style={estilo}>
        {conteudo}
      </Link>
    );
  }
  if (item.destino?.tipo === "separador") {
    const tab = item.destino.tab;
    return (
      <button type="button" onClick={() => onAbrir(tab)} className={classe} style={estilo}>
        {conteudo}
      </button>
    );
  }
  return (
    <div className={classe} style={estilo}>
      {conteudo}
    </div>
  );
}

/**
 * O que ha de novo, a entrada -- e uma vez por versao.
 *
 * Fica acima do cartao do peso, que e o unico sitio onde se descobre sem ir
 * procurar, mas sai do caminho ao primeiro toque no X e nao volta ate a versao
 * seguinte (NOVIDADES_VERSAO, em lib/novidades.ts).
 *
 * A demonstracao e um insight de verdade, com os registos de quem esta a ler.
 * Dizer "a app agora le os teus dados" e uma promessa; mostrar o que ela leu e
 * a prova -- e poupa a traducao entre um exemplo e o caso da pessoa.
 */
export default function Novidades({
  entries,
  alturaCm,
  onAbrir,
}: {
  entries: Entry[];
  alturaCm: number | null;
  onAbrir: (tab: Tab) => void;
}) {
  const { mode } = useTheme();
  const chrome = CHROME[mode];
  const primeiro = useMemo(
    () => insights(entries, alturaCm)[0] ?? null,
    [entries, alturaCm],
  );

  function dispensar() {
    try {
      localStorage.setItem(NOVIDADES_KEY, NOVIDADES_VERSAO);
    } catch {
      // Modo privado ou armazenamento bloqueado: o cartao volta na proxima
      // visita. E o mal menor -- a alternativa era nao o poder fechar.
    }
    document.documentElement.dataset[NOVIDADES_ATTR] = "vistas";
  }

  /*
   * Uma linha curta cada, de proposito. A primeira versao deste cartao, com
   * descricoes de duas e tres linhas, ocupava o ecra inteiro de um telemovel e
   * empurrava o peso para baixo da dobra -- e um aviso que tapa aquilo que se
   * veio ver fecha-se sem se ler. "Aprender" nao esta aqui: ja vive na barra de
   * baixo, sempre a vista.
   */
  const itens: Item[] = [
    {
      titulo: "Registar sem rede",
      texto: "Fica no aparelho e segue quando a rede voltar.",
      destino: null,
    },
    {
      // Nao se descobre sozinho, e o botao muda de sitio conforme o
      // telemovel: a instrucao vai aqui mesmo.
      titulo: "Instalar no ecrã inicial",
      texto: "iPhone: Partilhar › Ecrã principal. Android: menu › Instalar.",
      destino: null,
    },
    {
      titulo: "Objetivos para cada medida",
      texto: "Abdómen, gordura, perímetros.",
      destino: { tipo: "pagina", href: "/conta" },
    },
    {
      titulo: "Ritmo e tendência",
      texto: "Quanto mudas por semana.",
      destino: { tipo: "separador", tab: "evolucao" },
    },
    {
      titulo: "Importar do Excel",
      texto: "No Histórico, vendo antes o que entra.",
      destino: { tipo: "separador", tab: "historico" },
    },
  ];

  return (
    <div data-novidades-card>
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold" style={{ color: chrome.ink }}>
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

        <div
          className="mt-3 rounded-xl border px-4 pt-3 pb-1"
          style={{ borderColor: "var(--border)", background: "var(--plane)" }}
        >
          <p className="text-xs" style={{ color: chrome.muted }}>
            A app agora lê os teus registos e diz o que eles mostram.
            {primeiro ? " Por exemplo:" : ""}
          </p>
          {primeiro ? (
            <>
              <p className="mt-2 text-sm font-semibold" style={{ color: chrome.ink }}>
                {primeiro.titulo}
              </p>
              <p
                className="mt-1 line-clamp-2 text-sm leading-relaxed"
                style={{ color: chrome.inkSecondary }}
              >
                {primeiro.texto}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm leading-relaxed" style={{ color: chrome.inkSecondary }}>
              O ruído de um dia para o outro, uma recomposição em curso, um
              planalto. Começa a aparecer com duas ou três semanas de medições.
            </p>
          )}
          {/* Um botao com altura de toque, e nao uma palavra sublinhada: um alvo
              de uma palavra falha-se com o polegar. */}
          <button
            type="button"
            onClick={() => onAbrir("evolucao")}
            className="touch -ml-1 mt-1 flex items-center gap-2 rounded-xl px-1 text-sm font-medium"
            style={{ color: chrome.ink }}
          >
            Ver o que os teus dados dizem
            <span aria-hidden style={{ color: chrome.muted }}>
              &rarr;
            </span>
          </button>
        </div>

        <div className="mt-3">
          {itens.map((item) => (
            <Linha key={item.titulo} item={item} onAbrir={onAbrir} />
          ))}
        </div>
      </Card>
    </div>
  );
}
