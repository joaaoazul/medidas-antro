/**
 * Identificacao do responsavel pelo tratamento e versoes dos documentos.
 *
 * PREENCHE ESTES VALORES antes de dar acesso a alguem. Aparecem nos Termos de
 * Servico e na Politica de Privacidade, e o RGPD obriga a identificar quem
 * trata os dados: uma politica que nao diz quem e o responsavel nao cumpre o
 * Artigo 13.
 */
export const RESPONSAVEL = {
  nome: "[O TEU NOME OU O DA EMPRESA]",
  email: "[EMAIL DE CONTACTO]",
  morada: "[MORADA COMPLETA]",
  nif: "[NIF OU NIPC]",
  pais: "Portugal",
} as const;

/**
 * Versoes dos documentos.
 *
 * Sao gravadas no registo de consentimento, por isso mudam sempre que o texto
 * mudar de forma substantiva -- e so assim. Mudar a versao sem mudar o texto
 * faz pedir consentimento outra vez sem razao; mudar o texto sem mudar a versao
 * deixa registado que alguem aceitou algo que ja nao existe.
 */
export const VERSAO_TERMOS = "2026-09-19";
export const VERSAO_PRIVACIDADE = "2026-09-19";

/** Idade minima para ter conta, sem consentimento de quem exerce o poder paternal. */
export const IDADE_MINIMA = 16;
