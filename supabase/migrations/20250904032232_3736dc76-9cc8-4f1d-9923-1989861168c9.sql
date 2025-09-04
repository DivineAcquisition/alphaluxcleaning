-- Add allowed_roles column to domain_routing_config table

ALTER TABLE domain_routing_config 
ADD COLUMN IF NOT EXISTS allowed_roles app_role[] NOT NULL DEFAULT '{"customer"}';

-- Now insert the domain configuration
DELETE FROM domain_routing_config;

INSERT INTO domain_routing_config (subdomain, allowed_roles, default_redirect_path, company_id, is_active) VALUES
('app', '{"admin", "manager"}', '/admin', '550e8400-e29b-41d4-a716-446655440000', true),
('contractor', '{"contractor"}', '/subcontractor-hub', '550e8400-e29b-41d4-a716-446655440000', true),
('portal', '{"customer"}', '/customer-portal-dashboard', '550e8400-e29b-41d4-a716-446655440000', true),
('book', '{"customer", "admin", "manager", "contractor"}', '/', '550e8400-e29b-41d4-a716-446655440000', true);