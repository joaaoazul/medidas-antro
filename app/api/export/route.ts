import { escreverCsv } from "@/lib/csv";
import { METRICS } from "@/lib/metrics";
import { listEntries } from "@/lib/repo";

/**
 * Descarrega todas as medicoes, em JSON ou CSV.
 *
 * O JSON leva o identificador de cada medicao, e e o que torna a importacao
 * idempotente: restaurar duas vezes a mesma copia de seguranca reconcilia pelo
 * id em vez de duplicar tudo. O CSV e para ler numa folha de calculo.
 */
export async function GET(request: Request) {
  const format = new URL(request.url).searchParams.get("format") ?? "json";
  const entries = await listEntries();
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    // O escritor vive em lib/csv.ts, ao lado do leitor: o que se exporta e,
    // por construcao e por teste, o que a importacao sabe ler.
    return new Response(escreverCsv(entries), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="medidas-${stamp}.csv"`,
      },
    });
  }

  return new Response(
    JSON.stringify({ metrics: METRICS.map((m) => m.id), entries }, null, 2),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="medidas-${stamp}.json"`,
      },
    },
  );
}
