-- Add Square payment columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS square_payment_id TEXT,
ADD COLUMN IF NOT EXISTS square_customer_id TEXT;

-- Add Square customer ID to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS square_customer_id TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_square_payment_id ON bookings(square_payment_id);
CREATE INDEX IF NOT EXISTS idx_customers_square_customer_id ON customers(square_customer_id);