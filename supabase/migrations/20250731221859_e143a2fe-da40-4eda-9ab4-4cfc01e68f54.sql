-- Create a new test onboarding token with the first application we find
INSERT INTO public.subcontractor_onboarding_tokens (
  application_id,
  token,
  expires_at,
  is_active,
  used_at
) VALUES (
  (SELECT id FROM public.subcontractor_applications ORDER BY created_at DESC LIMIT 1),
  'TEST_TOKEN_NEW_2025',
  now() + interval '7 days',
  true,
  NULL
);