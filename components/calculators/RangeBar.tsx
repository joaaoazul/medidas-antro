"use client";

/**
 * Barra horizontal com zonas coloridas de referencia e um marcador na
 * posicao do valor. So faz sentido para calculadoras com uma referencia
 * populacional objetiva (IMC, racio cintura-altura) -- nunca para as
 * metricas do dia a dia, onde subir ou descer pode ser a meta ou o alarme
 * consoante quem usa a app, e a cor nao tem como saber qual.
 */
export function RangeBar({
  categorias,
  dominioMax,
  valor,
}: {
  categorias: readonly { max: number; cor: string; label: string }[];
  dominioMax: number;
  valor: number;
}) {
  const limites = categorias.map((c) => Math.min(c.max, dominioMax));
  const segmentos = categorias.map((c, i) => ({
    cor: c.cor,
    largura: Math.max(limites[i] - (i === 0 ? 0 : limites[i - 1]), 0),
  }));

  const posicao = Math.min(Math.max(valor, 0), dominioMax) / dominioMax;

  return (
    <div className="pt-5 pb-4">
      <div className="relative">
        <div
          className="absolute -top-3.5 -translate-x-1/2"
          style={{ left: `${posicao * 100}%` }}
          aria-hidden
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "6px solid var(--text-primary)",
            }}
          />
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full">
          {segmentos.map((s, i) => (
            <div key={i} style={{ width: `${(s.largura / dominioMax) * 100}%`, background: s.cor }} />
          ))}
        </div>
      </div>
    </div>
  );
}
