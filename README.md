# Medidas

App para registar medidas antropométricas todos os dias — peso, perímetro
abdominal, gordura corporal, massa muscular e perímetros — e ver como evoluem
por dias, semanas e meses.

Next.js 16 + TypeScript, SQLite local, sem serviços externos. Desenhada
primeiro para o telemóvel — é lá que se regista uma pesagem, de manhã, com uma
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
npm run dev          # http://localhost:3000
```

Não é preciso configurar nada: a base de dados é criada na primeira utilização
em `data/medidas.db`.

Para experimentar com dados: abre a app, carrega em **Importar JSON** e escolhe
`exemplo/medidas-exemplo.json` (240 dias de dados fictícios, gerados).

```bash
npm run build && npm start   # produção
npm run lint
```

Uma nota para quem mexer no código: `app/actions.ts` é um módulo `"use server"`
e só pode exportar funções assíncronas — exportar uma constante de lá compila,
passa no lint e só rebenta quando alguém submete o formulário. É por isso que o
estado partilhado com o formulário vive em `lib/form-state.ts`.

## O que faz

Três separadores, um por pergunta:

**Hoje** — como estou, e já registei?
- O peso em grande, com a variação face a ~7 dias antes e uma mini-linha da
  fase recente; as outras sete métricas em cartões compactos.
- Formulário com os três campos do dia-a-dia sempre à vista e os perímetros
  atrás de um toque, para o gesto diário caber num ecrã sem deslizar.
- **Um registo por dia.** A data é a chave: voltar a gravar o mesmo dia corrige
  o registo em vez de criar um duplicado, e o formulário mostra o que já lá
  está. Campos em branco ficam por medir (`null`), não a zero.

**Evolução** — o que mudou, e em que ritmo?
- Um gráfico de cada vez, com a métrica escolhida numa fila de fichas.
- Intervalo (30 / 90 / 365 dias / tudo) e agrupamento por dia, semana ou mês
  (semana e mês são a média das medições existentes).
- Vista **Comparar**, com as métricas escolhidas indexadas em % face à primeira
  medição do intervalo.

**Histórico** — o que é que eu registei no dia 12?
- Uma ficha por dia no telemóvel, tabela no ecrã grande, com apagar.
- Exportar JSON/CSV e importar JSON, para cópias de segurança e para levar os
  dados para outro lado.

## Onde estão os dados

Num ficheiro SQLite em `data/medidas.db` (configurável em `DATABASE_FILE`). A
pasta `data/` está no `.gitignore`: são dados pessoais e não entram no
repositório.

**Isto tem uma consequência para o deploy.** Em plataformas com sistema de
ficheiros efémero — Vercel, Netlify e afins — o ficheiro desaparece a cada
arranque. Para essas, ou se quiseres a app acessível de vários dispositivos, é
preciso uma base de dados alojada. O ponto de troca está isolado: `lib/repo.ts`
é a única fronteira de acesso a dados (seis funções), e só ele precisa de mudar.
Para uso local ou numa máquina com disco persistente (um VPS, um Raspberry Pi,
Docker com volume), o SQLite chega e sobra.

Enquanto o ficheiro for local, **a exportação é a cópia de segurança.**

## Estrutura

```
app/
  layout.tsx         tipo de letra (Outfit) e o script que aplica o tema antes de pintar
  page.tsx           componente de servidor: lê os registos e entrega-os à casca
  actions.ts         server actions de gravar e apagar
  api/export         descarregar tudo em JSON ou CSV
  api/import         restaurar uma exportação (numa transação)
  globals.css        tokens de cor, claro e escuro
lib/
  metrics.ts         definição das 8 métricas — único sítio a mexer para acrescentar uma
  db.ts              ligação SQLite, esquema e migração de colunas
  repo.ts            fronteira de acesso a dados
  validation.ts      esquemas zod, partilhados pelo formulário e pela importação
  series.ts          intervalos, agregação, variações, indexação relativa e escala Y
  dates.ts           dias de calendário em AAAA-MM-DD, sem fusos horários
components/
  Dashboard.tsx      casca: cabeçalho, separadores e a vista ativa
  Nav.tsx            barra fixa no fundo (telemóvel) e separadores no cabeçalho (ecrã grande)
  ui.tsx             peças partilhadas: cartão, fichas, comutador, botões
  TodayView          .. HeroCard, MetricCard, EntryForm
  TrendsView         .. MetricChart, RelativeChart
  HistoryView        .. HistoryList, DataTransfer
  theme.tsx          modo claro/escuro e o cromado dos gráficos em hex
exemplo/             conjunto de dados de demonstração e imagens do README
```

## Acrescentar uma métrica

Uma entrada em `METRICS` (`lib/metrics.ts`) com um par de cores do próximo slot
livre da paleta. O formulário, os cartões, os gráficos, a tabela, a exportação e
a coluna na base de dados seguem daí — `lib/db.ts` acrescenta a coluna em falta
no arranque seguinte.

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
