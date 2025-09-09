-- Phase 1: Remove non-essential database tables
-- This will significantly reduce infrastructure complexity while preserving core business functionality

-- Remove Advanced CRM and Enterprise Tables
DROP TABLE IF EXISTS public.deals CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE; 
DROP TABLE IF EXISTS public.contracts CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;

-- Remove Complex BI and Analytics Tables
DROP TABLE IF EXISTS public.bi_reports CASCADE;
DROP TABLE IF EXISTS public.bi_insights_cache CASCADE;
DROP TABLE IF EXISTS public.search_indices CASCADE;

-- Remove Over-Engineered Automation Tables
DROP TABLE IF EXISTS public.automation_rules CASCADE;
DROP TABLE IF EXISTS public.automation_executions CASCADE; 
DROP TABLE IF EXISTS public.automation_assignment_rules CASCADE;
DROP TABLE IF EXISTS public.automated_notification_triggers CASCADE;

-- Remove Complex Security Tables (keep basic security)
DROP TABLE IF EXISTS public.security_alerts CASCADE;
DROP TABLE IF EXISTS public.ip_threat_intelligence CASCADE;
DROP TABLE IF EXISTS public.failed_login_attempts CASCADE;

-- Remove Advanced Payroll System
DROP TABLE IF EXISTS public.payroll_periods CASCADE;
DROP TABLE IF EXISTS public.payroll_records CASCADE;
DROP TABLE IF EXISTS public.payment_retries CASCADE;

-- Remove Complex Integration Tables
DROP TABLE IF EXISTS public.integration_configs CASCADE;
DROP TABLE IF EXISTS public.contractor_webhooks_outbox CASCADE;
DROP TABLE IF EXISTS public.delivery_logs CASCADE;

-- Remove Multi-Domain Complexity
DROP TABLE IF EXISTS public.domain_routing_config CASCADE;
DROP TABLE IF EXISTS public.auth_redirects CASCADE;

-- Remove Advanced Communication Tables  
DROP TABLE IF EXISTS public.contractor_message_templates CASCADE;
DROP TABLE IF EXISTS public.contractor_messages CASCADE;
DROP TABLE IF EXISTS public.comms_preferences CASCADE;

-- Remove Advanced Notification System (keep basic notifications)
DROP TABLE IF EXISTS public.notification_templates CASCADE;
DROP TABLE IF EXISTS public.notification_deliveries CASCADE;
DROP TABLE IF EXISTS public.notification_analytics CASCADE;
DROP TABLE IF EXISTS public.reminder_queue CASCADE;

-- Remove Complex Job Management Tables
DROP TABLE IF EXISTS public.job_assignment_audit CASCADE;
DROP TABLE IF EXISTS public.assignment_analytics CASCADE;
DROP TABLE IF EXISTS public.assignment_queue CASCADE;

-- Remove Advanced Analytics
DROP TABLE IF EXISTS public.payment_analytics CASCADE;
DROP TABLE IF EXISTS public.revenue_entries CASCADE;
DROP TABLE IF EXISTS public.feature_usage CASCADE;
DROP TABLE IF EXISTS public.performance_metrics_log CASCADE;

-- Remove Misc Non-Essential Tables
DROP TABLE IF EXISTS public.shortlinks CASCADE;
DROP TABLE IF EXISTS public.magic_tokens CASCADE;
DROP TABLE IF EXISTS public.interview_slots CASCADE;
DROP TABLE IF EXISTS public.interview_tokens CASCADE;
DROP TABLE IF EXISTS public.incidents CASCADE;
DROP TABLE IF EXISTS public.inbound_events CASCADE;
DROP TABLE IF EXISTS public.ghl_contacts CASCADE;
DROP TABLE IF EXISTS public.webhook_test_orders CASCADE;

-- Clean up message system complexity
DROP TABLE IF EXISTS public.message_queue CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;

-- Remove duplicate/legacy tables
DROP TABLE IF EXISTS public.cleaners CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.payouts CASCADE;

-- Remove advanced subcontractor features
DROP TABLE IF EXISTS public.subcontractor_blackouts CASCADE;
DROP TABLE IF EXISTS public.subcontractor_job_drops CASCADE;
DROP TABLE IF EXISTS public.subcontractor_restrictions CASCADE;
DROP TABLE IF EXISTS public.subcontractor_sensitive CASCADE;
DROP TABLE IF EXISTS public.subcontractor_profiles CASCADE;
DROP TABLE IF EXISTS public.subcontractor_performance_metrics CASCADE;

-- Remove service modification tracking
DROP TABLE IF EXISTS public.service_modifications CASCADE;
DROP TABLE IF EXISTS public.quality_reports CASCADE;

-- Remove tip complexity 
DROP TABLE IF EXISTS public.recurring_tip_schedules CASCADE;