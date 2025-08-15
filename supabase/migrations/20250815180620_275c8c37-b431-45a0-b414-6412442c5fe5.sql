-- Security hardening: Restrict public access to business-critical tables

-- Update tier_system_config RLS policies to require authentication
DROP POLICY IF EXISTS "Anyone can view tier system config" ON public.tier_system_config;

CREATE POLICY "Authenticated users can view tier system config" 
ON public.tier_system_config 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Update search_indices RLS policies to require authentication
DROP POLICY IF EXISTS "Users can search indices" ON public.search_indices;

CREATE POLICY "Authenticated users can search indices" 
ON public.search_indices 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update busy_slots RLS policies to require authentication for subcontractor calendar access
DROP POLICY IF EXISTS "Subcontractors can view their own busy slots" ON public.busy_slots;

CREATE POLICY "Subcontractors can view their own busy slots" 
ON public.busy_slots 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    subcontractor_id IN (
      SELECT id FROM subcontractors WHERE user_id = auth.uid()
    ) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
  )
);

CREATE POLICY "Admins can view all busy slots" 
ON public.busy_slots 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- System can still manage busy slots for calendar sync
-- (existing "System can manage busy slots" policy remains unchanged)