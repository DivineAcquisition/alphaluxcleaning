-- Fix unique constraint on busy_slots table to match upsert function
-- Drop the old constraint and create new one for calendar-based conflicts

-- First, drop the existing unique constraint on (subcontractor_id, start_time, end_time)
ALTER TABLE public.busy_slots 
DROP CONSTRAINT IF EXISTS busy_slots_subcontractor_id_start_time_end_time_key;

-- Create a new unique constraint on (calendar_id, start_time, end_time)
-- This allows the upsert function to work properly for both business and subcontractor events
ALTER TABLE public.busy_slots 
ADD CONSTRAINT busy_slots_calendar_id_start_time_end_time_key 
UNIQUE (calendar_id, start_time, end_time);