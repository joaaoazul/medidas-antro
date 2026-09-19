import { revalidatePath } from "next/cache";
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
    return Response.json({ error: "O ficheiro nao e JSON valido." }, { status: 400 });
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

  const imported = await importEntries(parsed);
  revalidatePath("/");

  return Response.json({ imported });
}
