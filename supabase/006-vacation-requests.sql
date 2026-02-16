-- 006: Vacation Requests table for formal vacation request workflow
-- Status: beantragt -> genehmigt/abgelehnt (by manager/admin)

-- Create vacation_requests table
create table if not exists public.vacation_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  start_datum date not null,
  end_datum date not null,
  arbeitstage integer not null check (arbeitstage > 0),
  kommentar text default '',
  status text not null default 'beantragt'
    check (status in ('beantragt', 'genehmigt', 'abgelehnt')),
  bearbeitet_von uuid references auth.users(id) on delete set null,
  bearbeitet_am timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint end_after_start check (end_datum >= start_datum)
);

-- Indexes
create index if not exists idx_vacation_requests_user_id on public.vacation_requests(user_id);
create index if not exists idx_vacation_requests_status on public.vacation_requests(status);
create index if not exists idx_vacation_requests_dates on public.vacation_requests(start_datum, end_datum);

-- Enable RLS
alter table public.vacation_requests enable row level security;

-- RLS Policies

-- Users can read their own requests
create policy "Users can read own vacation requests"
  on public.vacation_requests for select
  using (auth.uid() = user_id);

-- Managers/Admins can read all requests
create policy "Managers can read all vacation requests"
  on public.vacation_requests for select
  using (is_manager_or_admin());

-- Users can create their own requests
create policy "Users can create own vacation requests"
  on public.vacation_requests for insert
  with check (auth.uid() = user_id);

-- Users can delete own requests that are still 'beantragt'
create policy "Users can delete own pending requests"
  on public.vacation_requests for delete
  using (auth.uid() = user_id and status = 'beantragt');

-- Managers/Admins can update requests (approve/reject)
create policy "Managers can update vacation requests"
  on public.vacation_requests for update
  using (is_manager_or_admin());

-- Auto-update updated_at
create or replace trigger set_vacation_requests_updated_at
  before update on public.vacation_requests
  for each row
  execute function public.handle_updated_at();
