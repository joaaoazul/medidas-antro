import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medidas",
  description:
    "Registo diario de metricas antropometricas com a evolucao por dias, semanas e meses.",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
