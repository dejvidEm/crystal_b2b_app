-- Vehicle registry for B2B partners
-- Run after 002_vehicle_service_packages.sql

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'vehicle_category' and n.nspname = 'public'
  ) then
    create type public.vehicle_category as enum ('rental', 'staff', 'for_sale');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- vehicles (organization registry)
-- ---------------------------------------------------------------------------

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  created_by uuid not null references public.profiles (id) on delete restrict,
  category public.vehicle_category not null,
  license_plate text,
  vin text,
  internal_reference text,
  brand text,
  model text,
  year integer,
  color text,
  assigned_person text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vehicles_has_identifier check (
    nullif(trim(coalesce(license_plate, '')), '') is not null
    or nullif(trim(coalesce(vin, '')), '') is not null
    or nullif(trim(coalesce(internal_reference, '')), '') is not null
  ),
  constraint vehicles_year_range check (
    year is null
    or (
      year >= 1980
      and year <= (extract(year from timezone('Europe/Bratislava', now()))::integer + 1)
    )
  )
);

create index if not exists vehicles_organization_id_idx
  on public.vehicles (organization_id);

create index if not exists vehicles_org_category_idx
  on public.vehicles (organization_id, category);

create index if not exists vehicles_org_active_idx
  on public.vehicles (organization_id, is_active);

create index if not exists vehicles_license_plate_idx
  on public.vehicles (organization_id, license_plate)
  where license_plate is not null;

create index if not exists vehicles_vin_idx
  on public.vehicles (organization_id, vin)
  where vin is not null;

create index if not exists vehicles_internal_reference_idx
  on public.vehicles (organization_id, internal_reference)
  where internal_reference is not null;

create unique index if not exists vehicles_org_plate_active_uidx
  on public.vehicles (organization_id, upper(license_plate))
  where is_active = true
    and license_plate is not null
    and length(trim(license_plate)) > 0;

create unique index if not exists vehicles_org_vin_active_uidx
  on public.vehicles (organization_id, upper(vin))
  where is_active = true
    and vin is not null
    and length(trim(vin)) > 0;

create unique index if not exists vehicles_org_internal_active_uidx
  on public.vehicles (organization_id, upper(internal_reference))
  where is_active = true
    and internal_reference is not null
    and length(trim(internal_reference)) > 0;

drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at
before update on public.vehicles
for each row execute function public.set_updated_at();

-- Normalize text fields before insert/update
create or replace function public.vehicles_normalize()
returns trigger
language plpgsql
as $$
begin
  new.license_plate := nullif(upper(trim(coalesce(new.license_plate, ''))), '');
  new.vin := nullif(upper(trim(coalesce(new.vin, ''))), '');
  new.internal_reference := nullif(trim(coalesce(new.internal_reference, '')), '');
  new.brand := nullif(trim(coalesce(new.brand, '')), '');
  new.model := nullif(trim(coalesce(new.model, '')), '');
  new.color := nullif(trim(coalesce(new.color, '')), '');
  new.assigned_person := nullif(trim(coalesce(new.assigned_person, '')), '');
  new.notes := nullif(trim(coalesce(new.notes, '')), '');
  return new;
end;
$$;

drop trigger if exists vehicles_normalize_biu on public.vehicles;
create trigger vehicles_normalize_biu
before insert or update on public.vehicles
for each row execute function public.vehicles_normalize();

-- Force organization_id / created_by from authenticated partner
create or replace function public.vehicles_enforce_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_active_partner() then
    raise exception 'Vozidlá môžu spravovať iba aktívni partneri.';
  end if;

  if tg_op = 'INSERT' then
    new.organization_id := public.current_organization_id();
    new.created_by := auth.uid();
  elsif tg_op = 'UPDATE' then
    if old.organization_id is distinct from new.organization_id then
      raise exception 'Organizáciu vozidla nie je možné meniť.';
    end if;
    if old.created_by is distinct from new.created_by then
      raise exception 'Autora vozidla nie je možné meniť.';
    end if;
    new.organization_id := old.organization_id;
    new.created_by := old.created_by;
  end if;

  if new.organization_id is null then
    raise exception 'Partner nemá priradenú organizáciu.';
  end if;

  return new;
end;
$$;

drop trigger if exists vehicles_enforce_owner_biu on public.vehicles;
create trigger vehicles_enforce_owner_biu
before insert or update on public.vehicles
for each row execute function public.vehicles_enforce_owner();

alter table public.vehicles enable row level security;

drop policy if exists "vehicles_select" on public.vehicles;
create policy "vehicles_select"
on public.vehicles
for select
to authenticated
using (
  public.is_admin()
  or organization_id = public.current_organization_id()
);

drop policy if exists "vehicles_insert_partner" on public.vehicles;
create policy "vehicles_insert_partner"
on public.vehicles
for insert
to authenticated
with check (
  public.is_active_partner()
  and organization_id = public.current_organization_id()
);

