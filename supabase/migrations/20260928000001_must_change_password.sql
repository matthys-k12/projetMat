-- =====================================================================
-- IT Request Manager — 0004 : gestion des comptes par l'administration
--
-- Pas d'inscription libre : l'administrateur crée les comptes avec un mot de
-- passe temporaire. Ce drapeau oblige l'utilisateur à le remplacer à sa
-- première connexion ; l'administrateur ne connaît donc jamais le mot de passe
-- définitif (l'audit reste attribuable à la bonne personne).
--
-- Les comptes existants ne sont pas concernés (default false).
-- =====================================================================

alter table public.profiles
  add column must_change_password boolean not null default false;

comment on column public.profiles.must_change_password is
  'Vrai tant que l''utilisateur n''a pas remplacé le mot de passe temporaire fourni par l''administrateur.';
