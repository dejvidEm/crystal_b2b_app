-- Crystal B2B Partner Portal — development seed helpers
--
-- Do NOT insert Auth users directly here on hosted Supabase.
-- Create users in the Supabase Dashboard (Authentication → Users),
-- then run the SQL snippets below with the generated UUIDs.

-- ---------------------------------------------------------------------------
-- 1) Example organization
-- ---------------------------------------------------------------------------

insert into public.organizations (
  id,
  name,
  company_id,
  billing_email,
  phone,
  service_address,
  is_active
)
values (
  '11111111-1111-1111-1111-111111111111',
  'AutoPartner Bratislava s.r.o.',
  '12345678',
  'fleet@autopartner.sk',
  '+421900000000',
  'Príkladná 12, 821 01 Bratislava',
  true
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2) After creating Auth users in the Dashboard
-- ---------------------------------------------------------------------------
--
-- Create two users, for example:
--   admin@crystaldetailing.sk
--   partner@autopartner.sk
--
-- Then copy their UUIDs from Authentication → Users.

-- Promote Crystal admin (replace ADMIN_USER_UUID):
--
-- update public.profiles
-- set
--   role = 'admin',
--   organization_id = null,
--   full_name = 'Crystal Admin',
--   is_active = true
-- where id = 'ADMIN_USER_UUID';

-- Assign partner to the example organization (replace PARTNER_USER_UUID):
--
-- update public.profiles
-- set
--   role = 'partner',
--   organization_id = '11111111-1111-1111-1111-111111111111',
--   full_name = 'Ján Partner',
--   is_active = true
-- where id = 'PARTNER_USER_UUID';

-- ---------------------------------------------------------------------------
-- Optional: sample service request (only after profiles exist)
-- ---------------------------------------------------------------------------
--
-- insert into public.service_requests (
--   reference_code,
--   organization_id,
--   created_by,
--   requested_date,
--   time_window,
--   service_package,
--   priority,
--   vehicle_count,
--   status,
--   partner_note
-- )
-- values (
--   'CRY-2026-0001',
--   '11111111-1111-1111-1111-111111111111',
--   'PARTNER_USER_UUID',
--   (timezone('Europe/Bratislava', now()))::date + 3,
--   'morning',
--   'fleet_refresh', -- null = zmiešané balíky podľa vozidiel
--   'standard',
--   3,
--   'pending',
--   'Prosím o potvrdenie do piatku.'
-- );
