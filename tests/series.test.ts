import { describe, expect, it } from "vitest";
import {
  buildRelativeRows,
  buildSeries,
  deltaOver,
  latestReading,
  niceScale,
  notasPorBalde,
  projecao,
  regressao,
  ritmo,
  withTrend,
} from "@/lib/series";
import type { Point } from "@/lib/types";
import { dia, diasAtras, medicao } from "./apoio";

const BASE = "2026-06-01";

describe("buildSeries", () => {
  it("faz a media das medicoes do mesmo dia -- tambem no balde 'dia'", () => {
    // A regra que a interface anunciava ao contrario ate ser corrigida.
    const serie = buildSeries(
      [
        medicao(BASE, { peso: 80 }, { hora: "08:00" }),
        medicao(BASE, { peso: 81 }, { hora: "22:00" }),
      ],
      "peso",
      "dia",
    );
    expect(serie).toHaveLength(1);
    expect(serie[0].value).toBe(80.5);
    expect(serie[0].samples).toBe(2);
  });

  it("pesar-se tres vezes numa semana nao pesa mais nessa semana", () => {
    const tres = buildSeries(
      [
        medicao(dia(BASE, 0), { peso: 80 }),
        medicao(dia(BASE, 1), { peso: 82 }),
        medicao(dia(BASE, 2), { peso: 84 }),
      ],
      "peso",
      "semana",
    );
    const uma = buildSeries([medicao(dia(BASE, 1), { peso: 82 })], "peso", "semana");
    expect(tres[0].value).toBe(82);
    expect(uma[0].value).toBe(82);
  });

  it("nao inventa baldes sem medicao nenhuma", () => {
    const serie = buildSeries(
      [medicao(dia(BASE, 0), { peso: 80 }), medicao(dia(BASE, 30), { peso: 79 })],
      "peso",
      "dia",
    );
    expect(serie).toHaveLength(2);
  });

  it("ignora campos por medir em vez de os contar como zero", () => {
    const serie = buildSeries(
      [
        medicao(dia(BASE, 0), { peso: 80, abdomen: 90 }),
        medicao(dia(BASE, 1), { peso: 81 }),
      ],
      "abdomen",
      "dia",
    );
    expect(serie).toHaveLength(1);
    expect(serie[0].value).toBe(90);
  });

  it("devolve os baldes por ordem cronologica", () => {
    const serie = buildSeries(
      [
        medicao(dia(BASE, 5), { peso: 80 }),
        medicao(dia(BASE, 0), { peso: 82 }),
        medicao(dia(BASE, 2), { peso: 81 }),
      ],
      "peso",
      "dia",
    );
    expect(serie.map((p) => p.bucket)).toEqual([
      dia(BASE, 0),
      dia(BASE, 2),
      dia(BASE, 5),
    ]);
  });
});

describe("niceScale", () => {
  const pontos = (valores: number[]): Point[] =>
    valores.map((value, i) => ({
      bucket: String(i),
      t: i,
      value,
      samples: 1,
    }));

  it("as marcas caem todas DENTRO do dominio", () => {
    // A regra do README: o dominio nao e alargado ate ao multiplo seguinte dos
    // dois lados, senao metade da altura era vazio.
    const { domain, ticks } = niceScale(pontos([80.3, 84.7, 82.1]));
    for (const t of ticks) {
      expect(t).toBeGreaterThanOrEqual(domain[0]);
      expect(t).toBeLessThanOrEqual(domain[1]);
    }
  });

  it("nunca corta pontos reais", () => {
    const valores = [79.8, 85.2, 81];
    const { domain } = niceScale(pontos(valores));
    expect(domain[0]).toBeLessThan(Math.min(...valores));
    expect(domain[1]).toBeGreaterThan(Math.max(...valores));
  });

  it("da folga a uma serie de valor unico em vez de a achatar", () => {
    const { domain } = niceScale(pontos([80, 80, 80]));
    expect(domain[0]).toBeLessThan(80);
    expect(domain[1]).toBeGreaterThan(80);
  });

  it("aguenta uma serie vazia", () => {
    expect(niceScale([])).toEqual({ domain: [0, 1], ticks: [0, 1] });
  });
});

