-- 007: Add rejection reason field to vacation_requests
-- Manager can provide a reason when rejecting a vacation request

alter table public.vacation_requests
  add column if not exists ablehnungsgrund text default null;

comment on column public.vacation_requests.ablehnungsgrund is 'Grund fuer Ablehnung durch Manager/Admin';
