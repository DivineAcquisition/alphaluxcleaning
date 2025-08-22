-- Disable the trigger that's causing the gen_salt error during order creation
DROP TRIGGER IF EXISTS trigger_create_customer_account ON orders;

-- Also drop the problematic function to prevent any other usage
DROP FUNCTION IF EXISTS create_customer_account_on_booking();