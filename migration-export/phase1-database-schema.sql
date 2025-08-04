-- Phase 1A: Complete Database Schema Export for Bay Area Cleaning Pros
-- Multi-Subdomain Migration Package
-- Generated: 2025-01-04

-- ============================================
-- ENUMS AND CUSTOM TYPES
-- ============================================

CREATE TYPE public.app_role AS ENUM (
    'customer',
    'subcontractor', 
    'office_manager',
    'owner',
    'super_admin',
    'enterprise_client'
);

-- ============================================
-- CORE BUSINESS TABLES
-- ============================================

-- Users and Authentication
CREATE TABLE public.profiles (
    id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    full_name text,
    avatar_url text,
    phone text,
    department text,
    employee_id text,
    role_display_name text,
    is_active boolean DEFAULT true,
    company_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Orders and Bookings System
CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    customer_name text,
    customer_email text,
    customer_phone text,
    amount integer NOT NULL,
    currency text DEFAULT 'usd',
    status text DEFAULT 'pending',
    cleaning_type text,
    frequency text,
    add_ons text[],
    square_footage integer,
    preferred_time text,
    scheduled_date date,
    scheduled_time text,
    next_service_date date,
    service_details jsonb,
    completion_notes text,
    employee_notes text,
    cancellation_reason text,
    is_recurring boolean DEFAULT false,
    recurring_frequency text,
    service_status text DEFAULT 'active',
    paused_until date,
    auto_charged boolean DEFAULT false,
    retention_discount_offered boolean DEFAULT false,
    retention_discount_accepted boolean DEFAULT false,
    stripe_session_id text,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid,
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    customer_phone text,
    service_address text NOT NULL,
    service_date date NOT NULL,
    service_time text NOT NULL,
    status text DEFAULT 'scheduled' NOT NULL,
    priority text DEFAULT 'normal',
    special_instructions text,
    assigned_employee_id uuid,
    estimated_duration integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Subcontractor Management
CREATE TABLE public.subcontractors (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    address text,
    city text,
    state text,
    zip_code text,
    is_available boolean DEFAULT true,
    calendar_id text,
    subscription_status text DEFAULT 'active',
    split_tier text,
    rating numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.subcontractor_applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    address text,
    city text,
    state text,
    zip_code text,
    why_join_us text NOT NULL,
    previous_cleaning_experience text,
    availability text NOT NULL,
    preferred_work_areas text,
    emergency_contact_name text NOT NULL,
    emergency_contact_phone text NOT NULL,
    has_drivers_license boolean DEFAULT false NOT NULL,
    drivers_license_image_url text,
    has_own_vehicle boolean DEFAULT false NOT NULL,
    can_lift_heavy_items boolean DEFAULT false NOT NULL,
    comfortable_with_chemicals boolean DEFAULT false NOT NULL,
    reliable_transportation boolean DEFAULT false NOT NULL,
    background_check_consent boolean DEFAULT false NOT NULL,
    brand_shirt_consent boolean DEFAULT false NOT NULL,
    subcontractor_agreement_consent boolean DEFAULT false NOT NULL,
    status text DEFAULT 'pending' NOT NULL,
    admin_notes text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Job Management
CREATE TABLE public.subcontractor_job_assignments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subcontractor_id uuid,
    booking_id uuid,
    status text DEFAULT 'assigned' NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    accepted_at timestamp with time zone,
    completed_at timestamp with time zone,
    dropped_at timestamp with time zone,
    drop_reason text,
    subcontractor_notes text,
    customer_rating integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.job_tracking (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id uuid,
    check_in_time timestamp with time zone,
    check_out_time timestamp with time zone,
    check_in_location text,
    check_out_location text,
    actual_duration interval,
    photos jsonb DEFAULT '[]'::jsonb,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Business Intelligence Tables
CREATE TABLE public.performance_metrics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subcontractor_id uuid,
    month_year date NOT NULL,
    jobs_completed integer DEFAULT 0,
    on_time_percentage numeric DEFAULT 0,
    customer_rating numeric DEFAULT 0,
    complaints_count integer DEFAULT 0,
    bonus_eligible boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.customer_feedback (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    booking_id uuid,
    subcontractor_id uuid,
    overall_rating integer,
    cleanliness_rating integer,
    timeliness_rating integer,
    professionalism_rating integer,
    feedback_text text,
    photos jsonb DEFAULT '[]'::jsonb,
    category text DEFAULT 'general',
    status text DEFAULT 'new',
    response_text text,
    responded_by uuid,
    responded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Revenue and Financial Tracking
CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    industry text,
    logo_url text,
    website text,
    email text,
    phone text,
    address text,
    city text,
    state text,
    zip_code text,
    business_license text,
    tax_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.contracts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    contract_number text NOT NULL,
    contract_type text NOT NULL,
    start_date date NOT NULL,
    end_date date,
    auto_renewal boolean DEFAULT false,
    renewal_notice_days integer DEFAULT 30,
    base_fee numeric,
    revenue_share_percentage numeric,
    minimum_payment numeric,
    maximum_payment numeric,
    performance_bonus_triggers jsonb,
    terms_and_conditions text,
    document_url text,
    signed_date timestamp with time zone,
    signed_by_client text,
    signed_by_divine text,
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================
-- REFERRAL AND MARKETING SYSTEM
-- ============================================

CREATE TABLE public.referral_codes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    owner_email text NOT NULL,
    owner_name text,
    reward_type text DEFAULT 'deep_clean_50_percent',
    max_uses integer,
    current_uses integer DEFAULT 0,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.referral_uses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    referral_code_id uuid,
    used_by_email text NOT NULL,
    used_by_name text,
    order_id uuid,
    reward_applied boolean DEFAULT false,
    used_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- CALENDAR AND AVAILABILITY SYSTEM
-- ============================================

CREATE TABLE public.busy_slots (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subcontractor_id uuid,
    calendar_id text NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    event_title text,
    event_id text,
    calendar_type text DEFAULT 'business' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (calendar_id, start_time, end_time)
);

CREATE TABLE public.user_calendar_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    provider text NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================
-- AUXILIARY TABLES
-- ============================================

CREATE TABLE public.commercial_estimates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_name text NOT NULL,
    contact_person text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    zip_code text NOT NULL,
    business_type text NOT NULL,
    service_type text NOT NULL,
    cleaning_type text NOT NULL,
    frequency text NOT NULL,
    square_footage integer NOT NULL,
    number_of_floors integer DEFAULT 1 NOT NULL,
    number_of_offices integer DEFAULT 1 NOT NULL,
    number_of_restrooms integer DEFAULT 1 NOT NULL,
    preferred_walkthrough_date text NOT NULL,
    preferred_walkthrough_time text NOT NULL,
    alternative_date text,
    alternative_time text,
    preferred_time text,
    special_requirements text,
    status text DEFAULT 'pending' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.order_tips (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid,
    subcontractor_id uuid,
    amount numeric NOT NULL,
    customer_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.order_status_updates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid,
    subcontractor_id uuid,
    status_message text NOT NULL,
    estimated_arrival_minutes integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at columns
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subcontractors_updated_at
    BEFORE UPDATE ON public.subcontractors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.busy_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_updates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- END OF SCHEMA EXPORT
-- ============================================