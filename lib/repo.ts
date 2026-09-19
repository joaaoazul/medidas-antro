import { METRIC_IDS, type MetricId } from "./metrics";
import { createClient } from "./supabase/server";
import type { Entry } from "./types";
import type { EntryInput } from "./validation";

/**
 * Fronteira unica de acesso a dados.
 *
 * Todas as funcoes correm com a sessao de quem esta a navegar, por isso as
 * politicas de seguranca da base de dados aplicam-se a cada consulta. Nenhuma
 * delas filtra por utilizador "a mao" na clausula where por seguranca: o filtro
 * existe para pedir menos linhas, mas quem garante o isolamento e o Postgres.
 */

type Row = {
  date: string;
  nota: string | null;
  updated_at: string;
} & Partial<Record<MetricId, number | null>>;

const COLUMNS = ["date", ...METRIC_IDS, "nota", "updated_at"].join(", ");

function rowToEntry(row: Row): Entry {
  const values = Object.fromEntries(
    METRIC_IDS.map((id) => [id, row[id] ?? null]),
  ) as Record<MetricId, number | null>;

  return {
    date: row.date,
    values,
    nota: row.nota,
    updatedAt: row.updated_at,
  };
}

/**
 * Identidade de quem esta a fazer o pedido.
 *
 * getUser() valida o token contra a Supabase; getSession() so le o cookie, que
 * o lado de la tambem sabe escrever. As rotas ja estao guardadas pelo
 * middleware, por isso chegar aqui sem sessao e um erro de programacao e deve
 * rebentar alto em vez de devolver uma lista vazia.
 */
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Sem sessao iniciada.");
  }

  return { supabase, userId: user.id };
}

/** Todos os registos de quem esta autenticado, do mais antigo para o mais recente. */
export async function listEntries(): Promise<Entry[]> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("entries")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (error) throw new Error(`Nao foi possivel ler os registos: ${error.message}`);

  return (data as unknown as Row[]).map(rowToEntry);
}

export async function getEntry(date: string): Promise<Entry | null> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("entries")
    .select(COLUMNS)
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (error) throw new Error(`Nao foi possivel ler o registo: ${error.message}`);

  return data ? rowToEntry(data as unknown as Row) : null;
}

function toRow(input: EntryInput, userId: string) {
  return {
    user_id: userId,
    date: input.date,
    ...Object.fromEntries(METRIC_IDS.map((id) => [id, input.values[id]])),
    nota: input.nota && input.nota.length > 0 ? input.nota : null,
  };
}

/**
 * Grava o registo do dia. Reregistar a mesma data substitui o registo anterior
 * em vez de criar um duplicado -- corrigir a pesagem da manha e o caso normal,
 * nao uma excecao.
 */
export async function upsertEntry(input: EntryInput): Promise<Entry> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("entries")
    .upsert(toRow(input, userId), { onConflict: "user_id,date" })
    .select(COLUMNS)
    .single();

  if (error) throw new Error(`Nao foi possivel guardar: ${error.message}`);

  return rowToEntry(data as unknown as Row);
}

export async function deleteEntry(date: string): Promise<boolean> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("entries")
    .delete()
    .eq("user_id", userId)
    .eq("date", date)
    .select("date");

  if (error) throw new Error(`Nao foi possivel apagar: ${error.message}`);

  return (data?.length ?? 0) > 0;
}

/**
 * Importa varios registos. Um unico upsert com todas as linhas: ou entram
 * todas, ou nenhuma. Uma importacao a meio seria pior do que uma falhada.
 */
export async function importEntries(entries: EntryInput[]): Promise<number> {
  if (entries.length === 0) return 0;

  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("entries")
    .upsert(
      entries.map((entry) => toRow(entry, userId)),
      { onConflict: "user_id,date" },
    );

  if (error) throw new Error(`Nao foi possivel importar: ${error.message}`);

  return entries.length;
}
