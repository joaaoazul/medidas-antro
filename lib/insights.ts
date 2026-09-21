/**
 * O que os registos de uma pessoa dizem sobre ela.
 *
 * A app tinha os numeros todos e deixava a interpretacao inteira a quem a usa:
 * um grafico a descer nao diz se a descida ja e maior do que o ruido da
 * balanca, e o peso quase igual durante dois meses parece "nada aconteceu"
 * mesmo quando o abdomen encolheu tres centimetros. Estas funcoes procuram os
 * casos em que os dados dizem alguma coisa e poem-na por palavras.
 *
 * Tres regras, todas herdadas do resto da app:
 *
 * 1. **Descrever, nunca julgar.** A app nao sabe qual e o objetivo de quem a
 *    usa. Nenhum insight felicita nem alerta; dizem o que esta la e mais nada.
 * 2. **So quando os dados sustentam.** Cada um tem um minimo de medicoes e um
 *    limiar proprio. Um insight que aparece sempre nao informa nada, e um que
 *    aparece sem base e pior do que nenhum.
 * 3. **A explicacao vive nos artigos.** Cada insight aponta para o artigo que
 *    desenvolve o assunto -- e la que estao os avisos de que isto nao e
 *    aconselhamento medico, escritos uma vez e nao repetidos mal.
 */
import {
  RACIO_CATEGORIAS,
  calcularRacioCinturaAltura,
  categoriaRacioCinturaAltura,
} from "./calculators";
import { addDaysISO, daysBetween, longLabel, todayISO } from "./dates";
import {
  METRICS,
  METRIC_BY_ID,
  comArtigo,
  formatValue,
  type MetricId,
} from "./metrics";
import {
  amostras,
  buildSeries,
  latestReading,
  regressao,
  ritmo,
  withTrend,
} from "./series";
import type { Entry } from "./types";

export type Insight = {
  id: string;
  titulo: string;
  texto: string;
  /** Artigo que desenvolve o assunto. */
  artigo?: string;
};

/** Arredonda para as casas da metrica, sem sinal. */
function v(metric: MetricId, valor: number): string {
  return formatValue(metric, Math.abs(valor));
}

function u(metric: MetricId): string {
  return METRIC_BY_ID[metric].unit;
}

/* ------------------------------------------------------------------ *
 * Ruido proprio
 * ------------------------------------------------------------------ */

/**
 * Variacao tipica de um dia para o outro, em mediana.
 *
 * Mediana e nao media: uma unica pesagem esquecida a seguir a um jantar de
 * familia nao deve definir o que a pessoa considera normal.
 */
export function ruidoDiario(
  entries: Entry[],
  metric: MetricId,
): number | null {
  const serie = buildSeries(entries, metric, "dia");
  const difs: number[] = [];

  for (let i = 1; i < serie.length; i += 1) {
    const dias = Math.round((serie[i].t - serie[i - 1].t) / 86_400_000);
    if (dias !== 1) continue;
    const a = serie[i - 1].value;
    const b = serie[i].value;
    if (a === null || b === null) continue;
    difs.push(Math.abs(b - a));
  }

  if (difs.length < 15) return null;
  difs.sort((a, b) => a - b);
  return difs[Math.floor(difs.length / 2)];
}

/**
 * O ruido da propria pessoa, e quanto tempo e preciso para o ultrapassar.
 *
 * E o insight mais util que se pode dar a quem se pesa todos os dias: diz-lhe
 * quando pode ignorar um numero. Sem ele, a app pede que se confie na
 * tendencia sem nunca dizer a partir de que diferenca e que vale a pena olhar.
 */