describe("deltaOver", () => {
  it("diz a distancia REAL, nao a pedida", () => {
    const delta = deltaOver(
      [medicao(dia(BASE, 0), { peso: 82 }), medicao(dia(BASE, 9), { peso: 80 })],
      "peso",
      7,
    );
    expect(delta?.change).toBe(-2);
    expect(delta?.spanDays).toBe(9);
  });

  it("recusa quando a medicao mais proxima esta fora da tolerancia", () => {
    // Tolerancia de 7 dias e max(3, 3) = 3: uma medicao a 30 dias nao serve.
    expect(
      deltaOver(
        [medicao(dia(BASE, 0), { peso: 82 }), medicao(dia(BASE, 30), { peso: 80 })],
        "peso",
        7,
      ),
    ).toBeNull();
  });

  it("devolve null sem nada com que comparar", () => {
    expect(deltaOver([medicao(BASE, { peso: 80 })], "peso", 7)).toBeNull();
  });
});

describe("withTrend", () => {
  const serie = (valores: number[], passo = 1): Point[] =>
    valores.map((value, i) => ({
      bucket: dia(BASE, i * passo),
      t: Date.parse(`${dia(BASE, i * passo)}T00:00:00Z`),
      value,
      samples: 1,
    }));

  it("nunca sai do intervalo dos valores", () => {
    // Por isso a escala do grafico nao precisa de mudar quando a linha aparece.
    const valores = [82, 79, 85, 80, 83, 81, 84, 80.5];
    const trends = withTrend(serie(valores)).map((p) => p.trend!);
    expect(Math.min(...trends)).toBeGreaterThanOrEqual(Math.min(...valores));
    expect(Math.max(...trends)).toBeLessThanOrEqual(Math.max(...valores));
  });

  it("e muito mais lisa do que os pontos", () => {
    // "Liso" mede-se na variacao de ponto para ponto, e nao na amplitude total:
    // a tendencia comeca no primeiro valor e leva uns dias a convergir, e essa
    // subida inicial e legitima -- nao e ruido.
    const valores = Array.from({ length: 40 }, (_, i) => 80 + (i % 2 ? 0.8 : -0.8));
    const rows = withTrend(serie(valores));
    const passoMedio = (xs: number[]) =>
      xs.slice(1).reduce((s, x, i) => s + Math.abs(x - xs[i]), 0) / (xs.length - 1);

    expect(passoMedio(rows.map((p) => p.trend!))).toBeLessThan(
      passoMedio(valores) / 5,
    );
  });

  it("comeca no primeiro valor", () => {
    expect(withTrend(serie([82, 81, 80]))[0].trend).toBe(82);
  });

  it("depois de uma interrupcao longa, a medicao seguinte quase substitui a tendencia", () => {
    // O motivo de o peso depender do intervalo REAL e nao da posicao na lista:
    // com peso fixo, a linha voltava com uma inclinacao inventada.
    const [, , ultimo] = withTrend([
      { bucket: "2026-01-01", t: Date.parse("2026-01-01T00:00:00Z"), value: 80, samples: 1 },
      { bucket: "2026-01-02", t: Date.parse("2026-01-02T00:00:00Z"), value: 80, samples: 1 },
      { bucket: "2026-03-01", t: Date.parse("2026-03-01T00:00:00Z"), value: 90, samples: 1 },
    ]);
    expect(ultimo.trend).toBeCloseTo(90, 1);
  });

  it("preserva os buracos em vez de os preencher", () => {
    const rows = withTrend([
      { bucket: "a", t: 0, value: null, samples: 0 },
      { bucket: "b", t: 86_400_000, value: 80, samples: 1 },
    ]);
    expect(rows[0].trend).toBeNull();
  });
});

describe("regressao", () => {
  it("encontra o declive de uma reta exata", () => {
    const r = regressao([
      { x: 0, y: 10 },
      { x: 1, y: 12 },
      { x: 2, y: 14 },
    ]);
    expect(r?.declive).toBeCloseTo(2, 10);
    expect(r?.r2).toBeCloseTo(1, 10);
  });

  it("devolve null quando nao ha reta nenhuma a tirar dali", () => {
    expect(regressao([{ x: 1, y: 1 }])).toBeNull();
    // Todos no mesmo x.
    expect(regressao([{ x: 1, y: 1 }, { x: 1, y: 2 }])).toBeNull();
    // Todos com o mesmo y.
    expect(regressao([{ x: 1, y: 5 }, { x: 2, y: 5 }])).toBeNull();
  });
});

