import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STORAGE_KEY } from "@/components/theme";
import { chave, MARCA_UTILIZADOR } from "@/lib/fila-offline";
import { METRIC_BY_ID, METRIC_IDS, type MetricId } from "@/lib/metrics";

/*
 * A pagina offline e estatica: nao importa nada da app, e por isso tem uma
 * copia do que precisa. Uma copia diverge em silencio -- a chave da fila
 * mudava de um lado e as medicoes guardadas sem rede deixavam de ser vistas
 * pela app, sem erro nenhum. Estes testes sao a ligacao que o import nao faz.
 */
const html = readFileSync("public/offline.html", "utf8");
const sw = readFileSync("public/sw.js", "utf8");

const bloco = html.match(
  /<script type="application\/json" id="configuracao">([\s\S]*?)<\/script>/,
);
const cfg = JSON.parse(bloco![1]) as {
  filaPrefixo: string;
  marcaUtilizador: string;
  tema: string;
  metricas: { id: MetricId; label: string; short: string; unit: string; min: number; max: number }[];
  todas: string[];
};

describe("public/offline.html", () => {
  it("guarda na mesma fila por conta que a app le", () => {
    expect(cfg.filaPrefixo + "alguem").toBe(chave("alguem"));
  });

  it("le a mesma marca de utilizador que o painel escreve", () => {
    expect(cfg.marcaUtilizador).toBe(MARCA_UTILIZADOR);
  });

  it("le o mesmo tema que a app guarda", () => {
    expect(cfg.tema).toBe(STORAGE_KEY);
    // E o script que o aplica antes da pintura usa a mesma chave.
    expect(html).toContain(`localStorage.getItem("${STORAGE_KEY}")`);
  });

  it("tem os rotulos, unidades e limites de lib/metrics.ts", () => {
    for (const m of cfg.metricas) {
      const real = METRIC_BY_ID[m.id];
      expect(m).toEqual({
        id: real.id,
        label: real.label,
        short: real.short,
        unit: real.unit,
        min: real.min,
        max: real.max,
      });
    }
  });

  it("preenche com null todas as metricas, e so as que existem", () => {
    expect(cfg.todas).toEqual(METRIC_IDS);
  });
});

describe("public/sw.js", () => {
  it("VERSAO acompanha a pagina offline", () => {
    // Mudar a pagina sem mudar isto deixava a versao antiga nos telemoveis: o
    // browser so reinstala o service worker quando o proprio sw.js muda.
    const hash = createHash("sha256").update(html).digest("hex").slice(0, 12);
    expect(sw).toContain(`const VERSAO = "${hash}";`);
  });

  it("so interceta navegacoes, e so guarda a pagina offline", () => {
    expect(sw).toContain('if (event.request.mode !== "navigate") return;');
    // Nenhum cache.put: nada do que passa pela rede fica guardado.
    expect(sw).not.toMatch(/cache\.put|addAll/);
  });
});
