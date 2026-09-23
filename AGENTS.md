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
- `npm run lint`, `npm test` e `npm run build` têm de passar limpos.
- Os testes (`tests/`, Vitest) cobrem a lógica pura de `lib/` -- séries,
  insights, datas, validação, fila offline, invariantes da paleta -- e o
  contrato de `/api/import`, de que a fila offline depende. É aí que estão as
  regras subtis que se partem em silêncio -- a folga da escala, a tolerância da
  variação, os limiares de cada insight. Mexer numa dessas funções sem correr
  os testes é a forma mais rápida de desfazer uma decisão documentada sem dar
  por isso. Componentes não se testam aqui: exercitam-se no browser, pela razão
  abaixo.
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
- A fila offline (`lib/fila-offline.ts`) guarda medicoes no aparelho por conta:
  a chave leva o id de quem a encheu. Nunca a tornar global -- a medicao de uma
  pessoa seria enviada para a conta de quem entrasse a seguir no mesmo
  telemovel.
- Uma medicao so sai da fila com `{ imported: n }` na resposta. Nunca confiar em
  `response.ok`: com a sessao expirada o middleware redireciona para /entrar e o
  `fetch` segue -- acaba num 405, ou num 200 com HTML, e a fila apagava a unica
  copia. O contrato de /api/import (200 `{imported}`, 4xx `{error}` definitivo,
  5xx `{error}` passageiro) esta preso em `tests/import-route.test.ts`.
- O formulario de registo submete por `onSubmit` + `startTransition`, e nao pela
  prop `action`. Com `action`, o React 19 limpa os campos nao controlados mesmo
  quando a accao devolve um erro de validacao, e quem se engana num campo perde
  tudo o que escreveu. Quem limpa o formulario e o efeito que corre so depois de
  gravar com sucesso.
- `/manifest.webmanifest` esta em `PUBLIC_PATHS` do middleware porque o browser o
  pede sem cookies. Atras da sessao, era sempre redirecionado e a app nao se
  instalava.
- A validacao da data aceita ate amanha, de proposito: corre no servidor, em
  UTC, e entre a meia-noite e a uma em Lisboa (verao) o browser ja esta no dia
  seguinte. Nao "corrigir" para `<= hoje`.
- Uma coluna nova NUNCA entra em `PROFILE_COLUMNS` (nem em nenhuma leitura que
  corra em todos os pedidos) enquanto a migracao que a cria puder estar por
  aplicar em producao: le-se a parte, e `colunaEmFalta` (`lib/esquema.ts`) trata
  o erro como "ainda nao disponivel". Foi assim que a coluna `objetivos` entrou.
  O deploy na Vercel sai do `main` sozinho; a migracao aplica-se a mao.
- Os objetivos sao um mapa por metrica (`Objetivos`). O do peso vive em
  `objetivo_peso` e os outros em `objetivos`; so `app/page.tsx` junta os dois.
  Nenhum componente deve voltar a ter um `=== "peso"` para decidir se desenha um
  objetivo.
- O service worker (`public/sw.js`) so guarda `public/offline.html`. Nunca
  acrescentar cache de paginas da app nem de respostas da API: vem renderizadas
  com as medidas de quem as viu, e ficavam no aparelho depois de sair da conta.
  `tests/offline-page.test.ts` falha se aparecer um `cache.put`.
- `public/offline.html` e estatica e tem copias (chave da fila, marca do
  utilizador, tema, limites das medidas). Mudar qualquer uma em `lib/` obriga a
  muda-la la -- o teste compara. E qualquer mudanca a pagina obriga a por em
  `VERSAO` do `sw.js` o inicio do novo sha256 dela
  (`sha256sum public/offline.html | cut -c1-12`); o teste tambem falha sem isso.
- A marca `medidas-utilizador` (id da conta, no localStorage) e escrita pelo
  painel e apagada pelo botao de sair. E so por ela que a pagina offline sabe
  em que fila guardar; sem ela, nao deixa registar.

