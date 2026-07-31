-- Per-organization minimum vehicles per request
-- Run after 003_vehicle_registry.sql

-- ---------------------------------------------------------------------------
-- Column
-- ---------------------------------------------------------------------------

alter table public.organizations
  add column if not exists min_vehicles_per_request integer not null default 3;

alter table public.organizations
  drop constraint if exists organizations_min_vehicles_per_request_check;

alter table public.organizations
  add constraint organizations_min_vehicles_per_request_check
  check (
    min_vehicles_per_request >= 1
    and min_vehicles_per_request <= 50
  );

comment on column public.organizations.min_vehicles_per_request is
  'Minimum vehicles a partner must include in each service request.';

-- ---------------------------------------------------------------------------
-- Admin RPC: update minimum vehicles
-- ---------------------------------------------------------------------------

create or replace function public.update_organization_min_vehicles(
  p_organization_id uuid,
  p_min_vehicles integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Nie ste prihlásený.';
  end if;

  if not public.is_admin() then
    raise exception 'Len administrátor môže meniť nastavenia organizácie.';
  end if;

  if p_organization_id is null then
    raise exception 'Organizácia je povinná.';
  end if;

  if p_min_vehicles is null
     or p_min_vehicles < 1
     or p_min_vehicles > 50 then
    raise exception 'Minimálny odber musí byť medzi 1 a 50 vozidlami.';
  end if;

  update public.organizations
  set min_vehicles_per_request = p_min_vehicles
  where id = p_organization_id;

  if not found then
    raise exception 'Organizácia nebola nájdená.';
  end if;
end;
$$;

revoke all on function public.update_organization_min_vehicles(uuid, integer) from public;
grant execute on function public.update_organization_min_vehicles(uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- create_service_request: use organization minimum
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
  v_min_vehicles integer;
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

  select o.min_vehicles_per_request
  into v_min_vehicles
  from public.organizations o
  where o.id = v_org_id;

  if v_min_vehicles is null or v_min_vehicles < 1 then
    v_min_vehicles := 3;
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
