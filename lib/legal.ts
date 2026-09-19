/**
 * Identificacao do responsavel pelo tratamento e versoes dos documentos.
 *
 * O RGPD obriga a identificar quem trata os dados e a dar um contacto (Artigo
 * 13). Nome e email sao o minimo; morada e NIF sao opcionais aqui e sao
 * omitidos das frases quando ficam vazios, para nao aparecerem campos por
 * preencher num documento legal.
 */
export const RESPONSAVEL = {
  nome: "Joao Azul",
  email: "cybersec.joao@proton.me",
  /** Opcional. Reforca a identificacao, sobretudo se isto passar a servico pago. */
  morada: "",
  /** Opcional. Um particular que nao exerce atividade nao tem de o indicar. */
  nif: "",
  pais: "Portugal",
} as const;

/**
 * Monta a identificacao do responsavel numa frase, com o que existir.
 *
 * Sem isto, um documento com a morada por preencher sairia com "com morada em ,
 * contribuinte n.o ," -- pior do que nao dizer nada.
 */
export function identificacaoResponsavel(): string {
  const partes: string[] = [RESPONSAVEL.nome];

  if (RESPONSAVEL.morada) partes.push(`com morada em ${RESPONSAVEL.morada}`);
  if (RESPONSAVEL.nif) partes.push(`contribuinte n.o ${RESPONSAVEL.nif}`);
  partes.push(`em ${RESPONSAVEL.pais}`);

  return partes.join(", ");
}

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
