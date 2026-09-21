import { z } from "zod";

/**
 * Regras de entrada partilhadas pelo registo e pelo inicio de sessao.
 *
 * O minimo de 8 caracteres e o que a Supabase tambem exige por omissao; validar
 * do nosso lado permite dizer isso antes da ida ao servidor, em portugues e ao
 * lado do campo.
 */
export const credentialsSchema = z.object({
  email: z.string().trim().min(1, "Escreve o email.").email("Email inválido."),
  password: z
    .string()
    .min(8, "A palavra-passe tem de ter pelo menos 8 caracteres."),
});

export type Credentials = z.infer<typeof credentialsSchema>;
