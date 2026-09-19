import { METRICS, METRIC_IDS } from "@/lib/metrics";
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
    const header = ["data", "hora", ...METRIC_IDS, "nota"].join(",");
    const lines = entries.map((entry) =>
      [
        entry.date,
        entry.hora ?? "",
        ...METRIC_IDS.map((id) => entry.values[id] ?? ""),
        csvField(entry.nota ?? ""),
      ].join(","),
    );

    return new Response([header, ...lines].join("\n"), {
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

/** Aspas e virgulas numa nota partiriam a linha do CSV. */
function csvField(value: string): string {
  if (!/[",\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}
