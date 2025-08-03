-- Add new roles to the app_role enum (split into separate transaction)
ALTER TYPE public.app_role ADD VALUE 'owner';
ALTER TYPE public.app_role ADD VALUE 'office_manager';
ALTER TYPE public.app_role ADD VALUE 'field_cleaner';
ALTER TYPE public.app_role ADD VALUE 'recurring_cleaner';
ALTER TYPE public.app_role ADD VALUE 'subcontractor_partner';
ALTER TYPE public.app_role ADD VALUE 'client';