function insightRuido(entries: Entry[]): Insight | null {
  const ruido = ruidoDiario(entries, "peso");
  if (ruido === null || ruido === 0) return null;

  const r = ritmo(entries, "peso");
  const porDia = r ? Math.abs(r.porSemana) / 7 : 0;
  // Quantos dias ate a mudanca real ser maior do que o ruido de um dia.
  const dias = porDia > 0 ? Math.round(ruido / porDia) : null;

  const base =
    `De um dia para o outro o teu peso mexe-se tipicamente ${v("peso", ruido)} ${u("peso")}. ` +
    `Uma diferença menor do que isso, entre duas pesagens, não se distingue de água, sal e digestão.`;

  return {
    id: "ruido",
    titulo: `O teu ruído é de ${v("peso", ruido)} ${u("peso")}`,
    texto:
      dias !== null && dias >= 2 && dias <= 120
        ? `${base} Ao ritmo das últimas semanas, são precisos cerca de ${dias} dias para a mudança real passar a ser maior do que o ruído de um dia.`
        : base,
    artigo: "porque-o-peso-varia",
  };
}

/* ------------------------------------------------------------------ *
 * Recomposicao
 * ------------------------------------------------------------------ */

type Extremos = { inicio: number; fim: number; delta: number };

/**
 * Variacao entre o principio e o fim de uma janela, por medias das pontas.
 *
 * Usar a primeira e a ultima medicao seria comparar duas leituras isoladas --
 * as duas com o ruido todo em cima. A media dos primeiros e dos ultimos dias
 * custa o mesmo e e muito mais estavel.
 */
function extremos(
  entries: Entry[],
  metric: MetricId,
  de: string,
  ate: string,
  pontaDias = 14,
): Extremos | null {
  const inicio = amostras(entries, metric, de, addDaysISO(de, pontaDias));
  const fim = amostras(entries, metric, addDaysISO(ate, -pontaDias), ate);
  if (inicio.length === 0 || fim.length === 0) return null;

  const media = (xs: { y: number }[]) =>
    xs.reduce((s, p) => s + p.y, 0) / xs.length;

  const a = media(inicio);
  const b = media(fim);
  return { inicio: a, fim: b, delta: b - a };
}

/** Janela onde se procura uma recomposicao: mexe-se devagar, precisa de tempo. */
const RECOMP_DIAS = 90;

/**
 * Peso quase na mesma, forma diferente.
 *
 * E o caso em que a balanca sozinha mente por omissao, e e a razao de a app
 * registar oito metricas e nao uma.
 */
function insightRecomposicao(entries: Entry[]): Insight | null {
  const latest = latestReading(entries, "peso");
  if (!latest) return null;

  const de = addDaysISO(latest.date, -RECOMP_DIAS);
  if (entries[0].date > addDaysISO(de, 14)) return null;

  const peso = extremos(entries, "peso", de, latest.date);
  if (!peso) return null;

  // "Quase na mesma" e relativo a pessoa: 1,5 kg pesam muito mais em 55 kg do
  // que em 110.
  const limiar = Math.max(1, peso.inicio * 0.015);
  if (Math.abs(peso.delta) > limiar) return null;

  const mudou: string[] = [];
  for (const metric of ["abdomen", "gordura", "musculo"] as MetricId[]) {
    const e = extremos(entries, metric, de, latest.date);
    if (!e) continue;
    // Abaixo disto e erro de fita metrica ou de balanca de bioimpedancia.
    const minimo = metric === "musculo" ? 0.5 : 1;
    if (Math.abs(e.delta) < minimo) continue;
    const verbo = e.delta < 0 ? "desceu" : "subiu";
    mudou.push(`${comArtigo(metric)} ${verbo} ${v(metric, e.delta)} ${u(metric)}`);
  }

  if (mudou.length === 0) return null;

  // "o abdómen desceu 3 cm e a massa muscular subiu 1 kg", nunca com virgula
  // antes do ultimo: le-se uma frase, nao uma lista de campos.
  const lista =
    mudou.length === 1
      ? mudou[0]
      : `${mudou.slice(0, -1).join(", ")} e ${mudou[mudou.length - 1]}`;

  const pesoDiz =
    Math.abs(peso.delta) < 0.1
      ? "o peso ficou onde estava"
      : `o peso mexeu-se ${v("peso", peso.delta)} ${u("peso")}`;

  return {
    id: "recomposicao",
    titulo: "O peso está quase na mesma, mas tu não",
    texto:
      `Desde ${longLabel(de)} ${pesoDiz}, mas ${lista}. ` +
      `A balança sozinha não mostrava isto.`,
    artigo: "recomposicao-corporal",
  };
}

