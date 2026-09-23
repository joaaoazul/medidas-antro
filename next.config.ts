import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 e um modulo nativo: tem de ser carregado pelo Node em tempo
  // de execucao, nunca empacotado pelo bundler.
  serverExternalPackages: ["better-sqlite3"],

  // O service worker nunca pode ficar em cache HTTP: e comparando este ficheiro
  // que o browser decide se ha versao nova. O guia de PWA do Next recomenda
  // estes cabecalhos.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
