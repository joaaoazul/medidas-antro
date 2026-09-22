import { describe, expect, it } from "vitest";
import { classificar, escreverCsv, lerCsv } from "@/lib/csv";
import type { Entry } from "@/lib/types";
import { medicao } from "./apoio";

function ler(texto: string) {
  const r = lerCsv(texto);
  if (!r.ok) throw new Error(`esperava leitura, veio: ${r.mensagem}`);
  return r;
}

describe("ida e volta", () => {
  it("le de volta exatamente o que a exportacao escreve", () => {
    const originais: Entry[] = [
      medicao("2026-01-15", { peso: 82.4, abdomen: 90.1 }, { hora: "07:30" }),
      medicao("2026-01-15", { peso: 83.1 }, { hora: "22:10", nota: 'Jantar fora, "muito" sal; férias\nem Tavira' }),
      medicao("2026-01-16", { gordura: 21, braco: 34.5 }),
    ];
    const r = ler(escreverCsv(originais));
    expect(r.erros).toEqual([]);
    expect(r.ignoradas).toEqual([]);
    expect(r.medicoes.map((m) => m.entrada)).toEqual(
      originais.map((o) => ({ date: o.date, hora: o.hora, nota: o.nota, values: o.values })),
    );
  });

  it("a exportacao comeca com o BOM, para o Excel nao estragar os acentos", () => {
    expect(escreverCsv([]).charCodeAt(0)).toBe(0xfeff);
  });
});

describe("o CSV do Excel em portugues", () => {
  const excel =
    "﻿Data;Hora;Peso (kg);Perímetro abdominal (cm);% Gordura;Notas\r\n" +
    "22/01/2026;8:00;82,4;90,1;21;\"férias; praia\"\r\n" +
    "23/01/2026;08:15:00;82,1;;;\r\n";

  it("separador ;, virgula decimal, datas com o dia primeiro, CRLF e BOM", () => {
    const r = ler(excel);
    expect(r.erros).toEqual([]);
    expect(r.medicoes).toHaveLength(2);
    const [a, b] = r.medicoes.map((m) => m.entrada);
    expect(a).toMatchObject({ date: "2026-01-22", hora: "08:00", nota: "férias; praia" });
    expect(a.values).toMatchObject({ peso: 82.4, abdomen: 90.1, gordura: 21 });
    expect(b).toMatchObject({ date: "2026-01-23", hora: "08:15", nota: null });
    expect(b.values.abdomen).toBeNull();
  });

  it("reconhece cabecalhos com unidades, maiusculas e sem acentos", () => {
    expect(ler(excel).reconhecidas).toEqual([
      "Data", "Hora", "Peso (kg)", "Perímetro abdominal (cm)", "% Gordura", "Notas",
    ]);
    expect(ler("DATA;PERIMETRO ABDOMINAL [cm]\n22/01/2026;90").medicoes[0].entrada.values.abdomen).toBe(90);
  });
});

describe("cabecalhos", () => {
  it("aceita sinonimos comuns", () => {
    const r = ler("date,weight,cintura,body fat\n2026-01-22,82,90,21");
    expect(r.medicoes[0].entrada.values).toMatchObject({ peso: 82, abdomen: 90, gordura: 21 });
  });

  it("NAO confunde massa magra com massa muscular", () => {
    // Massa magra inclui osso, orgaos e agua. Importa-la como musculo pintava
    // um numero errado com ar de certo.
    const r = ler("data,peso,massa magra\n2026-01-22,82,65");
    expect(r.ignoradas).toEqual(["massa magra"]);
    expect(r.medicoes[0].entrada.values.musculo).toBeNull();
  });

  it("com a mesma coluna duas vezes, vale a primeira", () => {
    const r = ler("data,peso,weight\n2026-01-22,82,99");
    expect(r.medicoes[0].entrada.values.peso).toBe(82);
    expect(r.ignoradas).toEqual(["weight"]);
  });
});

describe("datas e horas", () => {
  it("o dia vem antes do mes -- 03/04 e 3 de abril", () => {
    expect(ler("data;peso\n03/04/2026;80").medicoes[0].entrada.date).toBe("2026-04-03");
  });

  it("aceita - e . como separadores de data", () => {
    const r = ler("data;peso\n03-04-2026;80\n03.04.2026;81");
    expect(r.medicoes.map((m) => m.entrada.date)).toEqual(["2026-04-03", "2026-04-03"]);
  });

  it("tira a hora da data quando nao ha coluna de hora", () => {
    const r = ler("data;peso\n22/01/2026 08:15;80");
    expect(r.medicoes[0].entrada).toMatchObject({ date: "2026-01-22", hora: "08:15" });
  });

  it("aceita horas a portuguesa", () => {
    const r = ler("data;hora;peso\n22/01/2026;8h30;80\n23/01/2026;7h;80");
    expect(r.medicoes.map((m) => m.entrada.hora)).toEqual(["08:30", "07:00"]);
  });
});

