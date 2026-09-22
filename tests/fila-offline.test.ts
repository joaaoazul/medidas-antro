import { beforeEach, describe, expect, it } from "vitest";
import {
  chave,
  descartar,
  enfileirar,
  enviar,
  ler,
  type Armazem,
} from "@/lib/fila-offline";
import type { EntryInput } from "@/lib/validation";
import { METRIC_IDS, type MetricId } from "@/lib/metrics";

class Memoria implements Armazem {
  dados = new Map<string, string>();
  getItem(k: string) {
    return this.dados.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.dados.set(k, v);
  }
}

const vazios = Object.fromEntries(METRIC_IDS.map((id) => [id, null])) as Record<
  MetricId,
  number | null
>;

function entrada(peso: number, id?: string): EntryInput {
  return {
    id,
    date: "2026-09-22",
    hora: "08:00",
    nota: null,
    values: { ...vazios, peso },
  };
}

let seq = 0;
const novoId = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, "0")}`;

/** Um `fetch` falso que responde por ordem. */
function respostas(...lista: (Response | Error)[]) {
  const pedidos: unknown[] = [];
  const f = (async (_url: string, init?: RequestInit) => {
    pedidos.push(JSON.parse(String(init?.body)));
    const r = lista.shift();
    if (!r) throw new Error("pedido a mais");
    if (r instanceof Error) throw r;
    return r;
  }) as unknown as typeof fetch;
  return { f, pedidos };
}

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { "content-type": "application/json" },
  });

/** O que o fetch devolve quando segue o redirect do middleware para /entrar. */
function redirectParaEntrar(): Response {
  const r = new Response("<html>Entrar</html>", {
    status: 200,
    headers: { "content-type": "text/html" },
  });
  Object.defineProperty(r, "redirected", { value: true });
  return r;
}

let armazem: Memoria;
beforeEach(() => {
  armazem = new Memoria();
});

describe("enfileirar", () => {
  it("da um id a uma medicao nova", () => {
    const p = enfileirar(armazem, "A", entrada(80), novoId);
    expect(p.entrada.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(ler(armazem, "A")).toHaveLength(1);
  });

  it("mantem o id de uma medicao em edicao -- o envio altera-a em vez de criar outra", () => {
    const id = "3f1c2a4e-8b7d-4c6a-9e2f-1a2b3c4d5e6f";
    expect(enfileirar(armazem, "A", entrada(80, id), novoId).entrada.id).toBe(id);
  });

  it("o mesmo id duas vezes fica uma so, a mais recente", () => {
    const id = "3f1c2a4e-8b7d-4c6a-9e2f-1a2b3c4d5e6f";
    enfileirar(armazem, "A", entrada(80, id), novoId);
    enfileirar(armazem, "A", entrada(81, id), novoId);
    const fila = ler(armazem, "A");
    expect(fila).toHaveLength(1);
    expect(fila[0].entrada.values.peso).toBe(81);
  });

  it("a fila e por conta: o que A guardou, B nao ve", () => {
    enfileirar(armazem, "A", entrada(80), novoId);
    expect(ler(armazem, "B")).toEqual([]);
  });

  it("lanca quando o armazenamento recusa, para ninguem dizer que ficou guardada", () => {
    const cheio: Armazem = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(() => enfileirar(cheio, "A", entrada(80), novoId)).toThrow();
  });
});

describe("ler", () => {
  it("trata lixo no armazenamento como fila vazia", () => {
    armazem.setItem(chave("A"), "{isto nao e json");
    expect(ler(armazem, "A")).toEqual([]);
    armazem.setItem(chave("A"), '{"nao":"e uma lista"}');
    expect(ler(armazem, "A")).toEqual([]);
  });
});

describe("enviar", () => {
  it("envia pelo endpoint de importacao, com o id, e tira da fila o que chegou", async () => {
    const p = enfileirar(armazem, "A", entrada(80), novoId);
    const { f, pedidos } = respostas(json({ imported: 1 }));

    expect(await enviar(armazem, "A", f)).toEqual({ enviadas: 1 });
    expect(ler(armazem, "A")).toEqual([]);
    expect(pedidos).toEqual([{ entries: [p.entrada] }]);
  });

  it("sem rede, para e deixa tudo na fila", async () => {
    enfileirar(armazem, "A", entrada(80), novoId);
    enfileirar(armazem, "A", entrada(81), novoId);
    const { f } = respostas(new TypeError("Failed to fetch"));

    expect(await enviar(armazem, "A", f)).toEqual({ enviadas: 0, parou: "sem-rede" });
    expect(ler(armazem, "A")).toHaveLength(2);
  });

  it("SESSAO EXPIRADA: um 200 que veio de um redirect nao apaga a medicao", async () => {
    // O caso que uma fila ingenua transformava em perda de dados.
    enfileirar(armazem, "A", entrada(80), novoId);
    const { f } = respostas(redirectParaEntrar());

    expect(await enviar(armazem, "A", f)).toEqual({ enviadas: 0, parou: "sem-sessao" });
    expect(ler(armazem, "A")).toHaveLength(1);
  });

  it("SESSAO EXPIRADA, o caso real: o 307 preserva o POST e o fetch acaba num 405 sem JSON", async () => {
    // Medido contra o servidor: POST /api/import sem sessao -> 307 para
    // /entrar -> POST /entrar -> 405. Nao e uma recusa da medicao.
    enfileirar(armazem, "A", entrada(80), novoId);
    const r = new Response("", { status: 405 });
    Object.defineProperty(r, "redirected", { value: true });
    const { f } = respostas(r);

    expect(await enviar(armazem, "A", f)).toEqual({ enviadas: 0, parou: "sem-sessao" });
    const fila = ler(armazem, "A");
    expect(fila).toHaveLength(1);
    expect(fila[0].falha).toBeUndefined();
  });

  it("um 200 sem a prova de importacao nao conta como enviado", async () => {
    enfileirar(armazem, "A", entrada(80), novoId);
    const { f } = respostas(json({ outra: "coisa" }));

    await enviar(armazem, "A", f);
    expect(ler(armazem, "A")).toHaveLength(1);
  });

  it("um 4xx marca-a como recusada, com a mensagem, e segue para a proxima", async () => {
    enfileirar(armazem, "A", entrada(80), novoId);
    enfileirar(armazem, "A", entrada(81), novoId);
    const { f } = respostas(
      json({ error: "Já existe uma medição nesse dia a essa hora." }, 409),
      json({ imported: 1 }),
    );

    expect(await enviar(armazem, "A", f)).toEqual({ enviadas: 1 });
    const fila = ler(armazem, "A");
    expect(fila).toHaveLength(1);
    expect(fila[0].falha).toBe("Já existe uma medição nesse dia a essa hora.");
  });

  it("uma recusa nao se reenvia sozinha", async () => {
    enfileirar(armazem, "A", entrada(80), novoId);
    await enviar(armazem, "A", respostas(json({ error: "não" }, 400)).f);
    const { f, pedidos } = respostas();

    expect(await enviar(armazem, "A", f)).toEqual({ enviadas: 0 });
    expect(pedidos).toHaveLength(0);
  });

  it("um 5xx e passageiro: para e fica tudo para depois", async () => {
    enfileirar(armazem, "A", entrada(80), novoId);
    const { f } = respostas(json({ error: "base de dados em baixo" }, 500));

    expect(await enviar(armazem, "A", f)).toEqual({ enviadas: 0, parou: "servidor" });
    expect(ler(armazem, "A")[0].falha).toBeUndefined();
  });

  it("se a rede cair a meio, o que ja foi nao volta a ir", async () => {
    enfileirar(armazem, "A", entrada(80), novoId);
    enfileirar(armazem, "A", entrada(81), novoId);
    const { f } = respostas(json({ imported: 1 }), new TypeError("Failed to fetch"));

    expect(await enviar(armazem, "A", f)).toEqual({ enviadas: 1, parou: "sem-rede" });
    const fila = ler(armazem, "A");
    expect(fila).toHaveLength(1);
    expect(fila[0].entrada.values.peso).toBe(81);
  });

  it("so envia a fila de quem esta autenticado", async () => {
    enfileirar(armazem, "A", entrada(80), novoId);
    const { f, pedidos } = respostas();

    expect(await enviar(armazem, "B", f)).toEqual({ enviadas: 0 });
    expect(pedidos).toHaveLength(0);
    expect(ler(armazem, "A")).toHaveLength(1);
  });
});

describe("descartar", () => {
  it("tira so aquela", () => {
    const a = enfileirar(armazem, "A", entrada(80), novoId);
    enfileirar(armazem, "A", entrada(81), novoId);
    descartar(armazem, "A", a.entrada.id);
    expect(ler(armazem, "A").map((p) => p.entrada.values.peso)).toEqual([81]);
  });
});
