/*
 * Service worker da app. Faz UMA coisa: quando abrir uma pagina falha por falta
 * de rede, mostra public/offline.html em vez do erro do browser.
 *
 * O que NAO faz, de proposito: guardar paginas da app ou respostas da API. As
 * paginas trazem as medidas todas la dentro (vem renderizadas do servidor), e
 * guarda-las no aparelho deixava dados de saude de alguem la ficar depois de
 * sair da conta. A pagina offline e estatica e igual para toda a gente.
 *
 * Tudo o que nao e uma navegacao passa ao lado, sem ser tocado.
 *
 * VERSAO e o inicio do sha256 de public/offline.html. Um teste
 * (tests/offline-page.test.ts) confirma-o: mudar a pagina sem mudar isto
 * deixava a versao antiga guardada nos telemoveis, porque o browser so
 * reinstala o service worker quando o proprio ficheiro muda.
 */
const VERSAO = "8929ae9ed33a";
const CACHE = `medidas-offline-${VERSAO}`;
const OFFLINE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // "reload": ignora a cache HTTP -- quer-se a pagina acabada de sair.
      .then((cache) => cache.add(new Request(OFFLINE, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(
          nomes
            .filter((n) => n.startsWith("medidas-offline-") && n !== CACHE)
            .map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE).then(
        (pagina) =>
          pagina ??
          new Response("Sem rede.", {
            status: 503,
            headers: { "content-type": "text/plain; charset=utf-8" },
          }),
      ),
    ),
  );
});
