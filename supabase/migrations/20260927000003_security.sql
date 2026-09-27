-- =====================================================================
-- IT Request Manager — 0003 : sécurité
--
-- Choix : "deny all" pour anon et authenticated.
--   Le navigateur n'accède JAMAIS directement aux données métier (ni via
--   PostgREST, ni via RPC). Toute lecture/écriture passe par l'API NestJS,
--   qui utilise la service_role après avoir vérifié le token et le rôle.
--   Si la clé anon fuite, elle ne donne accès à rien.
-- =====================================================================

alter table public.profiles               enable row level security;
alter table public.categories             enable row level security;
alter table public.materials              enable row level security;
alter table public.requests               enable row level security;
alter table public.request_items          enable row level security;
alter table public.request_status_history enable row level security;
alter table public.notifications          enable row level security;
alter table public.audit_logs             enable row level security;
-- Aucune policy volontairement : RLS actif sans policy = aucun accès pour anon/authenticated.

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Fonctions : exécutables uniquement par le backend
revoke execute on all functions in schema public from public, anon, authenticated;
grant  execute on all functions in schema public to service_role;

-- Idem pour les fonctions créées plus tard
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- ---------- Storage : images des matériels ----------
-- Bucket public en lecture (images non sensibles) ; l'upload se fait uniquement
-- via l'API avec la service_role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('materials', 'materials', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
