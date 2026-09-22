import { colunaEmFalta } from "./esquema";
import { createClient } from "./supabase/server";
import { VERSAO_PRIVACIDADE, VERSAO_TERMOS } from "./legal";
import {
  limparObjetivos,
  type Consent,
  type Objetivo,
  type Objetivos,
  type ObjetivosExtra,
  type Profile,
  type ProfileInput,
  type Sexo,
} from "./profile";

/** Leitura e escrita de perfis e consentimentos. Sempre com a sessao de quem navega. */

type ProfileRow = {
  nome: string | null;
  data_nascimento: string | null;
  sexo: Sexo | null;
  altura_cm: number | null;
  objetivo: Objetivo | null;
  objetivo_peso: number | null;
  treinos_por_semana: number | null;
  notas: string | null;
  onboarding_em: string | null;
};

const PROFILE_COLUMNS =
  "nome, data_nascimento, sexo, altura_cm, objetivo, objetivo_peso, treinos_por_semana, notas, onboarding_em";

function rowToProfile(row: ProfileRow): Profile {
  return {
    nome: row.nome,
    dataNascimento: row.data_nascimento,
    sexo: row.sexo,
    alturaCm: row.altura_cm,
    objetivo: row.objetivo,
    objetivoPeso: row.objetivo_peso,
    treinosPorSemana: row.treinos_por_semana,
    notas: row.notas,
    onboardingEm: row.onboarding_em,
  };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Não foi possível ler o perfil: ${error.message}`);
  return data ? rowToProfile(data as unknown as ProfileRow) : null;
}

/**
 * Grava o perfil.
 *
 * `concluirOnboarding` so e verdadeiro na primeira vez. Numa edicao nas
 * definicoes tem de ser falso: reescrever onboarding_em a cada gravacao
 * apagava a data em que a pessoa entrou de facto, que e a unica que interessa.
 */
export async function saveProfile(
  userId: string,
  input: ProfileInput,
  { concluirOnboarding = false }: { concluirOnboarding?: boolean } = {},
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      nome: input.nome,
      data_nascimento: input.dataNascimento,
      sexo: input.sexo,
      altura_cm: input.alturaCm,
      objetivo: input.objetivo,
      objetivo_peso: input.objetivoPeso,
      treinos_por_semana: input.treinosPorSemana,
      notas: input.notas,
      ...(concluirOnboarding
        ? { onboarding_em: new Date().toISOString() }
        : {}),
    },
    { onConflict: "user_id" },
  );

  if (error)
    throw new Error(`Não foi possível guardar o perfil: ${error.message}`);
}

/**
 * Os objetivos das metricas que nao o peso.
 *
 * Lidos a parte, e NAO em PROFILE_COLUMNS, de proposito: o perfil e lido em
 * todos os pedidos, e uma coluna que ainda nao existe ali deitava abaixo todas
 * as paginas no intervalo entre o deploy e a migracao. Aqui, a coluna em falta
 * e so "ainda nao disponivel".
 */
export async function getObjetivosExtra(userId: string): Promise<ObjetivosExtra> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("objetivos")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (colunaEmFalta(error)) return { disponivel: false, valores: {} };
    throw new Error(`Não foi possível ler os objetivos: ${error.message}`);
  }
  return {
    disponivel: true,
    valores: limparObjetivos((data as { objetivos?: unknown } | null)?.objetivos),
  };
}

export async function saveObjetivos(userId: string, valores: Objetivos): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ objetivos: limparObjetivos(valores) })
    .eq("user_id", userId);

  if (error) {
    if (colunaEmFalta(error)) {
      throw new Error("Os objetivos por medida ainda não estão disponíveis.");
    }
    throw new Error(`Não foi possível guardar os objetivos: ${error.message}`);
  }
}

export async function getConsents(userId: string): Promise<Consent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consents")
    .select("documento, versao, aceite_em")
    .eq("user_id", userId)
    .order("aceite_em", { ascending: false });

  if (error)
    throw new Error(`Não foi possível ler os consentimentos: ${error.message}`);
  return (data ?? []) as Consent[];
}

/**
 * Regista a aceitacao das versoes atuais dos dois documentos.
 *
 * Duas linhas novas, nunca uma alteracao: o registo de consentimento e um livro
 * de registo, e um livro que se pode reescrever nao demonstra nada.
 */
export async function recordConsent(userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("consents").insert([
    { user_id: userId, documento: "termos", versao: VERSAO_TERMOS },
    { user_id: userId, documento: "privacidade", versao: VERSAO_PRIVACIDADE },
  ]);

  if (error)
    throw new Error(
      `Não foi possível registar o consentimento: ${error.message}`,
    );
}
