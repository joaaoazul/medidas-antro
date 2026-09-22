-- Objetivos por metrica.
-- Aplicado no projeto em 2026-09-22 (versao 20260922212515).
--
-- O peso pretendido continua em `objetivo_peso`: o onboarding escreve-o, tem a
-- sua restricao de intervalo, e mexer-lhe obrigava a migrar dados sem ganho
-- nenhum. As outras metricas ganham uma coluna `objetivos`, um objeto
-- { "abdomen": 85, "gordura": 18, ... }. No codigo e um mapa unico por metrica.
--
-- Nao precisa de politicas novas: a coluna e da tabela `profiles`, que ja tem
-- RLS e as politicas de select, insert e update da propria pessoa.
--
-- O codigo funciona antes e depois disto ser aplicado. Antes, a coluna e lida
-- a parte, o erro de coluna inexistente (42703) e tratado como "funcionalidade
-- ainda nao disponivel", e as definicoes nao mostram os campos novos. Depois,
-- aparecem. A ordem do deploy nao importa.
--
-- Os intervalos de cada metrica validam-se na aplicacao, com os limites de
-- lib/metrics.ts; aqui so se garante que e um objeto.

alter table public.profiles
  add column if not exists objetivos jsonb not null default '{}'::jsonb;

alter table public.profiles
  drop constraint if exists profiles_objetivos_objeto;
alter table public.profiles
  add constraint profiles_objetivos_objeto
  check (jsonb_typeof(objetivos) = 'object');
