-- Fix critical security vulnerability in subcontractor_notifications table

-- Remove the dangerous "System can manage notifications" policy that allows public access
DROP POLICY IF EXISTS "System can manage notifications" ON public.subcontractor_notifications;

-- Clean up duplicate policies (there are duplicates for viewing and updating)
DROP POLICY IF EXISTS "Subcontractors can view their notifications" ON public.subcontractor_notifications;
DROP POLICY IF EXISTS "Subcontractors can update their notifications" ON public.subcontractor_notifications;

-- Keep the secure policies that restrict access to intended recipients
-- The remaining policies are properly scoped:
-- - "Subcontractors can view their own notifications" - only shows notifications for the authenticated user
-- - "Subcontractors can update their own notifications" - only allows updates to own notifications
-- - "System can create notifications" - allows system to create notifications but not read them

-- Add a secure admin policy for notification management
CREATE POLICY "Admins can manage all notifications"
ON public.subcontractor_notifications
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
);

-- Add a secure system policy for creating notifications (restricting the existing one)
DROP POLICY IF EXISTS "System can create notifications" ON public.subcontractor_notifications;

CREATE POLICY "System can create notifications"
ON public.subcontractor_notifications
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Create a secure function for notification creation that doesn't expose existing data
CREATE OR REPLACE FUNCTION public.create_notification_safe(
  p_subcontractor_id uuid,
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'general'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  -- Insert notification without exposing existing data
  INSERT INTO public.subcontractor_notifications (
    subcontractor_id,
    user_id,
    title,
    message,
    type,
    read
  ) VALUES (
    p_subcontractor_id,
    p_user_id,
    p_title,
    p_message,
    p_type,
    false
  ) RETURNING id INTO v_notification_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'notification_id', v_notification_id,
    'message', 'Notification created successfully'
  );
END;
$$;

-- Grant execute permissions for the safe creation function
GRANT EXECUTE ON FUNCTION public.create_notification_safe(uuid, uuid, text, text, text) TO authenticated;