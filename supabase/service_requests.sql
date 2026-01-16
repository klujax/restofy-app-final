-- =============================================
-- Service Requests Table (Call Waiter)
-- =============================================

-- Drop existing table if needed (uncomment if you need to recreate)
-- drop table if exists public.service_requests;

create table if not exists public.service_requests (
  id uuid default uuid_generate_v4() primary key,
  cafe_id uuid references public.profiles(id) on delete cascade not null,
  table_no text not null,
  status text default 'pending' check (status in ('pending', 'resolved')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster lookups
create index if not exists service_requests_cafe_id_idx on public.service_requests(cafe_id);
create index if not exists service_requests_status_idx on public.service_requests(status);

-- RLS for service_requests
alter table public.service_requests enable row level security;

-- Drop existing policies if any
drop policy if exists "Service requests are viewable by cafe owner." on public.service_requests;
drop policy if exists "Anyone can create service requests." on public.service_requests;
drop policy if exists "Owners can update their service requests." on public.service_requests;
drop policy if exists "Owners can delete their service requests." on public.service_requests;

create policy "Service requests are viewable by cafe owner."
  on public.service_requests for select
  using (auth.uid() = cafe_id);

create policy "Anyone can create service requests."
  on public.service_requests for insert
  with check (true);

create policy "Owners can update their service requests."
  on public.service_requests for update
  using (auth.uid() = cafe_id);

create policy "Owners can delete their service requests."
  on public.service_requests for delete
  using (auth.uid() = cafe_id);

-- Enable realtime
alter publication supabase_realtime add table public.service_requests;
