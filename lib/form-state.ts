/**
 * Estado que as server actions devolvem ao formulario.
 *
 * Vive fora do ficheiro "use server" de proposito: um modulo "use server" so
 * pode exportar funcoes assincronas, porque tudo o que ele exporta vira um
 * ponto de entrada chamavel a partir do cliente. Exportar dali um objeto
 * compila e passa no lint, e rebenta em tempo de execucao a primeira vez que o
 * formulario e submetido.
 */
export type ActionState = {
  status: "idle" | "ok" | "erro";
  message: string;
  /** Data gravada com sucesso, para o formulario dar sinal de vida. */
  savedDate?: string;
};

export const IDLE: ActionState = { status: "idle", message: "" };

/**
 * Estado das accoes de administracao.
 *
 * Leva um `segredo` porque criar uma conta ou repor uma palavra-passe produz
 * uma palavra-passe temporaria que tem de ser mostrada UMA vez a quem a vai
 * entregar. Nao fica guardada em lado nenhum em texto legivel: a partir do
 * momento em que esta mensagem desaparece do ecra, nem o administrador a
 * consegue recuperar.
 */
export type AdminState = ActionState & { segredo?: string };

export const ADMIN_IDLE: AdminState = { status: "idle", message: "" };
