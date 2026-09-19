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
