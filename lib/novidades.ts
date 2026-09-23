/**
 * O cartao de novidades, a entrada.
 *
 * A versao e o mecanismo: o cartao fica dispensado enquanto a versao guardada
 * no browser for igual a esta. Subir o numero fa-lo reaparecer a toda a gente
 * -- e a unica coisa a mexer quando houver novidades para mostrar.
 *
 * O estado vive no browser e nao no perfil, de proposito: e uma conveniencia
 * de leitura, nao um dado da pessoa. O preco e o cartao reaparecer uma vez em
 * cada dispositivo novo, que e barato ao pe de uma migracao e de uma escrita
 * na base de dados por cada toque num X.
 */
export const NOVIDADES_VERSAO = "2";

export const NOVIDADES_KEY = "medidas-novidades";

/**
 * Atributo carimbado no <html> antes da primeira pintura quando esta versao ja
 * foi vista. Quem esconde o cartao e o CSS, nao o React: decidido depois da
 * hidratacao, o cartao aparecia a vista e empurrava o resto da pagina para
 * baixo a cada visita, mesmo a quem ja o tinha dispensado.
 */
export const NOVIDADES_ATTR = "novidades";
