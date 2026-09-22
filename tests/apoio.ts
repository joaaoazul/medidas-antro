import { METRIC_IDS, type MetricId } from "@/lib/metrics";
import type { Entry } from "@/lib/types";

const VAZIO = Object.fromEntries(METRIC_IDS.map((id) => [id, null])) as Record<
  MetricId,
  number | null
>;

let contador = 0;

/** Uma medicao, com so o que o teste precisa de dizer. */
export function medicao(
  date: string,
  values: Partial<Record<MetricId, number>>,
  extra: { hora?: string | null; nota?: string | null } = {},
): Entry {
  contador += 1;
  return {
    id: `m${contador}`,
    date,
    hora: extra.hora ?? null,
    nota: extra.nota ?? null,
    updatedAt: "",
    values: { ...VAZIO, ...values },
  };
}

/** Datas consecutivas a partir de uma base, em AAAA-MM-DD. */
export function dia(base: string, offset: number): string {
  return new Date(Date.parse(`${base}T00:00:00Z`) + offset * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/** Hoje menos `atras` dias -- para o que depende do relogio. */
export function diasAtras(atras: number): string {
  const agora = new Date();
  const hoje = Date.UTC(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate(),
  );
  return new Date(hoje - atras * 86_400_000).toISOString().slice(0, 10);
}
