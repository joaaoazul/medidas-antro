import { describe, expect, it } from "vitest";
import { todayISO } from "@/lib/dates";
import { lerMedicao, parseNumber, quando } from "@/lib/form-entry";

function formulario(campos: Record<string, string>): FormData {
  const fd = new FormData();
  fd.set("date", todayISO());
  fd.set("hora", "08:00");
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

describe("parseNumber", () => {
  it("aceita virgula decimal -- e assim que se escreve em portugues", () => {
    expect(parseNumber("82,4")).toBe(82.4);
    expect(parseNumber("82.4")).toBe(82.4);
    expect(parseNumber(" 82,4 ")).toBe(82.4);
  });

  it("campo vazio e medida por fazer, nunca zero", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("   ")).toBeNull();
    expect(parseNumber(null)).toBeNull();
  });

  it("distingue lixo de vazio", () => {
    expect(parseNumber("oitenta")).toBe("erro");
    expect(parseNumber("82,4,1")).toBe("erro");
  });
});

describe("lerMedicao", () => {
  it("le um formulario minimo", () => {
    const r = lerMedicao(formulario({ peso: "80,4" }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.entrada.values.peso).toBe(80.4);
      expect(r.entrada.values.abdomen).toBeNull();
      expect(r.entrada.id).toBeUndefined();
    }
  });

  it("nomeia a metrica que tem lixo", () => {
    const r = lerMedicao(formulario({ peso: "80", abdomen: "abc" }));
    expect(r).toEqual({
      ok: false,
      message: "Perímetro abdominal: valor não é um número.",
    });
  });

  it("recusa um formulario sem medida nenhuma", () => {
    expect(lerMedicao(formulario({})).ok).toBe(false);
  });

  it("trata uma nota so com espacos como sem nota", () => {
    const r = lerMedicao(formulario({ peso: "80", nota: "   " }));
    expect(r.ok && r.entrada.nota).toBeNull();
  });

  it("leva o id quando esta a editar", () => {
    const id = "3f1c2a4e-8b7d-4c6a-9e2f-1a2b3c4d5e6f";
    const r = lerMedicao(formulario({ peso: "80", id }));
    expect(r.ok && r.entrada.id).toBe(id);
  });
});

describe("quando", () => {
  it("junta a hora so quando a ha", () => {
    expect(quando({ date: "2026-09-22", hora: "08:00" })).toBe("2026-09-22 às 08:00");
    expect(quando({ date: "2026-09-22", hora: null })).toBe("2026-09-22");
  });
});
