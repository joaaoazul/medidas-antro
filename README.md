# Medidas

App para registar medidas antropométricas todos os dias — peso, perímetro
abdominal, gordura corporal, massa muscular e perímetros — e ver como evoluem
por dias, semanas e meses.

Next.js 16 + TypeScript, Postgres na Supabase. **Aplicação de acesso restrito:**
não há registo público — as contas são criadas pelo administrador. Desenhada
primeiro para o telemóvel, que é onde se regista uma pesagem, de manhã, com uma
mão.

<p>
  <img src="exemplo/preview-telemovel.png" alt="Separador Hoje no telemóvel" width="250">
  <img src="exemplo/preview-evolucao.png" alt="Separador Evolução no telemóvel" width="250">
  <img src="exemplo/preview-escuro.png" alt="Separador Histórico em modo escuro" width="250">
</p>

![Separador Evolução no ecrã grande](exemplo/preview-desktop.png)

## Arrancar

```bash
npm install
cp .env.example .env.local     # e preenche os dois valores
npm run dev                    # http://localhost:3000
```

Os dois valores estão no dashboard da Supabase, em **Project Settings → API**:
o URL do projeto e a chave publicável (`sb_publishable_...`). São públicos por
desenho — vão no browser. Quem protege os dados são as políticas da base de
dados, não o segredo da chave.

O esquema está em `supabase/migrations/`. Num projeto novo, cola esse SQL no
**SQL Editor** da Supabase (ou aplica-o com o CLI da Supabase).

### Fechar o registo e criar-te a ti

Esta app é restrita, e isso tem de ser imposto **também do lado da Supabase** —
não basta não haver botão de registo na interface. Em **Authentication → Sign In
/ Providers → Email**, desliga *Allow new users to sign up*. Sem isso, qualquer
pessoa cria conta chamando a API diretamente.

