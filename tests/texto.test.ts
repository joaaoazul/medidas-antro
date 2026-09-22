import { describe, expect, it } from "vitest";
import { normalizar } from "@/lib/texto";

describe("normalizar", () => {
  it("tira os acentos todos, nao so os mais comuns", () => {
    expect(normalizar("férias")).toBe("ferias");
    expect(normalizar("manhã")).toBe("manha");
    expect(normalizar("almoço")).toBe("almoco");
    expect(normalizar("pêssego")).toBe("pessego");
    expect(normalizar("Müller")).toBe("muller");
    expect(normalizar("José")).toBe("jose");
  });

  it("ignora maiusculas", () => {
    expect(normalizar("MEDIDAS DA SEMANA")).toBe("medidas da semana");
  });

  it("deixa passar o que nao tem acentos", () => {
    expect(normalizar("2026-03-15")).toBe("2026-03-15");
    expect(normalizar("")).toBe("");
  });

  it("faz uma nota acentuada encontrar-se sem acento e vice-versa", () => {
    // O que a pesquisa do historico precisa, nos dois sentidos.
    expect(normalizar("Férias na Madeira").includes(normalizar("ferias"))).toBe(
      true,
    );
    expect(normalizar("Ferias na Madeira").includes(normalizar("férias"))).toBe(
      true,
    );
  });
});
