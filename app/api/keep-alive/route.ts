import { pingDatabase } from "@/lib/repo";

/**
 * Chamado todos os dias pelo cron da Vercel (ver vercel.json).
 *
 * A Supabase pausa os projetos do plano gratuito apos cerca de uma semana sem
 * atividade, e com o projeto pausado a app inteira deixa de responder. Uma
 * consulta diaria evita isso.
 *
 * A Vercel envia "Authorization: Bearer <CRON_SECRET>" se a variavel existir no
 * projeto. Sem ela, a rota recusa tudo em vez de ficar aberta a qualquer um.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return Response.json(
      { ok: false, error: "CRON_SECRET em falta" },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  try {
    await pingDatabase();
    return Response.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
