-- =============================================
-- RESTOFY KAFE - CLEAN DATABASE SETUP
-- Bu script TÜM tabloları siler ve yeniden oluşturur!
-- =============================================

-- 1. Önce tüm tabloları sil (CASCADE ile bağımlılıkları da siler)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.service_requests CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Helper function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  business_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  logo_url text,
  address text,
  phone text,
  currency text DEFAULT 'TRY',
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- RESTAURANTS TABLE
-- =============================================
CREATE TABLE public.restaurants (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  location text,
  slug text NOT NULL UNIQUE,
  description text,
  logo_url text,
  address text,
  phone text,
  currency text DEFAULT '₺',
  theme_color text DEFAULT '#f97316',
  working_hours jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX restaurants_owner_id_idx ON public.restaurants(owner_id);
CREATE INDEX restaurants_slug_idx ON public.restaurants(slug);

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "restaurants_select_public" ON public.restaurants FOR SELECT USING (is_active = true);
CREATE POLICY "restaurants_select_owner" ON public.restaurants FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "restaurants_insert" ON public.restaurants FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "restaurants_update" ON public.restaurants FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "restaurants_delete" ON public.restaurants FOR DELETE USING (auth.uid() = owner_id);

-- =============================================
-- CATEGORIES TABLE
-- =============================================
CREATE TABLE public.categories (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  image_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX categories_restaurant_id_idx ON public.categories(restaurant_id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_all" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- MENU_ITEMS TABLE
-- =============================================
CREATE TABLE public.menu_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL,
  image_url text,
  is_available boolean DEFAULT true,
  stock_status text DEFAULT 'in_stock',
  preparation_time integer,
  sort_order integer DEFAULT 0,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX menu_items_restaurant_id_idx ON public.menu_items(restaurant_id);
CREATE INDEX menu_items_category_id_idx ON public.menu_items(category_id);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu_items_all" ON public.menu_items FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- ORDERS TABLE
-- =============================================
CREATE TABLE public.orders (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_name text,
  table_number text,
  notes text,
  status text DEFAULT 'pending',
  total_amount numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX orders_restaurant_id_idx ON public.orders(restaurant_id);
CREATE INDEX orders_status_idx ON public.orders(status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_all" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- ORDER_ITEMS TABLE
-- =============================================
CREATE TABLE public.order_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  menu_item_name text NOT NULL,
  quantity integer DEFAULT 1 NOT NULL,
  unit_price numeric(10, 2) NOT NULL,
  total_price numeric(10, 2) NOT NULL,
  notes text,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_all" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- SERVICE_REQUESTS TABLE
-- =============================================
CREATE TABLE public.service_requests (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
  cafe_id uuid,
  table_no text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX service_requests_restaurant_id_idx ON public.service_requests(restaurant_id);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_requests_all" ON public.service_requests FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- REVIEWS TABLE
-- =============================================
CREATE TABLE public.reviews (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  customer_name text,
  rating integer NOT NULL,
  comment text,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_approved boolean DEFAULT true
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_all" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;

-- DONE
SELECT 'Migration completed!' as result;
