-- Registos diarios de medidas antropometricas.
--
-- A chave primaria e (user_id, date): um registo por pessoa por dia. Regravar
-- o mesmo dia corrige o registo em vez de criar um duplicado, e o upsert da
-- aplicacao apoia-se exatamente nesta chave.
create table if not exists public.entries (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  date        date        not null,

  -- Cada medida e null enquanto nao for feita. null nao e zero: zero seria uma
  -- leitura, a ausencia de leitura nao e.
  peso        real,
  abdomen     real,
  gordura     real,
  musculo     real,
  peito       real,
  anca        real,
  braco       real,
  coxa        real,

  nota        text,
  updated_at  timestamptz not null default now(),

  primary key (user_id, date)
);

-- Os graficos leem sempre uma janela de datas de uma pessoa, por esta ordem.
create index if not exists entries_user_date_idx
  on public.entries (user_id, date desc);

-- ---------------------------------------------------------------------------
-- Seguranca ao nivel da linha
-- ---------------------------------------------------------------------------
-- Isto nao e opcional. A chave anonima da Supabase e publica por desenho: vai
-- no browser e qualquer pessoa a consegue ler. O que impede alguem autenticado
-- de ler as medidas de outra pessoa nao e a aplicacao -- e a base de dados.
-- Sem as politicas abaixo, esta tabela fica legivel por qualquer utilizador
-- registado, e estes sao dados de saude.
alter table public.entries enable row level security;

-- Politicas separadas por operacao, e nao uma unica "for all": assim uma delas
-- pode ser afrouxada no futuro sem arrastar as outras por engano.
drop policy if exists "entries_select_own" on public.entries;
create policy "entries_select_own"
  on public.entries for select
  using (auth.uid() = user_id);

drop policy if exists "entries_insert_own" on public.entries;
create policy "entries_insert_own"
  on public.entries for insert
  with check (auth.uid() = user_id);

-- "using" decide que linhas se podem alterar; "with check" impede que a
-- alteracao passe a linha para outra pessoa. Sao precisas as duas.
drop policy if exists "entries_update_own" on public.entries;
create policy "entries_update_own"
  on public.entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "entries_delete_own" on public.entries;
create policy "entries_delete_own"
  on public.entries for delete
  using (auth.uid() = user_id);

-- updated_at e escrito pela base de dados, nao pelo cliente: um relogio mal
-- acertado no telemovel nao pode inventar a hora de gravacao.
--
-- security invoker, nao definer: a funcao corre em nome de quem faz o insert e
-- so toca na linha que essa pessoa ja pode escrever. Como SECURITY DEFINER
-- ficaria exposta na API REST em /rest/v1/rpc/, chamavel por qualquer
-- visitante -- superficie de ataque sem beneficio nenhum.
create or replace function public.entries_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- O trigger continua a correr: o Postgres verifica o privilegio EXECUTE quando
-- o trigger e criado, nao a cada disparo. Tirar o EXECUTE so fecha a porta da
-- API REST.
revoke execute on function public.entries_touch_updated_at() from public;
revoke execute on function public.entries_touch_updated_at() from anon;
revoke execute on function public.entries_touch_updated_at() from authenticated;

drop trigger if exists entries_touch_updated_at on public.entries;
create trigger entries_touch_updated_at
  before insert or update on public.entries
  for each row execute function public.entries_touch_updated_at();
