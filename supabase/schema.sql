-- ============================================================
-- MATHOS — Schéma Supabase
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ============================================================

-- Extension pour UUID
create extension if not exists "pgcrypto";

-- ─── Profils utilisateurs ─────────────────────────────────────────────────────
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  first_name  text not null default '',
  role        text not null default 'candidate'  -- 'candidate' | 'recruiter' | 'admin'
                check (role in ('candidate', 'recruiter', 'admin')),
  study_level text,
  class_rating  text check (class_rating  in ('bon', 'moyen', 'faible')),
  school_rating text check (school_rating in ('bon', 'moyen', 'faible')),
  created_at  timestamptz default now()
);

-- RLS : chaque utilisateur voit seulement son propre profil
-- (les admins voient tout via service_role)
alter table public.users enable row level security;

create policy "users_self" on public.users
  for all using (auth.uid() = id);

-- ─── Tokens officiels ─────────────────────────────────────────────────────────
create table public.tokens (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,          -- code à 8 caractères alphanumériques
  generated_by  uuid references public.users(id),   -- admin ou recruteur
  used_by       uuid references public.users(id),   -- candidat
  supervised    boolean not null default false,      -- true = token recruteur supervisé
  expires_at    timestamptz not null,
  used_at       timestamptz,
  created_at    timestamptz default now()
);

alter table public.tokens enable row level security;

-- Les candidats peuvent lire un token par son code (pour le valider)
create policy "tokens_read_by_code" on public.tokens
  for select using (true);

-- Seuls les admins/recruteurs peuvent créer des tokens (via service_role côté API)
create policy "tokens_insert_admin" on public.tokens
  for insert with check (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'recruiter'))
  );

-- ─── Résultats officiels ──────────────────────────────────────────────────────
create table public.official_results (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id),
  token_id         uuid not null references public.tokens(id),
  -- Identité snapshot (au cas où l'utilisateur change son nom)
  candidate_name   text not null,
  candidate_email  text not null,
  -- Résultats
  score            integer not null,
  max_score        integer not null,
  theme_scores     jsonb not null default '{}',
  questions_count  integer not null,
  duration_seconds integer,                   -- durée réelle en secondes
  study_level      text,
  -- Métadonnées
  supervised       boolean not null default false,
  hash             text not null,             -- SHA-256 pour vérification d'intégrité
  pdf_url          text,                      -- URL du PDF stocké sur Supabase Storage
  -- Horodatage
  started_at       timestamptz,
  completed_at     timestamptz default now()
);

alter table public.official_results enable row level security;

-- Le candidat voit ses propres résultats
create policy "official_results_owner" on public.official_results
  for select using (auth.uid() = user_id);

-- Les recruteurs voient tout (via service_role en API)

-- ─── Résultats non officiels (entraînement + grand test libre) ────────────────
create table public.quiz_results (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.users(id),   -- null si anonyme
  mode         text not null check (mode in ('grand_test', 'entrainement')),
  score        integer not null,
  max_score    integer not null,
  theme_scores jsonb not null default '{}',
  questions_count integer not null,
  study_level  text,
  training_theme text,
  training_level text,
  completed_at timestamptz default now()
);

alter table public.quiz_results enable row level security;

create policy "quiz_results_owner" on public.quiz_results
  for select using (auth.uid() = user_id);

create policy "quiz_results_insert" on public.quiz_results
  for insert with check (auth.uid() = user_id or user_id is null);

-- ─── Invitations recruteurs ───────────────────────────────────────────────────
create table public.recruiter_invitations (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique,
  invited_by   uuid references public.users(id),
  invite_code  text not null unique default encode(gen_random_bytes(16), 'hex'),
  accepted_at  timestamptz,
  created_at   timestamptz default now()
);

alter table public.recruiter_invitations enable row level security;

-- Seuls les admins gèrent les invitations (via service_role)

-- ─── Trigger : créer un profil à l'inscription ───────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, first_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'candidate')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Vue : stats agrégées par utilisateur (pour admin) ───────────────────────
create or replace view public.user_stats as
  select
    u.id,
    u.email,
    u.first_name,
    u.role,
    u.study_level,
    u.created_at,
    count(distinct qr.id)   as total_sessions,
    count(distinct or2.id)  as total_official,
    max(or2.completed_at)   as last_official_at
  from public.users u
  left join public.quiz_results qr on qr.user_id = u.id
  left join public.official_results or2 on or2.user_id = u.id
  group by u.id;
