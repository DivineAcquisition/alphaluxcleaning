-- Create function to trigger Airtable sync on order changes
CREATE OR REPLACE FUNCTION trigger_airtable_sync()
RETURNS trigger AS $$
BEGIN
  -- Call the edge function to sync order to Airtable
  PERFORM pg_http_post(
    'https://kqoezqzogleaaupjzxch.supabase.co/functions/v1/sync-to-airtable',
    jsonb_build_object(
      'action', 'sync_order',
      'data', to_jsonb(NEW)
    )::text,
    'application/json'
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the main operation
  INSERT INTO webhook_logs (
    webhook_url,
    payload,
    response_status,
    success,
    error_message
  ) VALUES (
    'airtable_sync',
    to_jsonb(NEW),
    500,
    false,
    SQLERRM
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for orders table
DROP TRIGGER IF EXISTS orders_airtable_sync_trigger ON orders;
CREATE TRIGGER orders_airtable_sync_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_airtable_sync();

-- Create trigger for bookings table
DROP TRIGGER IF EXISTS bookings_airtable_sync_trigger ON bookings;
CREATE TRIGGER bookings_airtable_sync_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_airtable_sync();