/* ------------------------------------------------------------------ *
 * Planalto
 * ------------------------------------------------------------------ */

/**
 * Parado agora, a mexer antes.
 *
 * Um planalto e o momento em que mais gente desiste, e quase sempre por o ler
 * como fracasso em vez de como a forma normal da curva. Dize-lo com os numeros
 * dos dois periodos e mais util do que qualquer encorajamento.
 */
function insightPlanalto(entries: Entry[]): Insight | null {
  const latest = latestReading(entries, "peso");
  if (!latest) return null;

  const fimAnterior = addDaysISO(latest.date, -28);
  const inicioAnterior = addDaysISO(latest.date, -84);

  const recentes = amostras(entries, "peso", fimAnterior, latest.date);
  const antes = amostras(entries, "peso", inicioAnterior, fimAnterior);
  if (recentes.length < 6 || antes.length < 10) return null;

  const retaRecente = regressao(recentes);
  const retaAntes = regressao(antes);
  if (!retaRecente || !retaAntes) return null;

  const agora = retaRecente.declive * 7;
  const dantes = retaAntes.declive * 7;

  // Parado agora, e antes a mexer-se a serio e com um ajuste que o sustente.
  if (Math.abs(agora) > 0.1) return null;
  if (Math.abs(dantes) < 0.2 || retaAntes.r2 < 0.4) return null;

  const sentido = dantes < 0 ? "descido" : "subido";

  return {
    id: "planalto",
    titulo: "Quatro semanas praticamente sem variação",
    texto:
      `No último mês o peso ficou onde estava, depois de nos dois meses ` +
      `anteriores ter ${sentido} ${v("peso", dantes)} ${u("peso")} por semana. ` +
      `Os planaltos fazem parte da curva -- não são o fim dela.`,
    artigo: "perda-de-peso-nao-e-linear",
  };
}

/* ------------------------------------------------------------------ *
 * Manha contra noite
 * ------------------------------------------------------------------ */

/** Dias com duas pesagens a horas diferentes antes de valer a pena a conta. */
const DIAS_COM_DUAS = 8;

/**
 * A diferenca entre a primeira e a ultima pesagem do mesmo dia.
 *
 * E a prova, medida no proprio corpo de quem le, de que uma pesagem so vale
 * comparada com outra a mesma hora -- muito mais convincente do que a mesma
 * frase num artigo.
 */
function insightDentroDoDia(entries: Entry[]): Insight | null {
  const porDia = new Map<string, { hora: string; valor: number }[]>();

  for (const entry of entries) {
    const valor = entry.values.peso;
    if (valor === null || !entry.hora) continue;
    const lista = porDia.get(entry.date) ?? [];
    lista.push({ hora: entry.hora, valor });
    porDia.set(entry.date, lista);
  }

  const difs: number[] = [];
  for (const lista of porDia.values()) {
    if (lista.length < 2) continue;
    const ordenada = [...lista].sort((a, b) => (a.hora < b.hora ? -1 : 1));
    const primeira = ordenada[0];
    const ultima = ordenada[ordenada.length - 1];
    if (primeira.hora === ultima.hora) continue;
    difs.push(ultima.valor - primeira.valor);
  }

  if (difs.length < DIAS_COM_DUAS) return null;

  difs.sort((a, b) => a - b);
  const mediana = difs[Math.floor(difs.length / 2)];
  if (Math.abs(mediana) < 0.3) return null;

  const sentido = mediana > 0 ? "mais" : "menos";

  return {
    id: "dentro-do-dia",
    titulo: `Pesas ${v("peso", mediana)} ${u("peso")} ${sentido} ao fim do dia`,
    texto:
      `Nos ${difs.length} dias em que te pesaste mais do que uma vez, a última ` +
      `pesagem deu tipicamente ${v("peso", mediana)} ${u("peso")} ${sentido} do que a primeira. ` +
      `É o mesmo corpo no mesmo dia -- comparar uma pesagem da manhã com uma da noite ` +
      `não diz nada sobre gordura.`,
    artigo: "sempre-a-mesma-hora",
  };
}

