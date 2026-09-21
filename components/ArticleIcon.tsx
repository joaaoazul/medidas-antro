/**
 * Uma ilustracao simples por artigo ou ferramenta, no mesmo estilo de linha
 * dos icones da Nav e do Logo -- tracado fino, cantos arredondados,
 * currentColor. Nada de fotografias: seriam de banco de imagens, sem relacao
 * com o resto do desenho da app, e com direitos que esta app nao tem como
 * verificar. Uma ferramenta e o artigo que a acompanha (ex.: "racio-cintura-
 * altura") partilham slug de proposito -- e a mesma ideia em dois formatos.
 */
const PATHS: Record<string, React.ReactNode> = {
  "porque-o-peso-varia": (
    <path d="M3 13c2-5 4 5 6 0s4-5 6 0s4-5 6 0" />
  ),
  imc: (
    <>
      <circle cx="12" cy="6" r="3" />
      <path d="M6 21v-5a6 6 0 0112 0v5" />
    </>
  ),
  proteina: (
    <>
      <circle cx="5" cy="12" r="2.2" />
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="19" cy="12" r="2.2" />
      <path d="M7.2 12h2.6M14.2 12h2.6" />
    </>
  ),
  "calorias-e-macros": (
    <path d="M12 3c2 3-1 5-1 8a1 1 0 002 0c0-1 1-2 2-3c1 2 1 4 1 5a4 4 0 01-8 0c0-4 2-6 4-10z" />
  ),
  "peso-nao-e-gordura": (
    <>
      <circle cx="9" cy="12" r="6" />
      <circle cx="15" cy="12" r="6" />
    </>
  ),
  "medir-o-perimetro-abdominal": (
    <>
      <rect x="3" y="10" width="18" height="4" rx="1" />
      <path d="M7 10v2M11 10v2M15 10v2M19 10v2" />
    </>
  ),
  "sempre-a-mesma-hora": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </>
  ),
  "tendencia-importa-mais": (
    <>
      <path d="M4 17l5-6 4 4 7-9" />
      <circle cx="20" cy="6" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  "sono-e-o-peso": <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />,
  "fiabilidade-das-balancas-de-gordura": (
    <path d="M13 3L5 13h5l-1 8 8-10h-5z" />
  ),
  "ciclo-menstrual-e-peso": (
    <>
      <path d="M5 12a7 7 0 0112.5-4.3M19 12a7 7 0 01-12.5 4.3" />
      <path d="M17.5 4v4h-4M6.5 20v-4h4" />
    </>
  ),
  "recomposicao-corporal": (
    <>
      <path d="M8 20V8M5 11l3-3 3 3" />
      <path d="M16 4v12M13 13l3 3 3-3" />
    </>
  ),
  "limitacoes-do-imc": (
    <>
      <circle cx="12" cy="6" r="3" />
      <path d="M6 21v-5a6 6 0 0112 0v5" />
    </>
  ),
  "quanto-pesa-a-agua": (
    <path d="M12 3s7 8.5 7 13a7 7 0 01-14 0c0-4.5 7-13 7-13z" />
  ),
  "perda-de-peso-nao-e-linear": <path d="M3 7h4v4h4v3h4v3h4" />,
  "sal-e-retencao-de-agua": (
    <>
      <path d="M9 3h6l1.5 4h-9z" />
      <rect x="7" y="7" width="10" height="13" rx="2" />
      <path d="M10.5 11h.01M13.5 13h.01M10.5 15.5h.01M13.5 17.5h.01" />
    </>
  ),
  "sarcopenia-e-massa-muscular": (
    <>
      <path d="M4 12h16" />
      <rect x="2" y="9" width="4" height="6" rx="1" />
      <rect x="18" y="9" width="4" height="6" rx="1" />
    </>
  ),
  "racio-cintura-altura": (
    <>
      <circle cx="12" cy="5" r="2.5" />
      <path d="M8 21v-6a4 4 0 018 0v6" />
      <path d="M7 13h10" />
    </>
  ),
  "sobrecarga-progressiva": <path d="M2 20h20M5 20v-7M11 20v-11M17 20v-4" />,
  "proteina-e-musculo": (
    <>
      <circle cx="5" cy="12" r="2.2" />
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="19" cy="12" r="2.2" />
      <path d="M7.2 12h2.6M14.2 12h2.6" />
    </>
  ),
  "frequencia-de-treino": (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4" />
      <circle cx="8" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  "recuperacao-e-sono": (
    <path d="M3 19v-6a2 2 0 012-2h4a2 2 0 012 2v2m8 4v-3a2 2 0 00-2-2h-4M3 19h18M3 21v-2M21 21v-2" />
  ),
  "dores-musculares-doms": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M7.5 12h2l1.2-3 2 6 1.2-3h2.6" />
    </>
  ),
};

export function ArticleIcon({
  slug,
  size = 22,
}: {
  slug: string;
  size?: number;
}) {
  const path = PATHS[slug];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {path}
    </svg>
  );
}

/** A ilustracao dentro do seu emblema redondo -- o mesmo tratamento em toda a lista e em cada artigo. */
export function ArticleBadge({
  slug,
  size = 44,
}: {
  slug: string;
  size?: number;
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl"
      style={{
        width: size,
        height: size,
        background: "var(--selected)",
        color: "var(--text-primary)",
      }}
    >
      <ArticleIcon slug={slug} size={Math.round(size * 0.5)} />
    </span>
  );
}
