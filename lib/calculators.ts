/**
 * Formulas puras por tras das ferramentas em /ferramentas.
 *
 * Separadas dos componentes de cliente para poderem ser lidas e verificadas
 * sem UI a volta -- e para o mesmo calculo nunca ser reescrito de forma
 * ligeiramente diferente em dois sitios.
 */

/** IMC = peso (kg) / altura (m) ao quadrado. */
export function calcularImc(pesoKg: number, alturaCm: number): number {
  const alturaM = alturaCm / 100;
  return pesoKg / (alturaM * alturaM);
}

export const IMC_CATEGORIAS = [
  { max: 18.5, label: "Abaixo do peso", cor: "#5b93d9" },
  { max: 25, label: "Peso saudável", cor: "#4caf6e" },
  { max: 30, label: "Excesso de peso", cor: "#e2a83f" },
  { max: Infinity, label: "Obesidade", cor: "#d9534f" },
] as const;

/** O IMC nunca desce a zero nem sobe para sempre -- so a barra precisa disto. */
export const IMC_DOMINIO_MAX = 40;

export function categoriaImc(imc: number) {
  return IMC_CATEGORIAS.find((c) => imc < c.max)!;
}

/** Cintura a dividir pela altura, ambas na mesma unidade. */
export function calcularRacioCinturaAltura(
  cinturaCm: number,
  alturaCm: number,
): number {
  return cinturaCm / alturaCm;
}

/**
 * Bandas "semaforo" de Ashwell para o racio cintura-altura: sem risco
 * acrescido abaixo de 0,5, risco acrescido ate 0,6, risco muito alto dai para
 * cima. E a referencia mais citada para este racio.
 */
export const RACIO_CATEGORIAS = [
  { max: 0.5, label: "Sem risco acrescido", cor: "#4caf6e" },
  { max: 0.6, label: "Risco acrescido", cor: "#e2a83f" },
  { max: Infinity, label: "Risco muito alto", cor: "#d9534f" },
] as const;

export const RACIO_DOMINIO_MAX = 0.75;

export function categoriaRacioCinturaAltura(racio: number) {
  return RACIO_CATEGORIAS.find((c) => racio < c.max)!;
}

export const PROTEINA_CONTEXTOS = [
  {
    key: "sedentario",
    label: "Sedentário",
    min: 0.8,
    max: 0.8,
    nota: "Referência geral (RDA) para quem não treina com regularidade.",
  },
  {
    key: "treino",
    label: "Treino de força regular",
    min: 1.4,
    max: 2.0,
    nota: "Cobre a generalidade de quem treina para ganhar ou manter músculo.",
  },
  {
    key: "defice",
    label: "Défice calórico, a treinar",
    min: 2.3,
    max: 3.1,
    nota: "Para preservar músculo enquanto perdes gordura.",
  },
] as const;

export type ProteinaContextoKey = (typeof PROTEINA_CONTEXTOS)[number]["key"];

export function calcularProteina(pesoKg: number, contexto: ProteinaContextoKey) {
  const c = PROTEINA_CONTEXTOS.find((c) => c.key === contexto)!;
  return { min: Math.round(pesoKg * c.min), max: Math.round(pesoKg * c.max) };
}

export type Sexo = "feminino" | "masculino" | "outro" | "nao_dizer";

/**
 * Taxa metabolica basal, equacao de Mifflin-St Jeor -- a recomendada pela
 * American Dietetic Association para a generalidade dos adultos. Perde
 * precisao em obesidade e em idade avancada; a ferramenta avisa disso.
 */
export function calcularBmr(
  pesoKg: number,
  alturaCm: number,
  idade: number,
  sexo: Sexo,
): number {
  const base = 10 * pesoKg + 6.25 * alturaCm - 5 * idade;
  if (sexo === "masculino") return base + 5;
  if (sexo === "feminino") return base - 161;
  // "outro" e "nao dizer": media dos dois termos, na falta de melhor.
  return base + (5 - 161) / 2;
}

export const NIVEIS_ATIVIDADE = [
  { key: "sedentario", label: "Sedentário (pouco ou nenhum exercício)", fator: 1.2 },
  { key: "leve", label: "Exercício leve, 1-3x por semana", fator: 1.375 },
  { key: "moderado", label: "Exercício moderado, 3-5x por semana", fator: 1.55 },
  { key: "intenso", label: "Exercício intenso, 6-7x por semana", fator: 1.725 },
  { key: "muito_intenso", label: "Exercício muito intenso ou trabalho físico", fator: 1.9 },
] as const;

