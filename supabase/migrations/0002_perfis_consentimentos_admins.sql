-- Ver o commit que acompanha este ficheiro para o racional completo.
-- Aplicado no projeto em 2026-09-19.

create table if not exists public.profiles (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  nome               text,
  data_nascimento    date,
  sexo               text check (sexo in ('feminino', 'masculino', 'outro', 'nao_dizer')),
  altura_cm          real check (altura_cm between 80 and 260),
  objetivo           text check (objetivo in ('perder_gordura', 'ganhar_musculo', 'manter', 'desempenho', 'outro')),
  objetivo_peso      real check (objetivo_peso between 20 and 400),
  treinos_por_semana smallint check (treinos_por_semana between 0 and 14),
  notas              text,
  -- Nulo enquanto o onboarding nao estiver concluido.
  onboarding_em      timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Livro de registo do consentimento. So insert e select: um registo de
-- consentimento que se possa reescrever nao demonstra nada, e o RGPD exige
-- poder demonstra-lo.
create table if not exists public.consents (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  documento  text not null check (documento in ('termos', 'privacidade')),
  versao     text not null,
  aceite_em  timestamptz not null default now()
);

create index if not exists consents_user_idx on public.consents (user_id, documento, aceite_em desc);
alter table public.consents enable row level security;

drop policy if exists "consents_select_own" on public.consents;
create policy "consents_select_own" on public.consents
  for select using (auth.uid() = user_id);
drop policy if exists "consents_insert_own" on public.consents;
create policy "consents_insert_own" on public.consents
  for insert with check (auth.uid() = user_id);

-- Administradores. Sem politica de escrita nenhuma: ninguem se promove pela
-- API. Criam-se pelo SQL Editor.
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
drop policy if exists "admins_select_own" on public.admins;
create policy "admins_select_own" on public.admins
  for select using (auth.uid() = user_id);

-- Estado da conta: campos que a propria pessoa nao pode alterar. Vive fora de
-- profiles precisamente porque profiles e escrito pela pessoa.
create table if not exists public.account_state (
  user_id             uuid primary key references auth.users (id) on delete cascade,
  password_temporaria boolean not null default false,
  updated_at          timestamptz not null default now()
);

alter table public.account_state enable row level security;
drop policy if exists "account_state_select_own" on public.account_state;
create policy "account_state_select_own" on public.account_state
  for select using (auth.uid() = user_id);

-- Cria perfil e estado assim que nasce uma conta. Precisa mesmo de security
-- definer: corre a partir de um trigger no schema auth e escreve no schema
-- public, para uma conta que ainda nao tem sessao.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.account_state (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.touch_updated_at() from public, anon, authenticated;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before insert or update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists account_state_touch_updated_at on public.account_state;
create trigger account_state_touch_updated_at
  before insert or update on public.account_state
  for each row execute function public.touch_updated_at();

-- Chamada pela app depois de uma mudanca de palavra-passe bem sucedida.
-- Security definer porque account_state nao aceita escritas de utilizadores --
-- e e isso que impede alguem de fingir que ja mudou a palavra-passe.
create or replace function public.limpar_password_temporaria()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'sem sessao iniciada';
  end if;
  update public.account_state set password_temporaria = false where user_id = auth.uid();
end;
$$;

revoke execute on function public.limpar_password_temporaria() from public, anon;
grant execute on function public.limpar_password_temporaria() to authenticated;
