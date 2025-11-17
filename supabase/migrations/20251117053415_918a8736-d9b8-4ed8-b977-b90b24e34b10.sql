-- Update test booking with 90-Day Plan offer data
UPDATE bookings 
SET 
  offer_name = '90-Day Reset & Maintain Plan',
  offer_type = '90_day_plan',
  visit_count = 4,
  is_recurring = true,
  est_price = 699.00,
  deposit_amount = 175.00,
  balance_due = 524.00
WHERE id = '83ea1bcd-e791-4343-9990-7331f0fc0191';