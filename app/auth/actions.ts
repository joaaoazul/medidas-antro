"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
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
    "New password should be different from the old password.":
      "A palavra-passe nova tem de ser diferente da antiga.",
    "Signups not allowed for this instance":
      "O registo esta fechado. Pede uma conta ao administrador.",
    /*
     * email_provider_disabled. A mensagem da Supabase fala em registo, mas o
     * interruptor que a dispara ("Enable email provider") governa o registo E o
     * login -- quem o desliga a pensar que esta a fechar o registo fica sem
     * conseguir entrar, e a mensagem original manda-o procurar no sitio errado.
     */
    "Email logins are disabled":
      "O login por email esta desligado no projeto Supabase. Liga 'Enable email provider'; o que fecha o registo e outro interruptor.",
    "Email signups are disabled":
      "O login por email esta desligado no projeto Supabase. Liga 'Enable email provider'; o que fecha o registo e outro interruptor.",
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

/*
 * Nao existe signUp aqui de proposito.
 *
 * Esta aplicacao e de acesso restrito: as contas sao criadas pelo
 * administrador, em app/admin/actions.ts. Se este ficheiro exportasse uma accao
 * de registo, ela ficava acessivel a qualquer visitante -- e um modulo
 * "use server" expoe tudo o que exporta como ponto de entrada chamavel a partir
 * do cliente, esteja ou nao ligada a um formulario.
 *
 * O fecho do registo tem de ser feito TAMBEM no lado da Supabase, em
 * Authentication -> Sign In / Providers -> Email -> "Allow new users to sign
 * up". Sem isso, qualquer pessoa pode criar conta chamando a API diretamente,
 * sem passar por esta aplicacao.
 */

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A palavra-passe tem de ter pelo menos 8 caracteres."),
    confirmacao: z.string(),
  })
  .refine((v) => v.password === v.confirmacao, {
    message: "As duas palavras-passe nao sao iguais.",
  });

/**
 * Muda a palavra-passe de quem tem sessao iniciada.
 *
 * Usada tanto na mudanca obrigatoria da palavra-passe temporaria como numa
 * mudanca voluntaria. A marca de temporaria e limpa por uma funcao da base de
 * dados, porque a tabela onde vive nao aceita escritas de utilizadores -- e e
 * isso que impede alguem de fingir que ja a mudou.
 */
export async function changePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = passwordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmacao: String(formData.get("confirmacao") ?? ""),
  });

  if (!parsed.success) {
    return { status: "erro", message: firstError(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "erro", message: "Sem sessao iniciada." };

  // Saber se era a mudanca obrigatoria decide para onde se vai a seguir: quem
  // veio da entrada quer chegar a app, quem veio das definicoes quer ficar nas
  // definicoes.
  const { data: estado } = await supabase
    .from("account_state")
    .select("password_temporaria")
    .eq("user_id", user.id)
    .maybeSingle();
  const eraObrigatoria = Boolean(estado?.password_temporaria);

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { status: "erro", message: translate(error.message) };
  }

  const { error: rpcError } = await supabase.rpc("limpar_password_temporaria");
  if (rpcError) {
    return {
      status: "erro",
      message: `A palavra-passe mudou, mas o estado da conta nao: ${rpcError.message}`,
    };
  }

  revalidatePath("/", "layout");

  if (eraObrigatoria) redirect("/");
  return { status: "ok", message: "Palavra-passe alterada." };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/entrar");
}
