import { describe, expect, it } from "vitest";
import { insights, ruidoDiario } from "@/lib/insights";
import { diasAtras, medicao } from "./apoio";
import type { Entry } from "@/lib/types";

const ids = (entries: Entry[], altura: number | null = null) =>
  insights(entries, altura).map((i) => i.id);

/** Pesagem diaria a descer, com ruido alternado. */
function descida(dias: number, porDia = 0.05, ruido = 0.15): Entry[] {
  return Array.from({ length: dias }, (_, i) =>
    medicao(diasAtras(dias - 1 - i), {
      peso: 85 - i * porDia + (i % 2 ? ruido : -ruido),
    }),
  );
}

describe("guardas gerais", () => {
  it("nao diz nada sem registos", () => {
    expect(insights([])).toEqual([]);
  });

  it("nao diz nada a quem acabou de comecar", () => {
    expect(insights(descida(3))).toEqual([]);
  });

  it("nunca mostra mais do que quatro", () => {
    expect(insights(descida(200), 178).length).toBeLessThanOrEqual(4);
  });
});

describe("ruido diario", () => {
  it("e a mediana das diferencas de dias consecutivos", () => {
    const entries = Array.from({ length: 30 }, (_, i) =>
      medicao(diasAtras(29 - i), { peso: 80 + (i % 2 ? 0.4 : 0) }),
    );
    expect(ruidoDiario(entries, "peso")).toBeCloseTo(0.4, 5);
  });

  it("precisa de pares que cheguem", () => {
    expect(ruidoDiario(descida(10), "peso")).toBeNull();
  });

  it("ignora pares que nao sejam de dias seguidos", () => {
    const deCincoEmCinco = Array.from({ length: 30 }, (_, i) =>
      medicao(diasAtras(150 - i * 5), { peso: 80 + (i % 2 ? 1 : 0) }),
    );
    expect(ruidoDiario(deCincoEmCinco, "peso")).toBeNull();
  });
});

describe("recomposicao", () => {
  it("aparece com o peso parado e a composicao a mexer-se", () => {
    const entries = Array.from({ length: 100 }, (_, i) =>
      medicao(diasAtras(99 - i), {
        peso: 80 + (i % 3 === 0 ? 0.2 : -0.2),
        ...(i % 7 === 0
          ? { abdomen: 92 - (i / 100) * 4, musculo: 34 + (i / 100) * 1.5 }
          : {}),
      }),
    );
    expect(ids(entries)).toContain("recomposicao");
  });

  it("cala-se quando o peso tambem se mexeu", () => {
    const entries = Array.from({ length: 100 }, (_, i) =>
      medicao(diasAtras(99 - i), {
        peso: 85 - i * 0.05,
        ...(i % 7 === 0 ? { abdomen: 92 - (i / 100) * 4 } : {}),
      }),
    );
    expect(ids(entries)).not.toContain("recomposicao");
  });

  it("cala-se com o peso parado mas nada mais medido", () => {
    const entries = Array.from({ length: 100 }, (_, i) =>
      medicao(diasAtras(99 - i), { peso: 80 + (i % 3 === 0 ? 0.2 : -0.2) }),
    );
    expect(ids(entries)).not.toContain("recomposicao");
  });
});

describe("planalto", () => {
  it("aparece parado agora depois de se ter mexido antes", () => {
    const entries = Array.from({ length: 84 }, (_, i) =>
      medicao(diasAtras(83 - i), {
        peso:
          i < 56
            ? 85 - (i / 7) * 0.4 + (i % 2 ? 0.15 : -0.15)
            : 81.8 + (i % 2 ? 0.15 : -0.15),
      }),
    );
    expect(ids(entries)).toContain("planalto");
  });

  it("cala-se em quem continua a descer", () => {
    expect(ids(descida(84))).not.toContain("planalto");
  });
});

describe("racio cintura-altura", () => {
  const comAbdomen = Array.from({ length: 100 }, (_, i) =>
    medicao(diasAtras(99 - i), {
      peso: 82 - i * 0.02,
      ...(i % 7 === 0 ? { abdomen: 94 - (i / 100) * 5 } : {}),
    }),
  );

  it("precisa da altura do perfil", () => {
    expect(ids(comAbdomen, null)).not.toContain("racio");
    expect(ids(comAbdomen, 178)).toContain("racio");
  });

  it("cala-se com uma fita metrica velha de mais", () => {
    const antigo = Array.from({ length: 40 }, (_, i) =>
      medicao(diasAtras(200 - i), { peso: 82, abdomen: 94 }),
    ).concat(
      Array.from({ length: 40 }, (_, i) => medicao(diasAtras(39 - i), { peso: 82 })),
    );
    expect(ids(antigo, 178)).not.toContain("racio");
  });
});

