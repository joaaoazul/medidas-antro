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
import { parseNumber } from "./form-entry";
import { METRICS, comArtigo, type MetricId } from "./metrics";
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

/**
 * Objetivo por metrica.
 *
 * O peso guarda-se em `objetivo_peso` e o resto na coluna `objetivos` (ver a
 * migracao 0004), mas no codigo e um mapa so: nenhum componente tem de saber
 * qual das metricas e a especial -- era isso que obrigava a um `=== "peso"` em
 * cada sitio que desenhava um objetivo.
 */
export type Objetivos = Partial<Record<MetricId, number>>;

/**
 * O que se le da coluna `objetivos`. Vive aqui, e nao em profile-repo.ts,
 * porque as definicoes -- um componente de cliente -- precisam do tipo, e este
 * ficheiro e o que se pode importar dos dois lados sem arrastar o cliente de
 * servidor para o browser.
 */
export type ObjetivosExtra = {
  /** A coluna existe? Falso enquanto a migracao 0004 nao for aplicada. */
  disponivel: boolean;
  valores: Objetivos;
};

/** As metricas cujo objetivo vive na coluna `objetivos`: todas menos o peso. */
export const METRICAS_OBJETIVO_EXTRA = METRICS.filter((m) => m.id !== "peso");

/**
 * O que vem da coluna `objetivos`, limpo.
 *
 * E JSON sem esquema na base de dados -- qualquer coisa pode la estar, de uma
 * edicao a mao no SQL Editor a uma metrica que um dia deixe de existir. Fica
 * so o que e uma metrica conhecida com um numero dentro dos limites dela.
 */
export function limparObjetivos(bruto: unknown): Objetivos {
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) return {};
  const out: Objetivos = {};
  for (const m of METRICAS_OBJETIVO_EXTRA) {
    const v = (bruto as Record<string, unknown>)[m.id];
    if (typeof v === "number" && Number.isFinite(v) && v >= m.min && v <= m.max) {
      out[m.id] = v;
    }
  }
  return out;
}

/** O mapa completo, com o peso vindo da sua coluna propria. */
export function juntarObjetivos(
  objetivoPeso: number | null | undefined,
  extra: Objetivos,
): Objetivos {
  return objetivoPeso == null ? { ...extra } : { ...extra, peso: objetivoPeso };
}

/** Le os campos `objetivo_<metrica>` do formulario das definicoes. */
export function lerObjetivos(
  formData: FormData,
): { ok: true; valores: Objetivos } | { ok: false; message: string } {
  const valores: Objetivos = {};
  for (const m of METRICAS_OBJETIVO_EXTRA) {
    const n = parseNumber(formData.get(`objetivo_${m.id}`));
    if (n === "erro") {
      return { ok: false, message: `O objetivo para ${comArtigo(m.id)} não é um número.` };
    }
    if (n === null) continue;
    if (n < m.min || n > m.max) {
      return {
        ok: false,
        message: `O objetivo para ${comArtigo(m.id)} tem de estar entre ${m.min} e ${m.max} ${m.unit}.`,
      };
    }
    valores[m.id] = n;
  }
  return { ok: true, valores };
}
