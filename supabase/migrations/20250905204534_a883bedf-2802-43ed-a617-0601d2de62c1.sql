-- Phase 1A: Add New Roles Only

-- Add new roles to existing app_role enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'owner' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
        ALTER TYPE public.app_role ADD VALUE 'owner';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'dispatcher' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
        ALTER TYPE public.app_role ADD VALUE 'dispatcher';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cleaner' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
        ALTER TYPE public.app_role ADD VALUE 'cleaner';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'support' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
        ALTER TYPE public.app_role ADD VALUE 'support';
    END IF;
END $$;

-- Create job status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE public.job_status AS ENUM (
          'unassigned', 'offered', 'accepted', 'declined', 'in_progress', 
          'completed', 'no_show', 'cancelled', 'paid'
        );
    END IF;
END $$;