describe("erros por linha", () => {
  it("apontam a linha do ficheiro e nao estragam as outras", () => {
    const r = ler(
      "data;peso;abdomen\n" +
        "22/01/2026;80;90\n" + //       linha 2: boa
        "ontem;80;90\n" + //            linha 3: data
        "24/01/2026;oitenta;90\n" + //  linha 4: numero
        "25/01/2026;500;90\n" + //      linha 5: fora dos limites
        "\n" + //                       linha 6: vazia, ignorada
        "27/01/2026;;\n" + //           linha 7: nenhuma medida
        "28/01/2026;81;91\n", //        linha 8: boa
    );
    expect(r.medicoes.map((m) => m.linha)).toEqual([2, 8]);
    expect(r.erros.map((e) => e.linha)).toEqual([3, 4, 5, 7]);
    expect(r.erros[0].mensagem).toContain("ontem");
    expect(r.erros[1].mensagem).toContain("Peso");
    expect(r.erros[2].mensagem).toContain("entre 20 e 400");
  });

  it("uma nota com quebra de linha nao desalinha a numeracao", () => {
    const r = ler('data;peso;nota\n22/01/2026;80;"duas\nlinhas"\nerrada;80;x\n');
    expect(r.medicoes[0].entrada.nota).toBe("duas\nlinhas");
    expect(r.erros[0].linha).toBe(4);
  });
});

describe("ficheiros que nao servem", () => {
  it("vazio", () => {
    expect(lerCsv("")).toEqual({ ok: false, mensagem: "O ficheiro está vazio." });
    expect(lerCsv("﻿  \n")).toMatchObject({ ok: false });
  });

  it("sem coluna de data", () => {
    const r = lerCsv("peso;abdomen\n80;90");
    expect(r.ok).toBe(false);
    expect(!r.ok && r.mensagem).toContain("coluna de data");
  });

  it("sem nenhuma medida reconhecida", () => {
    const r = lerCsv("data;passos;calorias\n22/01/2026;8000;2100");
    expect(r.ok).toBe(false);
    expect(!r.ok && r.mensagem).toContain("passos");
  });
});

describe("classificar", () => {
  const existentes = [
    medicao("2026-01-22", { peso: 80 }, { hora: "08:00" }),
    medicao("2026-01-23", { peso: 81 }),
  ];
  const linhas = (texto: string) => ler(texto).medicoes;

  it("separa novas, iguais e conflitos", () => {
    const c = classificar(
      linhas(
        "data;hora;peso\n" +
          "22/01/2026;08:00;80\n" + //  igual a uma existente
          "22/01/2026;08:00;79\n" + //  mesmo dia e hora, outro valor
          "22/01/2026;21:00;81\n" + //  nova
          "24/01/2026;;82\n", //        nova
      ),
      existentes,
    );
    expect(c.iguais.map((m) => m.linha)).toEqual([2]);
    expect(c.conflitos.map((m) => m.linha)).toEqual([3]);
    expect(c.novas.map((m) => m.linha)).toEqual([4, 5]);
  });

  it("reimportar o proprio CSV nao traz nada de novo", () => {
    const c = classificar(ler(escreverCsv(existentes)).medicoes, existentes);
    expect(c.novas).toEqual([]);
    expect(c.iguais).toHaveLength(2);
  });

  it("uma linha com MENOS medidas do que a existente, e as mesmas, e igual -- nao conflito", () => {
    // O caso real: uma folha que so regista o peso, contra dias que a app ja
    // tem com a gordura da balanca.
    const app = [medicao("2026-01-22", { peso: 88.8, gordura: 26.6 }, { hora: "07:30" })];
    const c = classificar(linhas("data;hora;peso\n22/01/2026;07:30;88,8"), app);
    expect(c.iguais).toHaveLength(1);
    expect(c.conflitos).toEqual([]);
  });

  it("um valor que a linha traz e que difere e conflito", () => {
    const app = [medicao("2026-01-22", { peso: 88.8, gordura: 26.6 }, { hora: "07:30" })];
    const c = classificar(linhas("data;hora;peso;gordura\n22/01/2026;07:30;88,8;25"), app);
    expect(c.conflitos).toHaveLength(1);
  });

  it("uma folha sem horas contra medicoes com hora: a mesma pesagem e igual", () => {
    const app = [medicao("2026-01-22", { peso: 88.8 }, { hora: "07:30" })];
    const c = classificar(linhas("data;peso\n22/01/2026;88,8"), app);
    expect(c.iguais).toHaveLength(1);
  });

  it("sem hora, outra medicao no mesmo dia e legitima", () => {
    const c = classificar(linhas("data;peso\n23/01/2026;81,5"), existentes);
    expect(c.novas).toHaveLength(1);
  });

  it("duas linhas do proprio ficheiro com o mesmo dia e hora: a segunda e conflito", () => {
    const c = classificar(linhas("data;hora;peso\n25/01/2026;08:00;80\n25/01/2026;08:00;81"), []);
    expect(c.novas.map((m) => m.linha)).toEqual([2]);
    expect(c.conflitos.map((m) => m.linha)).toEqual([3]);
  });
});
