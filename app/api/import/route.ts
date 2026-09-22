import { revalidatePath } from "next/cache";
import { MEDICAO_DUPLICADA } from "@/lib/form-state";
import { importEntries } from "@/lib/repo";
import { entrySchema, firstError } from "@/lib/validation";

/**
 * Restaura uma exportacao. Cada registo passa pela mesma validacao do
 * formulario e a gravacao corre numa transacao: ou entram todos, ou nenhum.
 * Uma importacao a meio seria pior do que uma falhada.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "O ficheiro não é JSON válido." },
      { status: 400 },
    );
  }

  const raw = Array.isArray(body)
    ? body
    : (body as { entries?: unknown })?.entries;

  if (!Array.isArray(raw)) {
    return Response.json(
      { error: "Esperava uma lista de registos (ou um objeto com 'entries')." },
      { status: 400 },
    );
  }

  const parsed = [];
  for (const [index, item] of raw.entries()) {
    const result = entrySchema.safeParse(item);
    if (!result.success) {
      return Response.json(
        { error: `Registo ${index + 1}: ${firstError(result.error)}` },
        { status: 400 },
      );
    }
    parsed.push(result.data);
  }

  /*
   * Um erro da base de dados tem de sair como JSON, como os outros. Sem este
   * try, saia como a pagina de erro do Next -- e quem chama le `{ error }` e
   * encontra HTML: a importacao manual dizia "nao foi possivel ler o ficheiro"
   * sobre um ficheiro perfeitamente legivel, e a fila offline nao tinha como
   * distinguir uma recusa de uma falha.
   *
   * 409 e nao 500 para a medicao repetida: nao e o servidor que falhou, e um
   * conflito que reenviar nao resolve. A fila offline le o codigo para decidir
   * se tenta outra vez.
   */
  let imported: number;
  try {
    imported = await importEntries(parsed);
  } catch (erro) {
    const error =
      erro instanceof Error ? erro.message : "Não foi possível importar.";
    return Response.json(
      { error },
      { status: error === MEDICAO_DUPLICADA ? 409 : 500 },
    );
  }

  revalidatePath("/");
  return Response.json({ imported });
}
