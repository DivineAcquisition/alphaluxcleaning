-- First remove duplicates by keeping only the most recent record for each email
WITH duplicates AS (
  SELECT id, email, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM public.customers
)
DELETE FROM public.customers 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now add the unique constraint
ALTER TABLE public.customers ADD CONSTRAINT customers_email_unique UNIQUE (email);