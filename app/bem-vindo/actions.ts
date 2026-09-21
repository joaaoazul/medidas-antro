"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/form-state";
import { profileSchema } from "@/lib/profile";
import { recordConsent, saveProfile } from "@/lib/profile-repo";
import { requireViewer } from "@/lib/session";
import { firstError } from "@/lib/validation";

/** Campo numerico opcional: vazio e null, virgula decimal aceite. */
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

export async function completeOnboarding(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const viewer = await requireViewer();

  /*
   * As duas caixas sao verificadas aqui, no servidor, e nao apenas no
   * formulario. O consentimento e a base legal para tratar dados de saude: se
   * so o browser o verificasse, bastava um pedido feito a mao para gravar um
   * perfil sem consentimento nenhum -- e ficava um tratamento sem fundamento,
   * com o registo a dizer o contrario.
   */
  if (formData.get("aceita_documentos") !== "sim") {
    return {
      status: "erro",
      message: "Tens de aceitar os Termos e a Política de Privacidade.",
    };
  }
  if (formData.get("aceita_saude") !== "sim") {
    return {
      status: "erro",
      message:
        "Sem o consentimento para tratar dados de saúde não há como guardar medidas.",
    };
  }

  const altura = numero(formData.get("alturaCm"));
  const objetivoPeso = numero(formData.get("objetivoPeso"));
  const treinos = numero(formData.get("treinosPorSemana"));

  if (altura === "erro" || objetivoPeso === "erro" || treinos === "erro") {
    return { status: "erro", message: "Há um número mal escrito." };
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

  // O consentimento primeiro: se o perfil ficasse gravado e o registo do
  // consentimento falhasse, ficavam dados de saude guardados sem prova do
  // fundamento que os permite.
  await recordConsent(viewer.id);
  await saveProfile(viewer.id, parsed.data, { concluirOnboarding: true });

  revalidatePath("/", "layout");
  redirect("/");
}
