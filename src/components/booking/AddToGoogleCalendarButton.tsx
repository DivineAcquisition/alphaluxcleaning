import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleIntegrations } from '@/hooks/useGoogleIntegrations';
import { timeSlotToIsoWindow } from '@/components/booking/OfferDateTimePicker';

interface Props {
  serviceDateYmd: string;
  timeSlot: string;
  serviceName: string;
  address?: string;
  notes?: string;
  customerEmail?: string;
  sessionId?: string;
  orderId?: string;
}

/**
 * Renders a "Save to Google Calendar" button on the order
 * confirmation page — but only when the server-side integration is
 * fully wired. If `GOOGLE_SERVICE_ACCOUNT_KEY` (or OAuth credentials)
 * is missing on Supabase, the `useGoogleIntegrations` probe returns
 * `calendar.configured === false` and this component renders nothing
 * so we never ship a half-working Google feature.
 */
export function AddToGoogleCalendarButton({
  serviceDateYmd,
  timeSlot,
  serviceName,
  address,
  notes,
  customerEmail,
  sessionId,
  orderId,
}: Props) {
  const { loading, calendar } = useGoogleIntegrations();
  const [submitting, setSubmitting] = useState(false);
  const [eventUrl, setEventUrl] = useState<string | null>(null);

  if (loading || !calendar.configured) return null;
  if (!serviceDateYmd || !timeSlot) return null;

  const handleClick = async () => {
    setSubmitting(true);
    try {
      const window_ = timeSlotToIsoWindow(serviceDateYmd, timeSlot as any);
      const { data, error } = await supabase.functions.invoke(
        'create-google-calendar-event',
        {
          body: {
            date: serviceDateYmd,
            time: timeSlot,
            serviceType: serviceName,
            sessionId: sessionId || orderId || undefined,
            start: window_.start,
            end: window_.end,
            address: address || '',
            notes: notes || '',
            customerEmail: customerEmail || '',
          },
        },
      );
      if (error) throw new Error(error.message);
      if (data?.success === false) {
        throw new Error(data?.error || 'Calendar event failed');
      }
      const url = data?.htmlLink || data?.event_link || data?.link || null;
      setEventUrl(url);
      toast.success('Added to Google Calendar');
    } catch (err: any) {
      console.error('[AddToGoogleCalendarButton]', err);
      toast.error(
        err?.message?.includes('not configured')
          ? 'Google Calendar is not configured yet.'
          : 'Could not add to Google Calendar.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (eventUrl) {
    return (
      <a
        href={eventUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm font-medium text-alx-gold hover:underline"
      >
        <Calendar className="h-4 w-4" />
        Event added — open in Google Calendar
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={submitting}
      className="border-alx-gold/50 text-alx-gold hover:bg-alx-gold/10"
    >
      {submitting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Calendar className="h-4 w-4 mr-2" />
      )}
      Add to Google Calendar
    </Button>
  );
}
