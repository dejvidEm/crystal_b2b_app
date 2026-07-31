-- Ensure request_vehicles has columns required by current create_service_request.
-- Safe to re-run. Fixes DBs that skipped / partially applied migration 002 or 003.

-- From 002: per-vehicle service package
alter table public.request_vehicles
  add column if not exists service_package public.service_package;

update public.request_vehicles rv
set service_package = coalesce(sr.service_package, 'fleet_refresh'::public.service_package)
from public.service_requests sr
where sr.id = rv.request_id
  and rv.service_package is null;

update public.request_vehicles
set service_package = 'fleet_refresh'
where service_package is null;

alter table public.request_vehicles
  alter column service_package set default 'fleet_refresh';

alter table public.request_vehicles
  alter column service_package set not null;

-- From 003: registry snapshot fields (only if vehicles table exists)
do $$
begin
  if to_regclass('public.vehicles') is not null then
    alter table public.request_vehicles
      add column if not exists vehicle_id uuid references public.vehicles (id) on delete set null;
  else
    alter table public.request_vehicles
      add column if not exists vehicle_id uuid;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'vehicle_category' and n.nspname = 'public'
  ) then
    alter table public.request_vehicles
      add column if not exists category public.vehicle_category;
  end if;
end $$;

alter table public.request_vehicles
  add column if not exists vin text;

alter table public.request_vehicles
  add column if not exists brand text;

alter table public.request_vehicles
  add column if not exists model text;

alter table public.request_vehicles
  add column if not exists color text;

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

-- Request-level package must stay nullable (mixed packages)
alter table public.service_requests
  alter column service_package drop not null;

notify pgrst, 'reload schema';
