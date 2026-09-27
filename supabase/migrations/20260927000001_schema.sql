-- =====================================================================
-- IT Request Manager — 0001 : schéma (types, tables, contraintes, index)
-- =====================================================================

-- ---------- Types ----------
create type public.user_role as enum ('USER', 'ADMIN');
create type public.request_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'FULFILLED');
create type public.notification_type as enum ('REQUEST_APPROVED', 'REQUEST_REJECTED', 'REQUEST_FULFILLED');

-- ---------- Utilitaire : updated_at automatique ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- Référence lisible et sûre en concurrence ----------
-- Une SEQUENCE ne distribue jamais deux fois la même valeur, même sous forte concurrence
-- (contrairement à COUNT(*) + 1). Des trous sont possibles en cas de rollback : c'est voulu.
create sequence public.request_reference_seq start 1;

create or replace function public.generate_request_reference()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'REQ-' || to_char(now(), 'YYYY') || '-'
         || lpad(nextval('public.request_reference_seq')::text, 6, '0');
$$;

-- ---------- profiles (1-1 avec auth.users) ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  first_name  text not null check (char_length(first_name) between 1 and 100),
  last_name   text not null default '' check (char_length(last_name) <= 100),
  email       text not null unique,
  role        public.user_role not null default 'USER',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- categories ----------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(trim(name)) between 2 and 100),
  description text check (char_length(description) <= 500),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- materials ----------
create table public.materials (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null check (char_length(trim(name)) between 2 and 150),
  description        text check (char_length(description) <= 2000),
  category_id        uuid not null references public.categories (id) on delete restrict,
  image_path         text,
  total_quantity     integer not null default 0 check (total_quantity >= 0),
  available_quantity integer not null default 0 check (available_quantity >= 0),
  minimum_stock      integer not null default 0 check (minimum_stock >= 0),
  -- Colonne générée : filtrable directement via supabase-js (.eq('is_low_stock', true))
  is_low_stock       boolean generated always as (available_quantity <= minimum_stock) stored,
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint materials_available_lte_total check (available_quantity <= total_quantity)
);

-- ---------- requests ----------
create table public.requests (
  id            uuid primary key default gen_random_uuid(),
  reference     text not null unique default public.generate_request_reference(),
  user_id       uuid not null references public.profiles (id) on delete restrict,
  reason        text not null check (char_length(trim(reason)) between 10 and 1000),
  status        public.request_status not null default 'PENDING',
  admin_comment text check (char_length(admin_comment) <= 1000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Un refus doit toujours être motivé
  constraint requests_rejected_needs_comment
    check (status <> 'REJECTED' or (admin_comment is not null and char_length(trim(admin_comment)) > 0))
);

-- ---------- request_items ----------
create table public.request_items (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.requests (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete restrict,
  quantity    integer not null check (quantity > 0),
  created_at  timestamptz not null default now(),
  constraint request_items_unique_material unique (request_id, material_id)
);

-- ---------- request_status_history ----------
create table public.request_status_history (
  id              uuid primary key default gen_random_uuid(),
  request_id      uuid not null references public.requests (id) on delete cascade,
  previous_status public.request_status,
  new_status      public.request_status not null,
  changed_by      uuid references public.profiles (id) on delete set null,
  comment         text,
  created_at      timestamptz not null default now()
);

-- ---------- notifications ----------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  request_id uuid references public.requests (id) on delete cascade,
  title      text not null,
  message    text not null,
  type       public.notification_type not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- audit_logs ----------
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ---------- Index ----------
create index requests_user_id_idx            on public.requests (user_id);
create index requests_status_idx             on public.requests (status);
create index requests_created_at_idx         on public.requests (created_at desc);
-- requests.reference : index créé par la contrainte UNIQUE
create index request_items_material_id_idx   on public.request_items (material_id);
create index status_history_request_idx      on public.request_status_history (request_id, created_at);
create index materials_category_id_idx       on public.materials (category_id);
create index materials_name_lower_idx        on public.materials (lower(name));
create index materials_active_idx            on public.materials (active);
create index notifications_user_id_idx       on public.notifications (user_id, created_at desc);
create index notifications_unread_idx        on public.notifications (user_id) where read_at is null;
create index audit_logs_created_at_idx       on public.audit_logs (created_at desc);
create index audit_logs_entity_idx           on public.audit_logs (entity_type, entity_id);

-- ---------- Triggers updated_at ----------
create trigger profiles_set_updated_at   before update on public.profiles   for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger materials_set_updated_at  before update on public.materials  for each row execute function public.set_updated_at();
create trigger requests_set_updated_at   before update on public.requests   for each row execute function public.set_updated_at();

-- ---------- Création automatique du profil à l'inscription ----------
-- Le rôle est TOUJOURS 'USER' à la création : jamais lu depuis user_metadata (modifiable par l'utilisateur).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''), 'Utilisateur'),
    coalesce(trim(new.raw_user_meta_data ->> 'last_name'), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
