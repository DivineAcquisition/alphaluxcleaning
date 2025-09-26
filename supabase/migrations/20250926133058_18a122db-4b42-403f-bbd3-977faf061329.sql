-- Create trigger to automatically call integrations when booking is confirmed
CREATE TRIGGER trigger_booking_integrations_on_confirm
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_booking_integrations();