-- A mudanca obrigatoria da palavra-passe passa a ser imposta pela base de dados.
-- Aplicado no projeto em 2026-09-23 (versao 20260923104324).
--
-- O problema: `limpar_password_temporaria` limpava a marca de palavra-passe
-- temporaria de quem a chamasse, sem confirmar que a palavra-passe tinha mudado.
-- A app so a chama depois de uma mudanca bem sucedida -- mas quem tem a
-- temporaria podia chama-la diretamente (POST /rest/v1/rpc/...) e ficar com ela,
-- que o administrador viu e que foi enviada por mensagem. O comentario da
-- migracao 0002 dizia que era isto que impedia "fingir que ja mudou". Nao era.
--
-- A correcao: no momento em que uma conta e marcada como temporaria, guarda-se
-- uma impressao (sha256) do hash da palavra-passe em auth.users. A funcao de
-- limpar recusa enquanto a palavra-passe atual tiver essa mesma impressao.
--
-- Depende de uma ordem que a app ja cumpre (app/admin/actions.ts): tanto criar
-- conta como repor a palavra-passe mudam PRIMEIRO a palavra-passe em auth.users e
-- SO DEPOIS marcam a conta. Quando a marca e posta, a palavra-passe e ja a
-- temporaria.
--
-- As impressoes vivem num schema proprio, fora dos que a API expoe: nao ha
-- pedido que as leia ou escreva. RLS ligado e sem politicas nem permissoes, na
-- mesma, para nao depender so do schema.

create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;

create table if not exists privado.password_temporaria_marcas (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  impressao  text not null,
  marcada_em timestamptz not null default now()
);

alter table privado.password_temporaria_marcas enable row level security;
revoke all on table privado.password_temporaria_marcas from public, anon, authenticated;

-- Guarda a impressao sempre que a conta e marcada -- tambem quando ja estava
-- marcada (repor duas vezes seguidas): a impressao tem de ser a da ULTIMA
-- temporaria, senao a segunda ficava por proteger.
create or replace function public.guardar_marca_password()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into privado.password_temporaria_marcas (user_id, impressao)
  select new.user_id,
         encode(sha256(convert_to(coalesce(u.encrypted_password, ''), 'UTF8')), 'hex')
    from auth.users u
   where u.id = new.user_id
  on conflict (user_id) do update
    set impressao = excluded.impressao, marcada_em = now();
  return null;
end;
$$;

revoke execute on function public.guardar_marca_password() from public, anon, authenticated;

drop trigger if exists account_state_marca_password on public.account_state;
create trigger account_state_marca_password
  after insert or update of password_temporaria on public.account_state
  for each row when (new.password_temporaria)
  execute function public.guardar_marca_password();

-- So limpa a marca se a palavra-passe ja nao for a temporaria.
create or replace function public.limpar_password_temporaria()
returns void language plpgsql security definer set search_path = '' as $$
declare
  atual   text;
  marcada text;
begin
  if auth.uid() is null then
    raise exception 'sem sessao iniciada';
  end if;

  select encode(sha256(convert_to(coalesce(u.encrypted_password, ''), 'UTF8')), 'hex')
    into atual
    from auth.users u
   where u.id = auth.uid();

  select m.impressao
    into marcada
    from privado.password_temporaria_marcas m
   where m.user_id = auth.uid();

  if marcada is not null and atual = marcada then
    raise exception 'A palavra-passe ainda é a temporária.' using errcode = 'P0001';
  end if;

  update public.account_state set password_temporaria = false where user_id = auth.uid();
  delete from privado.password_temporaria_marcas where user_id = auth.uid();
end;
$$;

revoke execute on function public.limpar_password_temporaria() from public, anon;
grant execute on function public.limpar_password_temporaria() to authenticated;

-- Contas ja marcadas antes desta migracao: ainda nao mudaram a palavra-passe
-- (se tivessem mudado, a marca tinha sido limpa), por isso a atual e a
-- temporaria.
insert into privado.password_temporaria_marcas (user_id, impressao)
select a.user_id,
       encode(sha256(convert_to(coalesce(u.encrypted_password, ''), 'UTF8')), 'hex')
  from public.account_state a
  join auth.users u on u.id = a.user_id
 where a.password_temporaria
on conflict (user_id) do nothing;
