import type { Metadata } from "next";
import AdminPanel, { type Conta } from "@/components/AdminPanel";
import { requireAdmin } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Administracao - Medidas" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // A guarda vem antes de qualquer uso da chave de servico. Sem sessao de
  // administrador, nada disto corre.
  const viewer = await requireAdmin();

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });

  if (error) throw new Error(`Nao foi possivel listar as contas: ${error.message}`);

  // Estado das contas numa so leitura, em vez de uma por conta.
  const { data: estados } = await admin
    .from("account_state")
    .select("user_id, password_temporaria");

  const temporarias = new Set(
    (estados ?? [])
      .filter((e) => e.password_temporaria)
      .map((e) => e.user_id as string),
  );

  const contas: Conta[] = data.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? "(sem email)",
      criadaEm: u.created_at.slice(0, 10),
      ultimaEntrada: u.last_sign_in_at ? u.last_sign_in_at.slice(0, 10) : null,
      passwordTemporaria: temporarias.has(u.id),
    }))
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));

  return (
    <main>
      <AdminPanel contas={contas} euId={viewer.id} />
    </main>
  );
}