drop policy if exists "vehicles_update_partner" on public.vehicles;
create policy "vehicles_update_partner"
on public.vehicles
for update
to authenticated
using (
  public.is_active_partner()
  and organization_id = public.current_organization_id()
)
with check (
  public.is_active_partner()
  and organization_id = public.current_organization_id()
);

-- ---------------------------------------------------------------------------
-- Extend request_vehicles snapshot columns
-- ---------------------------------------------------------------------------

alter table public.request_vehicles
  add column if not exists vehicle_id uuid references public.vehicles (id) on delete set null;

alter table public.request_vehicles
  add column if not exists category public.vehicle_category;

alter table public.request_vehicles
  add column if not exists vin text;

alter table public.request_vehicles
  add column if not exists brand text;

alter table public.request_vehicles
  add column if not exists model text;

alter table public.request_vehicles
  add column if not exists color text;

-- Allow historical snapshots without EČV when VIN / internal ref exists
alter table public.request_vehicles
  alter column license_plate drop not null;

alter table public.request_vehicles
  drop constraint if exists request_vehicles_license_plate_not_empty;

alter table public.request_vehicles
  drop constraint if exists request_vehicles_has_identifier;

alter table public.request_vehicles
  add constraint request_vehicles_has_identifier check (
    nullif(trim(coalesce(license_plate, '')), '') is not null
    or nullif(trim(coalesce(vin, '')), '') is not null
    or nullif(trim(coalesce(internal_reference, '')), '') is not null
  );

create index if not exists request_vehicles_vehicle_id_idx
  on public.request_vehicles (vehicle_id);

-- ---------------------------------------------------------------------------
-- Recreate create_service_request to support registry vehicles
-- Same signature as migration 002 — avoids overload ambiguity
-- ---------------------------------------------------------------------------

