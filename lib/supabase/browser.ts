import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para o browser.
 *
 * So e usado para terminar sessao; a leitura e a escrita de registos passam
 * todas pelo servidor. A chave anonima daqui e publica por desenho -- quem
 * protege os dados sao as politicas de seguranca da base de dados, nao o
 * segredo da chave.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
