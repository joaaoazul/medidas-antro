import Link from "next/link";

/**
 * Moldura dos documentos legais.
 *
 * Deliberadamente sem a casca da app: sao paginas publicas, tem de se poder ler
 * antes de haver conta e tem de se poder enviar o endereco a alguem. Coluna
 * estreita e entrelinha larga porque isto e texto corrido para ler, nao um
 * painel para consultar de relance.
 */
export default function LegalDoc({
  titulo,
  versao,
  children,
}: {
  titulo: string;
  versao: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/entrar"
        className="text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        &larr; Voltar
      </Link>

      <h1
        className="mt-6 text-2xl font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {titulo}
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        Versão {versao}
      </p>

      <div
        className="legal mt-8 flex flex-col gap-6 text-[15px] leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {children}
      </div>

      <p className="mt-12 text-xs" style={{ color: "var(--text-muted)" }}>
        Este documento descreve o funcionamento real desta aplicação. Se alguma
        coisa aqui escrita não corresponder ao que a app faz, é o documento que
        está errado -- avisa o responsável pelo contacto acima.
      </p>
    </main>
  );
}

/** Seccao numerada de um documento legal. */
export function Seccao({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2
        className="text-base font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {numero}. {titulo}
      </h2>
      {children}
    </section>
  );
}

export function Lista({ itens }: { itens: React.ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5">
      {itens.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
