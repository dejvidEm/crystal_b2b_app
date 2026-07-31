-- Crystal B2B Partner Portal — initial schema
-- Run in Supabase SQL Editor or via supabase db push

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('admin', 'partner');

create type public.request_status as enum (
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'rejected',
  'cancelled'
);

create type public.service_package as enum (
  'fleet_refresh',
  'fleet_interior_care',
  'vehicle_turnover'
);

create type public.time_window as enum (
  'morning',
  'afternoon',
  'flexible'
);

create type public.request_priority as enum (
  'standard',
  'priority'
);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_id text,
  billing_email text,
  phone text,
  service_address text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  role public.app_role not null default 'partner',
  full_name text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index profiles_organization_id_idx on public.profiles (organization_id);
create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create a basic partner profile on Auth signup.
-- Default role is ALWAYS partner — admin must be promoted explicitly via SQL.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, is_active)
  values (
    new.id,
    'partner',
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    true
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- service_requests
-- ---------------------------------------------------------------------------

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  created_by uuid not null references public.profiles (id) on delete restrict,
  requested_date date not null,
  time_window public.time_window not null,
  service_package public.service_package not null,
  priority public.request_priority not null default 'standard',
  vehicle_count integer not null check (vehicle_count >= 1),
  status public.request_status not null default 'pending',
  partner_note text,
  admin_note text,
  confirmed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index service_requests_org_date_idx
  on public.service_requests (organization_id, requested_date);

create index service_requests_status_date_idx
  on public.service_requests (status, requested_date);

create index service_requests_created_by_idx
  on public.service_requests (created_by);

create index service_requests_requested_date_idx
  on public.service_requests (requested_date);

create trigger service_requests_set_updated_at
before update on public.service_requests
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- request_vehicles
-- ---------------------------------------------------------------------------

create table public.request_vehicles (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests (id) on delete cascade,
  license_plate text not null,
  make_model text,
  internal_reference text,
  note text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint request_vehicles_license_plate_not_empty check (length(trim(license_plate)) > 0)
);

create index request_vehicles_request_sort_idx
  on public.request_vehicles (request_id, sort_order);

-- ---------------------------------------------------------------------------
-- Reference code generator: CRY-YYYY-NNNN
-- ---------------------------------------------------------------------------

create or replace function public.generate_reference_code()
returns text
language plpgsql
as $$
declare
  year_part text := to_char(timezone('Europe/Bratislava', now()), 'YYYY');
  seq integer;
  code text;
begin
  select coalesce(max(
    nullif(substring(reference_code from 'CRY-' || year_part || '-(\d+)'), '')::integer
  ), 0) + 1
  into seq
  from public.service_requests
  where reference_code like 'CRY-' || year_part || '-%';

  code := 'CRY-' || year_part || '-' || lpad(seq::text, 4, '0');
  return code;
end;
$$;

-- ---------------------------------------------------------------------------
-- Auth helpers (SECURITY DEFINER, locked search_path)
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  );
$$;

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.organization_id
  from public.profiles p
  where p.id = auth.uid()
    and p.is_active = true
  limit 1;
$$;

create or replace function public.is_active_partner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'partner'
      and p.is_active = true
      and p.organization_id is not null
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.current_organization_id() from public;
revoke all on function public.is_active_partner() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_organization_id() to authenticated;
grant execute on function public.is_active_partner() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.service_requests enable row level security;
alter table public.request_vehicles enable row level security;

-- organizations
create policy "organizations_select"
on public.organizations
for select
to authenticated
using (
  public.is_admin()
  or (id = public.current_organization_id() and is_active = true)
);

-- No insert/update/delete for browser clients — manage via SQL / dashboard

-- profiles
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  public.is_admin()
  or (id = auth.uid() and is_active = true)
);

create policy "profiles_update_own_limited"
on public.profiles
for update
to authenticated
using (id = auth.uid() and is_active = true)
with check (
  id = auth.uid()
  and is_active = true
  and role = (select p.role from public.profiles p where p.id = auth.uid())
  and organization_id is not distinct from (
    select p.organization_id from public.profiles p where p.id = auth.uid()
  )
);

-- service_requests
create policy "service_requests_select"
on public.service_requests
for select
to authenticated
using (
  public.is_admin()
  or organization_id = public.current_organization_id()
);

-- Partners must NOT insert directly — use create_service_request RPC
-- Admins must update status via update_request_status RPC (SECURITY DEFINER)

-- request_vehicles
create policy "request_vehicles_select"
on public.request_vehicles
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.service_requests sr
    where sr.id = request_vehicles.request_id
      and sr.organization_id = public.current_organization_id()
  )
);

-- ---------------------------------------------------------------------------
-- RPC: create_service_request (atomic request + vehicles)
-- ---------------------------------------------------------------------------

