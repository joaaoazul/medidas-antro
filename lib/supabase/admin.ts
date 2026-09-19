import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a chave de servico. Ignora todas as politicas de seguranca.
 *
 * Existe por uma unica razao: criar contas e repor palavras-passe sao operacoes
 * da API de administracao da Supabase, e essa API nao aceita a sessao de um
 * utilizador normal.
 *
 * Tres regras, e nenhuma delas e opcional:
 *
 * 1. "server-only" no topo faz o build falhar se algum componente de cliente
 *    importar este ficheiro, mesmo por engano, por uma cadeia de importacoes.
 *    Sem isso, a chave podia acabar no pacote que vai para o browser.
 * 2. Quem chama tem de confirmar que o visitante e administrador ANTES de
 *    chamar. Este cliente nao verifica nada -- nao tem como.
 * 3. Nunca usar isto para ler ou escrever medidas ou perfis. Essas passam
 *    sempre pela sessao de quem navega, para que as politicas se apliquem.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY. A area de administracao precisa dela; o resto da app nao.",
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
