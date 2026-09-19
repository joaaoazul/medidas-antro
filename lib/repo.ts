import { db } from "./db";
import { METRIC_IDS, type MetricId } from "./metrics";
import type { Entry } from "./types";
import type { EntryInput } from "./validation";

type Row = Record<string, unknown> & { date: string; updated_at: string };

function rowToEntry(row: Row): Entry {
  const values = Object.fromEntries(
    METRIC_IDS.map((id) => {
      const raw = row[id];
      return [id, typeof raw === "number" ? raw : null];
    }),
  ) as Record<MetricId, number | null>;

  return {
    date: row.date,
    values,
    nota: (row.nota as string | null) ?? null,
    updatedAt: row.updated_at,
  };
}

const COLUMNS = ["date", ...METRIC_IDS, "nota", "updated_at"];

/** Todos os registos, do mais antigo para o mais recente. */
export function listEntries(): Entry[] {
  const rows = db
    .prepare(`SELECT * FROM entries ORDER BY date ASC`)
    .all() as Row[];
  return rows.map(rowToEntry);
}

export function getEntry(date: string): Entry | null {
  const row = db.prepare(`SELECT * FROM entries WHERE date = ?`).get(date) as
    | Row
    | undefined;
  return row ? rowToEntry(row) : null;
}

/**
 * Grava o registo do dia. Reregistar a mesma data substitui o registo anterior
 * em vez de criar um duplicado -- corrigir a pesagem da manha e o caso normal,
 * nao uma excecao.
 */
export function upsertEntry(input: EntryInput): Entry {
  const placeholders = COLUMNS.map(() => "?").join(", ");
  // date fica de fora do SET: e a chave do conflito.
  const updates = COLUMNS.slice(1)
    .map((c) => `"${c}" = excluded."${c}"`)
    .join(", ");

  db.prepare(
    `INSERT INTO entries (${COLUMNS.map((c) => `"${c}"`).join(", ")})
     VALUES (${placeholders})
     ON CONFLICT(date) DO UPDATE SET ${updates}`,
  ).run(
    input.date,
    ...METRIC_IDS.map((id) => input.values[id]),
    input.nota && input.nota.length > 0 ? input.nota : null,
    new Date().toISOString(),
  );

  return getEntry(input.date)!;
}

export function deleteEntry(date: string): boolean {
  return db.prepare(`DELETE FROM entries WHERE date = ?`).run(date).changes > 0;
}

/**
 * Importa varios registos numa transacao: ou entram todos, ou nenhum.
 * Uma importacao a meio seria pior do que uma falhada.
 */
export function importEntries(entries: EntryInput[]): number {
  const run = db.transaction((batch: EntryInput[]) => {
    for (const entry of batch) upsertEntry(entry);
    return batch.length;
  });
  return run(entries);
}
