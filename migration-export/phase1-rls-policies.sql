-- Phase 1A: Row Level Security (RLS) Policies Export
-- Complete RLS Policy Recreation for Bay Area Cleaning Pros
-- Generated: 2025-01-04

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid());

-- System can insert profiles (for new user registration)
CREATE POLICY "System can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- ============================================
-- USER ROLES TABLE POLICIES
-- ============================================

-- Users can view their own roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

-- Admins can manage all user roles
CREATE POLICY "Admins can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- ============================================
-- ORDERS TABLE POLICIES
-- ============================================

-- Public order lookup (for payment and status checks)
CREATE POLICY "public_order_lookup" 
ON public.orders 
FOR SELECT 
USING (true);

-- Users can view their own orders
CREATE POLICY "select_own_orders" 
ON public.orders 
FOR SELECT 
USING (user_id = auth.uid());

-- System can insert orders
CREATE POLICY "insert_order" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- System and admins can update orders
CREATE POLICY "update_order" 
ON public.orders 
FOR UPDATE 
USING (true);

-- Customers can update their own recurring services
CREATE POLICY "Customers can update their own recurring services" 
ON public.orders 
FOR UPDATE 
USING (user_id = auth.uid());

-- Admins can delete orders
CREATE POLICY "Admins can delete orders" 
ON public.orders 
FOR DELETE 
USING (true);

-- Admins can manage all orders
CREATE POLICY "Admins can manage all orders" 
ON public.orders 
FOR ALL 
USING (true);

-- ============================================
-- BOOKINGS TABLE POLICIES
-- ============================================

-- Customers can view their own bookings
CREATE POLICY "Customers can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (customer_email = auth.email());

-- System can insert bookings
CREATE POLICY "System can insert bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

-- ============================================
-- SUBCONTRACTOR MANAGEMENT POLICIES
-- ============================================

-- Subcontractors table
CREATE POLICY "Subcontractors can view their own profile" 
ON public.subcontractors 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Subcontractors can update their own profile" 
ON public.subcontractors 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "System can manage subcontractors" 
ON public.subcontractors 
FOR ALL 
USING (true);

-- Subcontractor applications
CREATE POLICY "Anyone can submit applications" 
ON public.subcontractor_applications 
FOR INSERT 
WITH CHECK (true);

-- Job assignments
CREATE POLICY "Subcontractors can view their own assignments" 
ON public.subcontractor_job_assignments 
FOR SELECT 
USING (subcontractor_id IN (
  SELECT id FROM subcontractors WHERE user_id = auth.uid()
));

CREATE POLICY "Subcontractors can update their own assignments" 
ON public.subcontractor_job_assignments 
FOR UPDATE 
USING (subcontractor_id IN (
  SELECT id FROM subcontractors WHERE user_id = auth.uid()
));

CREATE POLICY "System can manage job assignments" 
ON public.subcontractor_job_assignments 
FOR ALL 
USING (true);

-- ============================================
-- JOB TRACKING POLICIES
-- ============================================

-- Subcontractors can manage their own job tracking
CREATE POLICY "Subcontractors can manage their own job tracking" 
ON public.job_tracking 
FOR ALL 
USING (assignment_id IN (
  SELECT sja.id 
  FROM subcontractor_job_assignments sja 
  JOIN subcontractors s ON sja.subcontractor_id = s.id 
  WHERE s.user_id = auth.uid()
));

-- Admins can manage job tracking
CREATE POLICY "Admins can manage job tracking" 
ON public.job_tracking 
FOR ALL 
USING (true);

-- ============================================
-- PERFORMANCE AND FEEDBACK POLICIES
-- ============================================

