import type { Metadata } from "next";
import AccountSettings from "@/components/AccountSettings";
import { getConsents, getObjetivosExtra } from "@/lib/profile-repo";
import { listEntries } from "@/lib/repo";
import { requireReadyViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Definições - Medidas" };
export const dynamic = "force-dynamic";

export default async function ContaPage() {
  const viewer = await requireReadyViewer();
  const [consents, entries, objetivos] = await Promise.all([
    getConsents(viewer.id),
    listEntries(),
    getObjetivosExtra(viewer.id),
  ]);

  return (
    <main>
      <AccountSettings
        email={viewer.email}
        profile={viewer.profile}
        objetivos={objetivos}
        consents={consents}
        admin={viewer.admin}
        totalRegistos={entries.length}
      />
    </main>
  );
}