export type NivelAtividadeKey = (typeof NIVEIS_ATIVIDADE)[number]["key"];

export function calcularTdee(bmr: number, nivel: NivelAtividadeKey): number {
  return bmr * NIVEIS_ATIVIDADE.find((n) => n.key === nivel)!.fator;
}

export const OBJETIVOS_CALORIAS = [
  { key: "perder", label: "Perder peso", ajuste: -500 },
  { key: "manter", label: "Manter peso", ajuste: 0 },
  { key: "ganhar", label: "Ganhar peso", ajuste: 300 },
] as const;

export type ObjetivoCaloriasKey = (typeof OBJETIVOS_CALORIAS)[number]["key"];

export type Macros = {
  calorias: number;
  proteinaG: number;
  gorduraG: number;
  carboidratosG: number;
};

/**
 * Reparte um alvo calorico em macros: a proteina fixa-se por kg de peso (a
 * mesma referencia da calculadora de proteina), a gordura fica com 25% das
 * calorias, e o hidrato de carbono leva o que sobrar.
 */
export function calcularMacros(
  caloriasAlvo: number,
  pesoKg: number,
  contextoProteina: ProteinaContextoKey,
): Macros {
  const { max: proteinaGkg } = PROTEINA_CONTEXTOS.find(
    (c) => c.key === contextoProteina,
  )!;
  const proteinaG = Math.round(pesoKg * proteinaGkg);
  const gorduraG = Math.round((caloriasAlvo * 0.25) / 9);
  const restantes = caloriasAlvo - proteinaG * 4 - gorduraG * 9;
  const carboidratosG = Math.round(Math.max(restantes, 0) / 4);

  return {
    calorias: Math.round(caloriasAlvo),
    proteinaG,
    gorduraG,
    carboidratosG,
  };
}

/**
 * Indice de massa magra (FFMI), normalizado para 1,80m.
 *
 * FFM = peso sem a fracao de gordura. A normalizacao (Kouri et al., 1995)
 * ajusta para a altura, para se poder comparar pessoas de alturas diferentes
 * pelo mesmo numero -- sem ela, ser alto já empurra o FFMI para cima
 * independentemente de quanto musculo se tem.
 */
export function calcularFfmi(
  pesoKg: number,
  alturaCm: number,
  gorduraPercent: number,
): number {
  const alturaM = alturaCm / 100;
  const massaMagraKg = pesoKg * (1 - gorduraPercent / 100);
  const ffmi = massaMagraKg / (alturaM * alturaM);
  return ffmi + 6.3 * (1.8 - alturaM);
}

/**
 * Referencias descritivas, nao uma escala de risco: mais alto nao e "melhor"
 * nem "pior", so mais musculo do que a media. Por isso a cor e um degrade
 * neutro (a mesma tinta, mais carregada), nunca vermelho/verde -- ver a nota
 * em RangeBar sobre nao pintar de bom ou mau o que a app nao pode julgar.
 *
 * O limite de 25 e o mais citado na literatura (Kouri et al., 1995) como o
 * teto tipico de quem constroi musculo sem recurso a esteroides anabolizantes
 * -- e vem de uma amostra so de homens; nao ha equivalente tao estabelecido
 * para mulheres.
 */
export const FFMI_CATEGORIAS = [
  { max: 18, label: "Abaixo da média", cor: "#c7d9f2" },
  { max: 20, label: "Média", cor: "#9fbde8" },
  { max: 22, label: "Acima da média", cor: "#6f97d6" },
  { max: 25, label: "Atlético", cor: "#4a78bf" },
  { max: Infinity, label: "Acima do limite natural típico", cor: "#2f5694" },
] as const;

export const FFMI_DOMINIO_MAX = 30;

export function categoriaFfmi(ffmi: number) {
  return FFMI_CATEGORIAS.find((c) => ffmi < c.max)!;
}

/** Cada macro em % das calorias totais, para uma barra de proporcao. */
export function percentagensMacros(macros: Macros) {
  const kcalProteina = macros.proteinaG * 4;
  const kcalCarboidratos = macros.carboidratosG * 4;
  const kcalGordura = macros.gorduraG * 9;
  const total = kcalProteina + kcalCarboidratos + kcalGordura || 1;

  return {
    proteina: (kcalProteina / total) * 100,
    carboidratos: (kcalCarboidratos / total) * 100,
    gordura: (kcalGordura / total) * 100,
  };
}
