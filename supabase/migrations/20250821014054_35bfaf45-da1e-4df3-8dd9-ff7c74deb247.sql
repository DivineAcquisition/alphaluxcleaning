-- Enable pgcrypto in the extensions schema (standard for Supabase)
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Ensure the create_customer_account_on_booking function can resolve pgcrypto functions
ALTER FUNCTION public.create_customer_account_on_booking() 
  SET search_path = 'public, extensions';
