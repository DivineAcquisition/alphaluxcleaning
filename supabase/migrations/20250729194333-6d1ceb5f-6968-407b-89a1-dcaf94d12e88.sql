-- Update busy_slots table to support business calendar events
-- Make subcontractor_id nullable since business calendar events don't belong to specific subcontractors
ALTER TABLE public.busy_slots 
ALTER COLUMN subcontractor_id DROP NOT NULL;

-- Add calendar_type field to distinguish between business and subcontractor calendar events
ALTER TABLE public.busy_slots 
ADD COLUMN calendar_type text NOT NULL DEFAULT 'business';

-- Add constraint to ensure calendar_type is either 'business' or 'subcontractor'
ALTER TABLE public.busy_slots 
ADD CONSTRAINT busy_slots_calendar_type_check 
CHECK (calendar_type IN ('business', 'subcontractor'));

-- Update existing records to have proper calendar_type
UPDATE public.busy_slots 
SET calendar_type = 'subcontractor' 
WHERE subcontractor_id IS NOT NULL;

-- Update the upsert_busy_slot function to handle business calendar events
CREATE OR REPLACE FUNCTION public.upsert_busy_slot(
  p_calendar_id text, 
  p_start_time timestamp with time zone, 
  p_end_time timestamp with time zone, 
  p_event_title text DEFAULT NULL::text, 
  p_event_id text DEFAULT NULL::text,
  p_calendar_type text DEFAULT 'business'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_subcontractor_id UUID;
  v_result JSONB;
BEGIN
  -- For subcontractor calendars, find subcontractor by calendar_id
  IF p_calendar_type = 'subcontractor' THEN
    SELECT id INTO v_subcontractor_id 
    FROM public.subcontractors 
    WHERE calendar_id = p_calendar_id;
    
    IF v_subcontractor_id IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'No subcontractor found with calendar_id: ' || p_calendar_id
      );
    END IF;
  END IF;
  
  -- Upsert busy slot
  INSERT INTO public.busy_slots (
    subcontractor_id,
    calendar_id,
    start_time,
    end_time,
    event_title,
    event_id,
    calendar_type
  ) VALUES (
    v_subcontractor_id,
    p_calendar_id,
    p_start_time,
    p_end_time,
    p_event_title,
    p_event_id,
    p_calendar_type
  )
  ON CONFLICT (calendar_id, start_time, end_time) 
  DO UPDATE SET
    event_title = EXCLUDED.event_title,
    event_id = EXCLUDED.event_id,
    calendar_type = EXCLUDED.calendar_type,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'subcontractor_id', v_subcontractor_id,
    'calendar_type', p_calendar_type,
    'message', 'Busy slot synced successfully'
  );
END;
$function$