/* ------------------------------------------------------------------ *
 * Padrao semanal
 * ------------------------------------------------------------------ */

/**
 * Indexado pelo dia da semana do JavaScript (0 = domingo).
 *
 * A preposicao vem com o dia porque o genero muda: e "as segundas" mas "aos
 * sabados". Compor "a(s) " + nome dava sempre uma das duas errada.
 */
const DIAS_DA_SEMANA = [
  "aos domingos",
  "às segundas",
  "às terças",
  "às quartas",
  "às quintas",
  "às sextas",
  "aos sábados",
];

/**
 * O dia da semana em que pesas mais, e aquele em que pesas menos.
 *
 * A conta e feita sobre o RESIDUO face a tendencia, nao sobre o valor. Sem
 * descontar a tendencia, quem esta a perder peso veria sempre o inicio da
 * semana "mais pesado" do que o fim, so porque o inicio vem primeiro -- o
 * padrao seria um artefacto da ordem dos dias, nao um padrao semanal.
 */
function insightSemanal(entries: Entry[]): Insight | null {
  const serie = buildSeries(entries, "peso", "dia");
  if (serie.length < 60) return null;

  const residuos: number[][] = Array.from({ length: 7 }, () => []);
  for (const p of withTrend(serie)) {
    if (p.value === null || p.trend === null) continue;
    const dia = new Date(p.t).getUTCDay();
    residuos[dia].push(p.value - p.trend);
  }

  const medias = residuos.map((xs) =>
    xs.length >= 6 ? xs.reduce((s, x) => s + x, 0) / xs.length : null,
  );
  const validos = medias
    .map((m, i) => ({ m, i }))
    .filter((d): d is { m: number; i: number } => d.m !== null);
  if (validos.length < 5) return null;

  const alto = validos.reduce((a, b) => (b.m > a.m ? b : a));
  const baixo = validos.reduce((a, b) => (b.m < a.m ? b : a));
  const amplitude = alto.m - baixo.m;

  // Tem de ser maior do que o ruido de um dia, senao e so ruido arrumado por
  // dia da semana.
  const ruido = ruidoDiario(entries, "peso");
  if (ruido === null || amplitude < ruido) return null;

  return {
    id: "semanal",
    titulo: `Pesas mais ${DIAS_DA_SEMANA[alto.i]}`,
    texto:
      `Descontada a tendência, ${DIAS_DA_SEMANA[alto.i]} ficas ${v("peso", alto.m)} ${u("peso")} ` +
      `acima do teu próprio nível, e ${DIAS_DA_SEMANA[baixo.i]} ${v("peso", baixo.m)} ${u("peso")} abaixo. ` +
      `São ${v("peso", amplitude)} ${u("peso")} que se repetem todas as semanas sem a massa gorda mudar.`,
    artigo: "quanto-pesa-a-agua",
  };
}


/* ------------------------------------------------------------------ *
 * A metrica que mais se mexeu
 * ------------------------------------------------------------------ */

/** Janela onde se compara o movimento das varias metricas. */
const MOVIMENTO_DIAS = 90;

/** Movimento relativo abaixo disto e erro de medicao, nao mudanca. */
const MOVIMENTO_MINIMO_PCT = 1.5;

/**
 * Qual das oito metricas se mexeu mais, em proporcao.
 *
 * Compara-se em percentagem e nao na unidade porque kg, cm e pontos
 * percentuais nao se comparam -- e a mesma razao pela qual o grafico nunca tem
 * dois eixos Y, e pela qual a vista Comparar indexa tudo a uma base comum. A
 * pergunta a que responde -- "o que e que esta mesmo a mudar em mim?" -- nao se
 * responde olhando para oito cartoes um a um.
 */
