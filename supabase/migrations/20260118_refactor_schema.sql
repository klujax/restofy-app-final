-- =============================================
-- REFACTOR: Move from Profile-based to Restaurant-based Architecture
-- =============================================

-- 1. Ensure Restaurants Table Exists and is Correct
CREATE TABLE IF NOT EXISTS public.restaurants (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  location text,
  slug text NOT NULL,
  description text,
  logo_url text,
  address text,
  phone text,
  currency text DEFAULT '₺',
  theme_color text DEFAULT '#f97316',
  is_active boolean DEFAULT true,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(owner_id, slug),
  UNIQUE(slug) 
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS restaurants_owner_id_idx ON public.restaurants(owner_id);
CREATE INDEX IF NOT EXISTS restaurants_slug_idx ON public.restaurants(slug);

-- RLS for restaurants
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public restaurants are viewable by everyone." ON public.restaurants FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can view their own restaurants." ON public.restaurants FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners can insert their own restaurants." ON public.restaurants FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own restaurants." ON public.restaurants FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their own restaurants." ON public.restaurants FOR DELETE USING (auth.uid() = owner_id);


-- 2. Migrate CATEGORIES to use restaurant_id
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE;

-- (Optional) Data Migration: If you have data, you'd map profile_id -> restaurant_id here. 
-- For now, we assume we might need to wipe or the user starts fresh, or we map 1:1 if a profile acts as a single restaurant.
-- Let's auto-create a default restaurant for existing profiles to prevent data loss if possible.
DO $$
DECLARE
    r_profile RECORD;
    v_restaurant_id uuid;
BEGIN
    FOR r_profile IN SELECT * FROM public.profiles LOOP
        -- Check if restaurant exists for this profile
        SELECT id INTO v_restaurant_id FROM public.restaurants WHERE owner_id = r_profile.id LIMIT 1;
        
        -- If not, create one
        IF v_restaurant_id IS NULL THEN
            INSERT INTO public.restaurants (owner_id, name, slug, description, logo_url)
            VALUES (r_profile.id, r_profile.business_name, r_profile.slug, r_profile.description, r_profile.logo_url)
            RETURNING id INTO v_restaurant_id;
        END IF;

        -- Update categories
        UPDATE public.categories SET restaurant_id = v_restaurant_id WHERE profile_id = r_profile.id AND restaurant_id IS NULL;
    END LOOP;
END $$;

-- Make restaurant_id mandatory after migration
-- ALTER TABLE public.categories ALTER COLUMN restaurant_id SET NOT NULL; -- Keeping optional for safety during transition, but logically should be required.


-- 3. Migrate MENU_ITEMS to use restaurant_id
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE;

DO $$
DECLARE
    r_cat RECORD;
BEGIN
    FOR r_cat IN SELECT id, restaurant_id FROM public.categories WHERE restaurant_id IS NOT NULL LOOP
        UPDATE public.menu_items SET restaurant_id = r_cat.restaurant_id WHERE category_id = r_cat.id AND restaurant_id IS NULL;
    END LOOP;
END $$;


-- 4. Migrate ORDERS to use restaurant_id
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE;

DO $$
DECLARE
    r_profile RECORD;
    v_rest_id uuid;
BEGIN
    FOR r_profile IN SELECT id FROM public.profiles LOOP
        SELECT id INTO v_rest_id FROM public.restaurants WHERE owner_id = r_profile.id LIMIT 1;
        IF v_rest_id IS NOT NULL THEN
            UPDATE public.orders SET restaurant_id = v_rest_id WHERE profile_id = r_profile.id AND restaurant_id IS NULL;
        END IF;
    END LOOP;
END $$;


-- 5. REVIEWS TABLE (New Requirement)
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    customer_name text, -- Optional
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_approved boolean DEFAULT true -- Auto-approve for now
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can see reviews
CREATE POLICY "Reviews are viewable by everyone." ON public.reviews FOR SELECT USING (true);
-- Anyone can insert a review (public)
CREATE POLICY "Anyone can insert reviews." ON public.reviews FOR INSERT WITH CHECK (true);
-- Only owner can delete (moderation)
CREATE POLICY "Owners can delete reviews." ON public.reviews FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.restaurants WHERE id = reviews.restaurant_id AND owner_id = auth.uid())
);
