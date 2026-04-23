UPDATE public.service_areas
SET active = true,
    updated_at = now()
WHERE state = 'CA'
  AND active = false;