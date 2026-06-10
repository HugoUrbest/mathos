-- 002_exam_sessions.sql
-- Sessions d'examen : permettent un scoring 100 % côté serveur.
-- Le serveur tire les 50 questions, stocke leurs IDs, et c'est lui (et lui seul)
-- qui corrige à la soumission. Le navigateur ne reçoit jamais les bonnes réponses.

create table if not exists public.exam_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id),
  token_id      uuid not null references public.tokens(id),
  token_code    text not null,
  level         text,                         -- niveau de l'examen (imposé ou choisi)
  study_level   text,                         -- niveau d'études déclaré du candidat
  question_ids  integer[] not null,           -- les 50 IDs tirés (ordre = ordre d'affichage)
  tab_warnings  integer not null default 0,   -- sorties de fenêtre détectées
  started_at    timestamptz not null default now(),
  expires_at    timestamptz not null,         -- started_at + 50 min + marge
  submitted_at  timestamptz,                  -- null tant que non soumis
  result_id     uuid references public.official_results(id)
);

alter table public.exam_sessions enable row level security;

-- Le candidat peut consulter ses propres sessions.
-- Toutes les écritures passent par le service_role (API) : pas de policy insert/update publique.
create policy "exam_sessions_owner" on public.exam_sessions
  for select using (auth.uid() = user_id);

create index if not exists exam_sessions_user_idx on public.exam_sessions(user_id);
create index if not exists exam_sessions_token_idx on public.exam_sessions(token_id);
