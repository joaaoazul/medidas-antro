/**
 * CSV: o que a app exporta, e o que uma pessoa traz de outro lado.
 *
 * Ler e escrever vivem juntos para o que a app escreve ser, por construcao,
 * o que ela sabe ler -- testado a ida e volta.
 *
 * A leitura foi pensada para o caso real em Portugal: uma folha de Excel
 * guardada como CSV. O Excel com o sistema em portugues separa por ";",
 * escreve "82,4" com virgula e datas como "22/09/2026". Um importador que so
 * aceitasse o formato da propria exportacao nao servia a ninguem que trouxesse
 * anos de registos de uma folha de calculo -- que e precisamente quem mais
 * precisa de importar.
 *
 * Tudo aqui e puro: sem rede, sem armazenamento. Corre no browser, antes do
 * envio, para a pessoa ver o que vai entrar ANTES de entrar.
 */
import { parseNumber } from "./form-entry";
import { METRICS, METRIC_BY_ID, METRIC_IDS, type MetricId } from "./metrics";
import { normalizar } from "./texto";
import type { Entry } from "./types";
import { entrySchema, firstError, type EntryInput } from "./validation";

/* ------------------------------------------------------------------ *
 * Escrever
 * ------------------------------------------------------------------ */

/** Aspas, separadores e quebras de linha numa nota partiriam a linha. */
function campo(valor: string): string {
  if (!/[",;\n\r]/.test(valor)) return valor;
  return `"${valor.replace(/"/g, '""')}"`;
}

/**
 * O CSV da exportacao.
 *
 * Comeca com o BOM de UTF-8 de proposito. Sem ele, o Excel abre o ficheiro
 * como Windows-1252 e "ferias" com acento vira "fÃ©rias" -- e o comentario da
 * exportacao diz que o CSV existe "para ler numa folha de calculo". A leitura
 * abaixo ignora-o.
 */
export function escreverCsv(entries: Entry[]): string {
  const cabecalho = ["data", "hora", ...METRIC_IDS, "nota"].join(",");
  const linhas = entries.map((entry) =>
    [
      entry.date,
      entry.hora ?? "",
      ...METRIC_IDS.map((id) => entry.values[id] ?? ""),
      campo(entry.nota ?? ""),
    ].join(","),
  );
  return `﻿${[cabecalho, ...linhas].join("\n")}`;
}

/* ------------------------------------------------------------------ *
 * Partir em linhas e campos
 * ------------------------------------------------------------------ */

type Registo = { linha: number; campos: string[] };

/**
 * RFC 4180, com o separador que vier.
 *
 * Uma maquina de estados e nao um `split`: uma nota com ";" ou com uma quebra
 * de linha, entre aspas, e um campo so -- e um `split` partia-a em dois e
 * desalinhava todas as colunas a seguir, em silencio. Guarda a linha fisica
 * onde cada registo comeca, para os erros apontarem a linha que o Excel mostra.
 */
function partir(texto: string, sep: string): Registo[] {
  const registos: Registo[] = [];
  let campos: string[] = [];
  let atual = "";
  let entreAspas = false;
  let linha = 1;
  let inicio = 1;

  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];
    if (entreAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          atual += '"';
          i += 1;
        } else {
          entreAspas = false;
        }
      } else {
        if (c === "\n") linha += 1;
        atual += c;
      }
      continue;
    }
    if (c === '"' && atual === "") {
      entreAspas = true;
    } else if (c === sep) {
      campos.push(atual);
      atual = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i += 1;
      campos.push(atual);
      registos.push({ linha: inicio, campos });
      campos = [];
      atual = "";
      linha += 1;
      inicio = linha;
    } else {
      atual += c;
    }
  }
  if (atual !== "" || campos.length > 0) {
    campos.push(atual);
    registos.push({ linha: inicio, campos });
  }
  return registos;
}

