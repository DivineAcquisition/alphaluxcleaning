-- CRITICAL SECURITY FIX: Add missing RLS policies for tables without proper access controls

-- Companies table - Admin/owner access only
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.companies;
CREATE POLICY "Admins can manage companies"
ON public.companies
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Contracts table - Admin/owner access only  
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.contracts;
CREATE POLICY "Admins can manage contracts"
ON public.contracts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Documents table - Role-based access with confidentiality checks
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
CREATE POLICY "Admins can manage invoices"
ON public.invoices
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Locations table - Admin/owner access only
CREATE POLICY "Admins can manage locations"
ON public.locations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Payments table - Admin access only
CREATE POLICY "Admins can manage payments"
ON public.payments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Revenue entries table - Admin/owner access only
CREATE POLICY "Admins can manage revenue entries"
ON public.revenue_entries
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Services table - Admin access only (fixing the jsonb cast issue)
CREATE POLICY "Admins can manage services"
ON public.services
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Deals table - Users can only view deals assigned to them
CREATE POLICY "Users can manage assigned deals"
ON public.deals
FOR ALL
TO authenticated
USING (assigned_to = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role));