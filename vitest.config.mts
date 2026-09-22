import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Testes so da logica pura: series, insights, datas e validacao.
 *
 * Nao ha aqui testes de componentes de proposito. O que esta em `lib/` e
 * deterministico e cheio de regras subtis -- a folga da escala, a tolerancia da
 * variacao, os limiares de cada insight -- e e isso que se parte em silencio
 * quando alguem mexe. A interface exercita-se no browser, que e onde os erros
 * dela aparecem (e o AGENTS.md diz porque).
 */
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
