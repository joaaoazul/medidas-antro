"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/form-state";
import { profileSchema } from "@/lib/profile";
import { saveProfile } from "@/lib/profile-repo";
import { deleteAllEntries } from "@/lib/repo";
import { requireReadyViewer } from "@/lib/session";
import { firstError } from "@/lib/validation";

function numero(raw: FormDataEntryValue | null): number | null | "erro" {
  if (typeof raw !== "string") return null;
  const texto = raw.trim().replace(",", ".");
  if (texto === "") return null;
  const valor = Number(texto);
  return Number.isFinite(valor) ? valor : "erro";
}

function opcao(raw: FormDataEntryValue | null): string | null {
  const valor = typeof raw === "string" ? raw.trim() : "";
  return valor === "" ? null : valor;
}

export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const viewer = await requireReadyViewer();

  const altura = numero(formData.get("alturaCm"));
  const objetivoPeso = numero(formData.get("objetivoPeso"));
  const treinos = numero(formData.get("treinosPorSemana"));

  if (altura === "erro" || objetivoPeso === "erro" || treinos === "erro") {
    return { status: "erro", message: "Ha um numero mal escrito." };
  }

  const parsed = profileSchema.safeParse({
    nome: String(formData.get("nome") ?? ""),
    dataNascimento: String(formData.get("dataNascimento") ?? ""),
    sexo: opcao(formData.get("sexo")),
    alturaCm: altura,
    objetivo: opcao(formData.get("objetivo")),
    objetivoPeso,
    treinosPorSemana: treinos,
    notas: opcao(formData.get("notas")),
  });

  if (!parsed.success) {
    return { status: "erro", message: firstError(parsed.error) };
  }

  // Sem concluirOnboarding: a data de entrada e a original, e nao a desta
  // gravacao.
  await saveProfile(viewer.id, parsed.data);
  revalidatePath("/", "layout");

  return { status: "ok", message: "Dados guardados." };
}

/**
 * Apaga todas as medidas, mantendo a conta.
 *
 * Nao ha desfazer, e por isso a interface pede confirmacao escrita antes de
 * chegar aqui. A conta em si so o administrador apaga -- isso e um pedido, nao
 * um botao, para nao se perder uma conta inteira num toque distraido.
 */
export async function eraseEntries(): Promise<ActionState> {
  await requireReadyViewer();

  const apagados = await deleteAllEntries();
  revalidatePath("/", "layout");

  return {
    status: "ok",
    message:
      apagados === 0
        ? "Nao havia registos para apagar."
        : `${apagados} ${apagados === 1 ? "registo apagado" : "registos apagados"}.`,
  };
}