Depois cria a tua conta em **Authentication → Users → Add user** (com *Auto
confirm user*), e promove-te a administrador no **SQL Editor**:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'o-teu-email@exemplo.com';
```

Isto faz-se pelo SQL Editor de propósito: a tabela `admins` não tem política de
escrita nenhuma, por isso ninguém se promove a administrador através da
aplicação, aconteça o que acontecer no código.

A partir daí, as contas criam-se dentro da app, em **Histórico → Administração**.

### Os documentos legais

O responsável pelo tratamento está identificado em `lib/legal.ts`. Nome e email
são o mínimo que o RGPD exige (Artigo 13.º); morada e NIF são opcionais e ficam
vazios — as frases dos documentos compõem-se com o que existir, em vez de
mostrarem campos por preencher. Se isto passar a serviço pago, é altura de
acrescentar os dois.

Para experimentar com dados: entra, vai a **Histórico → Importar JSON** e
escolhe `exemplo/medidas-exemplo.json` (240 dias de dados fictícios, gerados).

```bash
npm run build && npm start   # produção
npm run lint
npm test                     # Vitest, só a lógica de lib/
```

Os testes vivem em `tests/` e cobrem **só a lógica pura**: agregação de séries,
escala dos eixos, média móvel, ritmo e projeção, os oito insights com as suas
guardas, datas, validação e as invariantes da paleta. É aí que estão as regras
que se partem em silêncio -- nenhuma delas dá erro de compilação quando é
desfeita. A interface exercita-se no browser, que é onde os erros dela aparecem.

Uma nota para quem mexer no código: `app/actions.ts` é um módulo `"use server"`
e só pode exportar funções assíncronas — exportar uma constante de lá compila,
passa no lint e só rebenta quando alguém submete o formulário. É por isso que o
estado partilhado com o formulário vive em `lib/form-state.ts`.

## O que faz

Três separadores, um por pergunta:

**Hoje** — como estou, e já registei?
- Um cartão de **novidades** no topo, com uma demonstração da linha de
  tendência desenhada com as medições de quem está a ler, e os atalhos para a
  Evolução, para Aprender e para Ferramentas. Fecha-se num toque e não volta até haver versão nova
  (`NOVIDADES_VERSAO`, em `lib/novidades.ts` — subir o número fá-lo reaparecer a
  toda a gente). O estado fica no browser, não no perfil: é uma conveniência de
  leitura, e o preço é reaparecer uma vez em cada dispositivo novo.
- O peso em grande, com a variação face a ~7 dias antes e uma mini-linha da
  fase recente; as outras sete métricas em cartões compactos.
- **O ritmo**, por regressão sobre as últimas semanas — "0,25 kg por semana nas
  últimas 6 semanas" — e, quando os dados o sustentam, quando o peso pretendido
  é alcançado a esse ritmo. A janela adapta-se (ver as notas de desenho) e a
  projeção tem guardas próprias: sem elas, seria uma data com ar de facto.
- Formulário com os três campos do dia-a-dia sempre à vista e os perímetros
  atrás de um toque, para o gesto diário caber num ecrã sem deslizar.
- **Várias medições por dia**, distinguidas pela hora: pesar-se de manhã e à
  noite é o caso normal, não uma exceção. A hora vem já preenchida com a atual e
  usa o seletor do próprio sistema (a roda no iOS, o relógio no Android) — um
  seletor desenhado à mão não conheceria o formato de 12 ou 24 horas de quem
  está do outro lado, nem funcionaria com as ajudas de acessibilidade do
  telemóvel. Cada gravação cria uma medição nova; corrigir uma já existente
  faz-se pelo **Editar** no histórico. Campos em branco ficam por medir
  (`null`), não a zero.

**Evolução** — o que mudou, e em que ritmo?
- Um gráfico de cada vez, com a métrica escolhida numa fila de fichas.
- Intervalo (30 / 90 / 365 dias / tudo) e agrupamento por dia, semana ou mês.
  **Cada ponto é a média das medições desse balde** — incluindo o balde "dia",
  quando há mais do que uma medição nesse dia. O tooltip diz de quantas medições
  é a média, para o número nunca passar por uma leitura única quando não é.
- Agrupado por dia, uma **linha de tendência** (média móvel de ~7 dias) passa
  por cima dos pontos, na mesma cor e esbatida. Os pontos continuam a ser as
  medições reais; a linha responde à pergunta que uma pesagem isolada não
  responde.
- As **notas** das medições aparecem no gráfico: um anel à volta da medição
  anotada, e o texto no tooltip. São elas que explicam os degraus na linha —
  "comecei creatina", "férias", "doente".
- Cada gráfico traz um **resumo em texto** para leitores de ecrã: de onde para
  onde, em quantas medições, com o mínimo e o máximo.
- **O que os teus dados dizem**: um cartão por baixo do gráfico que procura os
  casos em que os registos dizem alguma coisa e a põe por palavras — o ruído
  típico de um dia para o outro (e quantos dias são precisos para a mudança
  real o ultrapassar), uma recomposição em curso, um planalto, qual das oito
  métricas mais se mexeu, o rácio cintura-altura e para onde vai, a diferença
  entre a pesagem da manhã e a da noite, um padrão por dia da semana, e a
  cadência do registo. Cada um aponta para o artigo que desenvolve o assunto,
  e só aparecem os que os dados sustentam — no máximo quatro de cada vez.
- Vista **Comparar**, com as métricas escolhidas indexadas em % face à primeira
  medição do intervalo.

**Histórico** — o que é que eu registei no dia 12?
- Uma ficha por medição no telemóvel, tabela no ecrã grande, com editar e
  apagar. Editar leva a medição ao formulário, no separador Hoje.
- Exportar JSON/CSV e importar JSON, para cópias de segurança e para levar os
  dados para outro lado.

**Definições** (`/conta`, pela engrenagem no cabeçalho) — tudo o que é da conta.
Ficam fora dos separadores de propósito: são coisas que se visitam de vez em
quando, e algumas não se desfazem, por isso não convém tê-las ao lado do registo
do dia-a-dia.
- Editar nome, data de nascimento, sexo, altura, objetivo, peso pretendido,
  treinos por semana e notas.
- Mudar a palavra-passe.
- Ver os consentimentos dados, com versão e data.
- Exportar os registos e apagá-los todos (com confirmação escrita).
- Terminar sessão e, para o administrador, o atalho para a administração.

**O que exige o administrador:** mudar o email, apagar a conta e retirar o
consentimento. O email é a identidade de entrada e mudá-lo pela app exigiria
confirmação por email, que esta app não envia; apagar a conta não tem desfazer e
leva as medidas todas. Ficam a um pedido de distância, não a um toque.

## Contas, consentimento e onboarding

**Não há registo público.** O administrador cria a conta com uma palavra-passe
temporária que aparece **uma só vez** no ecrã — não fica guardada legível em
lado nenhum, nem na base de dados nem em registos. Quem a receber é obrigado a
mudá-la na primeira entrada, antes de chegar a qualquer outra parte da app.

**Não há recuperação automática de palavra-passe.** Quem se esquecer pede ao
administrador, que repõe uma nova temporária. A página de entrada diz isso em
vez de deixar a pessoa às voltas.

**Onboarding em três passos**, na primeira entrada:

1. **Termos.** Duas caixas separadas e nenhuma pré-marcada: uma para os Termos e
   a Política de Privacidade, outra — expressa — para o tratamento de dados de
   saúde. São duas porque o Artigo 9.º do RGPD trata dados de saúde como
   categoria especial e exige consentimento explícito, distinto do aceite geral.
2. **Sobre ti.** Nome e data de nascimento (obrigatórios — a idade mínima não se
   verifica sem a perguntar), sexo e altura (opcionais).
3. **Objetivos.** Objetivo, peso pretendido, treinos por semana e notas. Se
   indicares um peso pretendido, ele aparece como linha de referência tracejada
   no gráfico do peso.

O consentimento é gravado como **registo**, não como estado: cada aceitação é
uma linha nova com o documento, a versão e o momento. A tabela não tem política
de `update` nem de `delete` — um livro de registo que se pode reescrever não
demonstra nada, e o RGPD exige poder demonstrar o consentimento. Quando a versão
de um documento muda, é pedido de novo na entrada seguinte.

## Administração

Em `/admin`, só para quem está na tabela `admins`. Permite criar contas, repor
palavras-passe e apagar contas (o que leva consigo o perfil e todas as medidas,
pelo apagamento em cascata — é assim que se cumpre um pedido de apagamento).

**Não dá acesso às medidas nem aos perfis de ninguém.** Isso não é uma decisão de
interface: não existe nenhuma política que dê a um administrador acesso às linhas
de outra pessoa, por isso a base de dados recusa o pedido. A área de
administração vê o que está em `auth.users` — email, datas — e o estado da
palavra-passe, e nada mais.

É a única parte da app que usa a chave de serviço, que ignora todas as políticas.
Está isolada em `lib/supabase/admin.ts`, marcada com `server-only` (o build falha
se algum componente de cliente a importar, mesmo por uma cadeia indireta), e cada
ação confirma que quem chama é administrador antes de a usar. Sem a variável
`SUPABASE_SERVICE_ROLE_KEY` a app funciona toda — só a administração é que não.

## Onde estão os dados, e quem lhes chega

Em Postgres, na Supabase, na tabela `entries`. Cada linha pertence a uma conta
(`user_id`), e a chave primária é `(user_id, date)` — um registo por pessoa por
dia.

**O isolamento entre contas é feito pela base de dados, não pela aplicação.** A
chave publicável vai no browser e qualquer pessoa a consegue ler; é assim que
foi desenhada. O que impede alguém autenticado de ler as medidas de outra pessoa
são as políticas de Row Level Security em
`supabase/migrations/0001_entries.sql`. Mesmo que um bug nesta app pedisse os
registos de outra conta, o Postgres não os devolvia.

Verificado no próprio projeto, numa transação revertida no fim:

| Cenário | Resultado |
|---|---|
| A pessoa A lê as medidas (2 contas com registos) | vê só as dela |
| A tenta escrever na conta de B | recusado pela política |
| A tenta apagar o registo de B | não apaga nada |
| Visitante sem sessão lê a tabela | não devolve nada |
| A escreve na própria conta | a política deixa passar |
| A tenta promover-se a administrador | bloqueado |
| A tenta limpar a marca de palavra-passe temporária | não altera nada |
| A lê o perfil de B | não vê nada |
| A lê os consentimentos de B | não vê nada |
| A tenta reescrever um consentimento já dado | não altera nada |

O *security advisor* da Supabase está limpo (zero alertas).

**Cópias de segurança.** A Supabase faz as suas, mas a exportação da app
(JSON/CSV) é a tua — e é também a forma de levar os dados para outro lado. O
JSON leva o identificador de cada medição, por isso restaurar duas vezes a mesma
cópia reconcilia em vez de duplicar. Uma cópia feita antes de existirem horas
continua a importar: a hora ausente é tratada como "sem hora".

**Deploy.** A app está na Vercel, ligada ao `main` deste repositório: cada push
constrói e publica.

Três coisas que não são óbvias e custam tempo a descobrir:

1. **As variáveis `NEXT_PUBLIC_*` são coladas no build, não lidas em runtime.**
   Acrescentar uma variável não afeta deployments já construídos — é preciso
   reconstruir. Um deployment feito antes de elas existirem fica com elas vazias
   e rebenta em todos os pedidos, apesar de a build ter passado.
2. **A região das funções tem de acompanhar a da base de dados.** Por omissão a
   Vercel corre em `iad1` (Washington) e o projeto Supabase está em `cdg1`
   (Paris): cada consulta atravessava o Atlântico, e abrir a app faz cinco.
   Está definida para `cdg1`.
3. **A chave de serviço não está na Vercel.** Sem ela, `/admin` rebenta em
   produção e o resto funciona. Acrescenta `SUPABASE_SERVICE_ROLE_KEY` em
   Settings → Environment Variables se quiseres gerir contas a partir do site,
   em vez de o fazer a correr a app localmente.

**Proteção de acesso.** O projeto tem a *Vercel Authentication* ligada, o que faz
com que os endereços `*.vercel.app` exijam sessão iniciada na Vercel. Enquanto os
marcadores de `lib/legal.ts` não estiverem preenchidos e o registo não estiver
fechado do lado da Supabase, convém ficar assim. Um domínio próprio contorna-a,
por a proteção estar em `all_except_custom_domains`.

## Estrutura

```
middleware.ts        renova a sessão e guarda as rotas privadas
supabase/migrations  esquema e políticas de segurança
app/
  entrar/            entrada (não há registo público)
  bem-vindo/         onboarding: consentimento, dados e objetivos
  conta/palavra-passe  mudança de palavra-passe, obrigatória se for temporária
  admin/             gestão de contas, só para administradores
  termos/            Termos de Serviço
  privacidade/       Política de Privacidade
  layout.tsx         tipo de letra (Outfit) e o script que aplica o tema antes de pintar
  page.tsx           componente de servidor: lê os registos e entrega-os à casca
  actions.ts         server actions de gravar e apagar
  entrar/            página de entrada e de criação de conta
  auth/actions.ts    entrar, criar conta, terminar sessão
  api/export         descarregar tudo em JSON ou CSV
  api/import         restaurar uma exportação (num só upsert)
  globals.css        tokens de cor, claro e escuro
