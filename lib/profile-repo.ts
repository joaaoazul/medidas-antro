import { createClient } from "./supabase/server";
import {
  VERSAO_PRIVACIDADE,
  VERSAO_TERMOS,
} from "./legal";
import type {
  Consent,
  Objetivo,
  Profile,
  ProfileInput,
  Sexo,
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

  if (error) throw new Error(`Nao foi possivel ler o perfil: ${error.message}`);
  return data ? rowToProfile(data as unknown as ProfileRow) : null;
}

/** Grava o perfil e da o onboarding por concluido. */
export async function saveProfile(
  userId: string,
  input: ProfileInput,
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
      onboarding_em: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw new Error(`Nao foi possivel guardar o perfil: ${error.message}`);
}

export async function getConsents(userId: string): Promise<Consent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consents")
    .select("documento, versao")
    .eq("user_id", userId);

  if (error)
    throw new Error(`Nao foi possivel ler os consentimentos: ${error.message}`);
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
    throw new Error(`Nao foi possivel registar o consentimento: ${error.message}`);
}

