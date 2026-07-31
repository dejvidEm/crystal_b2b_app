-- Per-vehicle service packages
-- Run after 001_initial_schema.sql

alter table public.request_vehicles
  add column if not exists service_package public.service_package;

update public.request_vehicles rv
set service_package = sr.service_package
from public.service_requests sr
where sr.id = rv.request_id
  and rv.service_package is null;

alter table public.request_vehicles
  alter column service_package set default 'fleet_refresh';

alter table public.request_vehicles
  alter column service_package set not null;

-- Request-level package becomes a summary:
-- same package for all vehicles → that value; mixed → null
alter table public.service_requests
  alter column service_package drop not null;

-- Recreate RPC without request-level package argument
drop function if exists public.create_service_request(
  date,
  public.time_window,
  public.service_package,
  public.request_priority,
  text,
  jsonb
);

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
  v_plate text;
  v_package public.service_package;
  v_idx integer := 0;
  v_tomorrow date;
  v_summary_package public.service_package;
  v_distinct_packages integer;
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
    v_plate := upper(trim(coalesce(v_item ->> 'license_plate', '')));

    if v_plate = '' then
      raise exception 'EČV je povinné pre každé vozidlo.';
    end if;

    begin
      v_package := (v_item ->> 'service_package')::public.service_package;
    exception
      when others then
        raise exception 'Každé vozidlo musí mať platný typ služby.';
    end;

    if v_package is null then
      raise exception 'Každé vozidlo musí mať typ služby.';
    end if;

    insert into public.request_vehicles (
      request_id,
      license_plate,
      make_model,
      internal_reference,
      note,
      service_package,
      sort_order
    )
    values (
      v_request_id,
      v_plate,
      nullif(trim(coalesce(v_item ->> 'make_model', '')), ''),
      nullif(trim(coalesce(v_item ->> 'internal_reference', '')), ''),
      nullif(trim(coalesce(v_item ->> 'note', '')), ''),
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