lib/
  metrics.ts         definição das 8 métricas — único sítio a mexer para acrescentar uma
  novidades.ts       versão do cartão de novidades e a chave que o guarda
  insights.ts        o que os registos de uma pessoa dizem sobre ela
  legal.ts           responsável pelo tratamento e versões dos documentos
  profile.ts         constantes, tipos e validação do perfil (sem código de servidor)
  profile-repo.ts    leitura e escrita de perfis e consentimentos
  session.ts         quem está a ver, e o que lhe falta fazer antes de entrar
  supabase/          clientes de servidor, de browser, de middleware e de administração
  repo.ts            fronteira de acesso às medidas
  validation.ts      esquemas zod, partilhados pelo formulário e pela importação
  series.ts          intervalos, agregação, variações, indexação relativa e escala Y
  dates.ts           dias de calendário em AAAA-MM-DD, sem fusos horários
components/
  Dashboard.tsx      casca: cabeçalho, separadores e a vista ativa
  Nav.tsx            barra fixa no fundo (telemóvel) e separadores no cabeçalho (ecrã grande)
  ui.tsx             peças partilhadas: cartão, fichas, comutador, botões
  TodayView          .. Novidades, HeroCard, MetricCard, EntryForm
  TrendsView         .. MetricChart, RelativeChart, Insights
  HistoryView        .. HistoryList, DataTransfer
  theme.tsx          modo claro/escuro e o cromado dos gráficos em hex
