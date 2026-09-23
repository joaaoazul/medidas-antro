"use client";

import { useEffect } from "react";

/**
 * Regista o service worker (public/sw.js).
 *
 * So em producao: em desenvolvimento, um service worker ativo mete-se entre o
 * browser e o servidor de desenvolvimento e confunde o recarregamento a quente.
 * `updateViaCache: "none"` faz o browser ir sempre buscar o sw.js ao servidor
 * para ver se mudou, em vez de confiar na cache HTTP.
 */
export default function RegistarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Sem service worker a app funciona na mesma: so nao abre sem rede.
      });
  }, []);
  return null;
}