describe("ritmo", () => {
  /** Descida limpa, uma medicao por dia. */
  const descida = (dias: number, porDia: number) =>
    Array.from({ length: dias }, (_, i) =>
      medicao(diasAtras(dias - 1 - i), { peso: 85 - i * porDia }),
    );

  it("mede o declive em kg por semana", () => {
    const r = ritmo(descida(30, 0.05), "peso");
    expect(r?.porSemana).toBeCloseTo(-0.35, 2);
  });

  it("recusa com medicoes a menos", () => {
    expect(ritmo(descida(4, 0.05), "peso")).toBeNull();
  });

  it("recusa quando as medicoes estao todas amontoadas em poucos dias", () => {
    // Seis pesagens em tres dias nao sao um ritmo.
    const amontoadas = Array.from({ length: 8 }, (_, i) =>
      medicao(diasAtras(3 - (i % 3)), { peso: 80 + i * 0.1 }, { hora: `0${i}:00` }),
    );
    expect(ritmo(amontoadas, "peso")).toBeNull();
  });

  it("alarga a janela quando a curta nao sustenta o ajuste", () => {
    // Ruido grande sobre uma descida lenta: a 28 dias o r2 nao chega.
    const ruidosa = Array.from({ length: 90 }, (_, i) =>
      medicao(diasAtras(89 - i), { peso: 85 - i * 0.03 + (i % 2 ? 0.5 : -0.5) }),
    );
    const r = ritmo(ruidosa, "peso");
    expect(r).not.toBeNull();
    expect(r!.dias).toBeGreaterThan(28);
  });
});

describe("projecao", () => {
  const bom = { porSemana: -0.25, medicoes: 30, dias: 41, r2: 0.7 };

  it("projeta quando o ajuste e bom e o objetivo esta a frente", () => {
    const p = projecao(bom, 81, 78);
    expect(p).not.toBeNull();
    // 3 kg a 0,25 por semana = 12 semanas = 84 dias.
    expect(p!.dias).toBe(84);
  });

  it("recusa com ajuste fraco", () => {
    expect(projecao({ ...bom, r2: 0.3 }, 81, 78)).toBeNull();
  });

  it("recusa quando o ritmo aponta ao contrario do objetivo", () => {
    expect(projecao(bom, 81, 85)).toBeNull();
  });

  it("recusa quando a data cai para la de um ano", () => {
    expect(projecao(bom, 95, 78)).toBeNull();
  });
});

describe("notasPorBalde", () => {
  it("agrupa as notas pelo balde e guarda-as todas", () => {
    const notas = notasPorBalde(
      [
        medicao(dia(BASE, 0), { peso: 80 }, { nota: "creatina" }),
        medicao(dia(BASE, 1), { peso: 80 }, { nota: "ferias" }),
        medicao(dia(BASE, 2), { peso: 80 }),
      ],
      "mes",
    );
    expect(notas.get("2026-06")).toEqual(["creatina", "ferias"]);
  });
});

describe("buildRelativeRows", () => {
  it("indexa cada metrica ao seu primeiro valor do intervalo", () => {
    const rows = buildRelativeRows(
      [
        medicao(dia(BASE, 0), { peso: 100, abdomen: 50 }),
        medicao(dia(BASE, 1), { peso: 90, abdomen: 55 }),
      ],
      ["peso", "abdomen"],
      "dia",
    );
    expect(rows[0].peso).toBe(0);
    expect(rows[1].peso).toBeCloseTo(-10, 6);
    expect(rows[1].abdomen).toBeCloseTo(10, 6);
  });
});

describe("latestReading", () => {
  it("salta para tras ate encontrar uma medicao daquela metrica", () => {
    const r = latestReading(
      [
        medicao(dia(BASE, 0), { peso: 80, abdomen: 90 }),
        medicao(dia(BASE, 1), { peso: 81 }),
        medicao(dia(BASE, 2), { peso: 82 }),
      ],
      "abdomen",
    );
    expect(r).toEqual({ date: dia(BASE, 0), value: 90 });
  });
});
