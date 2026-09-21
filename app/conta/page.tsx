import type { Metadata } from "next";
import AccountSettings from "@/components/AccountSettings";
import { getConsents } from "@/lib/profile-repo";
import { listEntries } from "@/lib/repo";
import { requireReadyViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Definições - Medidas" };
export const dynamic = "force-dynamic";

export default async function ContaPage() {
  const viewer = await requireReadyViewer();
  const [consents, entries] = await Promise.all([
    getConsents(viewer.id),
    listEntries(),
  ]);

  return (
    <main>
      <AccountSettings
        email={viewer.email}
        profile={viewer.profile}
        consents={consents}
        admin={viewer.admin}
        totalRegistos={entries.length}
      />
    </main>
  );
}
