import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleDisclaimer from "@/components/ArticleDisclaimer";
import { ARTICLES, getArticle } from "@/lib/articles";

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  return { title: article ? `${article.titulo} - Medidas` : "Medidas" };
}

export default async function ArtigoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/artigos"
        className="text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        &larr; Artigos
      </Link>

      <h1
        className="mt-6 text-2xl font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {article.titulo}
      </h1>

      <div className="mt-5">
        <ArticleDisclaimer />
      </div>

      <div
        className="mt-8 flex flex-col gap-4 text-[15px] leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {article.corpo.map((paragrafo, i) => (
          <p key={i}>{paragrafo}</p>
        ))}
      </div>
    </main>
  );
}
