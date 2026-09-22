import { z } from "zod";
import { METRICS, METRIC_BY_ID, type MetricId } from "./metrics";
import { addDaysISO, todayISO } from "./dates";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (usa AAAA-MM-DD).")
  .refine((value) => {
    // O regex deixa passar 2025-02-31; so a normalizacao apanha isso.
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Essa data não existe no calendário.")
  /*
   * Um dia de folga, e nao zero.
   *
   * Esta validacao corre no servidor, e "hoje" e o dia do relogio de quem a
   * corre. Com o servidor em UTC -- o que a Vercel usa por omissao -- entre a
   * meia-noite e a uma da manha em Lisboa, no verao, o browser ja esta no dia
   * seguinte e o servidor ainda nao: a pesagem de hoje era recusada como data
   * futura durante uma hora por noite. O campo de data do formulario continua
   * a ter `max` no dia de hoje LOCAL, por isso ninguem escolhe amanha por
   * engano; isto e uma guarda de sanidade, e um dia de desfasamento de fuso
   * nao e o que ela existe para apanhar.
   */
  .refine(
    (value) => value <= addDaysISO(todayISO(), 1),
    "Não dá para registar datas futuras.",
  );

/** Uma medida ausente e null, nao 0: 0 kg seria uma leitura, a ausencia nao e. */
function metricSchema(id: MetricId) {
  const m = METRIC_BY_ID[id];
  return z
    .union([z.number(), z.null()])
    .refine(
      (v) => v === null || (Number.isFinite(v) && v >= m.min && v <= m.max),
      `${m.label} tem de estar entre ${m.min} e ${m.max} ${m.unit}.`,
    );
}

/**
 * Hora opcional.
 *
 * Aceita ausente e trata-o como "sem hora", para que uma copia de seguranca
 * feita antes de existirem horas continue a importar sem erro.
 */
const horaSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (v === undefined || v === "" ? null : v))
  .refine(
    (v) => v === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(v),
    "Hora inválida (usa HH:MM).",
  );

export const entrySchema = z
  .object({
    /** Presente ao editar uma medicao existente; ausente ao criar. */
    id: z.string().uuid().optional(),
    date: dateSchema,
    hora: horaSchema,
    nota: z.string().trim().max(500, "Nota demasiado longa.").nullable(),
    values: z.object(
      Object.fromEntries(METRICS.map((m) => [m.id, metricSchema(m.id)])),
    ) as unknown as z.ZodType<Record<MetricId, number | null>>,
  })
  .refine(
    (entry) => Object.values(entry.values).some((v) => v !== null),
    "Preenche pelo menos uma medida.",
  );

export type EntryInput = z.infer<typeof entrySchema>;

/** Primeira mensagem de erro legivel, para devolver ao formulario. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos.";
}
