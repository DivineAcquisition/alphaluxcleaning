-- Create a fake subcontractor application and approve it
INSERT INTO public.subcontractor_applications (
  id,
  full_name,
  email,
  phone,
  why_join_us,
  previous_cleaning_experience,
  availability,
  preferred_work_areas,
  emergency_contact_name,
  emergency_contact_phone,
  address,
  city,
  state,
  zip_code,
  has_drivers_license,
  has_own_vehicle,
  can_lift_heavy_items,
  comfortable_with_chemicals,
  reliable_transportation,
  background_check_consent,
  brand_shirt_consent,
  subcontractor_agreement_consent,
  status,
  reviewed_at,
  admin_notes
) VALUES (
  gen_random_uuid(),
  'Divine Acquisition Test User',
  'divineacquisition.io@gmail.com',
  '+1-555-0123',
  'I want to join your team to grow my cleaning business and provide excellent service to Bay Area customers.',
  'I have 5+ years of professional cleaning experience including residential and commercial properties. Experience with eco-friendly products and advanced cleaning techniques.',
  'Monday-Friday 8AM-6PM, Weekends available for special projects',
  'San Francisco, Oakland, Berkeley, and surrounding Bay Area',
  'Emergency Contact Person',
  '+1-555-0124',
  '123 Test Street',
  'San Francisco',
  'CA',
  '94102',
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  'approved',
  now(),
  'Test application created for development purposes'
)
RETURNING id;

-- Generate secure onboarding token for the application
INSERT INTO public.subcontractor_onboarding_tokens (
  token,
  application_id,
  expires_at,
  is_active
) 
SELECT 
  'TEST_TOKEN_' || upper(substring(md5(random()::text), 1, 16)),
  id,
  now() + INTERVAL '1 day',
  true
FROM public.subcontractor_applications 
WHERE email = 'divineacquisition.io@gmail.com' 
AND status = 'approved'
RETURNING token, application_id;