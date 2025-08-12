-- CRITICAL SECURITY FIX: Add missing RLS policies for tables without proper access controls

-- Check which tables need RLS policies by adding them with IF NOT EXISTS equivalent

-- Documents table - Role-based access with confidentiality checks
DROP POLICY IF EXISTS "Users can view non-confidential documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can manage all documents" ON public.documents;

CREATE POLICY "Users can view non-confidential documents"
ON public.documents
FOR SELECT
TO authenticated
USING (NOT is_confidential OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can manage all documents"
ON public.documents
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Invoices table - Admin access only
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
CREATE POLICY "Admins can manage invoices"
ON public.invoices
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Locations table - Admin/owner access only  
DROP POLICY IF EXISTS "Admins can manage locations" ON public.locations;
CREATE POLICY "Admins can manage locations"
ON public.locations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Payments table - Admin access only
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
CREATE POLICY "Admins can manage payments"
ON public.payments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Revenue entries table - Admin/owner access only
DROP POLICY IF EXISTS "Admins can manage revenue entries" ON public.revenue_entries;
CREATE POLICY "Admins can manage revenue entries"
ON public.revenue_entries
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Services table - Admin access only
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services"
ON public.services
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));