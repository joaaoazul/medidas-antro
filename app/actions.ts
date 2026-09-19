"use server";

import { revalidatePath } from "next/cache";
import { METRIC_IDS, METRIC_BY_ID, type MetricId } from "@/lib/metrics";
import { deleteEntry, saveEntry as gravar } from "@/lib/repo";
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
  const id = formData.get("id");
  const hora = formData.get("hora");

  const parsedEntry = entrySchema.safeParse({
    // Presente so quando o formulario esta a editar uma medicao existente.
    id: typeof id === "string" && id !== "" ? id : undefined,
    date: String(formData.get("date") ?? ""),
    hora: typeof hora === "string" && hora.trim() !== "" ? hora.trim() : null,
    nota: typeof nota === "string" && nota.trim() !== "" ? nota.trim() : null,
    values,
  });

  if (!parsedEntry.success) {
    return { status: "erro", message: firstError(parsedEntry.error) };
  }

  try {
    await gravar(parsedEntry.data);
  } catch (erro) {
    return {
      status: "erro",
      message:
        erro instanceof Error ? erro.message : "Nao foi possivel guardar.",
    };
  }

  revalidatePath("/");

  const quando = parsedEntry.data.hora
    ? `${parsedEntry.data.date} as ${parsedEntry.data.hora}`
    : parsedEntry.data.date;

  return {
    status: "ok",
    message: parsedEntry.data.id
      ? `Medicao de ${quando} atualizada.`
      : `Medicao de ${quando} guardada.`,
    savedDate: parsedEntry.data.date,
  };
}

export async function removeEntry(id: string): Promise<ActionState> {
  const removed = await deleteEntry(id);
  revalidatePath("/");

  return removed
    ? { status: "ok", message: "Medicao apagada." }
    : { status: "erro", message: "Essa medicao ja nao existe." };
}
