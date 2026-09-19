-- Varias medicoes por dia.
--
-- A chave primaria era (user_id, date), o que impunha um registo por dia:
-- pesar-se de manha e a noite obrigava a substituir a medicao da manha. Passa a
-- haver uma chave propria por medicao, e a data deixa de ser unica.
--
-- A data continua a ser um dia de calendario (`date`) e a hora fica a parte, em
-- vez de um unico timestamptz. E deliberado: com timestamptz, uma pesagem as
-- 23:30 em Lisboa cai no dia seguinte em UTC, e o grafico passava a mostrar a
-- medicao no dia errado. Um dia de calendario nao tem esse problema, e a hora
-- e opcional para quem nao a quer registar.

alter table public.entries drop constraint if exists entries_pkey;

alter table public.entries
  add column if not exists id uuid not null default gen_random_uuid(),
  add column if not exists hora time;

alter table public.entries add primary key (id);

-- Impede duplicados exatos quando ha hora: gravar duas vezes a medicao das
-- 08:00 do mesmo dia e quase sempre um engano. Sem hora, o Postgres trata cada
-- NULL como distinto, e varias medicoes sem hora no mesmo dia continuam a
-- poder existir -- que e precisamente o caso de uso.
create unique index if not exists entries_user_date_hora_uidx
  on public.entries (user_id, date, hora);

drop index if exists entries_user_date_idx;
create index if not exists entries_user_date_hora_idx
  on public.entries (user_id, date desc, hora desc);