exemplo/             conjunto de dados de demonstração e imagens do README
```

## Acrescentar uma métrica

Uma entrada em `METRICS` (`lib/metrics.ts`) com um par de cores do próximo slot
livre da paleta e o `genero` do rótulo — "o perímetro abdominal" mas "a massa
muscular", e qualquer frase que nomeie a métrica precisa de concordar. O formulário, os cartões, os gráficos, a tabela, a exportação e
as consultas seguem daí. Falta só a coluna na base de dados: uma migração nova
em `supabase/migrations/` com `alter table public.entries add column ...`.

## Nota legal

Os Termos de Serviço e a Política de Privacidade descrevem com rigor o que esta
aplicação faz — que dados recolhe, onde ficam, quem lhes chega. Não foram
redigidos por advogado. Dados de saúde são categoria especial no Artigo 9.º do
RGPD; antes de dares acesso a clientes reais, vale a revisão de quem perceba do
assunto. Falta também aceitar o **acordo de subcontratação (DPA)** da Supabase,
no dashboard, em Organization Settings.

## Notas de desenho

Decisões que não são de gosto e que convém não desfazer sem querer:

**Mobile-first a sério, não "também funciona no telemóvel".** Os separadores
vivem numa barra fixa no fundo, onde o polegar chega sem trocar a mão de
posição; no ecrã grande a barra desaparece e passam para o cabeçalho. As filas
de filtros deslizam na horizontal em vez de quebrarem para quatro linhas — num
ecrã de 390px, filtros que quebram empurram o gráfico para fora do ecrã, e o
gráfico é que é o conteúdo. Os alvos de toque têm 44px.

**Uma só figura grande por vista.** O peso lidera o separador Hoje; os outros
separadores não competem com ele.

**Números em figuras tabulares, incluindo o grande.** A regra habitual manda
figuras proporcionais num valor grande isolado, porque as tabulares dão a cada
dígito a largura de um zero e o número fica frouxo. Na Outfit a conta
inverte-se: medido no browser, `"111"` ocupa 42px contra 81px de `"000"` — o
algarismo 1 é quase metade dos outros. Com um valor que muda a cada pesagem, as
proporcionais fariam o número encolher e crescer sozinho, e os cartões ao lado
dançariam com ele.

**Um gráfico por métrica, nunca dois eixos Y.** Peso em kg, perímetros em cm e
gordura em % não partilham escala. Sobrepô-los com dois eixos independentes
deixa esticar as escalas até qualquer cruzamento parecer significativo, e quem
lê não tem como saber que o cruzamento é um artefacto do eixo. Quando é mesmo
preciso ver as métricas juntas, a vista **Comparar** indexa tudo a uma base
comum e usa um único eixo honesto.

**A cor pertence à métrica, não à sua posição.** Cada métrica tem um slot fixo
da paleta, por isso ligar e desligar séries nunca repinta as que ficam. Os oito
pares claro/escuro passam os limiares de daltonismo em pares adjacentes nos dois
modos; a ordem dos slots é o mecanismo, não decoração. Trocar um hexadecimal
isolado desfá-lo.

**O que é novo esconde-se antes de ser pintado.** O cartão de novidades
desaparece por CSS, pelo atributo que o script do layout carimba no `<html>` —
a mesma técnica do tema, e pela mesma razão: decidido depois da hidratação, o
cartão aparecia à vista e empurrava o resto da página para baixo em cada visita,
mesmo a quem já o tinha fechado.

**Os insights descrevem, nunca julgam.** Pela mesma razão que a variação não é
verde nem vermelha: a app não sabe qual é o objetivo de quem a usa. Nenhum texto
felicita nem alerta — dizem o que está nos registos e mais nada. Cada um tem o
seu mínimo de medições e o seu limiar, e não aparece sem eles: um insight que
aparece sempre não informa nada, e um que aparece sem base é pior do que
nenhum. O padrão semanal, por exemplo, é calculado sobre o **resíduo face à
tendência** — sem descontar a tendência, quem está a perder peso veria sempre o
início da semana "mais pesado" do que o fim, e o padrão seria um artefacto da
ordem dos dias. A explicação de cada fenómeno vive nos artigos, que é onde está
o aviso de que nada disto é aconselhamento médico.

**A janela do ritmo adapta-se; a projeção tem de ser merecida.** Medido no
conjunto de exemplo, o declive do peso é quase o mesmo em qualquer janela — entre
-0,22 e -0,27 kg por semana — mas o ajuste (r²) sobe de 0,33 a 28 dias para 0,83
a 90. Ou seja: a tendência está lá desde o início, e o que falta numa janela
curta não é sinal, é tempo para o sinal vencer o ruído da balança. Por isso a
app tenta sempre a janela mais curta — é a mais recente, e a que reage primeiro
a uma mudança — e só alarga quando ela não chega. Descrever o ritmo é uma coisa;
**extrapolá-lo é uma afirmação muito mais forte**, e por isso a projeção exige
r² acima de 0,5, que o ritmo aponte ao objetivo e que a data caia dentro de um
ano. Sem as três, uma reta através de uma nuvem de pontos daria sempre uma data.

**A tendência é uma leitura, os pontos é que são o dado.** A média móvel
desenha-se primeiro, por baixo, esbatida e na cor da própria métrica — uma cor
própria faria dela uma segunda série, e não é: é a mesma medida, lida de outra
maneira. O peso de cada medição depende do intervalo **real** até à anterior
(`1 - exp(-dias/7)`), não da sua posição na lista: depois de três semanas sem
medir, a medição seguinte é praticamente o novo ponto de partida, em vez de a
linha voltar com uma inclinação inventada nos dias em que ninguém se pesou. Só
aparece no agrupamento por dia: agrupado por semana ou mês, a média do balde já
é a suavização, e suavizar por cima dela seria suavizar duas vezes.

**A variação não é verde nem vermelha.** A app não sabe qual é o objetivo de
quem a usa: descer 2 kg pode ser a meta ou o alarme. A direção está na seta e no
sinal; a cor não emite um juízo que a app não tem como fazer.

**As marcas do eixo Y são números redondos, mas o domínio não.** Alargar o
domínio até ao múltiplo seguinte dos dois lados podia acrescentar quase um passo
inteiro de vazio em cima e em baixo; em vez disso, as marcas são os múltiplos
que caem dentro do domínio já ajustado.

O modo escuro é escolhido, não invertido: são os mesmos oito tons, redefinidos
contra a superfície escura. O tipo de letra é a **Outfit**, carregada pelo
`next/font` — fica auto-alojada no build, sem pedidos a terceiros em tempo de
execução.
