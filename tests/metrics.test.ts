import { describe, expect, it } from "vitest";
import { METRICS, METRIC_IDS, comArtigo, formatValue } from "@/lib/metrics";

/**
 * As invariantes da paleta.
 *
 * O README e explicito: cada metrica ocupa para sempre o mesmo slot, os pares
 * claro/escuro passam os limiares de daltonismo, e trocar um hexadecimal
 * isolado desfaz isso. Estes testes nao verificam contraste -- verificam que
 * ninguem acrescenta uma metrica a reutilizar uma cor ja tomada, que e a forma
 * mais provavel de partir a regra sem dar por isso.
 */
describe("METRICS", () => {
  it("nao repete identificadores", () => {
    expect(new Set(METRIC_IDS).size).toBe(METRICS.length);
  });

  it("nao repete cores, em nenhum dos modos", () => {
    for (const modo of ["light", "dark"] as const) {
      const cores = METRICS.map((m) => m.color[modo]);
      expect(new Set(cores).size).toBe(METRICS.length);
    }
  });

  it("tem limites de sanidade coerentes", () => {
    for (const m of METRICS) {
      expect(m.min).toBeLessThan(m.max);
      expect(m.decimals).toBeGreaterThanOrEqual(0);
    }
  });

  it("tem genero em todas -- o texto corrido precisa de concordar", () => {
    for (const m of METRICS) {
      expect(["m", "f"]).toContain(m.genero);
    }
  });
});

describe("formatValue", () => {
  it("mostra ausencia em vez de zero", () => {
    expect(formatValue("peso", null)).toBe("--");
    expect(formatValue("peso", NaN)).toBe("--");
    expect(formatValue("peso", 0)).toBe("0.0");
  });
});

describe("comArtigo", () => {
  it("concorda com o genero do rotulo", () => {
    expect(comArtigo("abdomen")).toBe("o perímetro abdominal");
    expect(comArtigo("musculo")).toBe("a massa muscular");
    expect(comArtigo("gordura")).toBe("a gordura corporal");
  });
});
