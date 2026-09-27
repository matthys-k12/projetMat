-- =====================================================================
-- IT Request Manager — 0002 : fonctions métier transactionnelles (RPC)
--
-- Pourquoi des fonctions PostgreSQL ?
--   supabase-js n'offre pas de transaction multi-requêtes. Une fonction PL/pgSQL
--   s'exécute dans UNE transaction : soit tout est validé (stock, statut,
--   historique, notification, audit), soit tout est annulé (ROLLBACK automatique
--   à la moindre exception).
--
-- Contrat d'erreur : exception dont le MESSAGE est un code métier stable
--   (INSUFFICIENT_STOCK, INVALID_TRANSITION...) et le DETAIL un contexte lisible.
--   L'API NestJS mappe ces codes en statuts HTTP.
--
-- Sécurité : ces fonctions ne sont exécutables que par service_role (cf. 0003).
--   Le backend vérifie identité + rôle ; les fonctions revérifient (défense en profondeur).
-- =====================================================================

-- ---------- Helpers internes ----------

create or replace function public._assert_admin(p_admin_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = p_admin_id and role = 'ADMIN' and active
  ) then
    raise exception 'FORBIDDEN' using detail = 'Action réservée aux administrateurs actifs.';
  end if;
end;
$$;

-- Verrouille la demande et vérifie la transition autorisée (machine d'état centralisée)
create or replace function public._lock_request_for_transition(
  p_request_id uuid,
  p_target     public.request_status
)
returns public.requests
language plpgsql
set search_path = ''
as $$
declare
  v_request public.requests;
begin
  select * into v_request
  from public.requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'REQUEST_NOT_FOUND' using detail = 'Demande introuvable.';
  end if;

  if not (
       (v_request.status = 'PENDING'  and p_target in ('APPROVED', 'REJECTED', 'CANCELLED'))
    or (v_request.status = 'APPROVED' and p_target = 'FULFILLED')
  ) then
    raise exception 'INVALID_TRANSITION'
      using detail = format('Transition %s -> %s interdite.', v_request.status, p_target);
  end if;

  return v_request;
end;
$$;

create or replace function public._record_transition(
  p_request   public.requests,
  p_new       public.request_status,
  p_actor_id  uuid,
  p_comment   text,
  p_action    text,
  p_metadata  jsonb default '{}'::jsonb
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.request_status_history (request_id, previous_status, new_status, changed_by, comment)
  values (p_request.id, p_request.status, p_new, p_actor_id, p_comment);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    p_actor_id, p_action, 'request', p_request.id,
    jsonb_build_object('reference', p_request.reference, 'from', p_request.status, 'to', p_new) || p_metadata
  );
end;
$$;

create or replace function public._notify(
  p_request public.requests,
  p_type    public.notification_type,
  p_title   text,
  p_message text
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, request_id, title, message, type)
  values (p_request.user_id, p_request.id, p_title, p_message, p_type);
end;
$$;

-- ---------- create_request ----------
-- p_items : [{"material_id": "uuid", "quantity": 2}, ...]
create or replace function public.create_request(
  p_user_id uuid,
  p_reason  text,
  p_items   jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_request_id uuid;
  v_reference  text;
  v_count      integer;
  v_distinct   integer;
  v_bad        record;
begin
  if not exists (select 1 from public.profiles where id = p_user_id and active) then
    raise exception 'USER_NOT_ALLOWED' using detail = 'Compte inexistant ou désactivé.';
  end if;

  if p_reason is null or char_length(trim(p_reason)) not between 10 and 1000 then
    raise exception 'INVALID_REASON' using detail = 'Le motif doit contenir entre 10 et 1000 caractères.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_REQUEST' using detail = 'La demande doit contenir au moins un matériel.';
  end if;

  if exists (
    select 1 from jsonb_to_recordset(p_items) as x(material_id uuid, quantity integer)
    where x.material_id is null or x.quantity is null or x.quantity < 1
  ) then
    raise exception 'INVALID_QUANTITY' using detail = 'Chaque article doit avoir un matériel et une quantité >= 1.';
  end if;

  select count(*), count(distinct x.material_id) into v_count, v_distinct
  from jsonb_to_recordset(p_items) as x(material_id uuid, quantity integer);

  if v_count <> v_distinct then
    raise exception 'DUPLICATE_MATERIAL' using detail = 'Un même matériel apparaît plusieurs fois.';
  end if;

  -- Contrôle "souple" (sans verrou) : on refuse une demande manifestement impossible.
  -- Le contrôle "dur" a lieu à l'approbation, sous verrou.
  select x.material_id, m.name, m.active, m.available_quantity, x.quantity
    into v_bad
  from jsonb_to_recordset(p_items) as x(material_id uuid, quantity integer)
  left join public.materials m on m.id = x.material_id
  left join public.categories c on c.id = m.category_id
  where m.id is null or not m.active or not c.active or x.quantity > m.available_quantity
  limit 1;

  if found then
    if v_bad.name is null or not v_bad.active then
      raise exception 'MATERIAL_UNAVAILABLE'
        using detail = format('Matériel %s indisponible.', coalesce(v_bad.name, v_bad.material_id::text));
    end if;
    raise exception 'INSUFFICIENT_STOCK'
      using detail = format('%s : demandé %s, disponible %s.', v_bad.name, v_bad.quantity, v_bad.available_quantity);
  end if;

  insert into public.requests (user_id, reason)
  values (p_user_id, trim(p_reason))
  returning id, reference into v_request_id, v_reference;

  insert into public.request_items (request_id, material_id, quantity)
  select v_request_id, x.material_id, x.quantity
  from jsonb_to_recordset(p_items) as x(material_id uuid, quantity integer);

  insert into public.request_status_history (request_id, previous_status, new_status, changed_by)
  values (v_request_id, null, 'PENDING', p_user_id);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (p_user_id, 'REQUEST_CREATED', 'request', v_request_id,
          jsonb_build_object('reference', v_reference, 'items', p_items));

  return v_request_id;
end;
$$;

-- ---------- approve_request (opération critique) ----------
create or replace function public.approve_request(
  p_request_id uuid,
  p_admin_id   uuid,
  p_comment    text default null
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_request public.requests;
  v_bad     record;
  v_items   jsonb;
begin
  perform public._assert_admin(p_admin_id);

  -- 1. Verrou sur la demande + vérification de la transition
  v_request := public._lock_request_for_transition(p_request_id, 'APPROVED');

  -- 2. Verrou sur les lignes de stock concernées (ordre déterministe => pas d'interblocage)
  perform 1
  from public.materials m
  where m.id in (select ri.material_id from public.request_items ri where ri.request_id = p_request_id)
  order by m.id
  for update;

  -- 3. Vérification du stock sous verrou
  select m.name, m.active, m.available_quantity, ri.quantity
    into v_bad
  from public.request_items ri
  join public.materials m on m.id = ri.material_id
  where ri.request_id = p_request_id
    and (not m.active or ri.quantity > m.available_quantity)
  limit 1;

  if found then
    if not v_bad.active then
      raise exception 'MATERIAL_UNAVAILABLE' using detail = format('%s est désactivé.', v_bad.name);
    end if;
    raise exception 'INSUFFICIENT_STOCK'
      using detail = format('%s : demandé %s, disponible %s.', v_bad.name, v_bad.quantity, v_bad.available_quantity);
  end if;

  -- 4. Décrément du stock (la contrainte CHECK empêche de toute façon un stock négatif)
  update public.materials m
  set available_quantity = m.available_quantity - ri.quantity
  from public.request_items ri
  where ri.request_id = p_request_id
    and ri.material_id = m.id;

  -- 5. Statut
  update public.requests
  set status = 'APPROVED',
      admin_comment = nullif(trim(p_comment), '')
  where id = p_request_id;

  -- 6. Historique + audit + notification
  select jsonb_agg(jsonb_build_object('material_id', material_id, 'quantity', quantity))
    into v_items
  from public.request_items where request_id = p_request_id;

  perform public._record_transition(v_request, 'APPROVED', p_admin_id, p_comment,
                                    'REQUEST_APPROVED', jsonb_build_object('stock_decrement', v_items));

  perform public._notify(v_request, 'REQUEST_APPROVED', 'Demande approuvée',
                         format('Votre demande %s a été approuvée.', v_request.reference));
end;
$$;

-- ---------- reject_request ----------
create or replace function public.reject_request(
  p_request_id uuid,
  p_admin_id   uuid,
  p_comment    text
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_request public.requests;
begin
  perform public._assert_admin(p_admin_id);

  if p_comment is null or char_length(trim(p_comment)) = 0 then
    raise exception 'INVALID_COMMENT' using detail = 'Le motif du refus est obligatoire.';
  end if;

  v_request := public._lock_request_for_transition(p_request_id, 'REJECTED');

  update public.requests
  set status = 'REJECTED', admin_comment = trim(p_comment)
  where id = p_request_id;

  perform public._record_transition(v_request, 'REJECTED', p_admin_id, p_comment, 'REQUEST_REJECTED');
  perform public._notify(v_request, 'REQUEST_REJECTED', 'Demande refusée',
                         format('Votre demande %s a été refusée : %s', v_request.reference, trim(p_comment)));
end;
$$;

-- ---------- cancel_request (par le demandeur) ----------
create or replace function public.cancel_request(
  p_request_id uuid,
  p_user_id    uuid
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_request public.requests;
begin
  -- Une demande d'un autre utilisateur est traitée comme introuvable (pas de fuite d'information)
  if not exists (select 1 from public.requests where id = p_request_id and user_id = p_user_id) then
    raise exception 'REQUEST_NOT_FOUND' using detail = 'Demande introuvable.';
  end if;

  v_request := public._lock_request_for_transition(p_request_id, 'CANCELLED');

  update public.requests set status = 'CANCELLED' where id = p_request_id;

  perform public._record_transition(v_request, 'CANCELLED', p_user_id, null, 'REQUEST_CANCELLED');
end;
$$;

-- ---------- fulfill_request (matériel remis) ----------
create or replace function public.fulfill_request(
  p_request_id uuid,
  p_admin_id   uuid
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_request public.requests;
begin
  perform public._assert_admin(p_admin_id);

  v_request := public._lock_request_for_transition(p_request_id, 'FULFILLED');

  update public.requests set status = 'FULFILLED' where id = p_request_id;

  perform public._record_transition(v_request, 'FULFILLED', p_admin_id, null, 'REQUEST_FULFILLED');
  perform public._notify(v_request, 'REQUEST_FULFILLED', 'Matériel remis',
                         format('Le matériel de votre demande %s vous a été remis.', v_request.reference));
end;
$$;

-- ---------- Statistiques ----------
create or replace function public.get_user_dashboard_stats(p_user_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'total',     count(*),
    'pending',   count(*) filter (where status = 'PENDING'),
    'approved',  count(*) filter (where status = 'APPROVED'),
    'rejected',  count(*) filter (where status = 'REJECTED'),
    'cancelled', count(*) filter (where status = 'CANCELLED'),
    'fulfilled', count(*) filter (where status = 'FULFILLED')
  )
  from public.requests
  where user_id = p_user_id;
$$;

create or replace function public.get_admin_dashboard_stats()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'pending',  (select count(*) from public.requests where status = 'PENDING'),
    'today',    (select count(*) from public.requests where created_at >= date_trunc('day', now())),
    'approved', (select count(*) from public.requests where status = 'APPROVED'),
    'rejected', (select count(*) from public.requests where status = 'REJECTED'),
    'fulfilled',(select count(*) from public.requests where status = 'FULFILLED'),
    'activeMaterials',   (select count(*) from public.materials where active),
    'lowStockMaterials', (select count(*) from public.materials where active and is_low_stock),
    'byStatus', (
      select coalesce(jsonb_object_agg(status, cnt), '{}'::jsonb)
      from (select status, count(*) as cnt from public.requests group by status) s
    ),
    'last14Days', (
      select jsonb_agg(jsonb_build_object('date', d.day, 'count', coalesce(c.cnt, 0)) order by d.day)
      from (
        select gs::date as day
        from generate_series((current_date - 13)::timestamp, current_date::timestamp, interval '1 day') gs
      ) d
      left join (
        select created_at::date as day, count(*) as cnt
        from public.requests
        where created_at >= current_date - 13
        group by 1
      ) c on c.day = d.day
    ),
    'topMaterials', (
      select coalesce(jsonb_agg(t), '[]'::jsonb)
      from (
        select m.id, m.name, sum(ri.quantity)::int as "totalRequested"
        from public.request_items ri
        join public.materials m on m.id = ri.material_id
        group by m.id, m.name
        order by 3 desc
        limit 5
      ) t
    )
  );
$$;
