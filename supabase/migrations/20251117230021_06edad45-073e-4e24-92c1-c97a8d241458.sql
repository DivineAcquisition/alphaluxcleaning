-- Add source tracking and created_by fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'customer_web' CHECK (source IN ('customer_web', 'csr_phone', 'admin_manual')),
ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id);

-- Create index for faster filtering by source
CREATE INDEX IF NOT EXISTS idx_bookings_source ON bookings(source);
CREATE INDEX IF NOT EXISTS idx_bookings_created_by ON bookings(created_by_user_id);

-- Add comment for documentation
COMMENT ON COLUMN bookings.source IS 'Origin of booking: customer_web (customer booked online), csr_phone (CSR phone booking), admin_manual (manual admin entry)';
COMMENT ON COLUMN bookings.created_by_user_id IS 'Admin user who created this booking (for CSR/admin bookings only)';