/**
 * A base de dados ainda nao tem a coluna que o codigo pede?
 *
 * Existe para o codigo poder chegar a producao antes da migracao que o
 * acompanha -- e continuar a funcionar ate ela ser aplicada. Sem isto, uma
 * coluna nova lida num pedido que corre em todas as paginas deitava a app
 * inteira abaixo no intervalo entre o deploy e a migracao.
 *
 * Os dois codigos, segundo a documentacao da Supabase: `42703` (do Postgres)
 * quando se LE uma coluna que nao existe, `PGRST204` (do PostgREST) quando se
 * ESCREVE uma que nao esta na cache do esquema.
 */
export function colunaEmFalta(
  erro: { code?: string | null } | null | undefined,
): boolean {
  return erro?.code === "42703" || erro?.code === "PGRST204";
}
