import type { Metadata } from "next";
import Link from "next/link";
import ArticleDisclaimer from "@/components/ArticleDisclaimer";
import { ARTICLES } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Artigos - Medidas",
  description:
    "Notas gerais sobre medidas e o corpo. Não é aconselhamento médico.",
};

export default function ArtigosPage() {
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
        Artigos
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        Notas gerais sobre medidas e o corpo.
      </p>

      <div className="mt-6">
        <ArticleDisclaimer />
      </div>

      <ul className="mt-8 flex flex-col gap-6">
        {ARTICLES.map((article) => (
          <li key={article.slug}>
            <Link
              href={`/artigos/${article.slug}`}
              className="block rounded-2xl border p-5 transition-colors"
              style={{ borderColor: "var(--border)" }}
            >
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {article.titulo}
              </h2>
              <p
                className="mt-1.5 text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {article.resumo}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
