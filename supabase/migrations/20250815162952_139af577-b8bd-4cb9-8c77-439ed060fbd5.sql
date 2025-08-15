-- Fix remaining security issue: Set search_path for get_automation_success_rate function

CREATE OR REPLACE FUNCTION public.get_automation_success_rate(rule_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN (success_count + failure_count) = 0 THEN 0
      ELSE ROUND((success_count::NUMERIC / (success_count + failure_count)) * 100, 2)
    END
  FROM public.automation_rules
  WHERE id = rule_id;
$$;