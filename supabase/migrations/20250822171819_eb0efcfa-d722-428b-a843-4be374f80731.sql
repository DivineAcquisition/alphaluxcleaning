-- Delete all test orders and related data
DELETE FROM order_tips;
DELETE FROM customer_notifications WHERE order_id IS NOT NULL;
DELETE FROM orders;