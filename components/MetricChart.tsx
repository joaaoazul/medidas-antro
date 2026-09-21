"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { msToISO, longLabel, shortLabel } from "@/lib/dates";
import { formatValue, type Metric } from "@/lib/metrics";
import { MIN_TREND_POINTS, niceScale, withTrend } from "@/lib/series";
import type { Granularity, Point } from "@/lib/types";
import { CHROME, useTheme } from "./theme";
import { Card } from "./ui";

/** Acima disto os pontos deixam de ser marcas e passam a ser ruido. */
const MAX_DOTS = 40;

/** Notas mostradas num tooltip antes de passar a conta-las. */
const MAX_NOTAS = 3;

function bucketAt(t: number, granularity: Granularity): string {
  const iso = msToISO(t);
  return granularity === "mes" ? iso.slice(0, 7) : iso;
}

type TooltipRow = Point & { trend?: number | null };
type TooltipPayload = { payload: TooltipRow }[];

function ChartTooltip({
  active,
  payload,
  metric,
  granularity,
  showTrend,
  notas,
  color,
  ink,
  muted,
  surface,
}: {
  active?: boolean;
  payload?: TooltipPayload;
  metric: Metric;
  granularity: Granularity;
  showTrend: boolean;
  notas: Map<string, string[]>;
  color: string;
  ink: string;
  muted: string;
  surface: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  if (point.value === null) return null;

  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-sm"
      style={{ background: surface, borderColor: "var(--border)" }}
    >
      {/* O valor lidera; o nome da serie e secundario -- quem passa o rato ja
          sabe o que esta a ver e quer o numero. */}
      <div className="tabular text-base font-semibold" style={{ color: ink }}>
        {formatValue(metric.id, point.value)}{" "}
        <span className="text-sm font-normal">{metric.unit}</span>
      </div>
      <div className="mt-1 flex items-center gap-2" style={{ color: muted }}>
        {/* Chave em risco, nao em quadrado: a densidade do tooltip nao aguenta
            tinta com peso de dados a fazer trabalho de rotulo. */}
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 12,
            height: 2,
            borderRadius: 1,
            background: color,
          }}
        />
        <span className="text-xs">{longLabel(point.bucket)}</span>
      </div>
      {/* O aviso nao depende do agrupamento: o balde "dia" tambem faz media
          quando ha mais do que uma pesagem nesse dia, e era exatamente ai que
          a app mostrava uma media a fazer-se passar por uma leitura unica. */}
      {point.samples > 1 ? (
        <div className="mt-0.5 text-xs" style={{ color: muted }}>
          média de {point.samples} medições
          {granularity === "dia" ? " nesse dia" : ""}
        </div>
      ) : null}
      {showTrend && point.trend != null ? (
        <div className="tabular mt-0.5 text-xs" style={{ color: muted }}>
          tendência {formatValue(metric.id, point.trend)} {metric.unit}
        </div>
      ) : null}
      {/* Um balde de um mes pode ter muitas notas, e um tooltip com dez linhas
          tapa o grafico que veio explicar. Tres, e a conta das que ficam. */}
      {(notas.get(point.bucket) ?? []).slice(0, MAX_NOTAS).map((nota, i) => (
        <div
          key={i}
          className="mt-1.5 max-w-52 border-t pt-1.5 text-xs"
          style={{ borderColor: "var(--border)", color: ink }}
        >
          {nota}
        </div>
      ))}
      {(notas.get(point.bucket) ?? []).length > MAX_NOTAS ? (
        <div className="mt-1 text-xs" style={{ color: muted }}>
          e mais {(notas.get(point.bucket) ?? []).length - MAX_NOTAS}
        </div>
      ) : null}
    </div>
  );
}

const SEM_NOTAS: Map<string, string[]> = new Map();

/**
 * O grafico em palavras, para quem o nao ve.
 *
 * O SVG do Recharts nao diz nada a um leitor de ecra, e o historico -- que e a
 * garantia de acesso aos valores sem depender da cor -- da a tabela toda, nao a
 * forma da curva. Esta frase e a forma: de onde para onde, em quantas medicoes,
 * com o minimo e o maximo do intervalo.
 */
