import { describe, expect, it } from "vitest";
import { colunaEmFalta } from "@/lib/esquema";
import { juntarObjetivos, lerObjetivos, limparObjetivos } from "@/lib/profile";

describe("colunaEmFalta", () => {
  it("reconhece ler (42703) e escrever (PGRST204) uma coluna que nao existe", () => {
    expect(colunaEmFalta({ code: "42703" })).toBe(true);
    expect(colunaEmFalta({ code: "PGRST204" })).toBe(true);
  });

  it("nao confunde com outros erros -- esses tem de continuar a ser erros", () => {
    expect(colunaEmFalta({ code: "42501" })).toBe(false);
    expect(colunaEmFalta({ code: "23505" })).toBe(false);
    expect(colunaEmFalta(null)).toBe(false);
  });
});

describe("limparObjetivos", () => {
  it("guarda o que e uma metrica conhecida com um numero dentro dos limites", () => {
    expect(limparObjetivos({ abdomen: 85, gordura: 18 })).toEqual({ abdomen: 85, gordura: 18 });
  });

  it("deita fora o resto", () => {
    expect(
      limparObjetivos({
        abdomen: 999, //        fora dos limites
        gordura: "18", //       texto
        musculo: null,
        cintura_antiga: 80, //  metrica que nao existe
        peso: 75, //            o peso vive noutra coluna
        braco: Number.NaN,
      }),
    ).toEqual({});
  });

  it("aguenta o que nao e um objeto", () => {
    for (const lixo of [null, undefined, 42, "x", [85]]) {
      expect(limparObjetivos(lixo)).toEqual({});
    }
  });
});

describe("juntarObjetivos", () => {
  it("poe o peso, que vem da sua coluna, ao lado dos outros", () => {
    expect(juntarObjetivos(75, { abdomen: 85 })).toEqual({ abdomen: 85, peso: 75 });
    expect(juntarObjetivos(null, { abdomen: 85 })).toEqual({ abdomen: 85 });
  });
});

describe("lerObjetivos", () => {
  const fd = (campos: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(campos)) f.set(k, v);
    return f;
  };

  it("le virgula decimal e ignora campos vazios", () => {
    expect(lerObjetivos(fd({ objetivo_abdomen: "85,5", objetivo_gordura: "" }))).toEqual({
      ok: true,
      valores: { abdomen: 85.5 },
    });
  });

  it("recusa fora dos limites, com a metrica no genero certo", () => {
    const r = lerObjetivos(fd({ objetivo_musculo: "500" }));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toBe("O objetivo para a massa muscular tem de estar entre 5 e 200 kg.");
  });

  it("recusa lixo", () => {
    const r = lerObjetivos(fd({ objetivo_abdomen: "oitenta" }));
    expect(!r.ok && r.message).toBe("O objetivo para o perímetro abdominal não é um número.");
  });

  it("ignora um campo de objetivo para o peso -- tem o seu proprio", () => {
    expect(lerObjetivos(fd({ objetivo_peso: "75" }))).toEqual({ ok: true, valores: {} });
  });
});
