# Crystal B2B Partner Portal

Private B2B web application for Crystal Detailing Bratislava and its partners (dealerships, fleets, rentals, transfer companies).

Production URL: https://btob.crystaldetailing.sk

Partners submit service requests (date, package, vehicles). Crystal confirms, rejects, or completes them from the admin dashboard and calendar.

## Stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS
- Supabase Auth + Postgres (RLS)
- TanStack Query, React Hook Form, Zod
- date-fns (sk locale), Lucide, Sonner
- shadcn-style Radix UI primitives

## Local setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Create a Supabase project and fill `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_or_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use the **publishable** (anon) key only. Never put the service-role key in this app.

4. Apply the migrations in the Supabase SQL Editor (or CLI), in order:

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_vehicle_service_packages.sql`

Optional seed helpers: `supabase/seed.sql`

5. Configure Auth URLs in Supabase → Authentication → URL configuration:

- Site URL (local): `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/**`

For production:

- Site URL: `https://btob.crystaldetailing.sk`
- Redirect URLs: `https://btob.crystaldetailing.sk/**`

6. Start the app:

```bash
npm run dev
```

Open http://localhost:3000

## Create the first Crystal admin

1. In Supabase Dashboard → Authentication → Users, create a user (email + password).
2. Copy the user UUID.
3. Run:

```sql
update public.profiles
set
  role = 'admin',
  organization_id = null,
  full_name = 'Crystal Admin',
  is_active = true
where id = 'ADMIN_USER_UUID';
```

Admin accounts are never created automatically. New Auth users default to `partner`.

## Create a partner organization and user

1. Insert an organization:

```sql
insert into public.organizations (name, company_id, billing_email, phone, service_address, is_active)
values (
  'AutoPartner Bratislava s.r.o.',
  '12345678',
  'fleet@example.sk',
  '+421900000000',
  'Príkladná 12, Bratislava',
  true
)
returning id;
```

2. Create the partner Auth user in the Dashboard.
3. Assign the profile:

```sql
update public.profiles
set
  role = 'partner',
  organization_id = 'ORGANIZATION_UUID',
  full_name = 'Ján Partner',
  is_active = true
where id = 'PARTNER_USER_UUID';
```

## Roles and access

| Role | Navigation | Data access |
|------|------------|-------------|
| `admin` | Prehľad, Kalendár | All organizations and requests; status updates via RPC |
| `partner` | Prehľad, Nová požiadavka, Moje požiadavky, Kalendár | Own organization only; create via `create_service_request` RPC |

Authorization is enforced by PostgreSQL Row Level Security. Hiding UI is not security.

Business rules:

- Requests must be submitted at least 1 calendar day ahead (`Europe/Bratislava`)
- Default minimum vehicles: `MIN_VEHICLES_PER_DISPATCH` in `src/config/constants.ts` (also validated in SQL as 3)
- Partners cannot change request status
- Termín is valid only after Crystal confirmation

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm start
```

## Deploy on Vercel

1. Import the Git repository into Vercel.
2. Set environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL=https://btob.crystaldetailing.sk`

3. Deploy.
4. Domains → add `btob.crystaldetailing.sk` and configure DNS as shown by Vercel.
5. Update Supabase Auth Site URL + redirect URLs to the production domain.

Architecture notes for Vercel cost/control:

- No custom API layer for ordinary CRUD
- Browser talks to Supabase Data API with RLS
- `src/proxy.ts` only refreshes sessions and protects routes
- TanStack Query caches personalized data (`staleTime`, no polling, no refetch on focus)
- Calendar loads only the visible month
- Atomic request creation via one RPC

## Important routes

- `/` → redirects to dashboard or login
- `/login`
- `/dashboard`
- `/orders`
- `/orders/new`
- `/orders/[id]`
- `/calendar`
- `/unauthorized`

## Future extension points

The v1 model intentionally stays lean. Later additions can include before/after photos, damage reports, PDF work reports, monthly invoices, notifications, recurring schedules, partner pricing, multi-user orgs, vehicle history, audit log, and Google Calendar sync — without rebuilding the portal.