/** O separador e o que mais aparece no cabecalho, fora de aspas. */
function separadorDe(texto: string): ";" | "," | "\t" {
  const primeira = texto.split(/\r?\n/, 1)[0].replace(/"[^"]*"/g, "");
  const contagem = ([";", ",", "\t"] as const).map((s) => ({
    s,
    n: primeira.split(s).length - 1,
  }));
  contagem.sort((a, b) => b.n - a.n);
  return contagem[0].n > 0 ? contagem[0].s : ",";
}

/* ------------------------------------------------------------------ *
 * Cabecalhos
 * ------------------------------------------------------------------ */

type Coluna = "date" | "hora" | "nota" | MetricId;

/**
 * Nomes que uma coluna pode ter, alem dos da propria app.
 *
 * "cintura" e o perimetro abdominal: a propria app o trata assim, na
 * ferramenta do racio cintura-altura. "massa magra" NAO e massa muscular --
 * inclui osso, orgaos e agua -- e por isso nao esta aqui: importa-la como
 * musculo pintava um numero errado com ar de certo.
 */
const SINONIMOS: [string, Coluna][] = [
  ["data", "date"],
  ["date", "date"],
  ["dia", "date"],
  ["hora", "hora"],
  ["horas", "hora"],
  ["time", "hora"],
  ["nota", "nota"],
  ["notas", "nota"],
  ["note", "nota"],
  ["notes", "nota"],
  ["observacao", "nota"],
  ["observacoes", "nota"],
  ["comentario", "nota"],
  ["weight", "peso"],
  ["peso corporal", "peso"],
  ["cintura", "abdomen"],
  ["perimetro da cintura", "abdomen"],
  ["waist", "abdomen"],
  ["massa gorda", "gordura"],
  ["body fat", "gordura"],
  ["fat", "gordura"],
  ["muscle", "musculo"],
  ["muscle mass", "musculo"],
  ["chest", "peito"],
  ["torax", "peito"],
  ["hips", "anca"],
  ["hip", "anca"],
  ["quadril", "anca"],
  ["arm", "braco"],
  ["thigh", "coxa"],
];

const COLUNAS = new Map<string, Coluna>([
  ...METRICS.flatMap((m) =>
    [m.id, m.label, m.short].map((n) => [normalizar(n), m.id] as [string, Coluna]),
  ),
  ...SINONIMOS,
]);

/**
 * "Peso (kg)", "% Gordura", "PERIMETRO ABDOMINAL [cm]" -- tudo vira o nome
 * limpo. Sem acentos nem maiusculas, pela mesma razao que a pesquisa do
 * historico: quem escreveu o cabecalho nao pensou em como a app o ia ler.
 */
function colunaDe(cabecalho: string): Coluna | null {
  const limpo = normalizar(cabecalho)
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(/%/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(kg|cm)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return COLUNAS.get(limpo) ?? null;
}

/* ------------------------------------------------------------------ *
 * Datas e horas
 * ------------------------------------------------------------------ */

const dois = (n: string) => n.padStart(2, "0");

/**
 * "2026-09-22", "22/09/2026", "22-09-2026", "22.09.2026", com ou sem hora.
 *
 * O dia vem sempre antes do mes quando a data nao e ISO. E uma suposicao, e
 * esta escrita: esta e uma app portuguesa, e "03/04/2026" em Portugal e 3 de
 * abril. Um CSV americano com o mes primeiro entraria trocado nos dias ate
 * 12 -- e daria erro a partir do 13, que e onde a troca se denuncia.
 */
function lerData(bruto: string): { date: string; hora: string | null } | null {
  const t = bruto.trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?/);
  if (m) {
    return {
      date: `${m[1]}-${dois(m[2])}-${dois(m[3])}`,
      hora: m[4] ? `${dois(m[4])}:${m[5]}` : null,
    };
  }
  m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:[ ,]+(\d{1,2}):(\d{2})(?::\d{2})?)?$/);
  if (m) {
    return {
      date: `${m[3]}-${dois(m[2])}-${dois(m[1])}`,
      hora: m[4] ? `${dois(m[4])}:${m[5]}` : null,
    };
  }
  return null;
}

