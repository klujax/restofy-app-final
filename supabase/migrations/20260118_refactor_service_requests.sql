-- Add restaurant_id to service_requests
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE;

-- Migrate data
DO $$
DECLARE
    r_req RECORD;
    v_rest_id uuid;
BEGIN
    FOR r_req IN SELECT id, cafe_id FROM public.service_requests WHERE restaurant_id IS NULL LOOP
        SELECT id INTO v_rest_id FROM public.restaurants WHERE owner_id = r_req.cafe_id LIMIT 1;
        IF v_rest_id IS NOT NULL THEN
            UPDATE public.service_requests SET restaurant_id = v_rest_id WHERE id = r_req.id;
        END IF;
    END LOOP;
END $$;
