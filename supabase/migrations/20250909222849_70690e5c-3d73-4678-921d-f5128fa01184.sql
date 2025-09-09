-- Drop existing trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_subcontractor_notifications_updated_at ON public.subcontractor_notifications;

-- Recreate the trigger for subcontractor_notifications
CREATE TRIGGER update_subcontractor_notifications_updated_at
  BEFORE UPDATE ON public.subcontractor_notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();