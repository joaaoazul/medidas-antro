import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Cliente Supabase para componentes de servidor, server actions e rotas.
 *
 * Usa a sessao de quem esta a navegar, nunca uma chave de servico. E isso que
 * faz as politicas de seguranca da base de dados valerem: mesmo que um bug
 * nesta aplicacao pedisse os registos de outra pessoa, a base de dados nao os
 * devolvia.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Um componente de servidor nao pode escrever cookies. Nao faz mal:
            // quem renova a sessao e o middleware, e este catch so existe para
            // a leitura nao rebentar por causa disso.
          }
        },
      },
    },
  );
}
