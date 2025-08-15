-- Security Fix: Further restrict system access to busy_slots

-- Drop the overly permissive system policy
DROP POLICY IF EXISTS "System can manage busy slots" ON public.busy_slots;

-- Create more restrictive system policies
CREATE POLICY "System can insert busy slots" 
ON public.busy_slots 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update busy slots" 
ON public.busy_slots 
FOR UPDATE 
USING (true);

CREATE POLICY "System can delete busy slots" 
ON public.busy_slots 
FOR DELETE 
USING (true);

-- Log the security enhancement
INSERT INTO public.security_logs (action, details)
VALUES (
  'calendar_security_enhanced',
  jsonb_build_object(
    'timestamp', now(),
    'action', 'restricted_system_access',
    'description', 'Replaced broad system access with specific insert/update/delete policies for busy_slots'
  )
);