function resumo(metric: Metric, points: Point[], granularity: Granularity): string {
  const lidos = points.filter(
    (p): p is Point & { value: number } => p.value !== null,
  );
  if (lidos.length === 0) return `${metric.label}: sem medições neste intervalo.`;

  const primeiro = lidos[0];
  const ultimo = lidos[lidos.length - 1];
  const valores = lidos.map((p) => p.value);
  const min = Math.min(...valores);
  const max = Math.max(...valores);

  const unidade = metric.unit;
  const v = (n: number) => formatValue(metric.id, n);
  const baldes =
    granularity === "dia" ? "dias" : granularity === "semana" ? "semanas" : "meses";

  if (lidos.length === 1) {
    return `${metric.label}: uma medição, ${v(ultimo.value)} ${unidade} em ${longLabel(ultimo.bucket)}.`;
  }

  return (
    `${metric.label}, ${lidos.length} ${baldes} com medição: ` +
    `de ${v(primeiro.value)} ${unidade} em ${longLabel(primeiro.bucket)} ` +
    `a ${v(ultimo.value)} ${unidade} em ${longLabel(ultimo.bucket)}. ` +
    `Mínimo ${v(min)} ${unidade}, máximo ${v(max)} ${unidade}.`
  );
}

export default function MetricChart({
  metric,
  points,
  granularity,
  objetivo = null,
  notas = SEM_NOTAS,
}: {
  metric: Metric;
  points: Point[];
  granularity: Granularity;
  /** Valor pretendido, do perfil. Desenhado como linha de referencia. */
  objetivo?: number | null;
  /** Notas das medicoes, por balde. Assinaladas por baixo da linha. */
  notas?: Map<string, string[]>;
}) {
  const { mode, mounted } = useTheme();
  const chrome = CHROME[mode];
  const color = metric.color[mode];

  /*
   * A tendencia so faz sentido sobre as medicoes cruas. Agrupado por semana ou
   * mes, a media do balde ja e a suavizacao -- suavizar por cima dela seria
   * suavizar duas vezes e afastar a linha dos dados sem nada em troca.
   */
  const showTrend = granularity === "dia" && points.length >= MIN_TREND_POINTS;
  // A media movel e uma combinacao convexa dos valores, por isso nunca sai do
  // intervalo deles: a escala continua a ser a dos pontos.
  const data = showTrend ? withTrend(points) : points;

  const last = points.length > 0 ? points[points.length - 1] : null;
  // O objetivo entra na escala como se fosse um ponto: se ficasse de fora, uma
  // meta ainda longe caia fora do grafico e a linha nao se via.
  const scale = niceScale(
    objetivo === null
      ? points
      : [...points, { bucket: "", t: 0, value: objetivo, samples: 0 }],
  );
  const showDots = points.length <= MAX_DOTS;

  return (
    <Card className="p-4 sm:p-5" as="figure">
      <figcaption className="mb-4 flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: 999,
              background: color,
            }}
          />
          {/* Serie unica: o titulo diz o que esta desenhado, por isso nao ha
              caixa de legenda a repetir a mesma informacao. */}
          <span className="text-base font-medium" style={{ color: chrome.ink }}>
            {metric.label}
          </span>
          {/* Duas linhas no mesmo grafico pedem uma chave. Fica aqui, minima, e
              nao numa caixa de legenda: sao a mesma metrica, nao duas series. */}
          {showTrend ? (
            <span
              className="flex items-center gap-1.5 text-xs"
              style={{ color: chrome.muted }}
              title="Média móvel: cada medição pesa tanto menos quanto mais antiga for, com uma constante de tempo de 7 dias."
            >
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 4,
                  borderRadius: 2,
                  background: color,
                  opacity: 0.35,
                }}
              />
              tendência
            </span>
          ) : null}
        </span>
        <span className="text-xs" style={{ color: chrome.muted }}>
          {metric.unit}
        </span>
      </figcaption>

      {/* Antes do grafico e nao depois: quem ouve a pagina deve saber o que ali
          esta antes de atravessar uma arvore de SVG que nao lhe diz nada. */}
      <p className="sr-only">{resumo(metric, points, granularity)}</p>

      <div className="h-64 w-full sm:h-80" aria-hidden>
        {mounted && points.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 12, right: 52, bottom: 4, left: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke={chrome.grid}
                strokeWidth={1}
                // Sem isto o Recharts acrescenta linhas nos limites do dominio,
                // que nao tem marca nenhuma a dizer que valor representam.
                syncWithTicks
              />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(t: number) =>
                  shortLabel(bucketAt(t, granularity))
                }
                tick={{ fill: chrome.muted, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: chrome.axis }}
                minTickGap={28}
              />
              <YAxis
                domain={scale.domain}
                ticks={scale.ticks}
                tickFormatter={(v: number) => String(v)}
                tick={{ fill: chrome.muted, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                // A mira encontra o X: ninguem acerta numa linha de 2px.
                cursor={{ stroke: chrome.axis, strokeWidth: 1 }}
                content={
                  <ChartTooltip
                    metric={metric}
                    granularity={granularity}
                    showTrend={showTrend}
                    notas={notas}
                    color={color}
                    ink={chrome.ink}
                    muted={chrome.muted}
                    surface={chrome.surface}
                  />
                }
              />
              {showTrend ? (
                /* Desenhada primeiro, para os pontos medidos ficarem por cima:
                   a tendencia e leitura, os pontos e que sao o dado. Mesma cor
                   e mesma metrica -- uma cor propria fa-la-ia passar por outra
                   serie -- e esbatida, como o traco das mini-linhas. */
                <Line
                  type="linear"
                  dataKey="trend"
                  stroke={color}
                  strokeOpacity={0.35}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  isAnimationActive={false}
                  dot={false}
                  activeDot={false}
                />
              ) : null}
              <Line
                // Linear, nao suavizada: uma curva entre duas pesagens desenha
                // dias que nunca foram medidos.
                type="linear"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                isAnimationActive={false}
                dot={
                  showDots
                    ? {
                        r: 4,
                        fill: color,
                        stroke: chrome.surface,
                        strokeWidth: 2,
                      }
                    : false
                }
                activeDot={{
                  r: 5,
                  fill: color,
                  stroke: chrome.surface,
                  strokeWidth: 2,
                }}
              />
              {objetivo !== null ? (
                /* Tracejada e em tinta neutra: nao e um valor medido, e nao
                   pode parecer uma segunda serie. */
                <ReferenceLine
                  y={objetivo}
                  stroke={chrome.muted}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  label={{
                    value: `objetivo ${formatValue(metric.id, objetivo)}`,
                    position: "insideTopLeft",
                    fill: chrome.muted,
                    fontSize: 11,
                  }}
                />
              ) : null}
              {/*
               * Um anel a volta da medicao que tem nota.
               *
               * A nota pertence aquela medicao, por isso e ali que se assinala
               * -- uma marca no eixo obrigava a procurar a que ponto pertencia,
               * e chocava com o rotulo do objetivo quando este anda por baixo.
               * Em tinta neutra e sem preenchimento, para nao passar por um
               * valor medido de outra serie. A nota em si vive no tooltip:
               * escrita sobre a linha, tapava os dados que veio explicar.
               */}
              {points
                .filter((p) => p.value !== null && notas.has(p.bucket))
                .map((p) => (
                  <ReferenceDot
                    key={`nota-${p.bucket}`}
                    x={p.t}
                    y={p.value as number}
                    r={5}
                    fill="none"
                    stroke={chrome.muted}
                    strokeWidth={1.5}
                  />
                ))}
              {last && last.value !== null ? (
                /* Rotulo direto so na ponta -- um numero em cada ponto nao se
                   le, e este e tambem o apoio exigido pelas cores de contraste
                   mais baixo em modo claro. */
                <ReferenceDot
                  x={last.t}
                  y={last.value}
                  r={4}
                  fill={color}
                  stroke={chrome.surface}
                  strokeWidth={2}
                  label={{
                    value: formatValue(metric.id, last.value),
                    position: "right",
                    offset: 10,
                    fill: chrome.ink,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div
            className="flex h-full items-center justify-center text-sm"
            style={{ color: chrome.muted }}
          >
            {mounted ? "Sem medições neste intervalo." : ""}
          </div>
        )}
      </div>
    </Card>
  );
}
