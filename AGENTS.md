<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Este projeto

- As métricas definem-se num único sítio: `lib/metrics.ts`. Acrescentar uma
  entrada propaga-se ao formulário, cartões, gráficos, tabela, exportação e
  esquema da base de dados.
- Todo o acesso a dados passa por `lib/repo.ts`. Não usar `lib/db.ts`
  diretamente fora dessa fronteira.
- Antes de mexer em cores ou eixos dos gráficos, ler a secção "Notas sobre os
  gráficos" do README: a paleta e a regra do eixo único são deliberadas.
- `npm run lint` e `npm run build` têm de passar limpos.
- `app/actions.ts` tem `"use server"`: so pode exportar funcoes assincronas.
  Tudo o que um modulo desses exporta vira um ponto de entrada chamavel a partir
  do cliente, por isso exportar de la uma constante compila, passa no lint e
  rebenta em tempo de execucao na primeira submissao. Tipos e constantes
  partilhados com o formulario vivem em `lib/form-state.ts`.
- Mudancas no formulario, no apagar ou na importacao tem de ser exercitadas a
  serio no browser, nao so olhadas: o erro acima nao aparece nem no `tsc` nem no
  `next build`.
- Os dados estao em Postgres na Supabase. O isolamento entre contas e feito
  pelas politicas de Row Level Security em `supabase/migrations/`, nao pelo
  codigo da aplicacao. Qualquer tabela nova precisa de `enable row level
  security` e das suas politicas antes de guardar seja o que for.
- Nunca usar a chave de servico (`service_role`) nesta aplicacao: ela ignora as
  politicas. Todo o acesso passa pela sessao de quem esta a navegar.
- Para saber quem esta autenticado, usar sempre `supabase.auth.getUser()` e
  nunca `getSession()`: o segundo so le o cookie, que o lado do cliente tambem
  sabe escrever.
- Nao existe registo publico. Nunca acrescentar uma accao de registo a um modulo
  "use server" acessivel ao visitante: tudo o que esses modulos exportam vira um
  ponto de entrada chamavel do cliente, esteja ou nao ligado a um formulario.
- `lib/profile.ts` nao pode importar nada de `lib/supabase/server`. E usado por
  componentes de cliente, e essa importacao arrasta o cliente de servidor para o
  pacote do browser. O acesso a dados vive em `lib/profile-repo.ts`.
- A chave de servico so e usada em `lib/supabase/admin.ts`, que tem `server-only`
  no topo. Cada accao de administracao chama `requireAdmin()` antes de a usar.
- Consentimentos sao um livro de registo: so insert e select. Nunca acrescentar
  politicas de update ou delete a `consents`.
- Mudar o texto dos documentos legais de forma substantiva obriga a mudar a
  versao em `lib/legal.ts` -- e so entao. Mudar a versao sem mudar o texto faz
  pedir consentimento outra vez sem razao.
- Uma medicao nao e um dia. A tabela `entries` tem chave propria (`id`) e pode
  ter varias linhas na mesma data, com `hora` opcional. Nada no codigo deve
  voltar a assumir que a data e unica -- gravar passa a criar, e so altera
  quando ha `id`.
- A data e um dia de calendario (`date`) e a hora e uma coluna a parte, de
  proposito: com um `timestamptz`, uma pesagem as 23:30 em Lisboa cairia no dia
  seguinte em UTC e apareceria no dia errado no grafico.
