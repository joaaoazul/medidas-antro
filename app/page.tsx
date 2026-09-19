import { redirect } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import { listEntries } from "@/lib/repo";
import { createClient } from "@/lib/supabase/server";

// Os dados vivem em SQLite local e mudam a cada gravacao: nada disto pode ser
// pre-renderizado em build.
export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O middleware ja redireciona quem nao tem sessao. Esta segunda verificacao
  // existe porque uma pagina nao deve depender de uma guarda que vive noutro
  // ficheiro: se um dia o matcher do middleware mudar, isto falha fechado.
  if (!user) redirect("/entrar");

  const entries = await listEntries();

  return (
    <main>
      <Dashboard entries={entries} email={user.email ?? ""} />
    </main>
  );
}
