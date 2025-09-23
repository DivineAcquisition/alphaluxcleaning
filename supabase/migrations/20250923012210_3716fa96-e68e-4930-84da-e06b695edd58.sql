-- Add unique constraint to customers table email column
ALTER TABLE public.customers ADD CONSTRAINT customers_email_unique UNIQUE (email);