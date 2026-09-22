/**
 * Do formulario a uma medicao validada.
 *
 * Vive aqui, e nao em app/actions.ts, porque tem dois clientes: a server action
 * que grava com rede, e a fila que guarda no aparelho quando nao ha. Os dois
 * tem de ler "82,4" da mesma maneira e tratar um campo vazio como medida por
 * fazer -- se cada um tivesse a sua copia, bastava corrigir uma para as duas
 * passarem a gravar coisas diferentes a partir do mesmo formulario.
 *
 * E so leitura e validacao, sem nada de servidor: corre igual nos dois lados.
 */
import { METRIC_IDS, METRIC_BY_ID, type MetricId } from "./metrics";
import { entrySchema, firstError, type EntryInput } from "./validation";

/**
 * Converte o texto do campo em numero.
 *
 * Aceita virgula decimal porque e assim que se escreve "82,4" em portugues, e
 * um teclado numerico de telemovel oferece frequentemente a virgula.
 * Campo vazio e null (medida nao feita), nunca 0 -- zero seria uma leitura.
 */
export function parseNumber(raw: FormDataEntryValue | null): number | null | "erro" {
  if (typeof raw !== "string") return null;
  const text = raw.trim().replace(",", ".");
  if (text === "") return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : "erro";
}

export type Leitura =
  | { ok: true; entrada: EntryInput }
  | { ok: false; message: string };

/** Le e valida uma medicao a partir dos campos do formulario. */
export function lerMedicao(formData: FormData): Leitura {
  const values: Record<string, number | null> = {};

  for (const id of METRIC_IDS) {
    const parsed = parseNumber(formData.get(id));
    if (parsed === "erro") {
      return {
        ok: false,
        message: `${METRIC_BY_ID[id as MetricId].label}: valor não é um número.`,
      };
    }
    values[id] = parsed;
  }

  const nota = formData.get("nota");
  const id = formData.get("id");
  const hora = formData.get("hora");

  const parsed = entrySchema.safeParse({
    // Presente so quando o formulario esta a editar uma medicao existente.
    id: typeof id === "string" && id !== "" ? id : undefined,
    date: String(formData.get("date") ?? ""),
    hora: typeof hora === "string" && hora.trim() !== "" ? hora.trim() : null,
    nota: typeof nota === "string" && nota.trim() !== "" ? nota.trim() : null,
    values,
  });

  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };
  return { ok: true, entrada: parsed.data };
}

/** "2026-09-22 às 08:00", ou so a data. Para as mensagens de confirmacao. */
export function quando(entrada: Pick<EntryInput, "date" | "hora">): string {
  return entrada.hora ? `${entrada.date} às ${entrada.hora}` : entrada.date;
}
