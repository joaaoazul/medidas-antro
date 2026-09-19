import type { Metadata } from "next";
import PasswordForm from "@/components/PasswordForm";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Palavra-passe - Medidas" };
export const dynamic = "force-dynamic";

export default async function PalavraPassePage() {
  // requireViewer e nao requireReadyViewer: esta e uma das paginas que a conta
  // tem de poder abrir precisamente por ainda nao estar pronta.
  const viewer = await requireViewer();

  return (
    <main>
      <PasswordForm obrigatoria={viewer.passwordTemporaria} />
    </main>
  );
}
