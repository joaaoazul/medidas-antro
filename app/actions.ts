"use server";

import { revalidatePath } from "next/cache";
import { METRIC_IDS, METRIC_BY_ID, type MetricId } from "@/lib/metrics";
import { deleteEntry, upsertEntry } from "@/lib/repo";
import type { ActionState } from "@/lib/form-state";
import { entrySchema, firstError } from "@/lib/validation";

/**
 * Converte o texto do campo em numero.
 *
 * Aceita virgula decimal porque e assim que se escreve "82,4" em portugues, e
 * um teclado numerico de telemovel oferece frequentemente a virgula.
 * Campo vazio e null (medida nao feita), nunca 0 -- zero seria uma leitura.
 */
function parseNumber(raw: FormDataEntryValue | null): number | null | "erro" {
  if (typeof raw !== "string") return null;
  const text = raw.trim().replace(",", ".");
  if (text === "") return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : "erro";
}

export async function saveEntry(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values: Record<string, number | null> = {};

  for (const id of METRIC_IDS) {
    const parsed = parseNumber(formData.get(id));
    if (parsed === "erro") {
      return {
        status: "erro",
        message: `${METRIC_BY_ID[id as MetricId].label}: valor nao e um numero.`,
      };
    }
    values[id] = parsed;
  }

  const nota = formData.get("nota");
  const parsedEntry = entrySchema.safeParse({
    date: String(formData.get("date") ?? ""),
    nota: typeof nota === "string" && nota.trim() !== "" ? nota.trim() : null,
    values,
  });

  if (!parsedEntry.success) {
    return { status: "erro", message: firstError(parsedEntry.error) };
  }

  await upsertEntry(parsedEntry.data);
  revalidatePath("/");

  return {
    status: "ok",
    message: `Registo de ${parsedEntry.data.date} guardado.`,
    savedDate: parsedEntry.data.date,
  };
}

export async function removeEntry(date: string): Promise<ActionState> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { status: "erro", message: "Data invalida." };
  }

  const removed = await deleteEntry(date);
  revalidatePath("/");

  return removed
    ? { status: "ok", message: `Registo de ${date} apagado.` }
    : { status: "erro", message: "Esse registo ja nao existe." };
}
