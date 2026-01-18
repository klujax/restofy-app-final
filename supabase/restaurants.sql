-- =============================================
-- RESTAURANTS TABLE - Multiple restaurants per user
-- =============================================

-- Create restaurants table
create table if not exists public.restaurants (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  location text, -- e.g., "Kadıköy", "Beşiktaş"
  slug text not null,
  description text,
  logo_url text,
  address text,
  phone text,
  currency text default '₺',
  theme_color text default '#000000',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure unique slug per owner
  unique(owner_id, slug)
);

-- Index for faster lookups
create index if not exists restaurants_owner_id_idx on public.restaurants(owner_id);

-- RLS for restaurants
alter table public.restaurants enable row level security;

-- Everyone can view active restaurants (for public menu)
create policy "Public restaurants are viewable by everyone."
  on public.restaurants for select
  using (is_active = true);

-- Owners can view all their restaurants
create policy "Owners can view all their restaurants."
  on public.restaurants for select
  using (auth.uid() = owner_id);

-- Users can insert their own restaurants
create policy "Users can insert their own restaurants."
  on public.restaurants for insert
  with check (auth.uid() = owner_id);

-- Users can update their own restaurants
create policy "Users can update their own restaurants."
  on public.restaurants for update
  using (auth.uid() = owner_id);

-- Users can delete their own restaurants
create policy "Users can delete their own restaurants."
  on public.restaurants for delete
  using (auth.uid() = owner_id);

-- Trigger for updated_at
create trigger handle_restaurants_updated_at
  before update on public.restaurants
  for each row execute procedure public.handle_updated_at();

-- =============================================
-- UPDATE OTHER TABLES TO REFERENCE RESTAURANTS
-- =============================================

-- Add restaurant_id to categories (if not exists)
-- ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS restaurant_id uuid references public.restaurants(id) on delete cascade;

-- Add restaurant_id to menu_items (if not exists)
-- ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS restaurant_id uuid references public.restaurants(id) on delete cascade;

-- Add restaurant_id to orders (if not exists)
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS restaurant_id uuid references public.restaurants(id) on delete cascade;
