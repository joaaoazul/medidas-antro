import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Onboarding from "@/components/Onboarding";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Bem-vindo - Medidas" };
export const dynamic = "force-dynamic";

export default async function BemVindoPage() {
  const viewer = await requireViewer();

  // A palavra-passe temporaria vem primeiro: nao faz sentido pedir a data de
  // nascimento numa sessao cuja palavra-passe ainda e a que foi entregue por
  // mensagem.
  if (viewer.passwordTemporaria) redirect("/conta/palavra-passe");

  // Ja esta tudo feito: nao ha nada a preencher aqui.
  if (!viewer.precisaAceitar && !viewer.precisaOnboarding) redirect("/");

  return (
    <main>
      <Onboarding email={viewer.email} />
    </main>
  );
}
