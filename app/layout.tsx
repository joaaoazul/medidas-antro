import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import {
  NOVIDADES_ATTR,
  NOVIDADES_KEY,
  NOVIDADES_VERSAO,
} from "@/lib/novidades";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Medidas",
  description:
    "Registo diário de métricas antropométricas com a evolução por dias, semanas e meses.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
};

/**
 * Aplica o tema guardado antes da primeira pintura. Sem isto, quem escolheu o
 * modo escuro apanha um flash branco em cada navegacao.
 */
const themeScript = `
try {
  var t = localStorage.getItem("medidas-theme");
  if (t === "dark" || t === "light") document.documentElement.dataset.theme = t;
} catch (e) {}
`;

/**
 * Esconde o cartao de novidades antes da primeira pintura a quem ja o
 * dispensou, pela mesma razao que o tema se aplica aqui: decidido depois da
 * hidratacao, o cartao aparecia a vista e empurrava o resto da pagina para
 * baixo em cada visita. Quem o esconde e o CSS -- ver globals.css.
 */
const novidadesScript = `
try {
  if (localStorage.getItem(${JSON.stringify(NOVIDADES_KEY)}) === ${JSON.stringify(NOVIDADES_VERSAO)})
    document.documentElement.dataset[${JSON.stringify(NOVIDADES_ATTR)}] = "vistas";
} catch (e) {}
`;

/**
 * O React 19 avisa ao renderizar uma `<script>` normal (nunca corre em
 * navegacao no cliente, so na carga inicial). O truque do tipo mantem o
 * comportamento -- so interessa a carga inicial, o tema fica no atributo do
 * `<html>` depois disso -- sem o aviso na consola.
 */
function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT" className={outfit.variable} suppressHydrationWarning>
      <head>
        <InlineScript html={themeScript} />
        <InlineScript html={novidadesScript} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
