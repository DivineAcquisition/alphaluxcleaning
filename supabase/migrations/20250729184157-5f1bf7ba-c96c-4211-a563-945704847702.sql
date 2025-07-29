-- Fix security warnings by setting proper search paths for functions
CREATE OR REPLACE FUNCTION public.upsert_busy_slot(
  p_calendar_id TEXT,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_event_title TEXT DEFAULT NULL,
  p_event_id TEXT DEFAULT NULL
) 
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_subcontractor_id UUID;
  v_result JSONB;
BEGIN
  -- Find subcontractor by calendar_id
  SELECT id INTO v_subcontractor_id 
  FROM public.subcontractors 
  WHERE calendar_id = p_calendar_id;
  
  IF v_subcontractor_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No subcontractor found with calendar_id: ' || p_calendar_id
    );
  END IF;
  
  -- Upsert busy slot
  INSERT INTO public.busy_slots (
    subcontractor_id,
    calendar_id,
    start_time,
    end_time,
    event_title,
    event_id
  ) VALUES (
    v_subcontractor_id,
    p_calendar_id,
    p_start_time,
    p_end_time,
    p_event_title,
    p_event_id
  )
  ON CONFLICT (subcontractor_id, start_time, end_time) 
  DO UPDATE SET
    event_title = EXCLUDED.event_title,
    event_id = EXCLUDED.event_id,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'subcontractor_id', v_subcontractor_id,
    'message', 'Busy slot synced successfully'
  );
END;
$$;

-- Fix the get_available_slots function
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_subcontractor_id UUID,
  p_date DATE,
  p_time_slots TEXT[]
)
RETURNS TABLE(time_slot TEXT, available BOOLEAN) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  slot TEXT;
  slot_start TIMESTAMP WITH TIME ZONE;
  slot_end TIMESTAMP WITH TIME ZONE;
  is_busy BOOLEAN;
BEGIN
  FOREACH slot IN ARRAY p_time_slots
  LOOP
    -- Parse time slot to get start and end times (assuming 2-hour slots)
    slot_start := (p_date::TEXT || ' ' || slot)::TIMESTAMP WITH TIME ZONE;
    slot_end := slot_start + INTERVAL '2 hours';
    
    -- Check if this slot conflicts with any busy slots
    SELECT EXISTS(
      SELECT 1 FROM public.busy_slots bs
      WHERE bs.subcontractor_id = p_subcontractor_id
        AND bs.start_time < slot_end
        AND bs.end_time > slot_start
    ) INTO is_busy;
    
    RETURN QUERY SELECT slot, NOT is_busy;
  END LOOP;
END;
$$;