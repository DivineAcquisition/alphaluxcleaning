-- Seed availability_schedule table with time slots for the next 30 days
-- Excludes Sundays and provides Morning (8-11 AM) and Afternoon (12-4 PM) slots

DO $$
DECLARE
  start_date DATE := CURRENT_DATE;
  end_date DATE := CURRENT_DATE + INTERVAL '30 days';
  iter_date DATE;
  time_slots TEXT[] := ARRAY['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
  slot TEXT;
BEGIN
  iter_date := start_date;
  
  -- Loop through each date
  WHILE iter_date <= end_date LOOP
    -- Skip Sundays (day of week 0)
    IF EXTRACT(DOW FROM iter_date) != 0 THEN
      -- Insert time slots for this date
      FOREACH slot IN ARRAY time_slots LOOP
        INSERT INTO availability_schedule (date, time_slot, available_slots, booked_slots, active, created_at, updated_at)
        VALUES (iter_date, slot, 3, 0, true, NOW(), NOW())
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
    
    -- Move to next day
    iter_date := iter_date + INTERVAL '1 day';
  END LOOP;
END $$;