import { describe, expect, it, vi } from "vitest";

/*
 * O contrato do endpoint de importacao, e nao so a logica de lib/.
 *
 * Esta aqui porque a fila offline depende dele ao pormenor: sucesso e
 * `{ imported: n }`, recusa definitiva e 4xx com `{ error }`, falha passageira
 * e 5xx com `{ error }`. Se isto mudar de um lado sem mudar do outro, a fila
 * passa a reenviar para sempre o que devia desistir -- ou pior, a desistir do
 * que devia reenviar. A base de dados e o cache do Next sao simulados.
 */
const importEntries = vi.fn();
vi.mock("@/lib/repo", () => ({ importEntries: (...a: unknown[]) => importEntries(...a) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { POST } = await import("@/app/api/import/route");
const { MEDICAO_DUPLICADA } = await import("@/lib/form-state");
const { todayISO } = await import("@/lib/dates");

const pedido = (corpo: unknown) =>
  new Request("http://x/api/import", {
    method: "POST",
    body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });

const medicao = {
  id: "3f1c2a4e-8b7d-4c6a-9e2f-1a2b3c4d5e6f",
  date: todayISO(),
  hora: "08:00",
  nota: null,
  values: { peso: 80, abdomen: null, gordura: null, musculo: null, peito: null, anca: null, braco: null, coxa: null },
};

/*
 * O mock nao e limpo entre testes, de proposito. Com um beforeEach a limpa-lo
 * (mockReset ou mockClear), nesta versao do Vitest a rejeicao definida num
 * teste aparecia a rebentar os testes seguintes -- incluindo os que nem o
 * chamam. Cada teste define o que a base de dados devolve, e o de validacao
 * conta as chamadas antes e depois em vez de depender de um historico limpo.
 */

describe("POST /api/import", () => {
  it("sucesso: { imported }", async () => {
    importEntries.mockResolvedValue(1);
    const r = await POST(pedido({ entries: [medicao] }));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ imported: 1 });
  });

  it("medicao repetida: 409 com a frase, nao 500 com o codigo do Postgres", async () => {
    importEntries.mockRejectedValue(new Error(MEDICAO_DUPLICADA));
    const r = await POST(pedido({ entries: [medicao] }));
    expect(r.status).toBe(409);
    expect(await r.json()).toEqual({ error: MEDICAO_DUPLICADA });
  });

  it("erro da base de dados: 500, mas em JSON", async () => {
    importEntries.mockRejectedValue(new Error("Não foi possível importar: timeout"));
    const r = await POST(pedido({ entries: [medicao] }));
    expect(r.status).toBe(500);
    expect(r.headers.get("content-type")).toContain("application/json");
    expect((await r.json()).error).toContain("timeout");
  });

  it("validacao: 400, sem tocar na base de dados", async () => {
    const antes = importEntries.mock.calls.length;
    const r = await POST(pedido({ entries: [{ ...medicao, values: { ...medicao.values, peso: 5 } }] }));
    expect(r.status).toBe(400);
    expect(importEntries.mock.calls.length).toBe(antes);
  });

  it("JSON invalido: 400", async () => {
    const r = await POST(pedido("{nao e json"));
    expect(r.status).toBe(400);
  });
});
