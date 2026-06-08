-- Migration 001 : ajout du niveau imposé sur les tokens
-- À exécuter dans le SQL Editor de Supabase

alter table public.tokens
  add column if not exists level text
    check (level in ('college', 'lycee', 'bac', 'bac_plus'));
