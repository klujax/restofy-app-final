-- Add missing working_hours column to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS working_hours jsonb;

-- Ensure working_hours has default value structure (optional but good for consistency)
-- Format: { monday: { open: '09:00', close: '23:00', closed: false }, ... }
