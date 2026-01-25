-- RLS Policies for Public Access to Restaurant Data
-- Use this to ensure customers can view the menu without logging in

-- 1. Restaurants Table
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public restaurants are viewable by everyone." ON public.restaurants;
CREATE POLICY "Public restaurants are viewable by everyone." 
ON public.restaurants FOR SELECT 
USING (is_active = true);

-- Re-apply owner policy to be safe
DROP POLICY IF EXISTS "Owners can view their own restaurants." ON public.restaurants;
CREATE POLICY "Owners can view their own restaurants." 
ON public.restaurants FOR SELECT 
USING (auth.uid() = owner_id);

-- 2. Categories Table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public categories are viewable." ON public.categories;
CREATE POLICY "Public categories are viewable." 
ON public.categories FOR SELECT 
USING (true); 
-- logic: detailed filtering happens via restaurant_id and code, 
-- but at DB level we allow reading categories if you have the ID. 
-- You could add: EXISTS (SELECT 1 FROM restaurants r WHERE r.id = categories.restaurant_id AND r.is_active = true)

-- 3. Menu Items Table
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public menu items are viewable." ON public.menu_items;
CREATE POLICY "Public menu items are viewable." 
ON public.menu_items FOR SELECT 
USING (is_available = true); 
-- logic: hide unavailable items securely

-- 4. Reviews Table (if used)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are viewable by everyone." ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone." 
ON public.reviews FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Anyone can insert reviews." ON public.reviews;
CREATE POLICY "Anyone can insert reviews." 
ON public.reviews FOR INSERT 
WITH CHECK (true);

-- 5. Fix Service Requests (if specific RLS issues existed there)
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Allow public (waiters/customers) to insert requests? Usually yes for "Call Waiter" from URL
DROP POLICY IF EXISTS "Anyone can create service requests." ON public.service_requests;
CREATE POLICY "Anyone can create service requests." 
ON public.service_requests FOR INSERT 
WITH CHECK (true);

-- Allow owners to view requests for their restaurants
DROP POLICY IF EXISTS "Owners can view service requests." ON public.service_requests;
CREATE POLICY "Owners can view service requests." 
ON public.service_requests FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants r 
        WHERE r.id = service_requests.restaurant_id 
        AND r.owner_id = auth.uid()
    )
);
