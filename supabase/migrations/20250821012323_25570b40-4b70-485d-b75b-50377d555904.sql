-- Delete all orders created today (2025-08-21)
DELETE FROM public.orders 
WHERE DATE(created_at) = CURRENT_DATE;

-- Also clean up any related data that might reference these orders
DELETE FROM public.order_status_updates 
WHERE order_id IN (
  SELECT id FROM public.orders 
  WHERE DATE(created_at) = CURRENT_DATE
);

DELETE FROM public.customer_notifications 
WHERE order_id IN (
  SELECT id FROM public.orders 
  WHERE DATE(created_at) = CURRENT_DATE
);

DELETE FROM public.order_tips 
WHERE order_id IN (
  SELECT id FROM public.orders 
  WHERE DATE(created_at) = CURRENT_DATE
);