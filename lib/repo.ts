import { METRIC_IDS, type MetricId } from "./metrics";
import { createClient } from "./supabase/server";
import type { Entry } from "./types";
import type { EntryInput } from "./validation";

/**
 * Fronteira unica de acesso as medicoes.
 *
 * Todas as funcoes correm com a sessao de quem esta a navegar, por isso as
 * politicas de seguranca da base de dados aplicam-se a cada consulta. O filtro
 * por user_id existe para pedir menos linhas; quem garante o isolamento e o
 * Postgres.
 */

type Row = {
  id: string;
  date: string;
  hora: string | null;
  nota: string | null;
  updated_at: string;
} & Partial<Record<MetricId, number | null>>;

const COLUMNS = [
  "id",
  "date",
  "hora",
  ...METRIC_IDS,
  "nota",
  "updated_at",
].join(", ");

/** O Postgres devolve "08:00:00"; a app so mostra horas e minutos. */
function horaCurta(hora: string | null): string | null {
  return hora ? hora.slice(0, 5) : null;
}

function rowToEntry(row: Row): Entry {
  const values = Object.fromEntries(
    METRIC_IDS.map((id) => [id, row[id] ?? null]),
  ) as Record<MetricId, number | null>;

  return {
    id: row.id,
    date: row.date,
    hora: horaCurta(row.hora),
    values,
    nota: row.nota,
    updatedAt: row.updated_at,
  };
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Sem sessao iniciada.");

  return { supabase, userId: user.id };
}

/**
 * Ordena por dia e, dentro do dia, por hora.
 *
 * O Postgres poe os nulos no fim numa ordenacao ascendente; aqui a medicao sem
 * hora vem primeiro, porque e a que existia antes de alguem comecar a registar
 * horas e nao deve saltar para depois das da noite.
 */
function porOrdemCronologica(a: Entry, b: Entry): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  const ha = a.hora ?? "";
  const hb = b.hora ?? "";
  return ha < hb ? -1 : ha > hb ? 1 : 0;
}

/** Todas as medicoes, da mais antiga para a mais recente. */
export async function listEntries(): Promise<Entry[]> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("entries")
    .select(COLUMNS)
    .eq("user_id", userId);

  if (error)
    throw new Error(`Nao foi possivel ler os registos: ${error.message}`);

  return (data as unknown as Row[]).map(rowToEntry).sort(porOrdemCronologica);
}

export async function getEntry(id: string): Promise<Entry | null> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("entries")
    .select(COLUMNS)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error)
    throw new Error(`Nao foi possivel ler a medicao: ${error.message}`);
  return data ? rowToEntry(data as unknown as Row) : null;
}

function toRow(input: EntryInput, userId: string) {
  return {
    user_id: userId,
    date: input.date,
    hora: input.hora,
    ...Object.fromEntries(METRIC_IDS.map((id) => [id, input.values[id]])),
    nota: input.nota && input.nota.length > 0 ? input.nota : null,
  };
}

/**
 * Grava uma medicao: cria uma nova, ou altera a que o `id` indicar.
 *
 * Deixou de ser um upsert pela data. Com varias medicoes por dia, gravar uma
 * segunda pesagem tem de acrescentar uma linha, e nao substituir a da manha --
 * que era exatamente o que acontecia antes.
 */
export async function saveEntry(input: EntryInput): Promise<Entry> {
  const { supabase, userId } = await requireUser();
  const row = toRow(input, userId);

  const query = input.id
    ? supabase
        .from("entries")
        .update(row)
        .eq("id", input.id)
        .eq("user_id", userId)
    : supabase.from("entries").insert(row);

  const { data, error } = await query.select(COLUMNS).single();

  if (error) {
    // O indice unico (user_id, date, hora) so dispara quando ha hora: gravar
    // duas vezes as 08:00 do mesmo dia e quase sempre engano, e vale a pena
    // dize-lo em vez de deixar passar o codigo cru do Postgres.
    if (error.code === "23505") {
      throw new Error("Ja existe uma medicao nesse dia a essa hora.");
    }
    throw new Error(`Nao foi possivel guardar: ${error.message}`);
  }

  return rowToEntry(data as unknown as Row);
}

export async function deleteEntry(id: string): Promise<boolean> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("entries")
    .delete()
    .eq("user_id", userId)
    .eq("id", id)
    .select("id");

  if (error) throw new Error(`Nao foi possivel apagar: ${error.message}`);

  return (data?.length ?? 0) > 0;
}

/**
 * Importa medicoes.
 *
 * Reconcilia pelo `id` que vem da exportacao, por isso importar duas vezes a
 * mesma copia de seguranca nao duplica nada. Uma linha sem `id` e nova. As
 * politicas continuam a valer: um `id` de outra pessoa nao passa na verificacao
 * de escrita.
 */
export async function importEntries(entries: EntryInput[]): Promise<number> {
  if (entries.length === 0) return 0;

  const { supabase, userId } = await requireUser();

  const comId = entries.filter((e) => e.id);
  const semId = entries.filter((e) => !e.id);

  if (comId.length > 0) {
    const { error } = await supabase.from("entries").upsert(
      comId.map((e) => ({ id: e.id, ...toRow(e, userId) })),
      { onConflict: "id" },
    );
    if (error) throw new Error(`Nao foi possivel importar: ${error.message}`);
  }

  if (semId.length > 0) {
    const { error } = await supabase
      .from("entries")
      .insert(semId.map((e) => toRow(e, userId)));
    if (error) throw new Error(`Nao foi possivel importar: ${error.message}`);
  }

  return entries.length;
}

/**
 * Apaga todas as medicoes de quem esta autenticado, mantendo a conta.
 *
 * Existe para quem quer recomecar do zero sem perder a conta, e para quem quer
 * exercer o direito ao apagamento das medidas sem apagar tudo. A conta em si so
 * o administrador apaga.
 */
export async function deleteAllEntries(): Promise<number> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("entries")
    .delete()
    .eq("user_id", userId)
    .select("id");

  if (error) throw new Error(`Nao foi possivel apagar: ${error.message}`);

  return data?.length ?? 0;
}
