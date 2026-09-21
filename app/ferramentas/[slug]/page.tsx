import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBadge } from "@/components/ArticleIcon";
import ArticleDisclaimer from "@/components/ArticleDisclaimer";
import CaloriasMacrosCalculator from "@/components/calculators/CaloriasMacrosCalculator";
import FfmiCalculator from "@/components/calculators/FfmiCalculator";
import ImcCalculator from "@/components/calculators/ImcCalculator";
import ProteinaCalculator from "@/components/calculators/ProteinaCalculator";
import RacioCinturaAlturaCalculator from "@/components/calculators/RacioCinturaAlturaCalculator";
import { idadeEm } from "@/lib/profile";
import { listEntries } from "@/lib/repo";
import { requireReadyViewer } from "@/lib/session";
import { latestReading } from "@/lib/series";
import { getTool } from "@/lib/tools";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  return { title: tool ? `${tool.titulo} - Medidas` : "Medidas" };
}

export default async function FerramentaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const viewer = await requireReadyViewer();
  const entries = await listEntries();
  const peso = latestReading(entries, "peso")?.value ?? null;
  const abdomen = latestReading(entries, "abdomen")?.value ?? null;
  const gordura = latestReading(entries, "gordura")?.value ?? null;
  const altura = viewer.profile?.alturaCm ?? null;
  const idade = viewer.profile?.dataNascimento
    ? idadeEm(viewer.profile.dataNascimento)
    : null;
  const sexo = viewer.profile?.sexo ?? null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/ferramentas" className="text-sm" style={{ color: "var(--text-muted)" }}>
        &larr; Ferramentas
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <ArticleBadge slug={tool.slug} size={56} />
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          {tool.titulo}
        </h1>
      </div>

      <div className="mt-5">
        <ArticleDisclaimer />
      </div>

      <div className="mt-6">
        {slug === "imc" ? (
          <ImcCalculator pesoInicial={peso} alturaInicial={altura} />
        ) : null}
        {slug === "racio-cintura-altura" ? (
          <RacioCinturaAlturaCalculator cinturaInicial={abdomen} alturaInicial={altura} />
        ) : null}
        {slug === "proteina" ? <ProteinaCalculator pesoInicial={peso} /> : null}
        {slug === "calorias-e-macros" ? (
          <CaloriasMacrosCalculator
            pesoInicial={peso}
            alturaInicial={altura}
            idadeInicial={idade}
            sexoInicial={sexo}
          />
        ) : null}
        {slug === "ffmi" ? (
          <FfmiCalculator pesoInicial={peso} alturaInicial={altura} gorduraInicial={gordura} />
        ) : null}
      </div>
    </main>
  );
}
