-- Update existing subcontractor to new Tier 2 (Professional) rates
UPDATE subcontractors 
SET 
  tier_level = 2,
  hourly_rate = 18.00,
  monthly_fee = 50.00,
  updated_at = now()
WHERE tier_level = 1;