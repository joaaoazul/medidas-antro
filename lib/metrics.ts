/**
 * Definicao central das metricas antropometricas.
 *
 * A cor segue a METRICA (a entidade), nunca a sua posicao numa lista filtrada:
 * cada metrica ocupa para sempre o mesmo slot da paleta categorica, por isso
 * esconder uma metrica nunca repinta as restantes.
 *
 * Os oito pares light/dark abaixo sao a paleta categorica de referencia, ja
 * validada nos dois modos (banda de luminosidade, piso de croma, separacao CVD
 * e piso de visao normal em pares adjacentes). Nao trocar hexes isoladamente:
 * a ordem dos slots e o mecanismo de seguranca para daltonismo.
 */
export type MetricId =
  | "peso"
  | "abdomen"
  | "gordura"
  | "musculo"
  | "peito"
  | "anca"
  | "braco"
  | "coxa";

export type Metric = {
  id: MetricId;
  label: string;
  short: string;
  unit: string;
  /** Casas decimais usadas em inputs, eixos e tabelas. */
  decimals: number;
  /** Limites de sanidade do formulario (nao sao objetivos, sao guardas). */
  min: number;
  max: number;
  color: { light: string; dark: string };
};

export const METRICS: Metric[] = [
  {
    id: "peso",
    label: "Peso",
    short: "Peso",
    unit: "kg",
    decimals: 1,
    min: 20,
    max: 400,
    color: { light: "#2a78d6", dark: "#3987e5" },
  },
  {
    id: "abdomen",
    label: "Perímetro abdominal",
    short: "Abdómen",
    unit: "cm",
    decimals: 1,
    min: 30,
    max: 250,
    color: { light: "#eb6834", dark: "#d95926" },
  },
  {
    id: "gordura",
    label: "Gordura corporal",
    short: "Gordura",
    unit: "%",
    decimals: 1,
    min: 1,
    max: 70,
    color: { light: "#1baf7a", dark: "#199e70" },
  },
  {
    id: "musculo",
    label: "Massa muscular",
    short: "Músculo",
    unit: "kg",
    decimals: 1,
    min: 5,
    max: 200,
    color: { light: "#eda100", dark: "#c98500" },
  },
  {
    id: "peito",
    label: "Peito",
    short: "Peito",
    unit: "cm",
    decimals: 1,
    min: 40,
    max: 200,
    color: { light: "#e87ba4", dark: "#d55181" },
  },
  {
    id: "anca",
    label: "Anca",
    short: "Anca",
    unit: "cm",
    decimals: 1,
    min: 40,
    max: 200,
    color: { light: "#008300", dark: "#008300" },
  },
  {
    id: "braco",
    label: "Braço",
    short: "Braço",
    unit: "cm",
    decimals: 1,
    min: 15,
    max: 80,
    color: { light: "#4a3aa7", dark: "#9085e9" },
  },
  {
    id: "coxa",
    label: "Coxa",
    short: "Coxa",
    unit: "cm",
    decimals: 1,
    min: 20,
    max: 120,
    color: { light: "#e34948", dark: "#e66767" },
  },
];

export const METRIC_IDS = METRICS.map((m) => m.id);

export const METRIC_BY_ID: Record<MetricId, Metric> = Object.fromEntries(
  METRICS.map((m) => [m.id, m]),
) as Record<MetricId, Metric>;

/** A metrica que lidera o painel (unica figura heroi da vista). */
export const HERO_METRIC: MetricId = "peso";

export function formatValue(id: MetricId, value: number | null): string {
  if (value === null || Number.isNaN(value)) return "--";
  return value.toFixed(METRIC_BY_ID[id].decimals);
}

export function formatWithUnit(id: MetricId, value: number | null): string {
  if (value === null || Number.isNaN(value)) return "--";
  return `${formatValue(id, value)} ${METRIC_BY_ID[id].unit}`;
}
