"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { credentialsSchema } from "@/lib/credentials";
import type { AdminState } from "@/lib/form-state";
import { requireAdmin } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Alfabeto sem os caracteres que se confundem ao ler em voz alta ou numa
 * mensagem: 0/O, 1/l/I. Esta palavra-passe vai ser ditada ou copiada por uma
 * pessoa, e uma que se le mal gera um pedido de reposicao a seguir.
 */
const ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789";

function palavraPasseTemporaria(): string {
  const grupo = () =>
    Array.from({ length: 4 }, () => ALFABETO[randomInt(ALFABETO.length)]).join(
      "",
    );
  return `${grupo()}-${grupo()}-${grupo()}`;
}

/** Marca a conta como tendo palavra-passe posta pelo administrador. */
async function marcarTemporaria(userId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("account_state")
    .upsert(
      { user_id: userId, password_temporaria: true },
      { onConflict: "user_id" },
    );
  if (error) throw new Error(error.message);
}

export async function createAccount(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const password = palavraPasseTemporaria();
  const parsed = credentialsSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password,
  });

  if (!parsed.success) {
    return { status: "erro", message: "Email invalido." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password,
    // Confirmado a partida: a conta e criada por quem ja conhece a pessoa, e a
    // aplicacao nao envia email nenhum.
    email_confirm: true,
  });

  if (error) return { status: "erro", message: error.message };
  if (!data.user) return { status: "erro", message: "A conta nao foi criada." };

  await marcarTemporaria(data.user.id);
  revalidatePath("/admin");

  return {
    status: "ok",
    message: `Conta criada para ${parsed.data.email}. Entrega esta palavra-passe; ela tera de a mudar na primeira entrada.`,
    segredo: password,
  };
}

export async function resetPassword(userId: string): Promise<AdminState> {
  await requireAdmin();

  const password = palavraPasseTemporaria();
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { status: "erro", message: error.message };

  await marcarTemporaria(userId);
  revalidatePath("/admin");

  return {
    status: "ok",
    message: "Palavra-passe reposta. Entrega-a; tera de a mudar a seguir.",
    segredo: password,
  };
}

export async function deleteAccount(userId: string): Promise<AdminState> {
  const viewer = await requireAdmin();

  // Sem isto, um administrador distraido fica sem forma de entrar na area de
  // administracao -- e sem forma de a recuperar sem ir ao SQL Editor.
  if (userId === viewer.id) {
    return {
      status: "erro",
      message: "Nao podes apagar a tua propria conta aqui.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { status: "erro", message: error.message };

  revalidatePath("/admin");
  return {
    status: "ok",
    message: "Conta apagada, com o perfil e todas as medidas.",
  };
}
