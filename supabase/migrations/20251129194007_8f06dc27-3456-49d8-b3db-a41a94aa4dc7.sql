-- Create CYBER90 Black Friday promo code for 90-Day Plan
INSERT INTO promo_codes (
  code,
  type,
  amount_cents,
  applies_to,
  service_type_restriction,
  min_subtotal_cents,
  max_redemptions,
  starts_at,
  expires_at,
  active,
  metadata
) VALUES (
  'CYBER90',
  'FIXED',
  10000, -- $100 off
  'ONE_TIME',
  '90_day_plan',
  0,
  100,
  NOW(),
  '2025-12-02 23:59:59',
  true,
  '{"campaign": "black_friday_2025", "description": "Black Friday $100 off 90-Day Reset Plan"}'::jsonb
);