"use server";

import { revalidatePath } from "next/cache";
import { deleteEntry, saveEntry as gravar } from "@/lib/repo";
import type { ActionState } from "@/lib/form-state";
import { lerMedicao, quando } from "@/lib/form-entry";

/*
 * Este modulo so exporta funcoes assincronas -- tudo o que ele exporta vira um
 * ponto de entrada chamavel a partir do cliente. A leitura do formulario vive
 * em lib/form-entry.ts, partilhada com a fila offline.
 */

export async function saveEntry(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const leitura = lerMedicao(formData);
  if (!leitura.ok) return { status: "erro", message: leitura.message };
  const entrada = leitura.entrada;

  try {
    await gravar(entrada);
  } catch (erro) {
    return {
      status: "erro",
      message:
        erro instanceof Error ? erro.message : "Não foi possível guardar.",
    };
  }

  revalidatePath("/");

  return {
    status: "ok",
    message: entrada.id
      ? `Medição de ${quando(entrada)} atualizada.`
      : `Medição de ${quando(entrada)} guardada.`,
    savedDate: entrada.date,
  };
}

export async function removeEntry(id: string): Promise<ActionState> {
  const removed = await deleteEntry(id);
  revalidatePath("/");

  return removed
    ? { status: "ok", message: "Medição apagada." }
    : { status: "erro", message: "Essa medição já não existe." };
}
