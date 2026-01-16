-- =============================================
-- Restofy Kafe - Database Schema Migration
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- 1. PROFILES TABLE (Cafe Owners)
-- =============================================
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  business_name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  address text,
  phone text,
  currency text default 'TRY',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile."
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can delete their own profile."
  on public.profiles for delete
  using (auth.uid() = id);

-- =============================================
-- 2. CATEGORIES TABLE
-- =============================================
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  image_url text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster lookups
create index categories_profile_id_idx on public.categories(profile_id);

-- RLS for categories
alter table public.categories enable row level security;

create policy "Categories are viewable by everyone."
  on public.categories for select
  using (true);

create policy "Owners can insert their own categories."
  on public.categories for insert
  with check (auth.uid() = profile_id);

create policy "Owners can update their own categories."
  on public.categories for update
  using (auth.uid() = profile_id);

create policy "Owners can delete their own categories."
  on public.categories for delete
  using (auth.uid() = profile_id);

-- =============================================
-- 3. MENU_ITEMS TABLE
-- =============================================
create table public.menu_items (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric(10, 2) not null,
  image_url text,
  is_available boolean default true,
  stock_status text default 'in_stock' check (stock_status in ('in_stock', 'out_of_stock', 'low_stock')),
  preparation_time integer, -- in minutes
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for faster lookups
create index menu_items_profile_id_idx on public.menu_items(profile_id);
create index menu_items_category_id_idx on public.menu_items(category_id);

-- RLS for menu_items
alter table public.menu_items enable row level security;

create policy "Menu items are viewable by everyone."
  on public.menu_items for select
  using (true);

create policy "Owners can insert their own menu items."
  on public.menu_items for insert
  with check (auth.uid() = profile_id);

create policy "Owners can update their own menu items."
  on public.menu_items for update
  using (auth.uid() = profile_id);

create policy "Owners can delete their own menu items."
  on public.menu_items for delete
  using (auth.uid() = profile_id);

-- =============================================
-- 4. ORDERS TABLE
-- =============================================
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  customer_name text,
  table_number text,
  notes text,
  status text default 'received' check (status in ('received', 'preparing', 'ready', 'completed', 'rejected')),
  total_amount numeric(10, 2) not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster lookups
create index orders_profile_id_idx on public.orders(profile_id);
create index orders_status_idx on public.orders(status);
create index orders_created_at_idx on public.orders(created_at desc);

-- RLS for orders
alter table public.orders enable row level security;

create policy "Orders are viewable by everyone (for tracking)."
  on public.orders for select
  using (true);

create policy "Anyone can create orders (guest checkout)."
  on public.orders for insert
  with check (true);

create policy "Owners can update their orders."
  on public.orders for update
  using (auth.uid() = profile_id);

create policy "Owners can delete their orders."
  on public.orders for delete
  using (auth.uid() = profile_id);

-- =============================================
-- 5. ORDER_ITEMS TABLE
-- =============================================
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  menu_item_name text not null, -- Stored in case menu item is deleted
  quantity integer default 1 not null check (quantity > 0),
  unit_price numeric(10, 2) not null,
  total_price numeric(10, 2) not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster lookups
create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_menu_item_id_idx on public.order_items(menu_item_id);

-- RLS for order_items
alter table public.order_items enable row level security;

create policy "Order items are viewable by everyone."
  on public.order_items for select
  using (true);

create policy "Anyone can create order items."
  on public.order_items for insert
  with check (true);

create policy "Owners can update order items."
  on public.order_items for update
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.profile_id = auth.uid()
    )
  );

create policy "Owners can delete order items."
  on public.order_items for delete
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.profile_id = auth.uid()
    )
  );

-- =============================================
-- 6. REALTIME SUBSCRIPTIONS
-- =============================================
-- Enable realtime for orders table (for live order stream)
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;

-- =============================================
-- 7. FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_categories_updated_at
  before update on public.categories
  for each row execute procedure public.handle_updated_at();

create trigger handle_menu_items_updated_at
  before update on public.menu_items
  for each row execute procedure public.handle_updated_at();

create trigger handle_orders_updated_at
  before update on public.orders
  for each row execute procedure public.handle_updated_at();

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, business_name, slug)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'business_name', 'My Cafe'),
    coalesce(new.raw_user_meta_data->>'slug', new.id::text)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