create or replace function public.create_service_request(
  p_requested_date date,
  p_time_window public.time_window,
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
  v_idx integer := 0;
  v_tomorrow date;
  v_summary_package public.service_package;
  v_distinct_packages integer;
  v_vehicle_id uuid;
  v_new jsonb;
  v_reg public.vehicles%rowtype;
  v_package public.service_package;
  v_plate text;
  v_vin text;
  v_internal text;
  v_brand text;
  v_model text;
  v_color text;
  v_category public.vehicle_category;
  v_make_model text;
  v_note text;
  v_year integer;
  v_assigned text;
  v_notes text;
  v_seen_ids uuid[] := '{}';
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
    null,
    p_priority,
    v_vehicle_count,
    'pending',
    nullif(trim(coalesce(p_partner_note, '')), '')
  )
  returning id into v_request_id;

  for v_item in select * from jsonb_array_elements(p_vehicles)
  loop
    v_vehicle_id := null;
    v_reg := null;
    v_plate := null;
    v_vin := null;
    v_internal := null;
    v_brand := null;
    v_model := null;
    v_color := null;
    v_category := null;
    v_make_model := null;
    v_note := nullif(trim(coalesce(v_item ->> 'request_note', v_item ->> 'note', '')), '');

    begin
      v_package := (v_item ->> 'service_package')::public.service_package;
    exception
      when others then
        raise exception 'Každé vozidlo musí mať platný typ služby.';
    end;

    if v_package is null then
      raise exception 'Každé vozidlo musí mať typ služby.';
    end if;

    -- Existing registry vehicle
    if nullif(trim(coalesce(v_item ->> 'vehicle_id', '')), '') is not null then
      begin
        v_vehicle_id := (v_item ->> 'vehicle_id')::uuid;
      exception
        when others then
          raise exception 'Neplatné ID vozidla.';
      end;

      if v_vehicle_id = any (v_seen_ids) then
        raise exception 'To isté vozidlo nemôže byť v požiadavke viackrát.';
      end if;

      v_seen_ids := array_append(v_seen_ids, v_vehicle_id);

      select * into v_reg
      from public.vehicles v
      where v.id = v_vehicle_id
      for update;

      if not found then
        raise exception 'Vozidlo nebolo nájdené.';
      end if;

      if v_reg.organization_id <> v_org_id then
        raise exception 'Vozidlo nepatrí vašej organizácii.';
      end if;

      if v_reg.is_active is not true then
        raise exception 'Archivované vozidlo nie je možné pridať do požiadavky.';
      end if;

      v_plate := v_reg.license_plate;
      v_vin := v_reg.vin;
      v_internal := v_reg.internal_reference;
      v_brand := v_reg.brand;
      v_model := v_reg.model;
      v_color := v_reg.color;
      v_category := v_reg.category;
      v_make_model := nullif(trim(concat_ws(' ', v_reg.brand, v_reg.model)), '');

    -- New vehicle created atomically with the request
    elsif v_item ? 'new_vehicle' and jsonb_typeof(v_item -> 'new_vehicle') = 'object' then
      v_new := v_item -> 'new_vehicle';

      begin
        v_category := (v_new ->> 'category')::public.vehicle_category;
      exception
        when others then
          raise exception 'Nové vozidlo musí mať platnú kategóriu.';
      end;

      if v_category is null then
        raise exception 'Nové vozidlo musí mať kategóriu.';
      end if;

      v_plate := nullif(upper(trim(coalesce(v_new ->> 'license_plate', ''))), '');
      v_vin := nullif(upper(trim(coalesce(v_new ->> 'vin', ''))), '');
      v_internal := nullif(trim(coalesce(v_new ->> 'internal_reference', '')), '');
      v_brand := nullif(trim(coalesce(v_new ->> 'brand', '')), '');
      v_model := nullif(trim(coalesce(v_new ->> 'model', '')), '');
      v_color := nullif(trim(coalesce(v_new ->> 'color', '')), '');
      v_assigned := nullif(trim(coalesce(v_new ->> 'assigned_person', '')), '');
      v_notes := nullif(trim(coalesce(v_new ->> 'notes', '')), '');
      v_make_model := nullif(trim(concat_ws(' ', v_brand, v_model)), '');

      if v_plate is null and v_vin is null and v_internal is null then
        raise exception 'Nové vozidlo musí mať EČV, VIN alebo interné označenie.';
      end if;

      v_year := null;
      if nullif(trim(coalesce(v_new ->> 'year', '')), '') is not null then
        begin
          v_year := (v_new ->> 'year')::integer;
        exception
          when others then
            raise exception 'Neplatný rok výroby.';
        end;
      end if;

      begin
        insert into public.vehicles (
          organization_id,
          created_by,
          category,
          license_plate,
          vin,
          internal_reference,
          brand,
          model,
          year,
          color,
          assigned_person,
          notes,
          is_active
        )
        values (
          v_org_id,
          auth.uid(),
          v_category,
          v_plate,
          v_vin,
          v_internal,
          v_brand,
          v_model,
          v_year,
          v_color,
          v_assigned,
          v_notes,
          true
        )
        returning * into v_reg;
      exception
        when unique_violation then
          raise exception 'Vozidlo s týmto identifikátorom už v evidencii existuje.';
      end;

      v_vehicle_id := v_reg.id;
      v_plate := v_reg.license_plate;
      v_vin := v_reg.vin;
      v_internal := v_reg.internal_reference;
      v_brand := v_reg.brand;
      v_model := v_reg.model;
      v_color := v_reg.color;
      v_category := v_reg.category;
      v_make_model := nullif(trim(concat_ws(' ', v_reg.brand, v_reg.model)), '');

    -- Legacy payload (manual fields) for backward compatibility
    else
      v_plate := nullif(upper(trim(coalesce(v_item ->> 'license_plate', ''))), '');
      v_vin := nullif(upper(trim(coalesce(v_item ->> 'vin', ''))), '');
      v_internal := nullif(trim(coalesce(v_item ->> 'internal_reference', '')), '');
      v_brand := nullif(trim(coalesce(v_item ->> 'brand', '')), '');
      v_model := nullif(trim(coalesce(v_item ->> 'model', '')), '');
      v_color := nullif(trim(coalesce(v_item ->> 'color', '')), '');
      v_make_model := nullif(
        trim(coalesce(
          v_item ->> 'make_model',
          concat_ws(' ', v_brand, v_model)
        )),
        ''
      );

      if v_item ? 'category' and nullif(trim(coalesce(v_item ->> 'category', '')), '') is not null then
        begin
          v_category := (v_item ->> 'category')::public.vehicle_category;
        exception
          when others then
            v_category := null;
        end;
      end if;

      if v_plate is null and v_vin is null and v_internal is null then
        raise exception 'Každé vozidlo musí mať EČV, VIN alebo interné označenie.';
      end if;
    end if;

    insert into public.request_vehicles (
      request_id,
      vehicle_id,
      category,
      license_plate,
      vin,
      make_model,
      brand,
      model,
      color,
      internal_reference,
      note,
      service_package,
      sort_order
    )
    values (
      v_request_id,
      v_vehicle_id,
      v_category,
      v_plate,
      v_vin,
      v_make_model,
      v_brand,
      v_model,
      v_color,
      v_internal,
      v_note,
      v_package,
      v_idx
    );

    v_idx := v_idx + 1;
  end loop;

  select count(distinct rv.service_package)
  into v_distinct_packages
  from public.request_vehicles rv
  where rv.request_id = v_request_id;

  if v_distinct_packages = 1 then
    select rv.service_package
    into v_summary_package
    from public.request_vehicles rv
    where rv.request_id = v_request_id
    limit 1;
  else
    v_summary_package := null;
  end if;

  update public.service_requests
  set service_package = v_summary_package
  where id = v_request_id;

  return v_request_id;
end;
$$;

revoke all on function public.create_service_request(
  date, public.time_window, public.request_priority, text, jsonb
) from public;
grant execute on function public.create_service_request(
  date, public.time_window, public.request_priority, text, jsonb
) to authenticated;
