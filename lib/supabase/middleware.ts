import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Caminhos acessiveis sem sessao iniciada. */
const PUBLIC_PATHS = [
  "/entrar",
  "/auth",
  // Os documentos legais tem de se poder ler ANTES de haver conta, e o endereco
  // tem de se poder enviar a alguem. Uma politica de privacidade so acessivel a
  // quem ja aceitou nao serve para nada.
  "/termos",
  "/privacidade",
];

/**
 * Renova a sessao em cada pedido e guarda as rotas privadas.
 *
 * Os tokens da Supabase expiram ao fim de uma hora. Sem isto, quem deixasse o
 * separador aberto voltava a uma app subitamente vazia -- a sessao caducava e
 * as consultas passavam a nao devolver nada, sem nada a explicar porque.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() valida o token contra o servidor da Supabase. getSession() apenas
  // le o cookie, que quem esta do outro lado do ecra tambem consegue escrever,
  // por isso nao serve para decidir quem entra.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/entrar") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
