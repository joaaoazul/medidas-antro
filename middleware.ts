import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Tudo menos os ficheiros estaticos e as imagens: renovar a sessao num
     * pedido de um icone seria trabalho a mais em cada pedido, e esses nao
     * precisam de sessao nenhuma.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
