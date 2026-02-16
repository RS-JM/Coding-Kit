-- 008: Sick Leaves table for tracking employee sick days
-- Krankmeldungen werden rot im Kalender markiert

-- Create sick_leaves table
create table if not exists public.sick_leaves (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  start_datum date not null,
  end_datum date not null,
  kommentar text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint end_after_start check (end_datum >= start_datum),
  constraint no_future_sick_leave check (start_datum <= current_date)
);

-- Indexes
create index if not exists idx_sick_leaves_user_id on public.sick_leaves(user_id);
create index if not exists idx_sick_leaves_dates on public.sick_leaves(start_datum, end_datum);

-- Enable RLS
alter table public.sick_leaves enable row level security;

-- RLS Policies

-- Users can read their own sick leaves
create policy "Users can read own sick leaves"
  on public.sick_leaves for select
  using (auth.uid() = user_id);

-- Managers/Admins can read all sick leaves
create policy "Managers can read all sick leaves"
  on public.sick_leaves for select
  using (is_manager_or_admin());

-- Users can create their own sick leaves
create policy "Users can create own sick leaves"
  on public.sick_leaves for insert
  with check (auth.uid() = user_id);

-- Users can update their own sick leaves
create policy "Users can update own sick leaves"
  on public.sick_leaves for update
  using (auth.uid() = user_id);

-- Users can delete their own sick leaves
create policy "Users can delete own sick leaves"
  on public.sick_leaves for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace trigger set_sick_leaves_updated_at
  before update on public.sick_leaves
  for each row
  execute function public.handle_updated_at();

-- Comments
comment on table public.sick_leaves is 'Krankmeldungen der Mitarbeiter';
comment on column public.sick_leaves.start_datum is 'Erster Krankheitstag';
comment on column public.sick_leaves.end_datum is 'Letzter Krankheitstag (inklusiv)';
comment on column public.sick_leaves.kommentar is 'Optionaler Kommentar zur Krankmeldung';
