-- Lock down the live ghl_new_lead_notifications ledger. The create
-- migration was already applied on AlphaLuxClean without RLS, and the
-- table inherits GRANT ALL to anon. Enable RLS so only service_role
-- (edge functions) and active admins can see lead PII.

ALTER TABLE public.ghl_new_lead_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ghl_new_lead_notifications_service_role_all
  ON public.ghl_new_lead_notifications;
CREATE POLICY ghl_new_lead_notifications_service_role_all
  ON public.ghl_new_lead_notifications
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ghl_new_lead_notifications_admin_read
  ON public.ghl_new_lead_notifications;
CREATE POLICY ghl_new_lead_notifications_admin_read
  ON public.ghl_new_lead_notifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
