-- Ensure request-level service_package can be null (mixed packages summary).
-- Required by create_service_request, which inserts null and then sets the summary.
-- Run after 005_requested_time.sql (safe to re-run).

alter table public.service_requests
  alter column service_package drop not null;

notify pgrst, 'reload schema';
