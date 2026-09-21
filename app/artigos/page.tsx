import type { Metadata } from "next";
import Link from "next/link";
import { ArticleBadge } from "@/components/ArticleIcon";
import ArticleDisclaimer from "@/components/ArticleDisclaimer";
import { ARTICLES } from "@/lib/articles";
import { getViewer } from "@/lib/session";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Aprender - Medidas",
  description:
    "Ferramentas e notas gerais sobre medidas e o corpo. Não é aconselhamento médico.",
};

export default async function ArtigosPage() {
  const viewer = await getViewer();
  // So mostra as ferramentas a quem tem conta pronta a usar: precisam de
  // sessao, e ligam para /ferramentas, que a exige. Sem isto, quem chega
  // aqui pelo rodape do login via um atalho que so o devolve ao login.
  const mostrarFerramentas =
    viewer && !viewer.precisaOnboarding && !viewer.precisaAceitar;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/"
        className="text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        &larr; Voltar
      </Link>

      <h1
        className="mt-6 text-2xl font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Aprender
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        Ferramentas e notas gerais sobre medidas e o corpo.
      </p>

      <div className="mt-6">
        <ArticleDisclaimer />
      </div>

      {mostrarFerramentas ? (
        <>
          {/* O titulo liga para o indice das ferramentas. Sem isto, /ferramentas
              so se alcancava pelo "voltar" de dentro de uma ferramenta -- uma
              pagina a que nenhuma ligacao levava, e que so aparecia depois de
              ja la se ter estado. */}
          <div className="mt-8 flex items-baseline justify-between gap-3">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Ferramentas
            </h2>
            <Link
              href="/ferramentas"
              className="shrink-0 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              Ver todas &rarr;
            </Link>
          </div>
          <ul className="mt-3 flex flex-col gap-3">
            {TOOLS.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={`/ferramentas/${tool.slug}`}
                  className="flex items-center gap-4 rounded-2xl border p-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <ArticleBadge slug={tool.slug} size={40} />
                  <div className="min-w-0">
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {tool.titulo}
                    </h3>
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {tool.resumo}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h2
        className="mt-8 text-base font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Artigos
      </h2>
      <ul className="mt-3 flex flex-col gap-6">
        {ARTICLES.map((article) => (
          <li key={article.slug}>
            <Link
              href={`/artigos/${article.slug}`}
              className="flex gap-4 rounded-2xl border p-5 transition-colors"
              style={{ borderColor: "var(--border)" }}
            >
              <ArticleBadge slug={article.slug} />
              <div className="min-w-0">
                <h3
                  className="text-base font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {article.titulo}
                </h3>
                <p
                  className="mt-1.5 text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {article.resumo}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
