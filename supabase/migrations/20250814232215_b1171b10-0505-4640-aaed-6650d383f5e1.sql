-- Phase 1: Clean up uncompleted orders
-- Delete pending_payment orders older than 24 hours and pending orders older than 7 days

-- First, let's log what we're about to delete for tracking
INSERT INTO security_logs (action, details)
SELECT 
  'order_cleanup_phase1',
  jsonb_build_object(
    'deleted_orders', json_agg(
      jsonb_build_object(
        'id', id,
        'status', status,
        'created_at', created_at,
        'customer_email', customer_email,
        'amount', amount
      )
    ),
    'cleanup_timestamp', now(),
    'cleanup_reason', 'Phase 1: Remove stale uncompleted orders'
  )
FROM orders 
WHERE (
  (status = 'pending_payment' AND created_at < now() - interval '24 hours')
  OR 
  (status = 'pending' AND created_at < now() - interval '7 days')
);

-- Now delete the stale orders
DELETE FROM orders 
WHERE (
  (status = 'pending_payment' AND created_at < now() - interval '24 hours')
  OR 
  (status = 'pending' AND created_at < now() - interval '7 days')
);