/** "8:00", "08:00:00", "8h30", "8h". */
function lerHora(bruto: string): string | null | "erro" {
  const t = bruto.trim().toLowerCase();
  if (t === "") return null;
  const m = t.match(/^(\d{1,2})(?::(\d{2})(?::\d{2})?|h(\d{2})?)$/);
  if (!m) return "erro";
  return `${dois(m[1])}:${m[2] ?? m[3] ?? "00"}`;
}

/* ------------------------------------------------------------------ *
 * Ler
 * ------------------------------------------------------------------ */

export type LinhaLida = { linha: number; entrada: EntryInput };
export type ErroDeLinha = { linha: number; mensagem: string };

export type LeituraCsv =
  | { ok: false; mensagem: string }
  | {
      ok: true;
      medicoes: LinhaLida[];
      erros: ErroDeLinha[];
      /** Cabecalhos reconhecidos e ignorados, tal como vinham no ficheiro. */
      reconhecidas: string[];
      ignoradas: string[];
    };

/**
 * Le um CSV e valida cada linha com o mesmo esquema do formulario.
 *
 * Uma linha com erro nao estraga as outras: fica numa lista a parte, com o
 * numero da linha, e a pessoa decide se importa as validas. Um ficheiro sem
 * coluna de data, ou sem nenhuma metrica que se reconheca, e recusado inteiro
 * -- ai nao ha nada de util a importar, e o problema e o ficheiro todo.
 */
export function lerCsv(texto: string): LeituraCsv {
  const limpo = texto.replace(/^﻿/, "");
  if (limpo.trim() === "") return { ok: false, mensagem: "O ficheiro está vazio." };

  const registos = partir(limpo, separadorDe(limpo));
  const [cabecalho, ...corpo] = registos;

  const mapa: (Coluna | null)[] = [];
  const reconhecidas: string[] = [];
  const ignoradas: string[] = [];
  const vistas = new Set<Coluna>();
  for (const nome of cabecalho.campos) {
    const coluna = colunaDe(nome);
    // A mesma coluna duas vezes ("peso" e "weight"): vale a primeira.
    if (coluna && !vistas.has(coluna)) {
      vistas.add(coluna);
      mapa.push(coluna);
      reconhecidas.push(nome.trim());
    } else {
      mapa.push(null);
      if (nome.trim() !== "") ignoradas.push(nome.trim());
    }
  }

  if (!vistas.has("date")) {
    return {
      ok: false,
      mensagem:
        'Não encontrei uma coluna de data. A primeira linha tem de ter os nomes das colunas, e uma delas "data".',
    };
  }
  if (!METRIC_IDS.some((id) => vistas.has(id))) {
    return {
      ok: false,
      mensagem: `Não reconheci nenhuma medida nas colunas (${cabecalho.campos.join(", ")}). Usa nomes como peso, abdómen, gordura.`,
    };
  }

  const medicoes: LinhaLida[] = [];
  const erros: ErroDeLinha[] = [];

  for (const { linha, campos } of corpo) {
    if (campos.every((c) => c.trim() === "")) continue;

    const valor = (c: Coluna) => {
      const i = mapa.indexOf(c);
      return i === -1 ? "" : (campos[i] ?? "");
    };

    const data = lerData(valor("date"));
    if (!data) {
      erros.push({
        linha,
        mensagem: `Data "${valor("date").trim()}" não reconhecida (usa 2026-09-22 ou 22/09/2026).`,
      });
      continue;
    }

    const horaColuna = lerHora(valor("hora"));
    if (horaColuna === "erro") {
      erros.push({ linha, mensagem: `Hora "${valor("hora").trim()}" não reconhecida.` });
      continue;
    }

    const values = {} as Record<MetricId, number | null>;
    let lixo: string | null = null;
    for (const id of METRIC_IDS) {
      const n = parseNumber(valor(id));
      if (n === "erro") {
        lixo ??= `${METRIC_BY_ID[id].label}: "${valor(id).trim()}" não é um número.`;
        values[id] = null;
      } else {
        values[id] = n;
      }
    }
    if (lixo) {
      erros.push({ linha, mensagem: lixo });
      continue;
    }

    const nota = valor("nota").trim();
    const r = entrySchema.safeParse({
      date: data.date,
      hora: horaColuna ?? data.hora,
      nota: nota === "" ? null : nota,
      values,
    });
    if (!r.success) {
      erros.push({ linha, mensagem: firstError(r.error) });
      continue;
    }
    medicoes.push({ linha, entrada: r.data });
  }

  return { ok: true, medicoes, erros, reconhecidas, ignoradas };
}

