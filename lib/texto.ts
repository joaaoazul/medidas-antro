/**
 * Comparacao de texto para pesquisa, sem depender de acentos nem de
 * maiusculas.
 *
 * Quem escreveu "ferias" na nota vai procura-la escrevendo "ferias" com a
 * mesma probabilidade com que escreve "ferias" -- e num teclado de telemovel,
 * com mais. Uma pesquisa que exige o acento certo e uma pesquisa que falha, e
 * falha em silencio: devolve zero resultados e parece que nao ha nada.
 *
 * NFD separa a letra do acento, e a classe \p{Diacritic} apanha o acento
 * sozinho. E assim, e nao com uma tabela de substituicoes, porque uma tabela
 * escrita a mao esquece-se sempre de um caso -- o til do "ã", a cedilha, o
 * trema de um nome estrangeiro colado numa nota.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
