import Dashboard from "@/components/Dashboard";
import { listEntries } from "@/lib/repo";

// Os dados vivem em SQLite local e mudam a cada gravacao: nada disto pode ser
// pre-renderizado em build.
export const dynamic = "force-dynamic";

export default async function Home() {
  const entries = listEntries();

  return (
    <main>
      <Dashboard entries={entries} />
    </main>
  );
}