/* ------------------------------------------------------------------ *
 * Contra o que ja existe
 * ------------------------------------------------------------------ */

export type Classificacao = {
  /** Vao ser importadas. */
  novas: LinhaLida[];
  /** O que trazem ja la esta: ignoradas sem dano. */
  iguais: LinhaLida[];
  /** Ja ha uma medicao nesse dia e hora, com outros valores. */
  conflitos: LinhaLida[];
};

/**
 * Cada valor que a linha traz coincide com a medicao existente?
 *
 * "Cada valor que traz", e nao "todos os valores": uma folha que so regista o
 * peso, contra dias que a app ja tem com a gordura da balanca, nao esta a
 * contradizer nada -- tem menos. Comparar tudo punha todas essas linhas como
 * "valores diferentes", e era mentira.
 */
function contida(
  linha: Record<MetricId, number | null>,
  existente: Record<MetricId, number | null>,
): boolean {
  return METRIC_IDS.every((id) => {
    const x = linha[id];
    const y = existente[id];
    return x === null || (y !== null && Math.abs(x - y) < 0.0005);
  });
}

type Existente = { hora: string | null; values: Record<MetricId, number | null> };

/**
 * Separa o que e novo do que ja la esta.
 *
 * Existe porque o CSV nao leva id. Sem isto, reimportar o proprio CSV -- ou
 * um que se sobrepoe em parte ao que ja foi registado -- batia no indice unico
 * (dia, hora) e o ficheiro inteiro era recusado, incluindo as linhas novas.
 *
 * - **Igual**: o que a linha traz ja esta numa medicao desse dia. Se um dos
 *   lados nao tem hora, a hora nao conta -- uma folha sem horas contra
 *   medicoes da app que as tem continua a ser a mesma pesagem. Ignorada.
 * - **Conflito**: ja ha uma medicao nesse dia e a essa hora, e nao e esta. A
 *   base de dados recusava-a, e escolher qual das duas e a verdadeira nao e
 *   decisao que um importador deva tomar sozinho. Fica de fora, e e dito.
 * - **Nova**: o resto. Sem hora, varias medicoes no mesmo dia sao legitimas.
 */
export function classificar(
  medicoes: LinhaLida[],
  existentes: Entry[],
): Classificacao {
  const porDia = new Map<string, Existente[]>();
  for (const e of existentes) {
    porDia.set(e.date, [...(porDia.get(e.date) ?? []), { hora: e.hora, values: e.values }]);
  }

  const out: Classificacao = { novas: [], iguais: [], conflitos: [] };
  for (const m of medicoes) {
    const { date, hora, values } = m.entrada;
    const doDia = porDia.get(date) ?? [];
    const compativeis = doDia.filter(
      (e) => e.hora === hora || e.hora === null || hora === null,
    );

    if (compativeis.some((e) => contida(values, e.values))) {
      out.iguais.push(m);
    } else if (hora !== null && doDia.some((e) => e.hora === hora)) {
      out.conflitos.push(m);
    } else {
      out.novas.push(m);
      // A seguinte com o mesmo dia e hora, no proprio ficheiro, ja conta com
      // esta -- a base de dados recusava as duas no mesmo lote.
      porDia.set(date, [...doDia, { hora, values }]);
    }
  }
  return out;
}