function insightMovimento(entries: Entry[]): Insight | null {
  const latest = latestReading(entries, "peso");
  if (!latest) return null;

  const de = addDaysISO(latest.date, -MOVIMENTO_DIAS);
  if (entries[0].date > addDaysISO(de, 14)) return null;

  const movimentos: { metric: MetricId; pct: number; delta: number }[] = [];
  for (const metric of METRICS) {
    const e = extremos(entries, metric.id, de, latest.date);
    if (!e || e.inicio === 0) continue;
    movimentos.push({
      metric: metric.id,
      pct: (e.delta / e.inicio) * 100,
      delta: e.delta,
    });
  }

  if (movimentos.length < 2) return null;

  movimentos.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
  const maior = movimentos[0];
  if (Math.abs(maior.pct) < MOVIMENTO_MINIMO_PCT) return null;

  const peso = movimentos.find((m) => m.metric === "peso");
  // Se o que mais se mexeu foi o proprio peso, o insight nao acrescenta nada ao
  // que o cartao do Hoje ja diz em grande.
  if (maior.metric === "peso") return null;

  const verbo = maior.delta < 0 ? "desceu" : "subiu";
  const comparacao =
    peso && Math.abs(peso.pct) >= 0.5
      ? ` No mesmo período o peso mudou ${Math.abs(peso.pct).toFixed(1)}%.`
      : " No mesmo período o peso praticamente não mudou.";

  /*
   * Numa metrica que ja e uma percentagem, escrever "desceu 2,3 %, 10,3% do
   * que era" poe duas percentagens com significados diferentes na mesma
   * frase. Pontos para a variacao absoluta resolve, e e o termo correto.
   */
  const emPontos = u(maior.metric) === "%";
  const absoluta = emPontos
    ? `${v(maior.metric, maior.delta)} pontos`
    : `${v(maior.metric, maior.delta)} ${u(maior.metric)}`;

  return {
    id: "movimento",
    titulo: `${METRIC_BY_ID[maior.metric].short} é o que mais mudou`,
    texto:
      `Em ${MOVIMENTO_DIAS} dias ${comArtigo(maior.metric)} ${verbo} ` +
      `${absoluta} -- ${Math.abs(maior.pct).toFixed(1)}% do que era.${comparacao}`,
    artigo: "peso-nao-e-gordura",
  };
}

/* ------------------------------------------------------------------ *
 * Racio cintura-altura
 * ------------------------------------------------------------------ */

/**
 * O racio cintura-altura, e para onde vai.
 *
 * A ferramenta ja calcula o de hoje; o que falta e o movimento. Um racio
 * isolado e um numero com uma banda ao lado, e o mesmo racio com tres meses
 * atras ao lado e uma direcao -- que e o que a pessoa pode mudar.
 *
 * So aparece com a altura preenchida: sem ela nao ha racio nenhum.
 */
function insightRacio(entries: Entry[], alturaCm: number | null): Insight | null {
  if (!alturaCm) return null;

  const latest = latestReading(entries, "abdomen");
  if (!latest) return null;
  // Uma fita metrica de ha meio ano nao descreve ninguem hoje.
  if (daysBetween(latest.date, todayISO()) > 60) return null;

  const agora = calcularRacioCinturaAltura(latest.value, alturaCm);
  const categoria = categoriaRacioCinturaAltura(agora);

  /*
   * A banda vem com os seus limites, e nao so com o nome.
   *
   * Arredondado a duas casas, um racio de 0,503 aparece como "0,50" ao lado de
   * "risco acrescido", e quem leia a banda como "abaixo de 0,50" ve uma
   * contradicao onde ha so arredondamento. Dizer de onde ate onde vai a banda
   * torna o caso de fronteira obvio em vez de suspeito -- e informa, que e o
   * que um insight tem de fazer.
   */
  const i = RACIO_CATEGORIAS.indexOf(categoria);
  const minimo = i === 0 ? null : RACIO_CATEGORIAS[i - 1].max;
  const limites =
    minimo === null
      ? `abaixo de ${categoria.max.toFixed(2)}`
      : categoria.max === Infinity
        ? `acima de ${minimo.toFixed(2)}`
        : `de ${minimo.toFixed(2)} a ${categoria.max.toFixed(2)}`;

  const antes = extremos(
    entries,
    "abdomen",
    addDaysISO(latest.date, -90),
    latest.date,
  );

  let movimento = "";
  if (antes && Math.abs(antes.delta) >= 1) {
    const racioAntes = calcularRacioCinturaAltura(antes.inicio, alturaCm);
    const verbo = antes.delta < 0 ? "Desceu" : "Subiu";
    movimento = ` ${verbo} de ${racioAntes.toFixed(2)} nos últimos três meses.`;
  }

  return {
    id: "racio",
    titulo: `O teu rácio cintura-altura é ${agora.toFixed(2)}`,
    texto:
      `Cai na banda "${categoria.label.toLowerCase()}" das referências mais ` +
      `citadas, que vai ${limites}.${movimento} ` +
      `Mede a cintura contra a altura, por isso não confunde quem é baixo e ` +
      `magro com quem é alto e largo -- ao contrário do IMC.`,
    artigo: "racio-cintura-altura",
  };
}

