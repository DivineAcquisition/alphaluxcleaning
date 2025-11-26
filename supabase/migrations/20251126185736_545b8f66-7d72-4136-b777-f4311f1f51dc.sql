-- Fix RLS policy on customers table to allow inserts
-- The issue is both policies are RESTRICTIVE, causing conflicts
-- We need to make the anonymous insert policy PERMISSIVE

DROP POLICY IF EXISTS "Allow anonymous insert on customers" ON public.customers;

CREATE POLICY "Allow anonymous insert on customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (true);

-- This policy is now PERMISSIVE (default), allowing anonymous inserts
-- while the admin policy can still control admin-specific inserts