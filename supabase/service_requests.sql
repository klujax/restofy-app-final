-- =============================================
-- Service Requests Table (Call Waiter)
-- =============================================

create table public.service_requests (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  table_number text not null,
  status text default 'pending' check (status in ('pending', 'resolved')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster lookups
create index service_requests_profile_id_idx on public.service_requests(profile_id);
create index service_requests_status_idx on public.service_requests(status);

-- RLS for service_requests
alter table public.service_requests enable row level security;

create policy "Service requests are viewable by cafe owner."
  on public.service_requests for select
  using (auth.uid() = profile_id);

create policy "Anyone can create service requests."
  on public.service_requests for insert
  with check (true);

create policy "Owners can update their service requests."
  on public.service_requests for update
  using (auth.uid() = profile_id);

create policy "Owners can delete their service requests."
  on public.service_requests for delete
  using (auth.uid() = profile_id);

-- Enable realtime
alter publication supabase_realtime add table public.service_requests;