/* ------------------------------------------------------------------ *
 * Cadencia do registo
 * ------------------------------------------------------------------ */

/** Dias observados para contar a cadencia. */
const CADENCIA_DIAS = 30;

/**
 * Com que frequencia a pessoa se pesa, e o que isso faz a leitura.
 *
 * Nao e uma repreensao -- a app nao manda em ninguem. E a consequencia
 * tecnica: com menos pontos, cada um pesa mais na tendencia, e a linha reage
 * mais a um dia isolado. Quem souber isso le o proprio grafico melhor.
 */
function insightCadencia(entries: Entry[]): Insight | null {
  const hoje = todayISO();
  const de = addDaysISO(hoje, -(CADENCIA_DIAS - 1));

  // So a quem ja tem historico: a quem comecou ha duas semanas isto nao diz
  // nada que nao seja obvio.
  if (entries.length === 0 || daysBetween(entries[0].date, hoje) < 60) {
    return null;
  }

  const dias = new Set<string>();
  for (const entry of entries) {
    if (entry.date >= de && entry.values.peso !== null) dias.add(entry.date);
  }

  // Acima de metade dos dias nao ha nada a dizer: a leitura e solida.
  if (dias.size === 0 || dias.size > CADENCIA_DIAS * 0.5) return null;

  return {
    id: "cadencia",
    titulo: `Pesaste-te em ${dias.size} dos últimos ${CADENCIA_DIAS} dias`,
    texto:
      `Com menos pontos, cada pesagem pesa mais na tendência, e a linha reage ` +
      `mais a um dia isolado. Não há número certo de pesagens -- mas vale a ` +
      `pena saber que a linha é menos firme do que parece quando os pontos são ` +
      `poucos.`,
    artigo: "tendencia-importa-mais",
  };
}

/* ------------------------------------------------------------------ *
 * Reuniao
 * ------------------------------------------------------------------ */

/** Quantos insights se mostram de uma vez. Mais do que isto e uma lista. */
export const MAX_INSIGHTS = 4;

/**
 * Os insights que os dados sustentam, do mais especifico para o mais geral.
 *
 * A ordem e a prioridade: uma recomposicao ou um planalto sao factos daquela
 * pessoa naquele mes, e valem mais do que o ruido diario, que e verdade para
 * toda a gente que se pese.
 */
export function insights(
  entries: Entry[],
  alturaCm: number | null = null,
): Insight[] {
  if (entries.length === 0) return [];

  const candidatos: ((e: Entry[]) => Insight | null)[] = [
    insightRecomposicao,
    insightPlanalto,
    insightMovimento,
    (e) => insightRacio(e, alturaCm),
    insightDentroDoDia,
    insightSemanal,
    insightCadencia,
    insightRuido,
  ];

  const out: Insight[] = [];
  for (const f of candidatos) {
    const insight = f(entries);
    if (insight) out.push(insight);
    if (out.length === MAX_INSIGHTS) break;
  }
  return out;
}
