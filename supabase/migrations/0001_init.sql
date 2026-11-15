-- ProjectBlack · schema iniziale
-- Il menù è un documento JSON per locale: `draft` (in lavorazione) e `published` (snapshot online).
-- La pagina pubblica legge solo tramite public_menu(), quindi le bozze non sono mai esposte.

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  name text not null,
  status text not null default 'prova' check (status in ('attivo', 'prova', 'sospeso')),
  trial_ends timestamptz,
  draft jsonb not null,
  published jsonb,
  published_at timestamptz,
  sold_out jsonb not null default '[]'::jsonb,
  last_access timestamptz,
  created_at timestamptz not null default now()
);

create table public.members (
  venue_id uuid not null references public.venues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('titolare', 'staff')),
  primary key (venue_id, user_id)
);

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table public.versions (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  created_at timestamptz not null default now(),
  author text not null default '',
  doc jsonb not null
);
create index versions_venue_idx on public.versions (venue_id, created_at desc);

create table public.activity (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  actor text not null default '',
  venue text not null default '',
  action text not null
);

-- ---------- helper di autorizzazione ----------

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
$$;

create function public.member_role(p_venue uuid) returns text
language sql stable security definer set search_path = '' as $$
  select m.role from public.members m where m.venue_id = p_venue and m.user_id = (select auth.uid())
$$;

-- ---------- RLS ----------

alter table public.venues enable row level security;
alter table public.members enable row level security;
alter table public.admins enable row level security;
alter table public.versions enable row level security;
alter table public.activity enable row level security;

create policy venues_select on public.venues for select to authenticated
  using (public.is_admin() or public.member_role(id) is not null);
create policy venues_insert on public.venues for insert to authenticated
  with check (public.is_admin());
create policy venues_update on public.venues for update to authenticated
  using (public.is_admin() or public.member_role(id) = 'titolare')
  with check (public.is_admin() or public.member_role(id) = 'titolare');
create policy venues_delete on public.venues for delete to authenticated
  using (public.is_admin());

create policy members_select on public.members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy members_write on public.members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy admins_select on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

create policy versions_select on public.versions for select to authenticated
  using (public.is_admin() or public.member_role(venue_id) = 'titolare');

create policy activity_select on public.activity for select to authenticated
  using (public.is_admin());
create policy activity_insert on public.activity for insert to authenticated
  with check (true);

-- Privilegi di colonna: dal client si può scrivere solo la bozza e il nome.
-- Stato, pubblicazione ed esauriti passano dalle funzioni qui sotto.
revoke all on public.venues from anon, authenticated;
grant select, delete on public.venues to authenticated;
grant insert (slug, name, status, trial_ends, draft) on public.venues to authenticated;
grant update (draft, name) on public.venues to authenticated;

revoke all on public.members, public.admins, public.versions, public.activity from anon;
grant select, insert, update, delete on public.members to authenticated;
grant select on public.admins, public.versions to authenticated;
grant select, insert on public.activity to authenticated;

-- ---------- funzioni ----------

-- Lettura pubblica: uno snapshot per scansione.
create function public.public_menu(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select case
    when v.status = 'sospeso' then jsonb_build_object('state', 'sospeso', 'name', v.name,
      'phone', coalesce(v.published, v.draft) #>> '{info,phone}', 'address', coalesce(v.published, v.draft) #>> '{info,address}')
    when v.published is null then jsonb_build_object('state', 'non-pubblicato', 'name', v.name,
      'phone', v.draft #>> '{info,phone}', 'address', v.draft #>> '{info,address}')
    else jsonb_build_object('state', 'ok', 'name', v.name, 'doc', v.published, 'soldOut', v.sold_out)
  end
  from public.venues v where v.slug = p_slug
$$;

create function public.publish_menu(p_venue uuid, p_author text) returns public.venues
language plpgsql security definer set search_path = '' as $$
declare v public.venues;
begin
  -- coalesce: per chi non è membro member_role() è NULL, e un NULL nell'if lascerebbe passare
  if not coalesce(public.is_admin() or public.member_role(p_venue) = 'titolare', false) then
    raise exception 'Non autorizzato' using errcode = '42501';
  end if;
  update public.venues set published = draft, published_at = now() where id = p_venue returning * into v;
  insert into public.versions (venue_id, author, doc) values (p_venue, coalesce(p_author, ''), v.draft);
  delete from public.versions where venue_id = p_venue and id not in
    (select id from public.versions where venue_id = p_venue order by created_at desc limit 15);
  insert into public.activity (actor, venue, action) values (coalesce(p_author, ''), v.name, 'Menù pubblicato');
  return v;
end $$;

-- Esauriti: stato operativo, effetto immediato, consentito anche allo staff.
create function public.set_sold_out(p_venue uuid, p_ids jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not (public.is_admin() or public.member_role(p_venue) is not null) then
    raise exception 'Non autorizzato' using errcode = '42501';
  end if;
  if jsonb_typeof(p_ids) <> 'array' then raise exception 'Formato non valido'; end if;
  update public.venues set sold_out = p_ids where id = p_venue;
end $$;

create function public.set_venue_status(p_venue uuid, p_status text) returns public.venues
language plpgsql security definer set search_path = '' as $$
declare v public.venues;
begin
  if not public.is_admin() then raise exception 'Non autorizzato' using errcode = '42501'; end if;
  update public.venues set status = p_status,
    trial_ends = case when p_status = 'attivo' then null else trial_ends end
  where id = p_venue returning * into v;
  return v;
end $$;

create function public.touch_venue(p_venue uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.member_role(p_venue) is not null then
    update public.venues set last_access = now() where id = p_venue;
  end if;
end $$;

revoke execute on function public.is_admin(), public.member_role(uuid), public.publish_menu(uuid, text),
  public.set_sold_out(uuid, jsonb), public.set_venue_status(uuid, text), public.touch_venue(uuid) from public, anon;
grant execute on function public.is_admin(), public.member_role(uuid), public.publish_menu(uuid, text),
  public.set_sold_out(uuid, jsonb), public.set_venue_status(uuid, text), public.touch_venue(uuid) to authenticated;
revoke execute on function public.public_menu(text) from public;
grant execute on function public.public_menu(text) to anon, authenticated;
