-- Support numbers are public contact info (shown on the site, booking
-- flow, and emails). Allow anyone to read the live registry so the UI
-- never has to bake in a phone number. Writes stay admin / service-role.
CREATE POLICY sms_state_numbers_public_select
  ON public.sms_state_numbers
  FOR SELECT
  TO anon, authenticated
  USING (true);
