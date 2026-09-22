import { describe, expect, it } from "vitest";
import { addDaysISO, todayISO } from "@/lib/dates";
import { METRIC_IDS, type MetricId } from "@/lib/metrics";
import { entrySchema, firstError } from "@/lib/validation";

const vazios = Object.fromEntries(METRIC_IDS.map((id) => [id, null])) as Record<
  MetricId,
  number | null
>;

const base = {
  date: todayISO(),
  hora: "08:00",
  nota: null,
  values: { ...vazios, peso: 80 },
};

describe("entrySchema", () => {
  it("aceita uma medicao minima", () => {
    expect(entrySchema.safeParse(base).success).toBe(true);
  });

  it("exige pelo menos uma medida -- uma linha toda vazia nao e um registo", () => {
    const r = entrySchema.safeParse({ ...base, values: vazios });
    expect(r.success).toBe(false);
    expect(firstError(r.error!)).toContain("pelo menos uma");
  });

  it("recusa uma data que o calendario nao tem", () => {
    // O regex sozinho deixava passar; e a normalizacao que apanha.
    expect(entrySchema.safeParse({ ...base, date: "2026-02-31" }).success).toBe(
      false,
    );
  });

  it("recusa datas futuras", () => {
    expect(
      entrySchema.safeParse({ ...base, date: addDaysISO(todayISO(), 1) }).success,
    ).toBe(false);
  });

  it("aceita uma medicao sem hora -- copias antigas nao tinham", () => {
    // A garantia do README: uma exportacao feita antes de existirem horas
    // continua a importar.
    expect(entrySchema.safeParse({ ...base, hora: undefined }).success).toBe(true);
    const r = entrySchema.parse({ ...base, hora: undefined });
    expect(r.hora).toBeNull();
    expect(entrySchema.parse({ ...base, hora: "" }).hora).toBeNull();
  });

  it("recusa horas malformadas", () => {
    for (const hora of ["24:00", "8:00", "07:60", "manhã"]) {
      expect(entrySchema.safeParse({ ...base, hora }).success).toBe(false);
    }
  });

  it("guarda os limites de sanidade de cada metrica", () => {
    expect(
      entrySchema.safeParse({ ...base, values: { ...vazios, peso: 5 } }).success,
    ).toBe(false);
    expect(
      entrySchema.safeParse({ ...base, values: { ...vazios, peso: 500 } }).success,
    ).toBe(false);
  });

  it("distingue ausente de zero", () => {
    // Zero seria uma leitura; a ausencia nao e. Por isso zero tem de bater nos
    // limites como qualquer outro valor.
    expect(
      entrySchema.safeParse({ ...base, values: { ...vazios, peso: 0 } }).success,
    ).toBe(false);
  });
});
