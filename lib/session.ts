import { redirect } from "next/navigation";
import { faltaConsentimento, type Profile } from "./profile";
import { getConsents, getProfile } from "./profile-repo";
import { createClient } from "./supabase/server";

export type Viewer = {
  id: string;
  email: string;
  profile: Profile | null;
  /** Pode entrar na area de administracao. */
  admin: boolean;
  /** A palavra-passe foi posta pelo administrador e tem de ser mudada. */
  passwordTemporaria: boolean;
  /** Falta aceitar a versao atual dos termos ou da politica. */
  precisaAceitar: boolean;
  /** Falta preencher o perfil. */
  precisaOnboarding: boolean;
};

/**
 * Quem esta a ver, e o que lhe falta fazer antes de poder usar a app.
 *
 * A identidade vem de getUser(), que valida o token contra a Supabase.
 * getSession() le apenas o cookie, que o lado do cliente tambem sabe escrever,
 * por isso nunca serve para decidir quem entra.
 */
export async function getViewer(): Promise<Viewer | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Quatro leituras independentes: em serie seriam quatro idas a base de dados
  // uma atras da outra em cada pedido.
  const [profile, consents, estado, admin] = await Promise.all([
    getProfile(user.id),
    getConsents(user.id),
    supabase
      .from("account_state")
      .select("password_temporaria")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return {
    id: user.id,
    email: user.email ?? "",
    profile,
    admin: Boolean(admin.data),
    passwordTemporaria: Boolean(estado.data?.password_temporaria),
    precisaAceitar: faltaConsentimento(consents),
    precisaOnboarding: !profile?.onboardingEm,
  };
}

/** Exige sessao iniciada; caso contrario manda entrar. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/entrar");
  return viewer;
}

/**
 * Exige uma conta pronta a usar.
 *
 * A ordem importa: primeiro tirar do caminho a palavra-passe que o
 * administrador conhece, so depois pedir dados pessoais. Nao faz sentido
 * alguem preencher a data de nascimento numa sessao cuja palavra-passe ainda e
 * a que lhe foi entregue por mensagem.
 */
export async function requireReadyViewer(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (viewer.passwordTemporaria) redirect("/conta/palavra-passe");
  if (viewer.precisaAceitar || viewer.precisaOnboarding) redirect("/bem-vindo");
  return viewer;
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireReadyViewer();
  // Uma pagina nunca decide isto sozinha: quem esta na tabela admins e decidido
  // no SQL Editor, e a tabela nao tem politica de escrita nenhuma.
  if (!viewer.admin) redirect("/");
  return viewer;
}
