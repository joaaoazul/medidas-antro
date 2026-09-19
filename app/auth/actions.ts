"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { credentialsSchema } from "@/lib/credentials";
import type { ActionState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { firstError } from "@/lib/validation";

function read(formData: FormData) {
  return credentialsSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
}

/**
 * As mensagens de erro da Supabase chegam em ingles e, algumas, em termos que
 * so fazem sentido para quem conhece a API. Traduzimos as que se veem no uso
 * normal e deixamos passar o resto tal como vem, para nao esconder um problema
 * real atras de um texto generico.
 */
function translate(message: string): string {
  const known: Record<string, string> = {
    "Invalid login credentials": "Email ou palavra-passe errados.",
    "Email not confirmed": "Confirma o email antes de entrares.",
    "User already registered": "Ja existe uma conta com este email.",
    "Password should be at least 6 characters.":
      "A palavra-passe e demasiado curta.",
  };
  return known[message] ?? message;
}

export async function signIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = read(formData);
  if (!parsed.success) {
    return { status: "erro", message: firstError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { status: "erro", message: translate(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = read(formData);
  if (!parsed.success) {
    return { status: "erro", message: firstError(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    return { status: "erro", message: translate(error.message) };
  }

  // Com a confirmacao por email desligada, o registo devolve logo uma sessao e
  // entra-se de imediato. Com ela ligada, nao ha sessao e e preciso dizer a
  // pessoa que tem de ir ao email -- sem isso, o formulario parecia nao fazer
  // nada.
  if (!data.session) {
    return {
      status: "ok",
      message: "Conta criada. Confirma o email para entrares.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/entrar");
}
