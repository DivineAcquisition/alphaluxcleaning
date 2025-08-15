-- Security Fix: Restrict access to busy_slots table to prevent calendar data exposure

-- Drop existing policies that may allow public access
DROP POLICY IF EXISTS "Admins can view all busy slots" ON public.busy_slots;
DROP POLICY IF EXISTS "Subcontractors can view their own busy slots" ON public.busy_slots;
DROP POLICY IF EXISTS "System can manage busy slots" ON public.busy_slots;

-- Create secure RLS policies for busy_slots
CREATE POLICY "Subcontractors can view their own busy slots" 
ON public.busy_slots 
FOR SELECT 
USING (
  subcontractor_id IN (
    SELECT id FROM public.subcontractors 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all busy slots" 
ON public.busy_slots 
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "System can manage busy slots" 
ON public.busy_slots 
FOR ALL 
USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.busy_slots ENABLE ROW LEVEL SECURITY;

-- Additional security: Create index for better performance on secured queries
CREATE INDEX IF NOT EXISTS idx_busy_slots_subcontractor_auth 
ON public.busy_slots(subcontractor_id);

-- Log security fix
INSERT INTO public.security_logs (action, details)
VALUES (
  'calendar_security_hardening',
  jsonb_build_object(
    'timestamp', now(),
    'action', 'restricted_busy_slots_access',
    'description', 'Removed public access to calendar data, restricted to authenticated subcontractors and admins only'
  )
);