create or replace function public.create_service_request(
  p_requested_date date,
  p_time_window public.time_window,
  p_service_package public.service_package,
  p_priority public.request_priority,
  p_partner_note text,
  p_vehicles jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_org_id uuid;
  v_request_id uuid;
  v_vehicle_count integer;
  v_min_vehicles constant integer := 3;
  v_item jsonb;
  v_plate text;
  v_idx integer := 0;
  v_tomorrow date;
begin
  if auth.uid() is null then
    raise exception 'Nie ste prihlásený.';
  end if;

  select * into v_profile
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception 'Profil nebol nájdený.';
  end if;

  if v_profile.is_active is not true then
    raise exception 'Účet je neaktívny.';
  end if;

  if v_profile.role <> 'partner' then
    raise exception 'Požiadavky môžu vytvárať iba partneri.';
  end if;

  if v_profile.organization_id is null then
    raise exception 'Partner nemá priradenú organizáciu.';
  end if;

  v_org_id := v_profile.organization_id;

  if not exists (
    select 1 from public.organizations o
    where o.id = v_org_id and o.is_active = true
  ) then
    raise exception 'Organizácia je neaktívna.';
  end if;

  v_tomorrow := (timezone('Europe/Bratislava', now()))::date + 1;

  if p_requested_date < v_tomorrow then
    raise exception 'Požiadavku je potrebné odoslať aspoň jeden deň vopred.';
  end if;

  if p_vehicles is null or jsonb_typeof(p_vehicles) <> 'array' then
    raise exception 'Zoznam vozidiel je povinný.';
  end if;

  v_vehicle_count := jsonb_array_length(p_vehicles);

  if v_vehicle_count < v_min_vehicles then
    raise exception 'Minimálny počet vozidiel je %.', v_min_vehicles;
  end if;

  if v_vehicle_count > 50 then
    raise exception 'Maximálny počet vozidiel je 50.';
  end if;

  insert into public.service_requests (
    reference_code,
    organization_id,
    created_by,
    requested_date,
    time_window,
    service_package,
    priority,
    vehicle_count,
    status,
    partner_note
  )
  values (
    public.generate_reference_code(),
    v_org_id,
    auth.uid(),
    p_requested_date,
    p_time_window,
    p_service_package,
    p_priority,
    v_vehicle_count,
    'pending',
    nullif(trim(coalesce(p_partner_note, '')), '')
  )
  returning id into v_request_id;

  for v_item in select * from jsonb_array_elements(p_vehicles)
  loop
    v_plate := upper(trim(coalesce(v_item ->> 'license_plate', '')));

    if v_plate = '' then
      raise exception 'EČV je povinné pre každé vozidlo.';
    end if;

    insert into public.request_vehicles (
      request_id,
      license_plate,
      make_model,
      internal_reference,
      note,
      sort_order
    )
    values (
      v_request_id,
      v_plate,
      nullif(trim(coalesce(v_item ->> 'make_model', '')), ''),
      nullif(trim(coalesce(v_item ->> 'internal_reference', '')), ''),
      nullif(trim(coalesce(v_item ->> 'note', '')), ''),
      v_idx
    );

    v_idx := v_idx + 1;
  end loop;

  return v_request_id;
end;
$$;

revoke all on function public.create_service_request(
  date, public.time_window, public.service_package, public.request_priority, text, jsonb
) from public;
grant execute on function public.create_service_request(
  date, public.time_window, public.service_package, public.request_priority, text, jsonb
) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: update_request_status (admin status transitions)
-- ---------------------------------------------------------------------------

create or replace function public.update_request_status(
  p_request_id uuid,
  p_new_status public.request_status,
  p_admin_note text default null
)
returns public.service_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.service_requests%rowtype;
  v_allowed boolean := false;
begin
  if not public.is_admin() then
    raise exception 'Iba administrátor môže meniť stav požiadavky.';
  end if;

  select * into v_request
  from public.service_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Požiadavka nebola nájdená.';
  end if;

  if v_request.status = p_new_status then
    raise exception 'Požiadavka už má tento stav.';
  end if;

  v_allowed := case
    when v_request.status = 'pending' and p_new_status in ('confirmed', 'rejected') then true
    when v_request.status = 'confirmed' and p_new_status in ('in_progress', 'cancelled') then true
    when v_request.status = 'in_progress' and p_new_status in ('completed', 'cancelled') then true
    else false
  end;

  if not v_allowed then
    raise exception 'Nepovolený prechod stavu z % na %.', v_request.status, p_new_status;
  end if;

  update public.service_requests
  set
    status = p_new_status,
    admin_note = case
      when p_admin_note is null then admin_note
      else nullif(trim(p_admin_note), '')
    end,
    confirmed_at = case
      when p_new_status = 'confirmed' then timezone('utc', now())
      else confirmed_at
    end,
    started_at = case
      when p_new_status = 'in_progress' then timezone('utc', now())
      else started_at
    end,
    completed_at = case
      when p_new_status = 'completed' then timezone('utc', now())
      else completed_at
    end,
    updated_at = timezone('utc', now())
  where id = p_request_id
  returning * into v_request;

  return v_request;
end;
$$;

revoke all on function public.update_request_status(
  uuid, public.request_status, text
) from public;
grant execute on function public.update_request_status(
  uuid, public.request_status, text
) to authenticated;
