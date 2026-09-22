import Dashboard from "@/components/Dashboard";
import { juntarObjetivos } from "@/lib/profile";
import { getObjetivosExtra } from "@/lib/profile-repo";
import { listEntries } from "@/lib/repo";
import { requireReadyViewer } from "@/lib/session";

// Os dados vivem na Supabase e mudam a cada gravacao: nada disto pode ser
// pre-renderizado em build.
export const dynamic = "force-dynamic";

export default async function Home() {
  // Trata de tudo: sem sessao manda entrar, com palavra-passe temporaria manda
  // muda-la, sem onboarding manda preenche-lo. A pagina nao depende do
  // middleware para isso -- se um dia o matcher mudar, isto falha fechado.
  const viewer = await requireReadyViewer();
  const [entries, objetivosExtra] = await Promise.all([
    listEntries(),
    getObjetivosExtra(viewer.id),
  ]);

  return (
    <main>
      <Dashboard
        userId={viewer.id}
        entries={entries}
        nome={viewer.profile?.nome ?? null}
        objetivos={juntarObjetivos(
          viewer.profile?.objetivoPeso,
          objetivosExtra.valores,
        )}
        alturaCm={viewer.profile?.alturaCm ?? null}
      />
    </main>
  );
}
