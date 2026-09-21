/**
 * Registo das ferramentas em /ferramentas -- so metadados (para a lista e
 * para o titulo da pagina). Cada ferramenta e um componente de cliente
 * proprio em components/calculators/, escolhido pelo slug em
 * app/ferramentas/[slug]/page.tsx.
 */
export type Tool = {
  slug: string;
  titulo: string;
  resumo: string;
};

export const TOOLS: Tool[] = [
  {
    slug: "imc",
    titulo: "IMC",
    resumo: "Índice de Massa Corporal, a partir do teu peso e altura.",
  },
  {
    slug: "racio-cintura-altura",
    titulo: "Rácio cintura-altura",
    resumo: "Compara o perímetro abdominal com a altura.",
  },
  {
    slug: "proteina",
    titulo: "Proteína diária",
    resumo: "Referência de gramas de proteína por dia, pelo teu peso.",
  },
  {
    slug: "calorias-e-macros",
    titulo: "Calorias e macros",
    resumo: "Estimativa de gasto calórico e repartição em proteína, hidratos e gordura.",
  },
  {
    slug: "ffmi",
    titulo: "FFMI",
    resumo: "Índice de massa magra, a partir do peso, altura e gordura corporal.",
  },
];

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
