/**
 * Definicoes de perfil: constantes, tipos e validacao.
 *
 * Este ficheiro nao importa nada do servidor de proposito. E usado por
 * componentes de cliente (o onboarding precisa da lista de objetivos), e uma
 * unica importacao de "./supabase/server" aqui arrastava o cliente de servidor
 * -- e os cabecalhos e cookies que ele le -- para dentro do pacote que vai para
 * o browser. O acesso a base de dados vive em profile-repo.ts.
 */
import { z } from "zod";
import { todayISO } from "./dates";
import { IDADE_MINIMA, VERSAO_PRIVACIDADE, VERSAO_TERMOS } from "./legal";

export const OBJETIVOS = [
  { key: "perder_gordura", label: "Perder gordura" },
  { key: "ganhar_musculo", label: "Ganhar músculo" },
  { key: "manter", label: "Manter" },
  { key: "desempenho", label: "Desempenho" },
  { key: "outro", label: "Outro" },
] as const;

export const SEXOS = [
  { key: "feminino", label: "Feminino" },
  { key: "masculino", label: "Masculino" },
  { key: "outro", label: "Outro" },
  { key: "nao_dizer", label: "Prefiro não dizer" },
] as const;

export type Objetivo = (typeof OBJETIVOS)[number]["key"];
export type Sexo = (typeof SEXOS)[number]["key"];

export type Profile = {
  nome: string | null;
  dataNascimento: string | null;
  sexo: Sexo | null;
  alturaCm: number | null;
  objetivo: Objetivo | null;
  objetivoPeso: number | null;
  treinosPorSemana: number | null;
  notas: string | null;
  onboardingEm: string | null;
};

const opcionalTexto = z
  .string()
  .trim()
  .max(500)
  .nullable()
  .transform((v) => (v && v.length > 0 ? v : null));

/**
 * Onboarding.
 *
 * Tudo e opcional excepto o nome e a data de nascimento: o nome porque a app
 * trata a pessoa por ele, e a data de nascimento porque e dela que sai a idade
 * minima -- e nao se pode verificar uma idade que nao se pergunta.
 */
export const profileSchema = z.object({
  nome: z.string().trim().min(1, "Escreve o teu nome.").max(80),
  dataNascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida.")
    .refine((v) => v < todayISO(), "Essa data ainda não aconteceu.")
    .refine(
      (v) => idadeEm(v) >= IDADE_MINIMA,
      `Tens de ter pelo menos ${IDADE_MINIMA} anos para teres conta.`,
    )
    .refine((v) => idadeEm(v) <= 120, "Confirma a data de nascimento."),
  sexo: z.enum(["feminino", "masculino", "outro", "nao_dizer"]).nullable(),
  alturaCm: z
    .union([z.number(), z.null()])
    .refine(
      (v) => v === null || (v >= 80 && v <= 260),
      "A altura tem de estar entre 80 e 260 cm.",
    ),
  objetivo: z
    .enum(["perder_gordura", "ganhar_musculo", "manter", "desempenho", "outro"])
    .nullable(),
  objetivoPeso: z
    .union([z.number(), z.null()])
    .refine(
      (v) => v === null || (v >= 20 && v <= 400),
      "O peso pretendido tem de estar entre 20 e 400 kg.",
    ),
  treinosPorSemana: z
    .union([z.number(), z.null()])
    .refine(
      (v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 14),
      "Treinos por semana entre 0 e 14.",
    ),
  notas: opcionalTexto,
});

export type ProfileInput = z.infer<typeof profileSchema>;

/** Idade completa em anos a data de hoje. */
export function idadeEm(dataNascimento: string): number {
  const hoje = todayISO();
  const anos = Number(hoje.slice(0, 4)) - Number(dataNascimento.slice(0, 4));
  // Ainda nao fez anos este ano se o dia-mes de hoje for anterior ao dele.
  return hoje.slice(5) < dataNascimento.slice(5) ? anos - 1 : anos;
}

export type Consent = {
  documento: "termos" | "privacidade";
  versao: string;
  aceite_em: string;
};

/** Falta aceitar a versao atual de algum dos documentos? */
export function faltaConsentimento(consents: Consent[]): boolean {
  const aceitou = (documento: Consent["documento"], versao: string) =>
    consents.some((c) => c.documento === documento && c.versao === versao);

  return (
    !aceitou("termos", VERSAO_TERMOS) ||
    !aceitou("privacidade", VERSAO_PRIVACIDADE)
  );
}
