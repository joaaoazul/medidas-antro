import type { MetadataRoute } from "next";

/**
 * Manifest da app: o que a deixa ficar no ecra inicial como uma app, sem a
 * barra do browser.
 *
 * `standalone` porque o gesto para que a app existe -- de manha, com uma mao --
 * nao ganha nada com uma barra de enderecos a ocupar o topo do ecra.
 *
 * Os icones sao de fundo inteiro e nao o emblema arredondado do favicon: o iOS
 * preenche a transparencia dos cantos com uma cor que escolhe ele, e o Android
 * recorta cada icone com uma mascara propria. O desenho cabe dentro da zona
 * segura (o circulo de 80% ao centro), por isso o mesmo ficheiro serve de
 * icone normal e de icone "maskable".
 *
 * Nao ha service worker. Abrir a app sem rede nenhuma continua a nao
 * funcionar -- o que se resolveu foi gravar sem rede com a app ja aberta, que e
 * o caso real. Um service worker que guardasse as paginas guardava tambem as
 * medidas de quem as viu, no aparelho, depois de sair da conta; e uma decisao
 * que merece ser tomada de proposito, nao de passagem.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Medidas",
    short_name: "Medidas",
    description:
      "Registo diário de métricas antropométricas com a evolução por dias, semanas e meses.",
    lang: "pt-PT",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f9f9f7",
    theme_color: "#f9f9f7",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
