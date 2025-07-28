-- Clean up all subcontractor-related data
-- First, remove all subcontractor profiles and related data

-- Delete from related tables first (due to foreign key constraints)
DELETE FROM subcontractor_payments;
DELETE FROM subcontractor_job_drops;
DELETE FROM subcontractor_job_assignments;
DELETE FROM subcontractor_restrictions;
DELETE FROM subcontractor_notifications;
DELETE FROM subcontractor_applications;

-- Delete all subcontractor profiles
DELETE FROM subcontractors;

-- Remove any user roles that are 'employee' (since subcontractor doesn't exist in enum)
DELETE FROM user_roles WHERE role = 'employee';

-- Update any bookings that were assigned to employees/subcontractors
UPDATE bookings SET assigned_employee_id = NULL WHERE assigned_employee_id IS NOT NULL;