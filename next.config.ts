import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 e um modulo nativo: tem de ser carregado pelo Node em tempo
  // de execucao, nunca empacotado pelo bundler.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
