import type { Metadata } from "next";
import Link from "next/link";
import { ArticleBadge } from "@/components/ArticleIcon";
import { requireReadyViewer } from "@/lib/session";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = { title: "Ferramentas - Medidas" };
export const dynamic = "force-dynamic";

export default async function FerramentasPage() {
  await requireReadyViewer();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/" className="text-sm" style={{ color: "var(--text-muted)" }}>
        &larr; Voltar
      </Link>

      <h1 className="mt-6 text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
        Ferramentas
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        Calculadoras a partir dos teus próprios registos. Não é aconselhamento
        médico.
      </p>

      <ul className="mt-8 flex flex-col gap-6">
        {TOOLS.map((tool) => (
          <li key={tool.slug}>
            <Link
              href={`/ferramentas/${tool.slug}`}
              className="flex gap-4 rounded-2xl border p-5 transition-colors"
              style={{ borderColor: "var(--border)" }}
            >
              <ArticleBadge slug={tool.slug} />
              <div className="min-w-0">
                <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  {tool.titulo}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {tool.resumo}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
