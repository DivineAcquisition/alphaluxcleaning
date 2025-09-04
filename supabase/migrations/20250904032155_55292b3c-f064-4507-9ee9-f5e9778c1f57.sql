-- Update domain routing configuration for new domain structure

-- Clear existing domain routing and insert new configuration
DELETE FROM domain_routing_config;

INSERT INTO domain_routing_config (subdomain, allowed_roles, default_redirect_path, company_id, is_active) VALUES
('app', '{"admin", "manager"}', '/admin', '550e8400-e29b-41d4-a716-446655440000', true),
('contractor', '{"contractor"}', '/subcontractor-hub', '550e8400-e29b-41d4-a716-446655440000', true),
('portal', '{"customer"}', '/customer-portal-dashboard', '550e8400-e29b-41d4-a716-446655440000', true),
('book', '{"customer", "admin", "manager", "contractor"}', '/', '550e8400-e29b-41d4-a716-446655440000', true);