-- Performance metrics
CREATE POLICY "Subcontractors can view their own metrics" 
ON public.performance_metrics 
FOR SELECT 
USING (subcontractor_id IN (
  SELECT id FROM subcontractors WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage performance metrics" 
ON public.performance_metrics 
FOR ALL 
USING (true);

-- Customer feedback
CREATE POLICY "Subcontractors can view feedback about them" 
ON public.customer_feedback 
FOR SELECT 
USING (subcontractor_id IN (
  SELECT id FROM subcontractors WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage customer feedback" 
ON public.customer_feedback 
FOR ALL 
USING (true);

-- ============================================
-- REFERRAL SYSTEM POLICIES
-- ============================================

-- Referral codes
CREATE POLICY "Anyone can read active referral codes" 
ON public.referral_codes 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can create their own referral codes" 
ON public.referral_codes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own referral codes" 
ON public.referral_codes 
FOR UPDATE 
USING (true);

-- Referral uses
CREATE POLICY "Anyone can insert referral uses" 
ON public.referral_uses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view referral uses for their codes" 
ON public.referral_uses 
FOR SELECT 
USING (true);

-- ============================================
-- CALENDAR AND AVAILABILITY POLICIES
-- ============================================

-- Busy slots
CREATE POLICY "Subcontractors can view their own busy slots" 
ON public.busy_slots 
FOR SELECT 
USING (subcontractor_id IN (
  SELECT id FROM subcontractors WHERE user_id = auth.uid()
));

CREATE POLICY "System can manage busy slots" 
ON public.busy_slots 
FOR ALL 
USING (true);

-- ============================================
-- COMMERCIAL ESTIMATES POLICIES
-- ============================================

CREATE POLICY "Anyone can insert commercial estimates" 
ON public.commercial_estimates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view commercial estimates" 
ON public.commercial_estimates 
FOR SELECT 
USING (true);

-- ============================================
-- ORDER TIPS POLICIES
-- ============================================

CREATE POLICY "Anyone can insert tips" 
ON public.order_tips 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Subcontractors can view their own tips" 
ON public.order_tips 
FOR SELECT 
USING (subcontractor_id IN (
  SELECT id FROM subcontractors WHERE user_id = auth.uid()
));

-- ============================================
-- ORDER STATUS UPDATES POLICIES
-- ============================================

CREATE POLICY "Anyone can view status updates for their orders" 
ON public.order_status_updates 
FOR SELECT 
USING (true);

CREATE POLICY "Subcontractors can insert their own status updates" 
ON public.order_status_updates 
FOR INSERT 
WITH CHECK (subcontractor_id IN (
  SELECT id FROM subcontractors WHERE user_id = auth.uid()
));

CREATE POLICY "Subcontractors can update their own status updates" 
ON public.order_status_updates 
FOR UPDATE 
USING (subcontractor_id IN (
  SELECT id FROM subcontractors WHERE user_id = auth.uid()
));

-- ============================================
-- SERVICE MODIFICATIONS POLICIES
-- ============================================

CREATE POLICY "Users can view their own service modifications" 
ON public.service_modifications 
FOR SELECT 
USING (order_id IN (
  SELECT id FROM orders WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create their own service modifications" 
ON public.service_modifications 
FOR INSERT 
WITH CHECK (order_id IN (
  SELECT id FROM orders WHERE user_id = auth.uid()
));

-- ============================================
-- SECURITY LOGS POLICIES
-- ============================================

CREATE POLICY "System can insert security logs" 
ON public.security_logs 
FOR INSERT 
WITH CHECK (true);

-- ============================================
-- ADDITIONAL MISSING TABLE POLICIES
-- ============================================

-- Job drops tracking
CREATE POLICY "Subcontractors can view their own drops" 
ON public.subcontractor_job_drops 
FOR SELECT 
USING (subcontractor_id IN (
  SELECT id FROM subcontractors WHERE user_id = auth.uid()
));

CREATE POLICY "System can insert job drops" 
ON public.subcontractor_job_drops 
FOR INSERT 
WITH CHECK (true);

-- Incidents tracking
CREATE POLICY "Subcontractors can view incidents about them" 
ON public.incidents 
FOR SELECT 
USING (subcontractor_id IN (
  SELECT id FROM subcontractors WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage incidents" 
ON public.incidents 
FOR ALL 
USING (true);

-- Messages
CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (sender_id = auth.uid());

-- Auth redirects (admin only)
CREATE POLICY "Admins can manage auth redirects" 
ON public.auth_redirects 
FOR ALL 
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Interview slots
CREATE POLICY "Anyone can view available slots" 
ON public.interview_slots 
FOR SELECT 
USING (is_available = true);

CREATE POLICY "System can manage interview slots" 
ON public.interview_slots 
FOR ALL 
USING (true);

-- Interview tokens (function access only)
CREATE POLICY "Interview tokens are only accessible by functions" 
ON public.interview_tokens 
FOR ALL 
USING (false);

-- ============================================
-- END OF RLS POLICIES EXPORT
-- ============================================