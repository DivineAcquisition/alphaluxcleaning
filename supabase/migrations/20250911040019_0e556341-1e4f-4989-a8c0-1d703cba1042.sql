-- Insert default email settings for Bay Area Cleaning Pros
INSERT INTO public.email_settings (
  id, 
  company_id, 
  from_name, 
  from_email, 
  reply_to, 
  brand
) VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440000',
  'Bay Area Cleaning Pros',
  'notifications@bayareacleaningpros.com',
  'support@bayareacleaningpros.com',
  '{"logo_url": "", "color_hex": "#A58FFF"}'::jsonb
) ON CONFLICT (company_id) DO UPDATE SET
  from_name = EXCLUDED.from_name,
  from_email = EXCLUDED.from_email,
  reply_to = EXCLUDED.reply_to,
  brand = EXCLUDED.brand,
  updated_at = now();