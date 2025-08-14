-- Fix Critical Security Issue: Messages Table Privacy
-- Messages table contains private communications and is currently publicly readable
-- This migration implements proper RLS policies to protect user privacy

-- =============================================
-- 1. MESSAGES TABLE SECURITY FIX
-- =============================================

-- Create comprehensive RLS policies for messages table
-- Users can only read messages where they are sender or recipient
CREATE POLICY "messages_users_can_read_own" ON public.messages
  FOR SELECT  
  USING (
    sender_id = auth.uid() OR 
    recipient_id = auth.uid() OR
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

-- Users can update messages they sent or received (e.g., mark as read)
CREATE POLICY "messages_users_can_update_own" ON public.messages
  FOR UPDATE
  USING (
    sender_id = auth.uid() OR 
    recipient_id = auth.uid() OR
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
  WITH CHECK (
    sender_id = auth.uid() OR 
    recipient_id = auth.uid() OR
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

-- Only admins can delete messages (preserve message history for compliance)
CREATE POLICY "messages_admin_can_delete" ON public.messages
  FOR DELETE
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- Enhance the existing insert policy to allow system/admin inserts
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "messages_secure_insert" ON public.messages
  FOR INSERT
  WITH CHECK (
    -- Users can only send messages with themselves as sender
    sender_id = auth.uid() OR
    -- Admins can send messages on behalf of others (for admin broadcasts)
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

-- =============================================
-- 2. LOG SECURITY FIX
-- =============================================

-- Log that this critical security fix has been applied
INSERT INTO public.security_logs (action, details, risk_level)
VALUES (
  'messages_privacy_security_fix_applied',
  jsonb_build_object(
    'timestamp', now(),
    'table_secured', 'messages',
    'vulnerability_type', 'publicly_readable_private_communications',
    'policies_applied', ARRAY[
      'messages_users_can_read_own',
      'messages_users_can_update_own', 
      'messages_admin_can_delete',
      'messages_secure_insert'
    ],
    'description', 'Fixed critical privacy vulnerability where all messages were publicly readable'
  ),
  'critical'
);