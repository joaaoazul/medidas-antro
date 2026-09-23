/**
 * Medicoes guardadas no aparelho enquanto nao ha rede.
 *
 * O caso de uso e o que a app foi desenhada para servir: de manha, com uma
 * mao, numa casa de banho com Wi-Fi mau. Ate aqui, gravar sem rede nao perdia
 * so a medicao -- a app inteira caia para um ecra de erro, e o que estava
 * escrito nos campos ia com ela.
 *
 * Quatro decisoes, todas contra a mesma coisa: perder uma medicao em silencio.
 *
 * 1. **A fila e por conta.** A chave leva o id de quem a encheu. Sem isso, se a
 *    pessoa A gravasse sem rede, saisse, e a pessoa B entrasse no mesmo
 *    telemovel, a medicao de A era enviada para a conta de B -- dados de saude
 *    de uma pessoa gravados no registo de outra.
 *
 * 2. **O id nasce no aparelho.** O envio passa pelo endpoint de importacao, que
 *    reconcilia pelo id. Se a resposta se perder depois de o servidor ja ter
 *    gravado, reenviar nao duplica: escreve outra vez a mesma linha.
 *
 * 3. **So sai da fila com prova de que chegou.** Uma sessao expirada nao da
 *    erro: o middleware responde com um redirect para /entrar, o `fetch` segue-o
 *    e devolve 200 -- com o HTML da pagina de entrada. Confiar em `response.ok`
 *    apagava a unica copia da medicao. A prova e a resposta JSON do endpoint,
 *    com o numero de registos importados.
 *
 * 4. **Recusa e falha nao sao a mesma coisa.** Um 4xx (validacao, uma medicao
 *    igual ja gravada) nao melhora com tempo: fica marcada, visivel, e nao se
 *    reenvia sozinha. Um 5xx ou a rede em baixo sao passageiros: tenta-se outra
 *    vez depois.
 *
 * Nada aqui toca em `window`: o armazenamento e o `fetch` entram por parametro,
 * para os testes poderem exercitar cada um destes casos sem browser.
 */
import type { EntryInput } from "./validation";

export type Pendente = {
  /** A medicao tal como o formulario a validou, ja com id. */
  entrada: EntryInput & { id: string };
  /** Quando foi guardada no aparelho (ISO). */
  guardadaEm: string;
  /** Mensagem do servidor quando a recusou. Uma recusa nao se reenvia sozinha. */
  falha?: string;
};

/** O que a fila precisa de um armazenamento -- o localStorage cumpre-o. */
export type Armazem = Pick<Storage, "getItem" | "setItem">;

export function chave(userId: string): string {
  return `medidas-fila:${userId}`;
}

/**
 * Quem tem a sessao aberta neste aparelho.
 *
 * A pagina offline (public/offline.html) e estatica e nao ve a sessao: sem
 * isto, nao saberia em que fila por conta guardar a medicao. Escreve-a o
 * painel ao abrir, apaga-a o botao de sair -- por isso so existe enquanto ha
 * alguem com sessao iniciada. Nao e um dado de saude: e o id da conta.
 */
export const MARCA_UTILIZADOR = "medidas-utilizador";

/** A fila de uma conta. Conteudo ilegivel e tratado como fila vazia. */
export function ler(armazem: Armazem, userId: string): Pendente[] {
  try {
    const bruto = armazem.getItem(chave(userId));
    if (!bruto) return [];
    const lista: unknown = JSON.parse(bruto);
    return Array.isArray(lista) ? (lista as Pendente[]) : [];
  } catch {
    return [];
  }
}

function escrever(armazem: Armazem, userId: string, lista: Pendente[]): void {
  armazem.setItem(chave(userId), JSON.stringify(lista));
}

/**
 * Guarda uma medicao na fila.
 *
 * Lanca se o armazenamento recusar (modo privado, espaco cheio): quem chama
 * tem de dizer a pessoa que a medicao NAO ficou guardada, em vez de a deixar
 * pensar que sim.
 */
export function enfileirar(
  armazem: Armazem,
  userId: string,
  entrada: EntryInput,
  novoId: () => string,
  agora: () => Date = () => new Date(),
): Pendente {
  const pendente: Pendente = {
    // A editar, a medicao ja tem id e o envio altera-a; a criar, nasce aqui.
    entrada: { ...entrada, id: entrada.id ?? novoId() },
    guardadaEm: agora().toISOString(),
  };
  // Mesmo id duas vezes (um duplo toque, uma edicao ja em fila): a mais
  // recente substitui, como faria o servidor.
  const lista = ler(armazem, userId).filter(
    (p) => p.entrada.id !== pendente.entrada.id,
  );
  escrever(armazem, userId, [...lista, pendente]);
  return pendente;
}

export function descartar(armazem: Armazem, userId: string, id: string): void {
  escrever(
    armazem,
    userId,
    ler(armazem, userId).filter((p) => p.entrada.id !== id),
  );
}

export type ResultadoEnvio = {
  enviadas: number;
  /** Porque parou antes do fim, quando parou. */
  parou?: "sem-rede" | "sem-sessao" | "servidor";
};

/**
 * Envia o que esta em fila, uma medicao de cada vez.
 *
 * Uma de cada vez, e nao todas num pedido: uma medicao recusada nao pode
 * travar as outras, e cada uma que chega sai logo da fila -- se a rede cair a
 * meio, o que ja foi nao se reenvia.
 */
export async function enviar(
  armazem: Armazem,
  userId: string,
  fetcher: typeof fetch,
): Promise<ResultadoEnvio> {
  let enviadas = 0;

  for (const pendente of ler(armazem, userId)) {
    if (pendente.falha) continue;

    let resposta: Response;
    try {
      resposta = await fetcher("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entries: [pendente.entrada] }),
      });
    } catch {
      return { enviadas, parou: "sem-rede" };
    }

    // O redirect para /entrar chega aqui como um 200 com HTML. Nao e sucesso.
    if (resposta.redirected) return { enviadas, parou: "sem-sessao" };

    let corpo: { imported?: unknown; error?: unknown } | null = null;
    try {
      corpo = await resposta.json();
    } catch {
      corpo = null;
    }

    if (resposta.ok && typeof corpo?.imported === "number") {
      descartar(armazem, userId, pendente.entrada.id);
      enviadas += 1;
      continue;
    }

    if (resposta.status >= 400 && resposta.status < 500 && corpo) {
      const falha =
        typeof corpo.error === "string" ? corpo.error : "O servidor recusou-a.";
      escrever(
        armazem,
        userId,
        ler(armazem, userId).map((p) =>
          p.entrada.id === pendente.entrada.id ? { ...p, falha } : p,
        ),
      );
      continue;
    }

    // 5xx, ou uma resposta que nao se percebe: pode ser passageiro. Fica.
    return { enviadas, parou: corpo ? "servidor" : "sem-sessao" };
  }

  return { enviadas };
}

/** Distingue "o pedido nem chegou a sair" de qualquer outro erro. */
export function eErroDeRede(erro: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  // O `fetch` rejeita com TypeError quando o pedido nao sai ("Failed to
  // fetch" no Chrome, "Load failed" no Safari, "NetworkError" no Firefox).
  return (
    erro instanceof TypeError &&
    /fetch|network|load failed/i.test(erro.message)
  );
}