describe("manha contra noite", () => {
  it("aparece com dias de duas pesagens a horas diferentes", () => {
    const entries = Array.from({ length: 20 }, (_, i) => [
      medicao(diasAtras(19 - i), { peso: 80 }, { hora: "08:00" }),
      medicao(diasAtras(19 - i), { peso: 80.9 }, { hora: "22:00" }),
    ]).flat();
    const encontrado = insights(entries).find((x) => x.id === "dentro-do-dia");
    expect(encontrado).toBeDefined();
    expect(encontrado!.titulo).toContain("mais ao fim do dia");
  });

  it("cala-se quando a diferenca e desprezavel", () => {
    const entries = Array.from({ length: 20 }, (_, i) => [
      medicao(diasAtras(19 - i), { peso: 80 }, { hora: "08:00" }),
      medicao(diasAtras(19 - i), { peso: 80.05 }, { hora: "22:00" }),
    ]).flat();
    expect(ids(entries)).not.toContain("dentro-do-dia");
  });

  it("cala-se com uma pesagem por dia", () => {
    expect(ids(descida(60))).not.toContain("dentro-do-dia");
  });
});

describe("padrao semanal", () => {
  it("encontra o dia em que se pesa mais", () => {
    const entries = Array.from({ length: 140 }, (_, i) => {
      const data = diasAtras(139 - i);
      const wd = new Date(`${data}T00:00:00Z`).getUTCDay();
      const fim = wd === 1 ? 0.6 : wd === 0 ? 0.4 : wd === 5 ? -0.3 : 0;
      return medicao(data, { peso: 82 - i * 0.02 + fim + (i % 3 === 0 ? 0.1 : -0.1) });
    });
    const encontrado = insights(entries).find((x) => x.id === "semanal");
    expect(encontrado).toBeDefined();
    expect(encontrado!.titulo).toBe("Pesas mais às segundas");
  });

  it("cala-se quando nao ha padrao nenhum -- so ruido", () => {
    const entries = Array.from({ length: 140 }, (_, i) =>
      medicao(diasAtras(139 - i), { peso: 82 + (i % 2 ? 0.2 : -0.2) }),
    );
    expect(ids(entries)).not.toContain("semanal");
  });
});

describe("metrica que mais se mexeu", () => {
  it("compara em proporcao, nao na unidade", () => {
    // O abdomen mexe-se 5 cm em 94 (5,3%); o peso 1 kg em 82 (1,2%).
    // Em valor absoluto ganhava o abdomen na mesma, mas a conta e relativa.
    const entries = Array.from({ length: 100 }, (_, i) =>
      medicao(diasAtras(99 - i), {
        peso: 82 - (i / 100) * 1,
        ...(i % 5 === 0 ? { abdomen: 94 - (i / 100) * 5 } : {}),
      }),
    );
    const encontrado = insights(entries).find((x) => x.id === "movimento");
    expect(encontrado).toBeDefined();
    expect(encontrado!.titulo).toContain("Abdómen");
  });

  it("cala-se quando o que mais mudou foi o proprio peso", () => {
    expect(ids(descida(100, 0.08))).not.toContain("movimento");
  });

  it("escreve a gordura em pontos, nao em percentagem de percentagem", () => {
    const entries = Array.from({ length: 100 }, (_, i) =>
      medicao(diasAtras(99 - i), {
        peso: 82 - (i / 100) * 0.3,
        ...(i % 5 === 0 ? { gordura: 26 - (i / 100) * 3 } : {}),
      }),
    );
    const encontrado = insights(entries).find((x) => x.id === "movimento");
    expect(encontrado?.texto).toContain("pontos");
    expect(encontrado?.texto).not.toMatch(/\d % --/);
  });
});

describe("cadencia", () => {
  it("aparece a quem tem historico e se pesa pouco", () => {
    const entries = Array.from({ length: 24 }, (_, i) =>
      medicao(diasAtras(120 - i * 5), { peso: 80 - i * 0.05 }),
    );
    expect(ids(entries)).toContain("cadencia");
  });

  it("cala-se a quem se pesa quase todos os dias", () => {
    expect(ids(descida(120))).not.toContain("cadencia");
  });

  it("cala-se a quem comecou ha pouco -- nao diz nada que nao seja obvio", () => {
    const recente = Array.from({ length: 5 }, (_, i) =>
      medicao(diasAtras(20 - i * 5), { peso: 80 }),
    );
    expect(ids(recente)).not.toContain("cadencia");
  });
});
